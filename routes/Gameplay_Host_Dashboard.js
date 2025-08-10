const express = require('express');
const router = express.Router();

router.get('/Gameplay_Host_Dashboard', (req, res) => {
    const { sessionId, round } = req.query;

    res.render('Gameplay_Host_Dashboard', {
        title: 'BlackJackie Game',
        sessionId: sessionId,
        currentRound: round || 1,
        message: `Round ${round || 1} - Get Ready!`
    });
});

module.exports = router;