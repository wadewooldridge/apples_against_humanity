/**
 *  apples_against_humanity - Apples-to-Apples and Cards Against Humanity multi-player game.
 *  Copyright (C) 2017 by Wade Wooldridge
 *
 *  server.js - Main server executable.
 */

/**
 *  Node modules.
 */
var express = require('express');
var routes = require('../routes');
var user = require('../routes/users');
var fs = require('fs');
var http = require('http');
var mime = require('mime');
var path = require('path');

var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var index = require('../routes/index');
var users = require('../routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, '../views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, '../public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../public')));

app.use('/', index);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;

/**
 *  cache - Main cache object to store cached files.
 */
var cache = {};

/**
 *  send404 - static file server: return 404 not found.
 */
// function send404(response) {
//     response.writeHead(404, {'Content-Type': 'text/plain'});
//     response.write('Error 404: resource not found.');
//     response.end();
// }

/**
 *  sendFile - static file server: return file.
 */
// function sendFile(response, filePath, fileContents) {
//     response.writeHead(200, {'Content-Type': mime.lookup(path.basename(filePath))});
//     response.end(fileContents);
// }

/**
 *  serveStatic - main server of static (client) files.
 */
// function serveStatic(response, cache, absPath) {
//     if (cache[absPath]) {
//         // File exists in cache.
//         sendFile(response, absPath, cache[absPath]);
//     } else {
//         // File not already in cache.
//         fs.exists(absPath, function(exists) {
//             if (exists) {
//                 // File exists.
//                 fs.readFile(absPath, function(err, data) {
//                     if (err) {
//                         // readFile failed.
//                         send404(response);
//                     } else {
//                         // readFile succeeded.
//                         cache[absPath] = data;
//                         sendFile(response, absPath, data);
//                     }
//                 });
//             } else  {
//                 // File does not exist.
//                 send404(response);
//             }
//         });
//     }
// }

/**
 *  Main server.
 */
// var server = http.createServer(function(request, response) {
//     var filePath = './app/client/';
//
//     if (request.url == '/') {
//         filePath += 'index.html';
//     } else {
//         filePath += request.url;
//     }
//
//     serveStatic(response, cache, filePath);
// });
//
// server.listen(3000, function() {
//     console.log('Server listening on port 3000.');
// });
