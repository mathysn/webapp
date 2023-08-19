const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const mysql2 = require('mysql2');
const path = require('path');
const bcrypt = require('bcrypt')
const crypto = require('crypto');
const session = require('express-session');

const captchaKey = require('./captchaKeys.json');
// const { hash } = require("bcrypt");

const app = express();
const port = 3000;

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
    console.log(`Server is listening on port ${port}`);

});

const connection = mysql2.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'webappdb'
});

connection.connect((err) => {
    if (err) throw err;
    console.log('Connected to the database');

});

app.get('/', (req, res) => {
    res.redirect('/home');

});

app.get('/home', async (req, res) => {
    const loggedIn = req.session.loggedIn;
    const username = req.session.username;

    res.render('home', { loggedIn, username} );

});

app.get('/register', (req, res) => {
    res.render('register');

});

app.get('/login', (req, res) => {
    res.render('login');

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
                console.error('Error registering user: ', error);

            }

            console.log('\nreCAPTCHA verification success');

            req.session.loggedIn = true;
            req.session.username = username;
            res.redirect('/home');

        } else {
            res.send('reCAPTCHA verification failed')

        }
    } catch(error) {
        console.error('reCAPTCHA verification failed: ', error);
        res.status(500).send('Internal server error.');
    }

});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check if the email exists in the database
        const query = `SELECT * FROM users WHERE email = ?`;
        const [rows] = await connection.promise().query(query, [email]);

        if (rows.length === 0) {
            console.log('Email does not exist. User login failed.');
            return res.redirect('/login');
        }

        const user = rows[0];

        // Compare the entered password with the stored hashed password
        const passwordMatch = bcrypt.compareSync(password, user.password);

        if (!passwordMatch) {
            console.log('Incorrect password. User login failed.');
            return res.redirect('/login');
        }

        console.log('[LOGIN] User login successful: ', user.email);

        // Redirect to the home page or any other desired route
        req.session.loggedIn = true;
        req.session.username = user.username;
        res.redirect('/home');

    } catch (error) {
        console.error('Error during user login: ', error);
        res.status(500).send('Internal server error.');
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/home');
});
