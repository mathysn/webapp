const connection = require("../connection");

module.exports = function(app) {
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
        const firstname = user.firstname;
        const lastname = user.lastname;
        const phonenumber = user.phonenumber;

        let hiddenPassword = "";
        const stringLength = Math.floor(Math.random() * (13 - 8 + 1)) + 8;
        for(let i = 0; i < stringLength; i++) {
            hiddenPassword += '*';
        }

        const query2 = `SELECT role_name FROM roles WHERE id_role = (SELECT role_id FROM users WHERE email = ?)`;
        const [rows2] = await connection.promise().query(query2, [email]);
        const role = rows2[0].role_name;


        res.render('account', { loggedIn, email, username, firstname, lastname, phonenumber, hiddenPassword, role });
    });
}