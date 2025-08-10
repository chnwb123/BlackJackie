const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const saltRounds = 10;

router.get('/Mobile_Register', (req, res) => {
    const sessionId = req.query.sessionId;
    res.render('Mobile_Register', { title: "Mobile Register", message: "Hello there!", sessionId: sessionId || null });
});

router.post('/Mobile_Register', function(req, res) {
    var username = req.body.username;
    var password = req.body.password;
    const sessionId = req.query.sessionId;
    bcrypt.hash(password, saltRounds, function(err, hashedPassword) {
        if (err) throw err;
        const query = 'INSERT INTO student (student_username, student_password) VALUES (?, ?)';
        req.db.query(query, [username, hashedPassword], (err, result) => {
            if (err) throw err;
            if (result) {
                res.redirect('/Mobile_Login?sessionId=' + sessionId + '&registered=1');
            }
        });
    });
});

router.get('/checkUsername', function(req, res) { // CHECK USERNAME DUPLICITY
    var username = req.query.username;
    req.db.connect(function(err) {
        if (err) throw err;
        req.db.query("SELECT * FROM student WHERE student_username = ?", [username], function (err, result) {
            if (err) throw err;
            var exists = result.length > 0;
            res.json({ exists: exists });
        });
    });
    return router;
});

module.exports = router;