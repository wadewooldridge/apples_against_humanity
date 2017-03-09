/**
 *  apples_against_humanity - Apples-to-Apples and Cards Against Humanity multi-player game.
 *  Copyright (C) 2017 by Wade Wooldridge
 *
 *  app_controllers.js - Main code for client Angular controllers.
 */

/**
 *  Set up basic Angular controllers, one for each page.
 */
var app = angular.module('aahClientApp');

// Controller for Choose Game page.
app.controller('chooseGameController', ['$interval', '$location', '$log', 'GameService', function($interval, $location, $log, GameService){
    $log.log('chooseGameController');
    var self = this;

    // Default to no games found.
    this.gameTable = undefined;
    this.gameTableEmpty = true;

    // Interval promise for updates; need to cancel when leaving this controller.
    this.intervalCounter = 0;
    this.intervalPromise = undefined;

    // Start the interval timer.
    this.startIntervalTimer = function() {
        $log.log('cgc.startIntervalTimer');
        this.intervalPromise = $interval(this.handleIntervalTimer, 500);
    };

    // Stop the interval timer.
    this.stopIntervalTimer = function() {
        $log.log('cgc.stopIntervalTimer');
        $interval.cancel(this.intervalPromise);
        this.intervalPromise = undefined;
    };

    // Handle interval timer: poll for game list.
    this.handleIntervalTimer = function() {
        // First interval is 500ms, then 2s after that.
        self.intervalCounter++;
        if (self.intervalCounter % 4 !== 1)
            return;

        $log.log('cgc.handleIntervalTimer');
        GameService.getGameTable().then(function(gameTable) {
            $log.log('handleIntervalTimer: got new gameTable');
            self.gameTable = gameTable;
            self.gameTableEmpty = (Object.keys(gameTable).length === 0);
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
app.controller('joinGameController', ['$interval', '$location', '$log', '$scope', 'GameService', function($interval, $location, $log, $scope, GameService){
    $log.log('joinGameController');
    var self = this;

    // This controller's copy of the current game.
    this.currentGame = GameService.getCurrentGame();

    // Variables to model the game name and player (host) name.
    this.gameName = '';
    this.playerName = 'TBD';

    // Variable to model the PlayerList received from the server.
    this.playerList = [];

    // Flag of whether the current user is the host of the game; this can change dynamically
    // if the original host disconnects from the game, and allows an alternate to Launch the game.
    this.iAmTheHost = false;

    // Handler for Launch button.
    this.onLaunchButton = function() {
        $log.log('jgc.onLaunchButton');
    };

    // Handler for changing game name: notify the server.
    this.onGameNameChange = function() {
        $log.log('ngc.onGameNameChange: ' + this.gameName);
        GameService.setCurrentGameName(this.gameName);
    };

    // Handler for changing player name: notify the server.
    this.onPlayerNameChange = function() {
        $log.log('jgc.onPlayerNameChange: ' + this.playerName);
        GameService.setCurrentPlayerName(this.playerName);
    };

    // Code that gets executed on controller initialization.
    $log.log('jgc:init');
    GameService.connect();
    GameService.registerCallbacks({
        GameName: function(data) {
            $log.log('cb.GameName: ', data);
            self.gameName = data.gameName;
            // Doesn't automatically update; do it manually.
            $scope.$apply();
        },
        JoinSucceeded: function(data) {
            $log.log('cb.JoinSucceeded: ', data);
        },
        JoinFailed: function(data) {
            $log.log('cb.JoinFailed: ', data);
        },
        PlayerList: function(data) {
            $log.log('cb.PlayerList: ', data);
            self.playerList = data.playerList;
            self.iAmTheHost = data.iAmTheHost;

            // Doesn't automatically update; do it manually.
            $scope.$apply();
        }
    });

}]);

// Controller for New Game page.
app.controller('newGameController', ['$interval', '$location', '$log', '$scope', 'GameService', function($interval, $location, $log, $scope, GameService){
    $log.log('newGameController');
    var self = this;

    // This controller's copy of the current game.
    this.currentGame = GameService.getCurrentGame();

    // Variables to model the game name and player (host) name.
    this.gameName = 'TBD';
    this.playerName = 'TBD';

    // Variable to model the PlayerList received from the server.
    this.playerList = [];

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
    GameService.registerCallbacks({
        JoinSucceeded: function(data) {
            $log.log('cb.JoinSucceeded: ', data);
        },
        JoinFailed: function(data) {
            $log.log('cb.JoinFailed: ', data);
        },
        PlayerList: function(data) {
            $log.log('cb.PlayerList: ', data);
            self.playerList = data.playerList;

            // Doesn't automatically update; do it manually.
            $scope.$apply();
        }
    });

}]);

// Controller for Play Game page.
app.controller('playGameController', ['$interval', '$location', '$log', 'GameService', function($interval, $location, $log, GameService){
    $log.log('playGameController');
}]);
