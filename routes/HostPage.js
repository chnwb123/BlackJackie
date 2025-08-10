require('dotenv').config();
const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

router.get('/HostPage', async (req, res) => {
    try {
        const sessionId = uuidv4(); // Generate unique session ID
        const joinUrl = `${process.env.SERVER_URL}/join?session=${sessionId}`;
        const qrDataUrl = await QRCode.toDataURL(joinUrl);
        res.render('HostPage', { qrCode: qrDataUrl, title: 'Host Page', sessionId: sessionId });
    } catch {
        res.status(500).send('Error generating QR code');
    }
});

module.exports = router;