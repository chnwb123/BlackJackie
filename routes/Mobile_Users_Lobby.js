const express = require('express');
const router = express.Router();

router.get('/Mobile_Users_Lobby', (req, res) => {
    const sessionId = req.query.sessionId;
    const playerName = req.query.playerName;
    const studentUsername = req.session.student_username;
    
    res.render('Mobile_Users_Lobby', { 
        title: "Game Lobby", 
        message: "Waiting for other players...", 
        sessionId: sessionId || null, 
        playerName: playerName || null,
        studentUsername: studentUsername || null 
    });
});

module.exports = router;