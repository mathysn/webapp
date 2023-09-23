const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const mysql2 = require('mysql2');
const path = require('path');
const bcrypt = require('bcrypt')
const crypto = require('crypto');
const chalk = require('chalk');

const session = require('express-session');
const connection = require('./connection.js');

const captchaKey = require('./captchaKeys.json');

const app = express();
const port = process.env.PORT || 3000;

const sessionSecretKey = crypto.randomBytes(32).toString('hex');

app.use(session({
    secret: sessionSecretKey,
    resave: false,
    saveUninitialized: true,
}));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use('/static', express.static(__dirname + '/views/static'));
app.set('views', path.join(__dirname, 'views/templates'));
app.set('view engine', 'ejs');

app.listen(port, () => {
    console.log(chalk.yellow(`\n[SERVER] Server is listening on port ${port}: http://localhost:${port}/`));

});

connection.connect((err) => {
    if (err) throw err;
    console.log(chalk.blue('[DATABASE] Connected to the database\n'));

});

app.get('/', (req, res) => {
    res.redirect('/home');

});

app.get('/home', async (req, res) => {
    const loggedIn = req.session.loggedIn;
    const username = req.session.username;
    const email = req.session.email;
    let role;
    if(loggedIn) {
        // Get the role of the logged in user
        const query = `SELECT role_name FROM roles WHERE id_role = (SELECT role_id FROM users WHERE email = ?)`;
        const [rows] = await connection.promise().query(query, [email]);
        role = rows[0].role_name;
    }

    res.render('home', { loggedIn, username, role} );

});

app.get('/register', (req, res) => {
    const email = null;
    const username = null;
    const errMsg = null;
    res.render('register', { email, username, errMsg });

});

app.get('/login', (req, res) => {
    const email = null;
    const errMsg = null;
    res.render('login', { email, errMsg });

});

app.post('/register', async (req, res) => {
    const { email, username, password, recaptchaResponse } = req.body;

    async function isEmailUsed(email) {
        const query = `SELECT COUNT(*) AS count FROM users WHERE email = ?`;
        const [rows] = await connection.promise().query(query, [email]);

        return rows[0].count > 0;
    }

    let errMsg = null;

    // Check if the entered email is already used
    const emailUsed = await isEmailUsed(email);
    if(emailUsed) {
        errMsg = "Email is already linked to an account.<br><a id='error-msg-link' href='/login'>Please login now!</a>";
        return res.render('register', { email, username, errMsg });
    }

    // Check if the username is shorter than 3 characters
    if(username.length < 3) {
        errMsg = "Username must be 3 characters or longer.";
        return res.render('register', { email, username, errMsg });
    }

    // Check if the password doesn't meet the requirements (1 cap letter, 1 number, 1 spec character)
    if(!/[A-Z]/.test(password) || !/[0-9]/.test(password) || !/[`!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/.test(password) || password.length < 8) {
        errMsg = "The password you entered is missing the following: <ul class='error-message-list'>"
        if(password.length < 8) {
            errMsg += "<li>8 characters or more</li>";
        }
        if(!/[A-Z]/.test(password)) {
            errMsg += "<li>1 capital letter</li>";
        }
        if(!/[0-9]/.test(password)) {
            errMsg += "<li>1 number</li>";
        }
        if(!/[`!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/.test(password)) {
            errMsg += "<li>1 special character</li>";
        }
        errMsg += "</ul>";
        return res.render('register', { email, username, errMsg });
    }

    try {
        const response = await axios.post('https://www.google.com/recaptcha/api/siteverify', null, {
            params: {
                secret: captchaKey.secret,
                response: recaptchaResponse,
            },
        });

        const { success } = response.data;

        // Check if the Captcha was completed (code above)
        if(success) {
            // Encrypt the password for extra security
            const salt = bcrypt.genSaltSync(10);
            const hashedPassword = bcrypt.hashSync(password, salt);

            try {
                const query = `INSERT INTO users (username, email, password) VALUES (?, ?, ?)`;
                await connection.promise().query(query, [username, email, hashedPassword]);

                console.log('[NEW USER]', { username, email, hashedPassword });

            } catch(error) {
                console.error('Error registering user:', error);
            }

            console.log('reCAPTCHA verification success');

            req.session.loggedIn = true;
            req.session.username = username;
            req.session.email = email;
            res.redirect('/home');

        } else {
            errMsg = "Please verify yourself with the Captcha.";
            res.render('register', { email, username, errMsg });

        }
    } catch(error) {
        console.error('reCAPTCHA verification failed:', error);
        res.status(500).send('Internal server error.');
    }

});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    let errMsg = null;

    try {
        // Check if the email exists in the database
        const query = `SELECT * FROM users WHERE email = ?`;
        const [rows] = await connection.promise().query(query, [email]);

        if (rows.length === 0) {
            const email = null;
            errMsg = "This email address isn't linked to any account.<br><a id='error-msg-link' href='/register'>Please register now!</a>"
            return res.render('login', { email, errMsg });
        }

        const user = rows[0];

        // Compare the entered password with the stored hashed password
        const passwordMatch = bcrypt.compareSync(password, user.password);
        if (!passwordMatch) {
            errMsg = "The password you entered is incorrect.<br>Please try again."
            return res.render('login', { email, errMsg });
        }

        console.log('[LOGIN] User login successful:', user.email);

        req.session.loggedIn = true;
        req.session.username = user.username;
        req.session.email = user.email;
        res.redirect('/home');

    } catch (error) {
        console.error('Error during user login:', error);
        res.status(500).send('Internal server error.');
    }
});

app.get('/logout', (req, res) => {
    console.log(`[LOGOUT] User logout successful: ${req.session.email}`);
    req.session.destroy();
    res.redirect('/home');
});

app.get('/account', async (req, res) => {
    const loggedIn = req.session.loggedIn;

    // Check if the user is logged in (prevents people to access the page using the url)
    if(loggedIn === undefined) {
        return res.redirect('/home');
    }

    const email = req.session.email;

    const query = `SELECT * FROM users WHERE email = ?`;
    const [rows] = await connection.promise().query(query, [email]);

    const user = rows[0];
    const username = user.username;

    let hiddenPassword = "";
    const stringLength = Math.floor(Math.random() * (13 - 8 + 1)) + 8;
    for(let i = 0; i < stringLength; i++) {
        hiddenPassword += '*';
    }

    const query2 = `SELECT role_name FROM roles WHERE id_role = (SELECT role_id FROM users WHERE email = ?)`;
    const [rows2] = await connection.promise().query(query2, [email]);
    const role = rows2[0].role_name;


    res.render('account', { loggedIn, email, username, hiddenPassword, role });
});

app.get('/dashboard', async (req, res) => {
    const loggedIn = req.session.loggedIn;
    const username = req.session.username;
    const email = req.session.email;
    let role;

    // Check if the user is logged in (prevents people to access the page using the url)
    if(loggedIn === undefined) {
        return res.redirect('home');
    }

    if(loggedIn) {
        // Get the role of the logged in user
        const query = `SELECT role_name FROM roles WHERE id_role = (SELECT role_id FROM users WHERE email = ?)`;
        const [rows] = await connection.promise().query(query, [email]);
        role = rows[0].role_name;

        // Check if the user has the permission to see this page (prevents people to access the page using the url)
        if(role === "User") {
            return res.redirect('home');
        }
    }

    res.render('dashboard', { loggedIn, username, role});
});

app.get('/cv', async (req, res) => {
    const loggedIn = req.session.loggedIn;
    const username = req.session.username;
    const email = req.session.email;
    let role;

    if(loggedIn) {
        const query = `SELECT role_name FROM roles WHERE id_role = (SELECT role_id FROM users WHERE email = ?)`;
        const [rows] = await connection.promise().query(query, [email]);
        role = rows[0].role_name;
    }

    res.render('cv', { loggedIn, username, role });
});
