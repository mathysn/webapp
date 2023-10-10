const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const crypto = require('crypto');
const chalk = require('chalk');

const session = require('express-session');
const connection = require('./connection');

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

// Routes
require(path.join(__dirname, 'routes/home'))(app);
require(path.join(__dirname, 'routes/register'))(app);
require(path.join(__dirname, 'routes/login'))(app);
require(path.join(__dirname, 'routes/logout'))(app);
require(path.join(__dirname, 'routes/account'))(app);
require(path.join(__dirname, 'routes/dashboard'))(app);
require(path.join(__dirname, 'routes/aboutme'))(app);

app.listen(port, () => {
    console.log(chalk.yellow(`\n[SERVER] Server is listening on port ${port}: http://localhost:${port}/`));
});

connection.connect((err) => {
    if (err) throw err;
    console.log(chalk.blue('[DATABASE] Connected to the database\n'));

});