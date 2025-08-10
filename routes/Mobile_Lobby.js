const express = require('express');
const router = express.Router();

router.get('/Mobile_Lobby', (req, res) => {
    const sessionId = req.query.sessionId;
    const studentUsername = req.session.student_username;
    res.render('Mobile_Lobby', { title: "Mobile Lobby", message: "Welcome to Mobile Lobby!", 
        sessionId: sessionId || null, 
        studentUsername: studentUsername || null 
    });
});

router.post('/Mobile_Lobby', (req, res) => {
    const sessionId = req.query.sessionId;
    var playerName = req.body.playerName;
    res.redirect('/Mobile_Users_Lobby?sessionId=' + sessionId + '&playerName=' + encodeURIComponent(playerName));
});

router.get('/checkPlayerName', (req, res) => {
    const { sessionId, playerName } = req.query;
    req.db.query(
        'SELECT COUNT(*) AS count FROM game_players WHERE session_id = ?',
        [sessionId],
        (err, results) => {
            if (err) return res.json({ available: false, playerCount: 0 });
            const playerCount = results[0].count;
            req.db.query(
                'SELECT COUNT(*) AS count FROM game_players WHERE session_id = ? AND player_name = ?',
                [sessionId, playerName],
                (err2, results2) => {
                    if (err2) return res.json({ available: false, playerCount });
                    const nameAvailable = results2[0].count === 0;
                    res.json({ available: nameAvailable, playerCount });
                }
            );
        }
    );
});

module.exports = router;