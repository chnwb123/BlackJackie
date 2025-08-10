const express = require('express');
const router = express.Router();

router.post('/HomePage', (req, res) => {
    res.redirect('/HostPage');
});

module.exports = router;