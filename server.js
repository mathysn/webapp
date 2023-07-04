const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const path = require('path');
const bcrypt = require('bcrypt')

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use('/static', express.static(__dirname + '/views/static'));
app.set('views', path.join(__dirname, 'views/templates'));
app.set('view engine', 'ejs');

app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);

});

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'webappdb'

});

connection.connect((err) => {
    if (err) throw err;
    console.log('Connected to the database');

});

app.get('/home', (req, res) => {
    res.render('home');

});

app.get('/login', (req, res) => {
    res.render('login');

});

app.get('/register', (req, res) => {
    res.render('register');

});

app.post('/register', async (req, res) => {
    const { email, username, password, recaptchaResponse } = req.body;

    try {
        const response = await axios.post('https://www.google.com/recaptcha/api/siteverify', null, {
            params: {
                secret: '6LfnUvMmAAAAADoaYe-qsDvwJtRnEcj35-d_ojo-',
                response: recaptchaResponse,
            },
        });

        const { success } = response.data;

        if(success) {
            // Encrypt the password for extra security
            const salt = bcrypt.genSaltSync(10);
            const hashedPassword = bcrypt.hashSync(password, salt);

            console.log('\nreCAPTCHA verification success');
            res.redirect('home');

        } else {
            res.send('reCAPTCHA verification failed')

        }
    } catch(error) {
        console.error('reCAPTCHA verification failed: ', error);
        res.status(500).send('Internal server error.');
    }

});
