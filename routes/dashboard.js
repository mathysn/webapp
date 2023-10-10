const connection = require("../connection");

module.exports = function(app) {
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
}