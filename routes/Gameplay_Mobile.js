const express = require('express');
const router = express.Router();

router.get('/Gameplay_Mobile', (req, res) => {
    const { sessionId, playerName, username, round } = req.query;
    
    if (!sessionId || !playerName || !username) {
        return res.redirect('/Mobile_Login?sessionId=' + sessionId);
    }
    
    res.render('Gameplay_Mobile', {
        title: 'BlackJackie Game',
        sessionId: sessionId,
        playerName: playerName,
        studentUsername: username,
        currentRound: round || 1,
        message: `Round ${round || 1} - Get Ready!`
    });
});

module.exports = router;