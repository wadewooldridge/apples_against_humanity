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
app.controller('joinGameController', ['$interval', '$location', '$log', 'GameService', function($interval, $location, $log, GameService){
    $log.log('joinGameController');

}]);

// Controller for New Game page.
app.controller('newGameController', ['$interval', '$location', '$log', 'GameService', function($interval, $location, $log, GameService){
    $log.log('newGameController');

    // This controller's copy of the current game.
    this.currentGame = GameService.getCurrentGame();

    // Variables to model the game name and player (host) name.
    this.gameName = '';
    this.playerName = '';

    // Handler for changing game name: notify the server.
    this.onGameNameChange = function() {
        $log.log('ngc.onGameNameChange: ' + this.gameName);
        GameService.setCurrentGameName(this.gameName);
    };

    // Handler for changing player name: notify the server.
    this.onPlayerNameChange = function() {
        $log.log('ngc.onPlayerNameChange: ' + this.playerName);
        GameService.setCurrentPlayerName(this.playerName);
    };

    // Handler for Launch button.
    this.onLaunchButton = function() {
        $log.log('ngc.onLaunchButton');

    };

    // Code that gets executed on controller initialization.
    $log.log('ngc:init');
    GameService.connect();

}]);

// Controller for Play Game page.
app.controller('playGameController', ['$interval', '$location', '$log', 'GameService', function($interval, $location, $log, GameService){
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
     *  Main socket for the connection to the game server.
     */
    this.socket = undefined;

    /**
     *  Connect a socket to the game server.
     */
    this.connect = function() {
        $log.log('GameService.connect');

        this.socket = io('http://localhost:3001');

        this.socket.on('connect', function () {
            var socket = this;
            $log.log('io.connect: ' + socket.id);
        });

        this.socket.on('test', function (data) {
            $log.log('io.test: ',  data);
        });

        this.socket.on('PlayerList')
    };

    /**
     *  Call game server to get the current list of games.
     */
    this.getGameList = function() {
        $log.log('GameService.getGameList');
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
        $log.log('GameService.startNewGame: ' + gameTypeApples);
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
        $log.log('GameService.setCurrentGame: ' + gameId);
        this.currentGameId = gameId;
        if (this.currentGameList != null) {
            this.currentGame = this.currentGameList[gameId];
        }
    };

    /**
     *  Set the name of the current game.
     */
    this.setCurrentGameName = function(gameName) {
        $log.log('GameService.setCurrentGameName: ' + gameName);
        this.currentGame.gameName = gameName;
        this.send('GameName', {gameName: gameName});
    };

    /**
     *  Set the name of the current player.
     */
    this.setCurrentPlayerName = function(playerName) {
        $log.log('GameService.setCurrentPlayerName: ' + playerName);
        this.currentGame.playerName = playerName;
        this.send('PlayerName', {playerName: playerName});
    };

    /**
     *  Send a packet to the server.
     */
    this.send = function(message, obj) {
        $log.log('GameService.send: ' + message + ', ', obj);
        this.socket.emit(message, obj);
    };

}]);

