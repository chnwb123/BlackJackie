const express = require('express');
const router = express.Router();

router.get('/join', (req, res) => {
    const sessionId = req.query.session;
    // You can render a page or redirect based on sessionId
    res.redirect('Mobile_Login?sessionId=' + sessionId);
});

module.exports = router;