const express = require('express');
const mysql = require('mysql');
const path = require('path');

const app = express();
const port = 3000;

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
    res.render('main');
});