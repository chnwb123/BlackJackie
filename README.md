# BlackJackie - Multiplayer Card Game Web App

## Overview

BlackJackie is a Python control flow programming concept quiz answering web app. It combines the rules of Blackjack or 21, physical deck of cards with QR codes embedded, and digital devices like mobile phones and laptop to allow interactive quiz answering session.

## Features

- Each physical playing card has its own QR code picture sticked on it. E.g. 4 of Hearts card has a QR code stick behind it. The QR code stores the info of the card for scanning purposes.
- Laptop must serve as the host that shares the game session QR code, displaying the players, scoreboard, question, who is/ are the dealer or players, as laptop's screen is bigger.
- Player scans the game session's QR code to join game lobby using their mobile phones.
- Min of 2 players OR Max of 5 players. Host can start depends on either these 2 conditions.
- After start, a dealer would be chosen from the players, he/ she would be the dealer throughout the 5 rounds. Dealer's job is to distribute 2 cards during the start of each round, and his/ her cards would be compared to other players after each round.
- On the beginning of every round, players wait for the dealer to distribute 2 cards for each of them. Dealer also gets 2 cards.
- Players scan their 2 cards to get their own question for the round.
- Double symbol combination = +5 points if answered correctly
- Double number combination = +7 points if answered correctly
- Value of 21 combination = +10 points if answered correctly
- No special combination = +0 points if answered correctly
- Each question has a base 10 points. E.g. No special combo + answered correctly = +10 points OR double symbol combination + answered correctly = +15 points OR value of 21 combination + answered wrongly = +0 points
- On every round, dealer starts to answer first, every mobile phone player will see the question and the post-answering summary like answered correctly and +10 points.
- Host scoreboard would be updated in real-time manner.
- Players answer turn by turn and only 1 question. After all players have answered, the round is finished.
- Before the round finished, each player's cards would be compared to the dealer's cards. If someone's value is greater than the dealer, an additional 10 points would be added.
- After the first round, second round's dealer would be the same. The gameplay process continues until it finishes the 5th round.
- After the 5th round, every player's final points would be shown on their own mobile phone.
  
## Technologies Used

- Node.js & Express.js
- Socket.IO (real-time communication)
- Pug (template engine)
- MySQL (database)
- JavaScript (frontend and backend)
- HTML5, CSS3 (responsive design)
- jsQR (QR code scanning)

## Folder Structure

```
/database/db.js                         # phpmyadmin localhost configuration
/phpMyAdmin_database/blackjackie.sql    # database import
/public/css                             # css files
/public/js                              # AJAX implementation on registration for tracking duplicate username
/qr_codes                               # all the QR code images for each of the playing card
/routes                                 # login, registration, host and mobile phone gameplays logics 
/views                                  # pug files for rendering web layouts and elements
.env                                    # ngrok configuration file
app.js                                  # main router management file
generate_cards.js                       # generating QR codes for each of the playing card.
populate_database.js                    # insert card details into the card table
qr_codes_print.html                     # shows all the qr codes in /qr_codes in web browser.
```

## How to Run

1. **Install dependencies:**
   ```
   npm install
   ```

2. **Configure your database:**
   - Update your MySQL connection settings in the /database/db.js file as needed

3. **Start the ngrok:**
   ```
   ngrok http 3000
   ```

4. **Initialize ngrok connection:**
   - Copy the URL from the Forwarding. E.g. https://f2221b2ffeca.ngrok-free.app
   - Pastes it to the .env file's SERVER_URL's value  

5. **Initialize ngrok connection:**
   - Copy the URL from the Forwarding. E.g. https://f2221b2ffeca.ngrok-free.app
   - Pastes it to the .env file's SERVER_URL's value  

6. **Start the server:**
   ```
   node app
   ```

7. Play the game 
