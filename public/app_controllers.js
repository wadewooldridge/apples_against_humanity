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
app.controller('joinGameController', ['$interval', '$location', '$log', '$scope', '$window', 'GameService',
                            function($interval, $location, $log, $scope, $window, GameService){
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

        // Tell the game server that we are launched. We don't change pages until it responds with 'Launched'.
        GameService.send('Launch', {});
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
        Launched: function(data) {
            $log.log('cb.Launched: ', data);
            $location.path('/play').replace();
            // Doesn't automatically update; do it manually.
            $scope.$apply();
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
app.controller('newGameController', ['$interval', '$location', '$log', '$scope', '$window', 'GameService',
                            function($interval, $location, $log, $scope, $window, GameService){
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

        // Tell the game server that we are launched. We don't change pages until it responds with 'Launched'.
        GameService.send('Launch', {});
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
        Launched: function(data) {
            $log.log('cb.Launched: ', data);
            $location.path('/play').replace();
            // Doesn't automatically update; do it manually.
            $scope.$apply();
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
app.controller('playGameController', ['$interval', '$location', '$log', '$scope', 'GameService', function($interval, $location, $log, $scope, GameService){
    $log.log('playGameController');
    var self = this;

    // This controller's copy of the current game.
    this.currentGame = GameService.getCurrentGame();

    // PlayerList received from the server.
    this.playerList = [];

    // Game status summary from the server.
    this.gameStatus = '';

    // Current player's hand: the answer cards that we hold.
    this.answerCardList = [];

    // Current question card.
    this.questionCard = undefined;

    // Code that gets executed on controller initialization.
    $log.log('pgc:init');
    GameService.registerCallbacks({
        AnswerCards: function(data) {
            $log.log('cb.AnswerCards: ', data);
            // Add each of the new cards to the hand.
            for (let i = 0; i < data.answerCards.length; i++) {
                self.answerCardList.push(data.answerCards[i]);
            }
            // Doesn't automatically update; do it manually.
            $scope.$apply();
        },
        GameStatus: function(data) {
            $log.log('cb.GameStatus: ', data);
            self.gameStatus = data.gameStatus;
            // Doesn't automatically update; do it manually.
            $scope.$apply();
        },
        PlayerList: function(data) {
            $log.log('cb.PlayerList: ', data);
            self.playerList = data.playerList;
            // Doesn't automatically update; do it manually.
            $scope.$apply();
        }
    });

    // Tell the game server that we are ready to start.
    GameService.send('ReadyToStart', {});
    // Fill our hand with answer cards.
    GameService.send('NeedAnswerCards', {holding: this.answerCardList.length})

}]);
