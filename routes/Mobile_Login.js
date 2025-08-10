const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

router.get('/Mobile_Login', (req, res) => {
    const sessionId = req.query.sessionId;
    res.render('Mobile_Login', { title: "Mobile Login", message: "Welcome to Mobile Login!", sessionId: sessionId || null });
});

router.post('/Mobile_Login', (req, res) => {
    var username = req.body.username;
    var password = req.body.password;
    const sessionId = req.query.sessionId;
    req.db.query("SELECT * FROM student WHERE student_username = ?", 
    [username], function (err, usernameResult) {
        if (err) throw err;
        if (usernameResult.length === 1) {
            bcrypt.compare(password, usernameResult[0].student_password, function(err, passwordResult) {
                if (err) throw err;
                if(passwordResult) {
                    req.session.studentLoggedIn = true;
                    req.session.student_id = usernameResult[0].student_id; 
                    req.session.student_username = usernameResult[0].student_username; 
                    res.redirect('/Mobile_Lobby?sessionId=' + sessionId);
                } else {
                    res.render('Mobile_Login', { title: "Mobile Login", invalidDetails: "Invalid username or password.", sessionId: sessionId || null });
                }
            });
        } else {
            res.render('Mobile_Login', { title: "Mobile Login", invalidDetails: "Invalid username or password.", sessionId: sessionId || null });
        }
    });
});

function checkLoggedIn(req, res, next) {
    const sessionId = req.query.sessionId;
    if (req.session.studentLoggedIn) {
        next();
    } else {
        req.session.error = 'Please Login.';
        res.redirect('/Mobile_Login?sessionId=' + sessionId);
    }
}

module.exports = router;