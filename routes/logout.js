module.exports = function(app) {
    app.get('/logout', (req, res) => {
        console.log(`[LOGOUT] User logout successful: ${req.session.email}`);
        req.session.destroy();
        res.redirect('/home');
    });
}