const connection = require("../connection");

module.exports = function(app) {
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
}