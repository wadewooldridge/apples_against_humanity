/**
 *  apples_against_humanity - Apples-to-Apples and Cards Against Humanity multi-player game.
 *  Copyright (C) 2017 by Wade Wooldridge
 *
 *  client.js - Main code for client.
 */

/**
 *  Set up basic Angular routing.
 */
var app = angular.module('aahClientApp',['ngRoute']);

app.controller('routeController', function($log){
    $log.log('routeController');
});

app.config(function($routeProvider){
    $routeProvider
        // Main (choose game) page.
        .when('/', {
            templateUrl: 'choose_game.html',
            controller: 'chooseGameController',
            controllerAs: 'cgc'
        })
        .when('/choose', {
            templateUrl: 'choose_game.html',
            controller: 'chooseGameController',
            controllerAs: 'cgc'
        })
        // Join game page.
        .when('/join',{
            templateUrl: 'join_game.html',
            controller: 'joinGameController',
            controllerAs: 'jgc'
        })
        // New Game page.
        .when('/new',{
            templateUrl: 'new_game.html',
            controller: 'newGameController',
            controllerAs: 'ngc'
        })
        // Play game page.
        .when('/play',{
            templateUrl: 'play_game.html',
            controller: 'playGameController',
            controllerAs: 'pgc'
        })
        .otherwise({
            redirectTo: "/"
        })
});

// Controller for Choose Game page.
app.controller('chooseGameController', ['$interval', '$location', '$log', 'GameService', function($interval, $location, $log, GameService){
    $log.log('chooseGameController');
    var self = this;

    // Default to no games found.
    this.gameList = undefined;
    this.gameListEmpty = true;

    // Interval promise for updates; need to cancel when leaving this controller.
    this.intervalPromise = undefined;

    // Start the interval timer.
    this.startIntervalTimer = function() {
        $log.log('cgc.startIntervalTimer');
        this.intervalPromise = $interval(this.handleIntervalTimer, 2000);
    };

    // Stop the interval timer.
    this.stopIntervalTimer = function() {
        $log.log('cgc.stopIntervalTimer');
        $interval.cancel(this.intervalPromise);
        this.intervalPromise = undefined;
    };

    // Handle interval timer: poll for game list.
    this.handleIntervalTimer = function() {
        $log.log('cgc.handleIntervalTimer');
        GameService.getGameList().then(function(gameList) {
            $log.log('handleIntervalTimer: got new gameList');
            self.gameList = gameList;
            self.gameListEmpty = (Object.keys(gameList).length === 0);
        })
    };

    // Handle click on Join Game button.
    this.joinGame = function(gameId) {
        $log.log('cgc.joinGame: ' + gameId);
        this.stopIntervalTimer();

        // Set the current game, and go to the join dialog.
        GameService.setCurrentGame(gameId);
        $location.url('/join');
    };

    // Handle click on Start New Game.
    this.newGame = function(gameTypeApples) {
        $log.log('cgc.newGame: ' + gameTypeApples);
        this.stopIntervalTimer();

        // Start a new game on the server.
        GameService.startNewGame(gameTypeApples).then(function() {
            $log.log('cgc.newGame: complete');
            $location.url('/new');
        });

    };

    // Code that gets executed on controller initialization.
    $log.log('cgc:init');
    this.startIntervalTimer();

}]);

// Controller for Join Game page.
app.controller('joinGameController', ['$log', function($log){
    $log.log('joinGameController');
}]);

// Controller for New Game page.
app.controller('newGameController', ['$log', function($log){
    $log.log('newGameController');
}]);

// Controller for Play Game page.
app.controller('playGameController', ['$log', function($log){
    $log.log('playGameController');
}]);

// Service for interfacing to the game server.
app.service('GameService', ['$http', '$location', '$log', '$q', function($http, $location, $log, $q) {
    $log.log('GameService: factory');
    var self = this;

    /**
     *  Current list of possible games.
     */
    this.currentGameList = undefined;

    /**
     *  Current game being played.
     */
    this.currentGameId = undefined;
    this.currentGame = undefined;

    /**
     *  Simpler getter methods.
     */
    this.getCurrentGameList = function() {return this.currentGameList};
    this.getCurrentGameId   = function() {return this.currentGameId};
    this.getCurrentGame     = function() {return this.currentGame};

    /**
     *  Call game server to get the current list of games.
     */
    this.getGameList = function() {
        $log.log('GameServer.getGameList');
        var url = 'http://localhost:3000/games';

        return $http({
            method: 'GET',
            url: url
        })
            .catch(function(_error) {
                $log.warn(_error);
                $q.reject(_error);
            })
            .then(function(response) {
                $log.log('getGameList: ' + response);
                self.currentGameList = response.data;
                return self.currentGameList;
            })
    };

    /**
     *  Call game server to start a new game of the specified type.
     */
    this.startNewGame = function(gameTypeApples) {
        $log.log('GameServer.startNewGame: ' + gameTypeApples);
        var url = 'http://localhost:3000/new/' + (gameTypeApples ? 'a2a' : 'cah');
        $log.log(url);

        return $http({
            method: 'GET',
            url: url
        })
            .catch(function(_error) {
                $log.warn(_error);
                $q.reject(_error);
            })
            .then(function(response) {
                $log.log('startNewGame: ' + response);
                self.currentGame = response.data;
                self.currentGameId = self.currentGame.gameId;
                return self.currentGame;
            })
    };

    /**
     *  Set the current game being played.
     */
    this.setCurrentGame = function(gameId) {
        $log.log('GameServer.setCurrentGame: ' + gameId);
        this.currentGameId = gameId;
        if (this.currentGameList != null) {
            this.currentGame = this.currentGameList[gameId];
        }
    };

    /**
     *  Main socket for the connection to the game server.
     */
    this.socket = undefined;

    /**
     *  Connect a socket to the game server.
     */
    this.connect = function() {
        $log.log('GameService.connect');

        this.socket = function(io) {
            io.connect('http://localhost:8080');
            $log.log('socket: ' + socket);

            socket.on('connection', function() {
                $log.log('io.connection');
            });

            socket.on('test', function(data) {
                $log.log('io.test: ' + data);
            });
        };

    }

}]);

