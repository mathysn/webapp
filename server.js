const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const mysql2 = require('mysql2');
const path = require('path');
const bcrypt = require('bcrypt')
const crypto = require('crypto');
const session = require('express-session');

const captchaKey = require('./captchaKeys.json');
const {randomInit} = require("mysql/lib/protocol/Auth");
// const { hash } = require("bcrypt");

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
    console.log(`[SERVER] Server is listening on port ${port}: http://localhost:${port}/`);

});

const connection = mysql2.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'webappdb'
});

connection.connect((err) => {
    if (err) throw err;
    console.log('[DATABASE] Connected to the database');

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
    res.render('register');

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

    try {
        const response = await axios.post('https://www.google.com/recaptcha/api/siteverify', null, {
            params: {
                secret: captchaKey.secret,
                response: recaptchaResponse,
            },
        });

        const { success } = response.data;

        if(success) {
            // Encrypt the password for extra security
            const salt = bcrypt.genSaltSync(10);
            const hashedPassword = bcrypt.hashSync(password, salt);

            try {
                const emailUsed = await isEmailUsed(email);
                if(emailUsed) {
                    console.log('Email is already used. User registration failed.');
                    return res.redirect('register');
                }

                const query = `INSERT INTO users (username, email, password) VALUES (?, ?, ?)`;
                await connection.promise().query(query, [username, email, hashedPassword]);

                console.log('[NEW USER] ', { username, email, hashedPassword });

            } catch(error) {
                console.error('Error registering user:', error);

            }

            console.log('\nreCAPTCHA verification success');

            req.session.loggedIn = true;
            req.session.username = username;
            req.session.email = email;
            res.redirect('/home');

        } else {
            res.send('reCAPTCHA verification failed')

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
            // console.log('[LOGIN ERROR] Email does not exist. User login failed.');

            let email = null;
            errMsg = "This email address isn't linked to any account.<br><a id='error-msg-link' href='/register'>Please register now!</a>"
            return res.render('login', { email, errMsg });
        }

        const user = rows[0];

        // Compare the entered password with the stored hashed password
        const passwordMatch = bcrypt.compareSync(password, user.password);

        if (!passwordMatch) {
            // console.log('[LOGIN ERROR] Incorrect password. User login failed.');

            errMsg = "The password you entered is incorrect.<br>Please try again."
            return res.render('login', { email, errMsg });
        }

        console.log('[LOGIN] User login successful:', user.email);

        // Redirect to the home page or any other desired route
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

app.get('/profile', async (req, res) => {
    const loggedIn = req.session.loggedIn;
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


    res.render('profile', { loggedIn, email, username, hiddenPassword, role });
});

app.get('/dashboard', async (req, res) => {
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

    res.render('dashboard', { loggedIn, username, role});
});
