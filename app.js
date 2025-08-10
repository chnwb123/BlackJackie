// Import Dependencies:
const session = require('express-session');
const bodyParser = require('body-parser');
const express = require("express");
const path = require("path");
const http = require('http');
const socketIo = require('socket.io');

// Initialize the App:
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Set Up Session Middleware:
require('dotenv').config(); // Load environment variables from .env file
app.use(session({
    secret: 'blackjackie',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true if using HTTPS
}));

// Import routes
const HomePage = require('./routes/HomePage');
const HostPage = require('./routes/HostPage');
const JoinURL = require('./routes/JoinUrl');
const Mobile_Register = require('./routes/Mobile_Register');
const Mobile_Login = require('./routes/Mobile_Login');
const Mobile_Lobby = require('./routes/Mobile_Lobby');
const Mobile_Users_Lobby = require('./routes/Mobile_Users_Lobby');
const Users_Lobby_Logic = require('./routes/Users_Lobby_Logic'); 
const Gameplay_Host_Dashboard = require('./routes/Gameplay_Host_Dashboard');
const Gameplay_Mobile = require('./routes/Gameplay_Mobile'); 
const Gameplay_Logic = require('./routes/Gameplay_Logic'); 
const Mobile_Result = require('./routes/Mobile_Result');
const db = require('./database/db'); // Database middleware

// Set Up Middleware:
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: false })); // Body parser middleware for URL-encoded data
app.use(bodyParser.json());

// Initialize Socket.IO game logic
Users_Lobby_Logic(io, db); // Pass both io and db to the Users_Lobby_Logic module
Gameplay_Logic(io, db);

// Use routes
app.use(function(req, res, next) { //  Database route
    req.db = db;
    next();
});
app.use("/", HomePage);
app.use("/", HostPage);
app.use("/", JoinURL);
app.use("/", Mobile_Register);
app.use("/", Mobile_Login);
app.use("/", Mobile_Lobby);
app.use("/", Mobile_Users_Lobby);
app.use("/", Gameplay_Host_Dashboard);
app.use("/", Gameplay_Mobile);
app.use("/", Mobile_Result);

// Set Up View Engine:
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

// Define Routes:
app.get("/", function (req, res) {
    res.render("HomePage", { title: "BlackJackie", message: "Hello there!" });
});

// Start the Server with Socket.IO:
server.listen(3000, function () {
    console.log("Example app listening on port 3000!");
});