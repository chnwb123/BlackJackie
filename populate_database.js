// Create populate_database.js
const db = require('./database/db');
const allCards = require('./generate_cards');

function populateDatabase() {
    const insertQuery = `
        INSERT INTO cards (suit, rank, value, qr_data, display_name) 
        VALUES (?, ?, ?, ?, ?)
    `;
    
    allCards.forEach((card, index) => {
        db.query(insertQuery, [
            card.suit,
            card.rank, 
            card.value,
            card.qrData,
            card.displayName
        ], (err, result) => {
            if (err) {
                console.error(`❌ Error inserting ${card.displayName}:`, err);
            } else {
                console.log(`✅ Inserted: ${card.displayName}`);
            }
            
            // Close connection after last card
            if (index === allCards.length - 1) {
                console.log('🎉 All cards inserted into database!');
                process.exit(0);
            }
        });
    });
}

populateDatabase();