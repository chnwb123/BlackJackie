// Game state management
const gameSessions = {}; // Store all game sessions & Keep for real-time data, sync with DB
const hostSockets = {}; // Track host sockets by sessionId
const gameTransitions = new Set(); // Track sessions in transition

// Export function that sets up Socket.IO logic
module.exports = (io, db) => {
    // Socket.IO connection handling
    io.on('connection', (socket) => {
        console.log('IO connection made:', socket.id);

        // Handle player joining a game session
        socket.on('joinGameSession', (data) => {
            const { sessionId, playerName, username } = data;
                    
            // Check if session exists in database
            const checkSessionQuery = 'SELECT * FROM game_sessions WHERE session_id = ?';
            db.query(checkSessionQuery, [sessionId], (err, sessionResult) => {
                if (err) {
                    console.error('Database error:', err);
                    return;
                }
                
                // If session doesn't exist in DB, create it
                if (sessionResult.length === 0) {
                    const createSessionQuery = `
                        INSERT INTO game_sessions (session_id, game_state, current_round, max_rounds) 
                        VALUES (?, ?, ?, ?)
                    `;
                    db.query(createSessionQuery, [sessionId, 'waiting', 0, 5], (err) => {
                        if (err) {
                            console.error('Error creating session:', err);
                            return;
                        }
                        console.log(`Created new session ${sessionId} in database`);
                    });
                }
                
                // Create in-memory session if doesn't exist
                if (!gameSessions[sessionId]) {
                    gameSessions[sessionId] = {
                        players: [],
                        gameState: 'waiting',
                        dealer: null,
                        currentRound: 0,
                        maxRounds: 5,
                        currentPlayer: null,
                        currentPlayerIndex: 0,
                        roundPhase: 'waiting',
                        questions: [],
                        playerAnswers: {},
                        timer: null
                    };
                }

                // Add player to database
                const addPlayerQuery = `
                    INSERT INTO game_players (session_id, socket_id, player_name, username, total_score) 
                    VALUES (?, ?, ?, ?, ?)
                `;
                db.query(addPlayerQuery, [sessionId, socket.id, playerName, username, 0], (err, result) => {
                    if (err) {
                        console.error('Error adding player to database:', err);
                        return;
                    }
                    
                    // Add player to in-memory session
                    const player = {
                        id: socket.id,
                        name: playerName,
                        username: username,
                        cards: [],
                        totalScore: 0,
                        roundScore: 0,
                        isDealer: false,
                        hasAnswered: false,
                        cardValue: 0,
                        isBust: false,
                        hasSpecialCombo: false,
                        dbId: result.insertId // Store database ID
                    };

                    gameSessions[sessionId].players.push(player);
                    console.log(`Player ${playerName} (${socket.id}) joined session ${sessionId}`);
                    console.log(`Session ${sessionId} now has ${gameSessions[sessionId].players.length} players`);
                    socket.join(sessionId);

                    // Notify all players in the session
                    io.to(sessionId).emit('playerJoined', {
                        players: gameSessions[sessionId].players,
                        totalPlayers: gameSessions[sessionId].players.length
                    });
                });
            });
        });

        // Handle host monitoring (doesn't join as player)
        socket.on('hostMonitorSession', (data) => {
            const { sessionId } = data;
            socket.join(sessionId);
            hostSockets[sessionId] = socket.id;
            console.log(`Host (${socket.id}) is monitoring session ${sessionId}`);
            
            // Get current players from database
            const getPlayersQuery = 'SELECT * FROM game_players WHERE session_id = ?';
            db.query(getPlayersQuery, [sessionId], (err, players) => {
                if (err) {
                    console.error('Error fetching players:', err);
                    return;
                }
                
                if (players.length > 0) {
                    // Rebuild in-memory session from database
                    if (!gameSessions[sessionId]) {
                        gameSessions[sessionId] = {
                            players: [],
                            gameState: 'waiting',
                            dealer: null,
                            currentRound: 0,
                            maxRounds: 5,
                            currentPlayer: null,
                            currentPlayerIndex: 0,
                            roundPhase: 'waiting',
                            questions: [],
                            playerAnswers: {},
                            timer: null
                        };
                    }
                    
                    // Convert DB players to in-memory format
                    gameSessions[sessionId].players = players.map(dbPlayer => ({
                        id: dbPlayer.socket_id,
                        name: dbPlayer.player_name,
                        username: dbPlayer.username,
                        cards: JSON.parse(dbPlayer.cards || '[]'),
                        totalScore: dbPlayer.total_score,
                        roundScore: dbPlayer.round_score,
                        isDealer: dbPlayer.is_dealer,
                        hasAnswered: false,
                        cardValue: dbPlayer.card_value || 0,
                        isBust: dbPlayer.is_bust || false,
                        hasSpecialCombo: dbPlayer.has_special_combo || false,
                        dbId: dbPlayer.id
                    }));
                    
                    socket.emit('playerJoined', {
                        players: gameSessions[sessionId].players,
                        totalPlayers: gameSessions[sessionId].players.length,
                        dealer: gameSessions[sessionId].dealer
                    });
                } else {
                    console.log(`No existing players in session ${sessionId}, host will wait`);
                }
            });
        });

        // Handle player disconnect
        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);

            // Check if any session is in transition
            let sessionInTransition = null;
            for (const sessionId in gameSessions) {
                if (gameTransitions.has(sessionId)) {
                    const session = gameSessions[sessionId];
                    const player = session.players.find(p => p.id === socket.id);
                    if (player) {
                        sessionInTransition = sessionId;
                        console.log(`⚠️ Player ${player.name} disconnected during game transition in session ${sessionId} - NOT removing from session`);
                        break;
                    }
                }
            }
            
            // Skip cleanup if session is transitioning
            if (sessionInTransition) {
                console.log(`🔄 Skipping player cleanup for session ${sessionInTransition} (in transition)`);
                return;
            }
            
            // Check if disconnecting user is a host
            for (const sessionId in hostSockets) {
                if (hostSockets[sessionId] === socket.id) {
                    delete hostSockets[sessionId];
                    console.log(`Host (${socket.id}) disconnected from session ${sessionId}`);
                    break;
                }
            }
            
            // Remove player from database and sessions
            const removePlayerQuery = 'DELETE FROM game_players WHERE socket_id = ?';
            db.query(removePlayerQuery, [socket.id], (err, result) => {
                if (err) {
                    console.error('Error removing player from database:', err);
                    return;
                }
                
                if (result.affectedRows > 0) {
                    // Remove from in-memory sessions
                    for (const sessionId in gameSessions) {
                        const session = gameSessions[sessionId];
                        const initialPlayerCount = session.players.length;
                        const playerToRemove = session.players.find(player => player.id === socket.id);

                        session.players = session.players.filter(player => player.id !== socket.id);
                        
                        if (session.players.length < initialPlayerCount && playerToRemove) {
                            console.log(`Player ${playerToRemove.name} (${socket.id}) removed from session ${sessionId}`);
                            console.log(`Session ${sessionId} now has ${session.players.length} players`);

                            io.to(sessionId).emit('playerLeft', {
                                players: session.players,
                                totalPlayers: session.players.length
                            });
                            
                            // If no players left, clean up session
                            if (session.players.length === 0) {
                                const deleteSessionQuery = 'DELETE FROM game_sessions WHERE session_id = ?';
                                db.query(deleteSessionQuery, [sessionId], (err) => {
                                    if (err) console.error('Error deleting session:', err);
                                });
                                
                                delete gameSessions[sessionId];
                                delete hostSockets[sessionId];
                                console.log(`Session ${sessionId} deleted from database and memory`);
                            }
                        }
                    }
                }
            });
        });

        // Handle manual player leave (for when navigation doesn't trigger disconnect)
        socket.on('playerLeave', (data) => {
            const { sessionId, playerName, username } = data;
            console.log(`Player ${playerName} manually leaving session ${sessionId}`);
            
            // Remove from database
            const removePlayerQuery = 'DELETE FROM game_players WHERE socket_id = ? AND session_id = ?';
            db.query(removePlayerQuery, [socket.id, sessionId], (err, result) => {
                if (err) {
                    console.error('Error removing player from database:', err);
                    return;
                }
                
                if (result.affectedRows > 0 && gameSessions[sessionId]) {
                    const session = gameSessions[sessionId];
                    const initialPlayerCount = session.players.length;
                    session.players = session.players.filter(player => player.id !== socket.id);
                    
                    if (session.players.length < initialPlayerCount) {
                        io.to(sessionId).emit('playerLeft', {
                            players: session.players,
                            totalPlayers: session.players.length
                        });
                        console.log(`Session ${sessionId} now has ${session.players.length} players`);
                        
                        if (session.players.length === 0) {
                            const deleteSessionQuery = 'DELETE FROM game_sessions WHERE session_id = ?';
                            db.query(deleteSessionQuery, [sessionId], (err) => {
                                if (err) console.error('Error deleting session:', err);
                            });
                            
                            delete gameSessions[sessionId];
                            delete hostSockets[sessionId];
                            console.log(`Session ${sessionId} deleted from database and memory`);
                        }
                    }
                }
            });
        });

        // Handle game start
        socket.on('startGame', (data) => {
            const { sessionId } = data;
            const session = gameSessions[sessionId];
            
            if (session && session.players.length >= 2) {
                // Mark session as transitioning
                gameTransitions.add(sessionId);
                console.log(`🔄 Session ${sessionId} entering game transition mode`);

                // Choose random dealer
                const randomIndex = Math.floor(Math.random() * session.players.length);
                session.players.forEach((player, index) => {
                    player.isDealer = (index === randomIndex);
                });
                session.dealer = session.players[randomIndex];
                session.gameState = 'playing';
                session.currentRound = 1;
                
                // Update database
                const updateSessionQuery = 'UPDATE game_sessions SET game_state = ?, current_round = ?, dealer_id = ? WHERE session_id = ?';
                db.query(updateSessionQuery, ['playing', 1, session.dealer.id, sessionId], (err) => {
                    if (err) {
                        console.error('Error updating session in database:', err);
                        return;
                    }
                    
                    // Update dealer in database
                    const updateDealerQuery = 'UPDATE game_players SET is_dealer = (socket_id = ?) WHERE session_id = ?';
                    db.query(updateDealerQuery, [session.dealer.id, sessionId], (err) => {
                        if (err) {
                            console.error('Error updating dealer in database:', err);
                            return;
                        }

                        // Notify all players and host that game started
                        io.to(sessionId).emit('gameStarted', {
                            sessionId: sessionId,
                            players: session.players,
                            dealer: session.dealer,
                            gameState: session.gameState,
                            currentRound: session.currentRound
                        });
                        
                        console.log(`Game started in session ${sessionId}, dealer: ${session.dealer.name}`);

                        // Clear transition flag after a delay (allow time for navigation)
                        setTimeout(() => {
                            gameTransitions.delete(sessionId);
                            console.log(`Session ${sessionId} transition complete`);
                        }, 10000); // 10 seconds should be enough for page navigation
                    });
                });
            }
        });
    });
};

module.exports.gameSessions = gameSessions;
module.exports.hostSockets = hostSockets;