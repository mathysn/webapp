const bcrypt = require('bcrypt');

const connection = require("../connection");

module.exports = function(app) {
    app.get('/login', (req, res) => {
        const email = null;
        const errMsg = null;
        res.render('login', { email, errMsg });

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
}