/**
 *  apples_against_humanity - Apples-to-Apples and Cards Against Humanity multi-player game.
 *  Copyright (C) 2017 by Wade Wooldridge
 *
 *  server.js - Main server executable.
 */

/**
 *  cache - Main cache object to store cached files.
 */
var cache = {};

/**
 *  Node / Express modules.
 */
var express = require('express');
var routes = require('../routes');
var fs = require('fs');
var http = require('http');
var mime = require('mime');
var path = require('path');

var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

/**
 *  Program-specific modules.
 */
var gameList = require('./GameList');

/**
 *  Create the main Express app.
 */
var app = express();

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

// Add REST interface dispatching here.
app.get('/games/a2a', function(request, response) {
    response.setHeader('Content-Type', 'application/json');
    response.send(JSON.stringify(gameList.getByGameType(true)));
});

app.get('/games/cah', function(request, response) {
    response.setHeader('Content-Type', 'application/json');
    response.send(JSON.stringify(gameList.getByGameType(false)));
});

app.get('/games', function(request, response) {
    response.setHeader('Content-Type', 'application/json');
    response.send(JSON.stringify(gameList.getAll()));
});

app.get('/new/a2a', function(request, response) {
    var gameId = gameList.create(true);
    response.setHeader('Content-Type', 'application/json');
    response.send(JSON.stringify(gameList.getById(gameId)));
});

app.get('/new/cah', function(request, response) {
    var gameId = gameList.create(false);
    response.setHeader('Content-Type', 'application/json');
    response.send(JSON.stringify(gameList.getById(gameId)));
});

// Serve default page as index.html.
app.get('/', function(request, response) {
    response.sendFile(path.join(__dirname, '../public', 'index.html'));
});

// Most pages are just served statically.
app.use(express.static(path.join(__dirname, '../public')));
//app.use('/', index);

// Drop through to catch 404 and forward to error handler.
app.use(function(req, res, next) {
    var err = new Error('Not Found');
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
