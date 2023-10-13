const bcrypt = require('bcrypt');
const axios = require('axios');

const connection = require("../connection");
const captchaKey = require("../captchaKeys.json");

module.exports = function(app) {
    app.get('/register', (req, res) => {
        const email = null;
        const username = null;
        const errMsg = null;
        const loggedIn = false;
        res.render('register', { email, username, errMsg, loggedIn });

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
        // if(!/[A-Z]/.test(password) || !/[0-9]/.test(password) || !/[`!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/.test(password) || password.length < 8) {
        //     errMsg = "The password you entered is missing the following: <ul class='error-message-list'>"
        //     if(password.length < 8) {
        //         errMsg += "<li>8 characters or more</li>";
        //     }
        //     if(!/[A-Z]/.test(password)) {
        //         errMsg += "<li>1 capital letter</li>";
        //     }
        //     if(!/[0-9]/.test(password)) {
        //         errMsg += "<li>1 number</li>";
        //     }
        //     if(!/[`!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/.test(password)) {
        //         errMsg += "<li>1 special character</li>";
        //     }
        //     errMsg += "</ul>";
        //     return res.render('register', { email, username, errMsg });
        // }

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
}