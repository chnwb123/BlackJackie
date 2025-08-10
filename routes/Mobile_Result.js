const express = require('express');
const router = express.Router();

router.get('/Mobile_Result', (req, res) => {
    const studentUsername = req.query.student_username;
    res.render('Mobile_Result', { title: "Mobile Result", message: "Thank You For Playing!", 
        studentUsername: studentUsername || null 
    });
});

module.exports = router;