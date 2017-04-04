/**
 *  apples_against_humanity - Apples-to-Apples and Cards Against Humanity multi-player game.
 *  Copyright (C) 2017 by Wade Wooldridge
 *
 *  server.js - Main server executable.
 */

/**
 *  cache - Main cache object to store cached files.
 */
const cache = {};

/**
 *  Node / Express modules.
 */
const express = require('express');
const http = require('http');
const routes = require('../routes');

const fs = require('fs');
const mime = require('mime');
const path = require('path');

const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

/**
 *  Program-specific modules.
 */
const gameList = require('./GameList');
const a2aJson = require('./assets/apples_to_apples.json');
const cahJson = require('./assets/cards_against_humanity.json');
gameList.loadMasterDecks(a2aJson, cahJson);

/**
 *  Create the main Express app.
 */
const app = express();
const server = http.createServer(app);
const io = require('socket.io')(server);
gameList.setIo(io);

// Set up view engine: only using Jade for the default error handler; the rest are static pages.
app.set('views', path.join(__dirname, '../views'));
app.set('view engine', 'jade');

/**
 *  Define the middleware order of execution.
 */
app.use(favicon(path.join(__dirname, '../public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
//app.use(cookieParser());

app.use(function(request, response, next) {
    response.header('Access-Control-Allow-Origin', '*');
    response.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Add REST interface dispatching here.
app.get('/games/a2a', function(request, response) {
    response.setHeader('Content-Type', 'application/json');
    response.send(JSON.stringify(gameList.getGamesByGameType(true)));
});

app.get('/games/cah', function(request, response) {
    response.setHeader('Content-Type', 'application/json');
    response.send(JSON.stringify(gameList.getGamesByGameType(false)));
});

app.get('/games', function(request, response) {
    response.setHeader('Content-Type', 'application/json');
    response.send(JSON.stringify(gameList.getAllGames()));
});

app.get('/new/a2a', function(request, response) {
    const gameId = gameList.createGame(true);
    response.setHeader('Content-Type', 'application/json');
    response.send(JSON.stringify(gameList.getGameByGameId(gameId)));
});

app.get('/new/cah', function(request, response) {
    const gameId = gameList.createGame(false);
    response.setHeader('Content-Type', 'application/json');
    response.send(JSON.stringify(gameList.getGameByGameId(gameId)));
});

app.get('/debug', function(request, response) {
    const debugDump = gameList.getDebugDump();
    response.setHeader('Content-Type', 'application/json');
    response.send(JSON.stringify(debugDump));
});

// Serve default page as index.html.
app.get('/', function(request, response) {
    response.sendFile(path.join(__dirname, '../public', 'index.html'));
});

// Most pages are just served statically.
app.use(express.static(path.join(__dirname, '../public')));
//app.use('/', index);

// Handle dispatch for socket IO.
io.on('connection', function(socket) {
    console.log('io.connection: ' + socket.id);
    //console.dir(socket);

    // Create a Player object for the existing socket.
    gameList.createPlayer(socket);

    // Set up all of the event emitter event handlers in the GameList object.
    gameList.setEventHandlers(socket);
});

// Listen for socket IO requests on port 3001.
server.listen(3001);
console.log('socket.io listening on port 3001');

// Drop through to catch 404 and forward to error handler.
app.use(function(req, res, next) {
    const err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// Generic error handler.
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

// Export the app so it can be started from the top-level index.js.
module.exports = app;
