// Create a new file: generate_cards.js
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

// Define all cards
const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

// Generate all 52 cards
const allCards = [];
suits.forEach(suit => {
    ranks.forEach(rank => {
        // Create unique QR code data
        const qrData = `CARD_${suit.toUpperCase()}_${rank}`;
        
        // Determine BlackJack value
        let value;
        if (rank === 'A') value = 11; // Ace (can be 1 or 11, start with 11)
        else if (['J', 'Q', 'K'].includes(rank)) value = 10; // Face cards
        else value = parseInt(rank); // Number cards
        
        allCards.push({
            suit: suit,
            rank: rank,
            value: value,
            qrData: qrData,
            displayName: `${rank} of ${suit.charAt(0).toUpperCase() + suit.slice(1)}`
        });
    });
});

console.log(`Generated ${allCards.length} cards`);
module.exports = allCards;

// Add this to generate_cards.js
async function generateQRCodes() {
    // Create directory for QR codes
    const qrDir = path.join(__dirname, 'qr_codes');
    if (!fs.existsSync(qrDir)) {
        fs.mkdirSync(qrDir);
    }

    console.log('Generating QR codes...');
    
    for (let i = 0; i < allCards.length; i++) {
        const card = allCards[i];
        
        try {
            // Generate QR code as PNG
            const fileName = `${card.suit}_${card.rank}.png`;
            const filePath = path.join(qrDir, fileName);
            
            await QRCode.toFile(filePath, card.qrData, {
                width: 100,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            });
            
            console.log(`✅ Generated: ${fileName} (${card.displayName})`);
            
        } catch (error) {
            console.error(`❌ Error generating ${card.displayName}:`, error);
        }
    }
    
    console.log(`\n🎉 All QR codes generated in: ${qrDir}`);
}

// Run the generation
generateQRCodes();

// Add this function to generate_cards.js
function generatePrintPage() {
    let html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>BlackJack Card QR Codes</title>
        <style>
            body { font-family: Arial, sans-serif; }
            .card-container { 
                display: inline-block; 
                margin: 10px; 
                text-align: center;
                border: 1px solid #ccc;
                padding: 10px;
                width: 180px;
            }
            .qr-code { width: 150px; height: 150px; }
            .card-name { margin-top: 5px; font-weight: bold; }
            .qr-data { font-size: 10px; color: #666; }
        </style>
    </head>
    <body>
        <h1>BlackJack Card QR Codes (52 Cards)</h1>
    `;
    
    allCards.forEach(card => {
        const imagePath = `qr_codes/${card.suit}_${card.rank}.png`;
        html += `
        <div class="card-container">
            <img src="${imagePath}" alt="${card.displayName}" class="qr-code">
            <div class="card-name">${card.displayName}</div>
            <div class="qr-data">${card.qrData}</div>
        </div>
        `;
    });
    
    html += '</body></html>';
    
    fs.writeFileSync('qr_codes_print.html', html);
    console.log('📄 Print-ready page created: qr_codes_print.html');
}

// Add this call after generateQRCodes()
generatePrintPage();