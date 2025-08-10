const userLobbyLogic = require('./Users_Lobby_Logic');

module.exports = (io, db) => {
    io.on('connection', (socket) => {
        // Handle QR scanning for ALL players (including dealer)
        socket.on('startQRScanning', (data) => {
            const { sessionId, dealerId, allPlayers, dealerName, message, scanDuration, cardsPerPlayer, specialInstructions } = data;
            
            console.log(`Host initiated QR scanning for ALL players in session ${sessionId}`);
            
            // Send QR scanning start event to ALL players (including dealer)
            io.to(sessionId).emit('qrScanningStarted', {
                dealerId: dealerId,
                dealerName: dealerName,
                message: message,
                allPlayers: allPlayers, //  Everyone scans
                scanDuration: scanDuration,
                cardsPerPlayer: cardsPerPlayer,
                instructions: 'Point your camera at the QR codes on your 2 assigned cards',
                specialInstructions: specialInstructions
            });
            
            // Update session state
            const session = userLobbyLogic.gameSessions[sessionId];
            console.log('All session players:', session.players.map(p => ({ name: p.name, id: p.id })));
            if (session) {
                session.gamePhase = 'qr_scanning';
                session.scanStartTime = Date.now();
                session.playersScanned = {}; // Track who has scanned
                
                // Initialize scan tracking for all players
                session.players.forEach(player => {
                    session.playersScanned[player.id] = {
                        name: player.name,
                        isDealer: player.isDealer,
                        scannedCards: [],
                        isComplete: false
                    };
                });
            }
        });

        // Handle QR scan results for ALL players
        socket.on('qrCodeScanned', (data) => {
            const { sessionId, playerId, cardData, scanResult, playerRole } = data;
    
            const session = userLobbyLogic.gameSessions[sessionId];
            if (!session) return;
            
            const player = session.players.find(p => p.id === playerId);
            if (!player) return;
            
            const currentRound = session.currentRound || 1;
            console.log(`\n📱 ${player.isDealer ? 'Dealer' : 'Player'} ${player.name} scanned card for Round ${currentRound}:`);
            console.log(`  🎴 Card data:`, cardData);
            
            // Add scanned card to player
            if (!player.scannedCards) player.scannedCards = [];
            player.scannedCards.push(cardData);
            
            console.log(`  📊 ${player.name} total cards: ${player.scannedCards.length}/2`);


            // CALCULATE BONUS IMMEDIATELY when player finishes scanning
            if (player.scannedCards.length >= 2) {
                const cardBonus = checkCardMatchingBonus(player.scannedCards);
                player.cardBonus = cardBonus;
                
                console.log(`${player.name} completed scanning:`, {
                    cards: player.scannedCards,
                    bonus: cardBonus?.description || 'No bonus'
                });
            }
            
            // Update scan tracking
            if (session.playersScanned[playerId]) {
                session.playersScanned[playerId].scannedCards = player.scannedCards;
                session.playersScanned[playerId].isComplete = player.scannedCards.length >= 2;
            }
            
            // UPDATE DATABASE WITH ROUND-SPECIFIC CARD DATA
            const combinedCardValue = getCombinedCardValue(player.scannedCards); 
            const bonusMarks = player.cardBonus ? (player.cardBonus.bonusMarks || 0) : 0;

            // STORE CARDS FOR SPECIFIC ROUND
            const updateCardsQuery = `
                UPDATE game_players 
                SET card_bonus = ?, bonus_marks = ?, round_${currentRound}_cards = ?, round_${currentRound}_card_value = ?
                WHERE session_id = ? AND socket_id = ?
            `;

            db.query(updateCardsQuery, [
                player.cardBonus ? JSON.stringify(player.cardBonus) : null,
                bonusMarks,
                JSON.stringify(player.scannedCards), // Store round-specific cards
                combinedCardValue, //  Store round-specific combined value
                sessionId,
                playerId
            ], (err) => {
                if (err) console.error('Error updating scanned cards:', err);
                else console.log(`💾 Stored Round ${currentRound} cards for ${player.name} with combined value: ${combinedCardValue}`);
            });
            
            // Notify host about scan with round information
            const hostSocketId = userLobbyLogic.hostSockets[sessionId];
            if (hostSocketId) {
                const totalPlayersScanned = Object.values(session.playersScanned).filter(p => p.isComplete).length;
                
                io.to(hostSocketId).emit('playerScannedCardInRound', {
                    round: currentRound,
                    player: {
                        id: player.id,
                        name: player.name,        //  Make sure name is included
                        isDealer: player.isDealer,
                        role: player.isDealer ? 'Dealer' : 'Player'  //  Include role
                    },
                    cardData: cardData,
                    totalScanned: player.scannedCards.length,
                    isComplete: player.scannedCards.length >= 2,
                    totalPlayersScanned: totalPlayersScanned,
                    allPlayersFinished: session.players.every(p => p.scannedCards && p.scannedCards.length >= 2)
                });
            }
            
            // Check if ALL players (including dealer) finished scanning for this round
            const allPlayersFinished = session.players.every(p => 
                p.scannedCards && p.scannedCards.length >= 2
            );
            
            if (allPlayersFinished) {
                console.log(` All players finished scanning for Round ${currentRound}!`);
                
                setTimeout(() => {
                    console.log(`🎯 Emitting roundScanningComplete for Round ${currentRound}`);
                    
                    //  EMIT WITH PROPER ROUND INFORMATION
                    io.to(sessionId).emit('roundScanningComplete', {
                        round: currentRound, //  Make sure this is properly set
                        totalRounds: 5,
                        message: `Round ${currentRound} scanning complete! Starting questions...`,
                        bonus: player.cardBonus,
                        players: session.players.map(p => ({
                            name: p.name,
                            role: p.isDealer ? 'Dealer' : 'Player',
                            cardValue: calculateCardValue(p.scannedCards || []),
                            hasBonus: !!p.cardBonus,
                            bonusDescription: p.cardBonus?.description || null
                        }))
                    });
                    
                    // Update game phase
                    session.gamePhase = 'questions';
                    session.currentPlayerIndex = 0;
                    
                    // Start questions after short delay
                    setTimeout(() => {
                        const firstPlayer = session.players[0];
                        session.currentPlayer = firstPlayer;
                        session.currentPlayerIndex = 0;
                        
                        console.log(`🎯 Round ${currentRound} - First player: ${firstPlayer.name}`);
                        
                        handleQuestionRequest(sessionId, currentRound, firstPlayer);
                    }, 3000);
                }, 1000);
            }
        });

        function handleQuestionRequest(sessionId, currentRound, currentPlayer = null) {
            console.log(`📝 Processing question request for session ${sessionId}, round ${currentRound}`);
    
            const session = userLobbyLogic.gameSessions[sessionId];
            if (!session) {
                console.log('❌ Session not found');
                return;
            }
            
            // Select current player if not provided
            if (!currentPlayer) {
                currentPlayer = session.currentPlayer;
                if (!currentPlayer) {
                    const allPlayers = session.players;
                    const currentIndex = session.currentPlayerIndex || 0;
                    currentPlayer = allPlayers[currentIndex];
                    session.currentPlayer = currentPlayer;
                    console.log(`🎯 Selected current player: ${currentPlayer?.name} (index: ${currentIndex})`);
                }
            }
            
            if (!currentPlayer) {
                console.log('❌ No current player found');
                return;
            }
            
            //  ENSURE PROPER TURN NUMBERING
            const allPlayers = session.players;
            const turnNumber = (session.currentPlayerIndex || 0) + 1; // Display turn number (1-based)
            const currentRoundNum = session.currentRound || 1;
            
            console.log(`🎯 Presenting question to ${currentPlayer.name} (Turn ${turnNumber}/${allPlayers.length}, Round ${currentRoundNum})`);
            
            // Determine difficulty based on card bonus
            let difficultyFilter = '';
            if (currentPlayer && currentPlayer.cardBonus) {
                difficultyFilter = "AND difficulty = 'easy'";
                console.log(`${currentPlayer.name} has card bonus - using easy questions only`);
            } else {
                difficultyFilter = "AND difficulty = 'normal'";
            }
            
            // Query database for question with difficulty filter
            const getQuestionQuery = `
                SELECT * FROM questions 
                WHERE id NOT IN (
                    SELECT question_id FROM game_questions_used 
                    WHERE session_id = ?
                ) 
                ${difficultyFilter}
                ORDER BY RAND() 
                LIMIT 1
            `;
            
            db.query(getQuestionQuery, [sessionId], (err, questionResults) => {
                if (err) {
                    console.error('Error fetching question:', err);
                    return;
                }
                
                if (questionResults.length === 0) {
                    console.log('❌ No questions available');
                    io.to(sessionId).emit('noQuestionsAvailable', { sessionId: sessionId });
                    return;
                }
                
                const question = questionResults[0];
                console.log(` Question selected: ${question.question_text || question.text || question.question}`);
                
                // Mark question as used
                const markUsedQuery = 'INSERT INTO game_questions_used (session_id, question_id) VALUES (?, ?)';
                db.query(markUsedQuery, [sessionId, question.id], (err) => {
                    if (err) console.error('Error marking question as used:', err);
                });
                
                session.currentQuestion = question;
                session.currentPlayer = currentPlayer;
                
                const allPlayers = session.players;
                const turnNumber = session.currentPlayerIndex + 1; // +1 for display
                const currentRoundNum = session.currentRound || 1;
                
                console.log(`🎯 Presenting question to ${currentPlayer.name} (Turn ${turnNumber}/${allPlayers.length})`);
                
                // Show round and player progress
                io.to(sessionId).emit('playerTurnAnnouncement', {
                    currentPlayer: currentPlayer,
                    turnNumber: turnNumber,
                    totalPlayers: allPlayers.length,
                    playerRole: currentPlayer.isDealer ? 'Dealer' : 'Player',
                    currentRound: currentRoundNum,
                    totalRounds: 5,
                    progress: `Round ${currentRoundNum}/5 - Player ${turnNumber}/${allPlayers.length}`,
                    roundProgress: `Round ${currentRoundNum} of 5`,
                    playerProgress: `${turnNumber} of ${allPlayers.length} players`
                });
                
                // Present question after announcement
                setTimeout(() => {
                    console.log(`📤 Sending question to session ${sessionId}`);
    
                    // Define questionData first
                    const questionData = {
                        question: {
                            ...question,
                            options: question.options || JSON.stringify([
                                question.option_a,
                                question.option_b,
                                question.option_c,
                                question.option_d
                            ].filter(opt => opt && opt.trim() !== ''))
                        },
                        currentPlayer: currentPlayer,
                        timeLimit: 60,
                        bonusInfo: currentPlayer?.cardBonus || null,
                        gameProgress: {
                            currentTurn: turnNumber,
                            totalPlayers: allPlayers.length,
                            currentRound: currentRoundNum,
                            totalRounds: 5,
                            isLastPlayerInRound: turnNumber === allPlayers.length,
                            isLastRound: currentRoundNum === 5
                        }
                    };
                    
                    // Store current question for answer processing
                    session.currentQuestion = question;
                    session.currentPlayer = currentPlayer;
                    
                    // EMIT TO HOST DASHBOARD
                    io.to(sessionId).emit('questionPresented', questionData);
                    
                    //  EMIT TIMER EVENTS (now questionData is defined)
                    // Emit timer start to ALL mobile clients (general timer)
                    io.to(sessionId).emit('answerTimerStart', {
                        currentPlayer: currentPlayer,
                        timeLimit: 60,
                        isCurrentPlayer: false, // Default for all clients
                        gameProgress: questionData.gameProgress
                    });
                    
                    // Emit special timer to the CURRENT PLAYER (their turn)
                    io.to(currentPlayer.id).emit('answerTimerStart', {
                        currentPlayer: currentPlayer,
                        timeLimit: 60,
                        isCurrentPlayer: true, // Special flag for current player
                        gameProgress: questionData.gameProgress
                    });
                    
                    console.log(`⏱️ Timer started for ${currentPlayer.name} (60 seconds)`);
                    
                }, 4000);
            });
        }

        function checkCardMatchingBonus(cards) {
            if (!cards || cards.length < 2) return null;
            
            const suits = cards.map(card => card.suit);
            const values = cards.map(card => card.value);
            
            console.log('🎴 Checking card bonus:', { suits, values });
            
            //  CHECK FOR BLACKJACK FIRST (A + 10/J/Q/K) = +10 BONUS
            const hasAce = values.includes('A');
            const hasTen = values.some(v => ['10', 'J', 'Q', 'K'].includes(v));
            if (hasAce && hasTen) {
                console.log('🃏 Blackjack detected!');
                return {
                    type: 'blackjack',
                    description: 'Blackjack!',
                    bonusMarks: 10, //  Blackjack = +10 points
                    difficultyBonus: true
                };
            }
            
            //  CHECK FOR 21 CARD VALUE = +10 BONUS
            const combinedValue = getCombinedCardValue(cards);
            if (combinedValue === 21) {
                console.log('🎯 21 Card Value detected!');
                return {
                    type: 'twenty_one',
                    description: '21 Card Value!',
                    bonusMarks: 10, //  21 value = +10 points
                    difficultyBonus: true
                };
            }
            
            //  CHECK FOR MATCHING VALUES (PAIRS) = +7 BONUS
            if (values[0] === values[1]) {
                console.log('👥 Pair detected:', values[0]);
                return {
                    type: 'value_match',
                    description: `Pair of ${values[0]}s`,
                    bonusMarks: 7, //  Same numbers = +7 points
                    difficultyBonus: true
                };
            }
            
            //  CHECK FOR MATCHING SUITS = +5 BONUS
            if (suits[0] === suits[1]) {
                console.log('🎨 Same suit detected:', suits[0]);
                return {
                    type: 'suit_match',
                    description: `Both ${suits[0]}`,
                    bonusMarks: 5, //  Same suits = +5 points
                    difficultyBonus: true
                };
            }
            
            console.log('❌ No bonus detected');
            return null; // No bonus
        }

        // Helper function to calculate card value
        function calculateCardValue(cards) {
            if (!cards || cards.length === 0) return 0;
            
            let total = 0;
            let aces = 0;
            
            cards.forEach(card => {
                if (card.value === 'A') {
                    aces++;
                    total += 11; // Count ace as 11 initially
                } else if (['J', 'Q', 'K'].includes(card.value)) {
                    total += 10;
                } else {
                    total += parseInt(card.value);
                }
            });
            
            // Adjust for aces if total > 21
            while (total > 21 && aces > 0) {
                total -= 10; // Change ace from 11 to 1
                aces--;
            }
            
            return total;
        }

        socket.on('gameplayHostDashboard', (data) => {
            const { sessionId } = data;
            console.log(`Gameplay Host monitoring session ${sessionId}`);
            socket.join(sessionId);

            // Ensure host socket is set for new session (in case no old session existed)
            if (!userLobbyLogic.hostSockets[sessionId]) {
                userLobbyLogic.hostSockets[sessionId] = socket.id;
                console.log(`Host's new socket id ${socket.id} set for same session ${sessionId}`);
            }

            // Send initial game data to host
            const session = userLobbyLogic.gameSessions[sessionId];
            if (session) {
                socket.emit('hostGameData', {
                    sessionId: sessionId,
                    players: session.players,
                    dealer: session.dealer
                });
            } else {
                console.error(`Session ${sessionId} not found for host monitoring`);
            }
        });

        socket.on('gameplayMobile', (data) => {
            const { sessionId, playerName, username } = data;
            console.log(`Player (${playerName}) with username (${username}) joined gameplay session ${sessionId}`);

            socket.join(sessionId);
            
            // Update player's new socket id in the session
            const session = userLobbyLogic.gameSessions[sessionId];
            if (session) {
                const existingPlayer = session.players.find(p => 
                    p.name === playerName || p.username === username
                );
                
                if (existingPlayer) {
                    // Update new dealer's socket id in database
                    const dealer = session.players.find(p => p.isDealer === true);
                    if (dealer) {
                        const dealerSocketId = dealer.id;
                        const updateHostSocketQuery = 'UPDATE game_sessions SET dealer_id = ? WHERE session_id = ? AND dealer_id = ?';
                        db.query(updateHostSocketQuery, [socket.id, sessionId, dealerSocketId], (err, updated) => {
                            if (err) {  
                                console.error('Error updating host socket ID in database:', err);
                            }; 
                            if (updated.affectedRows > 0) {
                                console.log(`Updated dealer's new socket ID from ${dealerSocketId} to ${socket.id}`);
                            }
                        });
                        
                    }

                    // Update socket ID for reconnecting player
                    console.log(`Updating socket ID for ${playerName}: ${existingPlayer.id} → ${socket.id}`);
                    existingPlayer.id = socket.id;
                    
                    // Update database
                    const updateSocketQuery = 'UPDATE game_players SET socket_id = ? WHERE player_name = ? AND session_id = ?';
                    db.query(updateSocketQuery, [socket.id, playerName, sessionId]);
                }
                socket.emit('mobileGameplayData', {
                    sessionId: sessionId,
                    players: session.players,
                    playerName: playerName,
                    username: username,
                });
            } else {
                console.error(`Session ${sessionId} not found for host monitoring`);
            }
        });

        // Function to move to next player
        function moveToNextPlayer(sessionId) {
            const session = userLobbyLogic.gameSessions[sessionId];
            if (!session) return;

            const allPlayers = session.players;
            let currentPlayerIndex = session.currentPlayerIndex || 0;
            const currentRound = session.currentRound || 1;

            console.log(`🔄 Moving to next player. Current: ${currentPlayerIndex}, Round: ${currentRound}`);

            //  FIND NEXT PLAYER IN SAME ROUND
            let nextPlayerIndex = currentPlayerIndex + 1;
            
            //  CHECK IF WE'VE COMPLETED ALL PLAYERS IN CURRENT ROUND
            if (nextPlayerIndex >= allPlayers.length) {
                //  ROUND COMPLETED - ALL PLAYERS ANSWERED
                console.log(`🏁 Round ${currentRound} completed - all players answered`);
                
                // Update session state
                session.gamePhase = 'round_complete';
                session.currentPlayerIndex = 0; // Reset for next round
                session.currentPlayer = null;
                
                //  CALCULATE NEXT ROUND PROPERLY
                const nextRound = currentRound + 1;
                
                //  WAIT LONGER BEFORE SHOWING ROUND COMPLETE (let final answer show properly)
                console.log(`⏰ Waiting 4 seconds to let final answer display...`);
                setTimeout(() => {
                    console.log(`📊 Showing round ${currentRound} complete summary`);
                    
                    const getUpdatedScoresQuery = `
                        SELECT player_name, total_score, is_dealer 
                        FROM game_players 
                        WHERE session_id = ? 
                        ORDER BY total_score DESC
                    `;
                    
                    db.query(getUpdatedScoresQuery, [sessionId], (err, scoreResults) => {
                        if (err) {
                            console.error('Error fetching updated scores:', err);
                            return;
                        }
                        
                        //  UPDATE IN-MEMORY SESSION WITH DATABASE SCORES
                        scoreResults.forEach(dbPlayer => {
                            const sessionPlayer = allPlayers.find(p => p.name === dbPlayer.player_name);
                            if (sessionPlayer) {
                                sessionPlayer.score = dbPlayer.total_score;
                                sessionPlayer.currentScore = dbPlayer.total_score;
                            }
                        });

                        //  EMIT ROUND COMPLETE EVENT (FIXED BRACKET STRUCTURE)
                        io.to(sessionId).emit('roundComplete', {
                            completedRound: currentRound,
                            nextRound: nextRound,
                            message: `Round ${currentRound} questions complete!`,
                            cardComparisonDone: true, //  Flag that card comparison happened
                            scores: allPlayers.map(p => ({
                                name: p.name,
                                score: p.score || 0,
                                role: p.isDealer ? 'Dealer' : 'Player'
                            }))
                        });

                        const hostSocketId = userLobbyLogic.hostSockets[sessionId];
                        if (hostSocketId) {
                            io.to(hostSocketId).emit('scoreboardUpdate', {
                                sessionId: sessionId,
                                roundCompleted: currentRound,
                                allScores: allPlayers.map(p => ({
                                    name: p.name,
                                    score: p.score || 0,
                                    role: p.isDealer ? 'Dealer' : 'Player'
                                })),
                                currentRound: nextRound,
                                gamePhase: 'round_transition'
                            });
                            
                            console.log(`📊 Scoreboard update sent to host for round ${currentRound} completion`);
                        }
                        
                        console.log(`📊 Updated scores emitted:`, allPlayers.map(p => `${p.name}: ${p.score}`));
                        
                        //  CHECK IF GAME IS COMPLETELY FINISHED
                        if (nextRound > 5) {
                            console.log('🏆 All 5 rounds completed - Game finished!');
                            setTimeout(() => {
                                endGame(sessionId);
                            }, 5000); //  Give time to see final round results
                            return;
                        }
                        
                        //  WAIT EVEN LONGER BEFORE ROUND TRANSITION
                        setTimeout(() => {
                            console.log(`🔄 Starting Round ${nextRound} transition`);
                            
                            // Update session for next round
                            session.currentRound = nextRound;
                            session.gamePhase = 'preparing_next_round';
                            
                            //  EMIT ROUND TRANSITION FIRST
                            io.to(sessionId).emit('roundTransition', {
                                completedRound: currentRound,
                                nextRound: nextRound,
                                message: `Round ${currentRound} complete! Preparing Round ${nextRound}...`,
                                scores: allPlayers.map(p => ({
                                    name: p.name,
                                    score: p.score || 0,
                                    role: p.isDealer ? 'Dealer' : 'Player'
                                }))
                            });
                            
                            //  WAIT MUCH LONGER BEFORE NEW CARD SCANNING
                            setTimeout(() => {
                                console.log(`🎯 Starting Round ${nextRound} - NEW CARD SCANNING PHASE`);
                                
                                // Clear previous cards for new round
                                session.players.forEach(player => {
                                    player.scannedCards = [];
                                    player.cardBonus = null;
                                    player.hasAnsweredThisRound = false; //  Reset for new round
                                });
                                
                                // Reset scan tracking
                                session.playersScanned = {};
                                session.players.forEach(player => {
                                    session.playersScanned[player.id] = {
                                        name: player.name,
                                        isDealer: player.isDealer,
                                        scannedCards: [],
                                        isComplete: false
                                    };
                                });
                                
                                //  NOW SET SCANNING PHASE
                                session.gamePhase = 'qr_scanning';
                                session.scanStartTime = Date.now();
                                
                                // Notify all players to start scanning new cards
                                io.to(sessionId).emit('newRoundCardScanning', {
                                    round: nextRound,
                                    totalRounds: 5,
                                    message: `Round ${nextRound} - Scan your NEW cards!`,
                                    instructions: 'Dealer will distribute new cards. Scan your 2 new assigned cards.',
                                    scanDuration: 60,
                                    currentScores: session.players.map(p => ({
                                        name: p.name,
                                        score: p.score || 0,
                                        role: p.isDealer ? 'Dealer' : 'Player'
                                    }))
                                });
                                
                                // Notify host
                                const hostSocketId = userLobbyLogic.hostSockets[sessionId];
                                if (hostSocketId) {
                                    io.to(hostSocketId).emit('hostGameData', {
                                        sessionId: sessionId,
                                        players: session.players,
                                        dealer: session.players.find(p => p.isDealer),
                                        currentRound: nextRound,
                                        totalRounds: 5,
                                        gameState: 'qr_scanning',
                                        message: `Round ${nextRound} - Card scanning in progress`
                                    });
                                }
                            }, 12000); //  WAIT 12 SECONDS before new scanning
                        }, 8000); //  WAIT 8 SECONDS for round transition
                    }); //  CLOSE DATABASE CALLBACK HERE
                }, 4000); //  WAIT 4 SECONDS to let final answer show properly
            
            } else {
                //  CONTINUE TO NEXT PLAYER IN SAME ROUND
                const nextPlayer = allPlayers[nextPlayerIndex];
                session.currentPlayerIndex = nextPlayerIndex;
                session.currentPlayer = nextPlayer;
                
                console.log(`➡️ Next player: ${nextPlayer.name} (Turn ${nextPlayerIndex + 1}/${allPlayers.length})`);
                
                //  CONTINUE WITH QUESTIONS IN SAME ROUND (add small delay for answer display)
                console.log(`⏰ Waiting 3 seconds to let answer display before next question...`);
                setTimeout(() => {
                    handleQuestionRequest(sessionId, currentRound, nextPlayer);
                }, 3000); //  3 seconds delay for next question in same round
            }
        }

        function handlePlayerAnswer(sessionId, playerName, answer, timedOut) {
            const session = userLobbyLogic.gameSessions[sessionId];
            if (!session || !session.currentQuestion) return;
            
            console.log(`\n📝 Processing answer from ${playerName}: "${answer}" ${timedOut ? '(TIMED OUT)' : ''}`);
            
            //  CLEAR AND STOP TIMER IMMEDIATELY
            if (session.answerTimer) {
                clearTimeout(session.answerTimer);
                session.answerTimer = null;
                console.log(`⏰ Timer stopped for ${playerName}`);
            }
            
            //  EMIT TIMER STOP TO ALL CLIENTS
            io.to(sessionId).emit('answerTimerStop', {
                playerName: playerName,
                answered: true,
                timedOut: timedOut,
                message: timedOut ? `${playerName} timed out` : `${playerName} answered`
            });
            
            const currentQuestion = session.currentQuestion;
            const currentPlayer = session.players.find(p => p.name === playerName);
            if (!currentPlayer) {
                console.error(`❌ Player ${playerName} not found in session`);
                return;
            }
            
            //  CHECK ANSWER CORRECTNESS
            const isCorrect = !timedOut && answer.toLowerCase() === currentQuestion.correct_answer.toLowerCase();
            console.log(` Answer check: ${isCorrect ? 'CORRECT' : 'INCORRECT'} (Expected: ${currentQuestion.correct_answer})`);
            
            //  CALCULATE TOTAL SCORE FOR THIS QUESTION
            let questionScore = 0;
            let cardBonusPoints = 0;
            let totalScoreGained = 0;
            
            if (isCorrect) {
                questionScore = 10; // Base points for correct answer
                
                //  ADD CARD BONUS IF APPLICABLE
                if (currentPlayer.cardBonus && currentPlayer.cardBonus.bonusMarks) {
                    cardBonusPoints = currentPlayer.cardBonus.bonusMarks;
                    console.log(`🎴 Card bonus applied: +${cardBonusPoints} (${currentPlayer.cardBonus.description})`);
                }
                
                totalScoreGained = questionScore + cardBonusPoints;
                console.log(`💰 Score breakdown: ${questionScore} (question) + ${cardBonusPoints} (card bonus) = ${totalScoreGained} total`);
            } else {
                console.log(`❌ No points awarded (incorrect answer or timeout)`);
            }
            
            //  UPDATE PLAYER SCORE IN MEMORY
            const oldScore = currentPlayer.score || 0;
            currentPlayer.score = oldScore + totalScoreGained;
            currentPlayer.currentScore = currentPlayer.score;
            
            console.log(`📊 Score update: ${playerName} ${oldScore} → ${currentPlayer.score} (+${totalScoreGained})`);
            
            //  UPDATE DATABASE SCORE IMMEDIATELY AND ATOMICALLY
            const updateScoreQuery = `
                UPDATE game_players 
                SET total_score = ?
                WHERE session_id = ? AND player_name = ?
            `;

            db.query(updateScoreQuery, [currentPlayer.score, sessionId, playerName], (err, result) => {
                if (err) {
                    console.error('❌ Error updating player score in database:', err);
                } else {
                    console.log(`💾 Database updated: ${playerName} total_score = ${currentPlayer.score} (${result.affectedRows} rows affected)`);
                }
            });

            debugDatabaseState(sessionId);
            
            //  RECORD DETAILED ANSWER HISTORY
            const insertAnswerQuery = `
                INSERT INTO game_answer_history 
                (session_id, round_number, player_name, question_id, player_answer, correct_answer, is_correct, 
                question_score, card_bonus_score, total_score_gained, new_total_score, answered_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            `;
            
            db.query(insertAnswerQuery, [
                sessionId,
                session.currentRound || 1,
                playerName,
                currentQuestion.id,
                answer,
                currentQuestion.correct_answer,
                isCorrect,
                questionScore,
                cardBonusPoints,
                totalScoreGained,
                currentPlayer.score
            ], (err) => {
                if (err) console.error('Error recording answer history:', err);
                else console.log(`📝 Answer history recorded for ${playerName}`);
            });
            
            //  MARK PLAYER AS ANSWERED FOR THIS ROUND
            currentPlayer.hasAnsweredThisRound = true;
            console.log(` ${playerName} marked as answered for round ${session.currentRound}`);
            
            //  SEND INDIVIDUAL RESULT TO THE ANSWERING PLAYER
            if (currentPlayer.id) {
                io.to(currentPlayer.id).emit('answerResult', {
                    isCorrect: isCorrect,
                    correctAnswer: currentQuestion.correct_answer,
                    playerAnswer: answer,
                    scoreGained: totalScoreGained,
                    breakdown: {
                        questionScore: questionScore,
                        cardBonusPoints: cardBonusPoints,
                        totalGained: totalScoreGained
                    },
                    newTotalScore: currentPlayer.score,
                    timedOut: timedOut,
                    cardBonus: currentPlayer.cardBonus
                });
                
                console.log(`📤 Individual result sent to ${playerName}`);
            }
            
            //  BROADCAST ANSWER EVENT TO ALL PLAYERS IN SESSION
            io.to(sessionId).emit('playerAnsweredBroadcast', {
                playerName: playerName,
                answer: answer,
                isCorrect: isCorrect,
                correctAnswer: currentQuestion.correct_answer,
                scoreGained: totalScoreGained,
                newScore: currentPlayer.score,
                timedOut: timedOut,
                question: currentQuestion.question_text || currentQuestion.text,
                breakdown: {
                    questionScore: questionScore,
                    cardBonusPoints: cardBonusPoints
                }
            });
            
            //  NOTIFY HOST WITH DETAILED INFO
            const hostSocketId = userLobbyLogic.hostSockets[sessionId];
            if (hostSocketId) {
                io.to(hostSocketId).emit('playerAnswered', {
                    playerName: playerName,
                    answer: answer,
                    isCorrect: isCorrect,
                    correctAnswer: currentQuestion.correct_answer,
                    scoreGained: totalScoreGained,
                    newScore: currentPlayer.score,
                    timedOut: timedOut,
                    breakdown: {
                        questionScore: questionScore,
                        cardBonusPoints: cardBonusPoints
                    }
                });
                
                //  UPDATE SCOREBOARD ON HOST
                io.to(hostSocketId).emit('scoreboardUpdate', {
                    sessionId: sessionId,
                    updatedPlayer: {
                        name: playerName,
                        newScore: currentPlayer.score,
                        scoreGained: totalScoreGained,
                        breakdown: {
                            questionScore: questionScore,
                            cardBonusPoints: cardBonusPoints
                        }
                    },
                    allScores: session.players.map(p => ({
                        name: p.name,
                        score: p.score || 0,
                        role: p.isDealer ? 'Dealer' : 'Player'
                    })),
                    currentRound: session.currentRound || 1
                });
                
                console.log(`📊 Host scoreboard updated for ${playerName}`);
            }
            
            console.log(`📤 Answer processing complete for ${playerName}`);
            
            //  MOVE TO NEXT PLAYER AFTER DELAY
            setTimeout(() => {
                moveToNextPlayer(sessionId);
            }, 3000);
        }

        // Function to end game
        function endGame(sessionId) {
            const session = userLobbyLogic.gameSessions[sessionId];
            if (!session) return;
            
            console.log('🏁 Game ending for session:', sessionId);
            
            // Calculate final rankings (scores already include all card bonuses from each round)
            const sortedPlayers = session.players
                .sort((a, b) => (b.score || 0) - (a.score || 0));
            
            const finalResults = {
                gameComplete: true,
                gameType: '5 Rounds - New Cards Each Round',
                totalRoundsCompleted: 5,
                finalScores: sortedPlayers.map((player, index) => {
                    return {
                        rank: index + 1,
                        name: player.name,
                        role: player.isDealer ? 'Dealer' : 'Player',
                        totalScore: player.score || 0,
                        questionsAnswered: 5,
                        finalCardValue: calculateCardValue(player.scannedCards || []), // Last round's cards
                        avgScorePerRound: Math.round((player.score || 0) / 5 * 100) / 100
                    };
                }),
                winner: {
                    name: sortedPlayers[0]?.name || 'No winner',
                    totalScore: sortedPlayers[0]?.score || 0,
                    role: sortedPlayers[0]?.isDealer ? 'Dealer' : 'Player'
                },
                gameStats: {
                    totalPlayersParticipated: session.players.length,
                    totalQuestionsAsked: session.players.length * 5,
                    totalRoundsCompleted: 5,
                    avgScorePerPlayer: Math.round((sortedPlayers.reduce((sum, p) => sum + (p.score || 0), 0)) / sortedPlayers.length * 100) / 100,
                    dynamicCardSystem: true, // Flag indicating cards changed each round
                    highestFinalScore: sortedPlayers[0]?.score || 0
                }
            };
            
            //  STORE SIMPLE GAME HISTORY
            storeSimpleGameHistory(sessionId, sortedPlayers);
            
            // Send final results
            io.to(sessionId).emit('gameComplete', finalResults);
            
            // Send individual results
            sortedPlayers.forEach((player, index) => {
                const playerSocketId = Object.keys(io.sockets.sockets).find(socketId => {
                    const socket = io.sockets.sockets[socketId];
                    return socket.playerName === player.name && socket.sessionId === sessionId;
                });
                
                if (playerSocketId) {
                    //  CALCULATE INDIVIDUAL PLAYER BREAKDOWN
                    const questionScore = Math.floor((player.score || 0) / 10) * 10; // Approximate question points
                    const cardBonus = (player.cardBonus?.bonusMarks || 0);
                    const dealerBeatBonus = (player.score || 0) - questionScore - cardBonus; // Remaining points from dealer beats
                    
                    io.to(playerSocketId).emit('gameComplete', {
                        ...finalResults,
                        //  PROPER INDIVIDUAL PLAYER DATA
                        playerScore: player.score || 0,
                        playerRank: index + 1,
                        playerRankText: getRankText(index + 1), // Add rank text function
                        playerFinalCardValue: calculateCardValue(player.scannedCards || []),
                        playerBreakdown: {
                            questionScore: questionScore,
                            cardBonus: cardBonus,
                            dealerBeatBonus: Math.max(0, dealerBeatBonus),
                            finalScore: player.score || 0,
                            beatDealerOverall: dealerBeatBonus > 0
                        },
                        isWinner: index === 0,
                        totalPlayers: sortedPlayers.length
                    });
                    
                    console.log(`📊 Individual result sent to ${player.name}: Rank ${index + 1}, Score ${player.score}`);
                }
            });
            
            // Update database
            const updateFinalScoreQuery = 'UPDATE game_sessions SET game_state = ?, updated_at = NOW() WHERE session_id = ?';
            db.query(updateFinalScoreQuery, ['completed', sessionId], (err) => {
                if (err) console.error('Error updating game completion:', err);
            });
            
            // Clean up session
            setTimeout(() => {
                delete userLobbyLogic.gameSessions[sessionId];
                delete userLobbyLogic.hostSockets[sessionId];
                console.log(`🧹 Session ${sessionId} cleaned up`);
            }, 30000);
        }

        function getRankText(rank) {
            const rankTexts = {
                1: '1st',
                2: '2nd', 
                3: '3rd'
            };
            return rankTexts[rank] || `${rank}th`;
        }

        function storeSimpleGameHistory(sessionId, sortedPlayers) {
            console.log('💾 Storing simple game history for session:', sessionId);
            
            const currentDate = new Date();
            const gameDate = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD
            const gameTime = currentDate.toTimeString().split(' ')[0]; // HH:MM:SS
            
            //  STORE EACH PLAYER'S FINAL RESULT
            sortedPlayers.forEach((player, index) => {
                const isWinner = index === 0; // First place is winner
                
                const insertHistoryQuery = `
                    INSERT INTO simple_game_history 
                    (session_id, player_name, final_score, final_rank, is_dealer, is_winner, game_date, game_time)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `;
                
                db.query(insertHistoryQuery, [
                    sessionId,
                    player.name,
                    player.score || 0,
                    index + 1, // final rank (1st, 2nd, 3rd, etc.)
                    player.isDealer,
                    isWinner,
                    gameDate,
                    gameTime
                ], (err, result) => {
                    if (err) {
                        console.error('Error storing simple game history:', err);
                    } else {
                        console.log(` Simple history stored for ${player.name}: Rank ${index + 1}, Score ${player.score}`);
                    }
                });
            });
            
            console.log(`📊 Game history stored for ${sortedPlayers.length} players on ${gameDate} at ${gameTime}`);
        }

        socket.on('hostConfirmedCardDistribution', (data) => {
            const { sessionId, round, message } = data;
            console.log(`🎴 Host confirmed card distribution for Round ${round}`);
            
            const session = userLobbyLogic.gameSessions[sessionId];
            if (!session) return;
            
            // Reset scanning state for new round
            session.gamePhase = 'qr_scanning';
            session.players.forEach(player => {
                player.scannedCards = [];
                player.cardBonus = null;
            });
            
            // Notify all players to start scanning
            io.to(sessionId).emit('startRoundScanning', {
                round: round,
                message: `Round ${round} - Start scanning your NEW cards!`,
                instructions: 'Scan the 2 new cards distributed by the dealer'
            });
        });

        socket.on('nextRoundStarting', (data) => {
            const { sessionId, round } = data;
            
            console.log(`🎯 Round ${round} starting - resetting host dashboard`);
            
            //  EMIT HOST DASHBOARD RESET
            const hostSocketId = userLobbyLogic.hostSockets[sessionId];
            if (hostSocketId) {
                const session = userLobbyLogic.gameSessions[sessionId];
                if (session) {
                    // Send fresh game data to host to reset the view
                    io.to(hostSocketId).emit('hostGameData', {
                        sessionId: sessionId,
                        players: session.players,
                        dealer: session.players.find(p => p.isDealer),
                        gameState: 'active',
                        currentRound: round,
                        message: `Round ${round} starting - Ready for questions`
                    });
                    
                    console.log(`📤 Host dashboard reset sent for Round ${round}`);
                }
            }
        });

        // Handle answer submission
        //  FIX: Update answerSubmitted handler to send correct info in answerTimerStop:
        socket.on('answerSubmitted', (data) => {
            const { sessionId, playerId, playerName, answer, submittedAt, autoSubmitted } = data;
            
            console.log(`📝 Answer submitted by ${playerName}: ${answer} ${autoSubmitted ? '(Auto-submitted)' : ''}`);
            
            //  GET SESSION AND MARK PLAYER AS ANSWERED
            const session = userLobbyLogic.gameSessions[sessionId];
            if (session) {
                const player = session.players.find(p => p.name === playerName || p.id === playerId);
                if (player) {
                    player.hasAnsweredThisRound = true; //  Mark as answered
                    console.log(` ${playerName} marked as answered for this round`);
                }
            }
            
            // Use the centralized handlePlayerAnswer function
            handlePlayerAnswer(sessionId, playerName, answer, false);
            
            //  CHECK IF ALL PLAYERS HAVE ANSWERED
            checkRoundComplete(sessionId);
        });

        // Handle answer timeout
        socket.on('answerTimeout', (data) => {
            const { sessionId, playerId, playerName, submittedAt } = data;
            
            console.log(`⏰ Answer timeout for ${playerName}`);
            
            //  GET SESSION AND MARK PLAYER AS ANSWERED
            const session = userLobbyLogic.gameSessions[sessionId];
            if (session) {
                const player = session.players.find(p => p.name === playerName || p.id === playerId);
                if (player) {
                    player.hasAnsweredThisRound = true; //  Mark as answered (timeout counts as answered)
                    console.log(`⏰ ${playerName} marked as answered (timeout) for this round`);
                }
            }
            
            // Use the centralized handlePlayerAnswer function
            handlePlayerAnswer(sessionId, playerName, 'Timeout', true);
            
            //  CHECK IF ALL PLAYERS HAVE ANSWERED
            checkRoundComplete(sessionId);
        });

        socket.on('requestCardComparison', async (data) => {
            console.log('🎯 Card comparison requested:', data);
            
            const { sessionId, round, players, dealerName, bonusPoints = 10 } = data;
            
            try {
                const gameSession = userLobbyLogic.gameSessions[sessionId];
                if (!gameSession) {
                    console.error('❌ Game session not found for card comparison');
                    return;
                }
                
                //  GET CURRENT ROUND COMBINED CARD VALUES FROM DATABASE
                const getCardsQuery = `
                    SELECT player_name, socket_id, round_${round}_card_value as combined_value, is_dealer
                    FROM game_players 
                    WHERE session_id = ? AND round_${round}_card_value IS NOT NULL
                `;
                
                db.query(getCardsQuery, [sessionId], (err, cardResults) => {
                    if (err) {
                        console.error('❌ Error fetching round card values:', err);
                        return;
                    }
                    
                    console.log(`📊 Round ${round} combined card values from database:`, cardResults);
                    
                    // Find dealer from database results
                    const dealerData = cardResults.find(p => p.is_dealer === 1);
                    if (!dealerData || dealerData.combined_value === null) {
                        console.error('❌ Dealer card value not found in database');
                        return;
                    }
                    
                    const dealerCombinedValue = dealerData.combined_value;
                    console.log(`🎴 Dealer ${dealerName} combined card value: ${dealerCombinedValue}`);
                    
                    const comparisonResults = [];
                    let totalBonusAwarded = 0;
                    let playersBeatingDealer = 0;
                    
                    //  PROCESS EACH PLAYER'S COMBINED VALUES FROM DATABASE
                    cardResults.forEach(playerData => {
                        const playerCombinedValue = playerData.combined_value || 0;
                        const isDealer = playerData.is_dealer === 1;
                        
                        //  SIMPLE RULE: Player card value > dealer card value = +10 bonus
                        const beatsDealer = playerCombinedValue > dealerCombinedValue;
                        
                        console.log(`🔍 ${playerData.player_name} (${isDealer ? 'Dealer' : 'Player'}): ${playerCombinedValue} vs Dealer: ${dealerCombinedValue} = ${beatsDealer ? 'WINS' : 'LOSES'}`);
                        
                        const sessionPlayer = gameSession.players.find(p => p.name === playerData.player_name);
                        
                        let bonusAwarded = 0;
                        if (beatsDealer) {
                            bonusAwarded = bonusPoints; // +10 bonus for higher card value
                            totalBonusAwarded += bonusAwarded;
                            playersBeatingDealer++;
                            
                            //  UPDATE PLAYER SCORE IN DATABASE
                            const updateScoreQuery = `
                                UPDATE game_players 
                                SET total_score = total_score + ?
                                WHERE session_id = ? AND socket_id = ?
                            `;

                            db.query(updateScoreQuery, [bonusAwarded, sessionId, playerData.socket_id], (err) => {
                                if (err) console.error('Error updating beat dealer bonus:', err);
                                else console.log(`💰 ${playerData.player_name} +${bonusAwarded} points for beating dealer (${playerCombinedValue} > ${dealerCombinedValue})`);
                            });
                            
                            //  UPDATE IN-MEMORY SESSION DATA
                            if (sessionPlayer) {
                                sessionPlayer.score = (sessionPlayer.score || 0) + bonusAwarded;
                            }
                            
                            console.log(`🎉 ${playerData.player_name} beats dealer! ${playerCombinedValue} > ${dealerCombinedValue} (+${bonusAwarded} points)`);
                        } else {
                            console.log(`❌ ${playerData.player_name} does not beat dealer: ${playerCombinedValue} ≤ ${dealerCombinedValue}`);
                        }
                        
                        //  BUILD RESULTS (including all players)
                        comparisonResults.push({
                            playerName: playerData.player_name,
                            role: isDealer ? 'Dealer' : 'Player',
                            playerCardValue: playerCombinedValue,
                            dealerCardValue: dealerCombinedValue,
                            beatsDealer: beatsDealer,
                            bonusAwarded: bonusAwarded,
                            newScore: sessionPlayer ? (sessionPlayer.score || 0) : 0,
                            isDealerBeatingThemselves: isDealer && beatsDealer //  Still track for display
                        });
                    });
                    
                    console.log(`📊 Card comparison complete: ${playersBeatingDealer} players beat dealer, ${totalBonusAwarded} bonus points awarded`);
                    
                    // Emit results to all clients
                    io.to(sessionId).emit('roundCardComparison', {
                        roundCompleted: round,
                        dealerCardValue: dealerCombinedValue,
                        dealerName: dealerName,
                        results: comparisonResults,
                        summary: {
                            playersBeatingDealer: playersBeatingDealer,
                            totalBonusAwarded: totalBonusAwarded,
                            bonusRule: `+${bonusPoints} points for higher combined card value`
                        }
                    });

                    comparisonResults.forEach(result => {
                        console.log(`🔍 Checking result for ${result.playerName}: beatsDealer=${result.beatsDealer}, role=${result.role}`);
                        
                        if (result.beatsDealer) {
                            // Find the specific player's socket ID
                            let playerSocketId = null;
                            
                            // Method 1: Check all connected sockets
                            const allSockets = Object.keys(io.sockets.sockets);
                            for (const socketId of allSockets) {
                                const socket = io.sockets.sockets[socketId];
                                const socketRooms = Array.from(socket.rooms);
                                const isInSession = socketRooms.includes(sessionId);
                                const matchesPlayer = (socket.playerName === result.playerName || socket.username === result.playerName);
                                
                                if (isInSession && matchesPlayer) {
                                    playerSocketId = socketId;
                                    console.log(` Found socket for ${result.playerName}: ${socketId}`);
                                    break;
                                }
                            }
                            
                            // Method 2: Fallback to session data
                            if (!playerSocketId) {
                                const sessionPlayer = gameSession.players.find(p => p.name === result.playerName);
                                if (sessionPlayer && sessionPlayer.id && io.sockets.sockets[sessionPlayer.id]) {
                                    playerSocketId = sessionPlayer.id;
                                    console.log(` Found socket from session data for ${result.playerName}: ${playerSocketId}`);
                                }
                            }

                            //  SEND SIMPLE NOTIFICATION TO SPECIFIC PLAYER
                            if (playerSocketId) {
                                io.to(playerSocketId).emit('dealerBeatNotification', {
                                    playerName: result.playerName, // Target specific player
                                    message: result.role === 'Dealer' ? 
                                        `🎉 You beat yourself as dealer!` : 
                                        `🎉 You beat the dealer!`,
                                    playerCardValue: result.playerCardValue,
                                    dealerCardValue: result.dealerCardValue,
                                    bonusAwarded: result.bonusAwarded,
                                    newScore: result.newScore,
                                    isDealerBeatingThemselves: result.role === 'Dealer'
                                });
                                
                                console.log(`📤 Sent dealer beat notification to ${result.playerName} only`);
                            } else {
                                console.error(`❌ Could not find socket for ${result.playerName}`);
                            }
                        }
                    });

                    const hostSocketId = userLobbyLogic.hostSockets[sessionId];
                    if (hostSocketId) {
                        const dealerResult = comparisonResults.find(r => r.role === 'Dealer');
                        const playerWinners = comparisonResults.filter(r => r.beatsDealer && r.role === 'Player');
                        const dealerBeatsThemselves = dealerResult && dealerResult.beatsDealer;
                        
                        io.to(hostSocketId).emit('hostCardComparisonResults', {
                            round: round,
                            dealerName: dealerName,
                            dealerCardValue: dealerCombinedValue,
                            dealerBeatsThemselves: dealerBeatsThemselves,
                            dealerBonusAwarded: dealerBeatsThemselves ? (dealerResult.bonusAwarded || 0) : 0,
                            playerWinners: playerWinners.map(winner => ({
                                playerName: winner.playerName,
                                cardValue: winner.playerCardValue,
                                bonusAwarded: winner.bonusAwarded,
                                newScore: winner.newScore
                            })),
                            playerLosers: comparisonResults.filter(r => !r.beatsDealer && r.role === 'Player').map(loser => ({
                                playerName: loser.playerName,
                                cardValue: loser.playerCardValue,
                                newScore: loser.newScore
                            })),
                            summary: {
                                totalWinners: playersBeatingDealer,
                                totalBonusAwarded: totalBonusAwarded,
                                dealerParticipated: true,
                                specialMessage: dealerBeatsThemselves ? 
                                    `🎉 Dealer ${dealerName} beat themselves and earned +${dealerResult.bonusAwarded} bonus points!` : 
                                    `😔 Dealer ${dealerName} did not beat their own card value.`
                            }
                        });
                        
                        console.log(`🎴 Host card comparison results sent: ${playersBeatingDealer} total winners (including ${dealerBeatsThemselves ? 'dealer' : 'no dealer'})`);
                    }
                    
                    // Reset for next round
                    gameSession.players.forEach(p => p.hasAnsweredThisRound = false);
                    
                    // Continue to next round or end game
                    setTimeout(() => {
                        if (round < 5) {
                            console.log(`🔄 Starting Round ${round + 1} after card comparison`);
                        } else {
                            console.log('🏆 All rounds complete - ending game');
                            endGame(sessionId);
                        }
                    }, 10000); //  10 seconds display time
                });
                
            } catch (error) {
                console.error('❌ Error in card comparison:', error);
            }
        });

        function debugDatabaseState(sessionId) {
            console.log(`\n🔍 DATABASE STATE DEBUG for session ${sessionId}:`);
            
            const debugQuery = `
                SELECT 
                    player_name,
                    total_score,
                    bonus_marks,
                    is_dealer,
                    card_bonus,
                    round_1_card_value,
                    round_2_card_value,
                    round_3_card_value,
                    round_4_card_value,
                    round_5_card_value
                FROM game_players 
                WHERE session_id = ?
                ORDER BY total_score DESC
            `;
            
            db.query(debugQuery, [sessionId], (err, results) => {
                if (err) {
                    console.error('Error fetching debug data:', err);
                    return;
                }
                
                console.log('📊 Current Database State:');
                results.forEach(player => {
                    console.log(`  ${player.player_name} (${player.is_dealer ? 'Dealer' : 'Player'}):`);
                    console.log(`    Total Score: ${player.total_score}`);
                    console.log(`    Bonus Marks: ${player.bonus_marks}`);
                    console.log(`    Card Bonus: ${player.card_bonus || 'None'}`);
                    console.log(`    Round Values: [${player.round_1_card_value || '?'}, ${player.round_2_card_value || '?'}, ${player.round_3_card_value || '?'}, ${player.round_4_card_value || '?'}, ${player.round_5_card_value || '?'}]`);
                    console.log('');
                });
            });
        }

        function getCombinedCardValue(scannedCards) {
            if (!scannedCards || scannedCards.length === 0) {
                console.log('⚠️ No scanned cards provided');
                return 0;
            }
            
            console.log('🎴 Processing scanned cards for combined value:', JSON.stringify(scannedCards, null, 2));
            
            let totalValue = 0;
            let aces = 0;
            
            scannedCards.forEach((card, index) => {
                let cardValue = '';
                
                console.log(`  🔍 Processing card ${index + 1}:`, card);
                
                //  HANDLE DIFFERENT CARD DATA STRUCTURES
                if (typeof card === 'string') {
                    cardValue = card;
                    console.log(`    📄 String card: ${cardValue}`);
                } else if (typeof card === 'object' && card !== null) {
                    cardValue = card.value || card.card || card.name || card.rank || card.cardValue || '';
                    console.log(`    📊 Object card - value: ${cardValue}`);
                } else if (typeof card === 'number') {
                    cardValue = card.toString();
                    console.log(`    🔢 Number card: ${cardValue}`);
                } else {
                    console.warn(`    ⚠️ Unknown card format:`, card);
                    return;
                }
                
                //  CLEAN UP THE CARD VALUE
                let cleanValue = cardValue.toString().replace(/[♠♥♦♣\s\-_]/g, '').trim().toUpperCase();
                console.log(`    🧹 Cleaned value: "${cleanValue}"`);
                
                //  CONVERT TO BLACKJACK-STYLE VALUE
                let numericValue = 0;
                
                if (cleanValue === 'A' || cleanValue === 'ACE') {
                    aces++;
                    numericValue = 11; // Start with 11, will adjust later if needed
                } else if (['K', 'KING', 'Q', 'QUEEN', 'J', 'JACK'].includes(cleanValue)) {
                    numericValue = 10; // Face cards = 10
                } else {
                    // Handle numeric values (2-10)
                    const parsedValue = parseInt(cleanValue);
                    if (!isNaN(parsedValue) && parsedValue >= 2 && parsedValue <= 10) {
                        numericValue = parsedValue;
                    } else {
                        console.warn(`    ⚠️ Could not parse card value: "${cardValue}" → "${cleanValue}"`);
                        numericValue = 0;
                    }
                }
                
                totalValue += numericValue;
                console.log(`     Card value: ${numericValue}, Running total: ${totalValue}`);
            });
            
            //  ADJUST FOR ACES (if total > 21, convert Aces from 11 to 1)
            while (totalValue > 21 && aces > 0) {
                totalValue -= 10; // Convert one Ace from 11 to 1
                aces--;
                console.log(`    🔄 Adjusted for Ace: New total: ${totalValue}`);
            }
            
            console.log(`🎴 Combined card value: ${totalValue}`);
            return totalValue;
        }

        function checkRoundComplete(sessionId) {
            const gameSession = userLobbyLogic.gameSessions[sessionId]; //  Fix reference
            if (!gameSession) return;
            
            // Check if all players have answered their questions for this round
            const allPlayersAnswered = gameSession.players.every(player => 
                player.hasAnsweredThisRound === true
            );
            
            console.log(`🔍 Checking round complete: ${gameSession.players.map(p => `${p.name}:${p.hasAnsweredThisRound ? '' : '❌'}`).join(', ')}`);
            
            if (allPlayersAnswered) {
                console.log(`🎯 All players answered in round ${gameSession.currentRound} - starting card comparison`);
                
                //  EMIT EVENT TO TRIGGER CARD COMPARISON
                io.to(sessionId).emit('allPlayersAnsweredInRound', {
                    round: gameSession.currentRound,
                    players: gameSession.players,
                    dealerName: gameSession.players.find(p => p.isDealer)?.name || 'Unknown'
                });
                
                // Reset for next round (will be done after card comparison)
                // Note: Don't reset here, reset when next round actually starts
            } else {
                console.log(`⏳ Waiting for more players to answer in round ${gameSession.currentRound}`);
            }
        }

        function getGameHistory(sessionId, callback) {
            const gameHistoryQuery = `
                SELECT 
                    gp.player_name,
                    gp.is_dealer,
                    gp.total_score,
                    gcc.round_number,
                    gcc.player_card_value,
                    gcc.dealer_card_value,
                    gcc.beats_dealer,
                    gcc.bonus_awarded
                FROM game_players gp
                LEFT JOIN game_card_comparisons gcc ON gp.session_id = gcc.session_id AND gp.player_name = gcc.player_name
                WHERE gp.session_id = ?
                ORDER BY gcc.round_number, gp.player_name
            `;
            
            db.query(gameHistoryQuery, [sessionId], callback);
        }

        socket.on('getPlayerHistory', (data) => {
            const { playerName } = data;
            console.log(`📊 Fetching simple history for player: ${playerName}`);
            
            // Get player's game history
            const getHistoryQuery = `
                SELECT 
                    session_id,
                    final_score,
                    final_rank,
                    is_dealer,
                    is_winner,
                    game_date,
                    game_time,
                    DATE_FORMAT(game_completed_at, '%Y-%m-%d %H:%i') as formatted_datetime
                FROM simple_game_history
                WHERE player_name = ?
                ORDER BY game_completed_at DESC
                LIMIT 20
            `;
            
            db.query(getHistoryQuery, [playerName], (err, historyResults) => {
                if (err) {
                    console.error('Error fetching player history:', err);
                    socket.emit('playerHistoryError', { message: 'Error fetching history' });
                    return;
                }
                
                // Calculate basic statistics
                const totalGames = historyResults.length;
                const totalWins = historyResults.filter(game => game.is_winner).length;
                const totalScore = historyResults.reduce((sum, game) => sum + game.final_score, 0);
                const averageScore = totalGames > 0 ? (totalScore / totalGames).toFixed(1) : '0.0';
                const winRate = totalGames > 0 ? ((totalWins / totalGames) * 100).toFixed(1) : '0.0';
                
                socket.emit('playerHistory', {
                    playerName: playerName,
                    statistics: {
                        totalGamesPlayed: totalGames,
                        totalWins: totalWins,
                        winRate: winRate + '%',
                        totalScore: totalScore,
                        averageScore: averageScore,
                        lastPlayed: historyResults[0]?.formatted_datetime || 'Never'
                    },
                    gameHistory: historyResults.map(game => ({
                        sessionId: game.session_id,
                        finalScore: game.final_score,
                        finalRank: game.final_rank,
                        isDealer: game.is_dealer,
                        isWinner: game.is_winner,
                        gameDate: game.game_date,
                        gameTime: game.game_time,
                        completedAt: game.formatted_datetime
                    }))
                });
                
                console.log(` Simple history sent for ${playerName}: ${totalGames} games, ${totalWins} wins`);
            });
        });

        //  ADD this socket handler to get specific game details:
        socket.on('getGameDetails', (data) => {
            const { sessionId } = data;
            console.log(`🔍 Fetching game details for session: ${sessionId}`);
            
            const getGameDetailsQuery = `
                SELECT 
                    player_name,
                    final_score,
                    final_rank,
                    is_dealer,
                    is_winner,
                    game_date,
                    game_time
                FROM simple_game_history
                WHERE session_id = ?
                ORDER BY final_rank
            `;
            
            db.query(getGameDetailsQuery, [sessionId], (err, gameResults) => {
                if (err) {
                    console.error('Error fetching game details:', err);
                    socket.emit('gameDetailsError', { message: 'Error fetching game details' });
                    return;
                }
                
                if (gameResults.length === 0) {
                    socket.emit('gameDetailsError', { message: 'Game not found' });
                    return;
                }
                
                const gameInfo = gameResults[0]; // Get date/time from any player record
                
                socket.emit('gameDetails', {
                    sessionId: sessionId,
                    gameDate: gameInfo.game_date,
                    gameTime: gameInfo.game_time,
                    totalPlayers: gameResults.length,
                    winner: gameResults.find(p => p.is_winner),
                    allPlayers: gameResults.map(player => ({
                        name: player.player_name,
                        finalScore: player.final_score,
                        finalRank: player.final_rank,
                        isDealer: player.is_dealer,
                        isWinner: player.is_winner
                    }))
                });
                
                console.log(` Game details sent for session ${sessionId}: ${gameResults.length} players`);
            });
        });
    });
};