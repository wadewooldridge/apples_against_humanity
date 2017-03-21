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
    const self = this;

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
    const self = this;

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
app.controller('playGameController', ['$interval', '$location', '$log', '$sce', '$scope', 'GameService', function($interval, $location, $log, $sce, $scope, GameService){
    $log.log('playGameController');
    const self = this;

    // This controller's copy of the current game.
    this.currentGame = GameService.getCurrentGame();
    this.gameTypeClass = (this.currentGame.gameTypeApples ? 'a2a' : 'cah');

    // PlayerList received from the server.
    this.playerList = [];

    // Which player is up, and is it me?
    this.upPlayerName = undefined;
    this.upPlayerIsMe = undefined;

    // Game status summary from the server, and list of status as history.
    this.gameStatus = '';
    this.historyList = [];

    // Current player's hand: the answer cards that we hold.
    this.handCardList = [];
    this.handCardsSelected = 0;

    // Current question card.
    this.questionCard = undefined;

    // Guesses, and flag for when they are revealed.
    this.guessCount = 0;
    this.guesses = [];
    this.guessesRevealed = false;

    // Select a card in the hand when it is clicked.
    this.onHandCardClick = function(index) {
        $log.log('onHandCardClick: ' + index);
    };

    // Play the selected cards from the hand.
    this.onPlayButton = function() {
        $log.log('onPlayButton');
    };

    // Reset the selected cards from the hand.
    this.onResetButton = function() {
        $log.log('onResetButton');
    };

    // Code that gets executed on controller initialization.
    $log.log('pgc:init');
    GameService.registerCallbacks({
        // GameStatus: received throughout; update the current gameStatus and the historyList.
        GameStatus: function(data) {
            $log.log('cb.GameStatus: ', data);
            self.gameStatus = data.gameStatus;
            self.historyList.push(data.gameStatus);
            // Doesn't automatically update; do it manually.
            $scope.$apply();
        },

        // HandCards: received when the game server fills out our hand.
        HandCards: function(data) {
            $log.log('cb.HandCards: ', data);
            // Add each of the new cards to the hand.
            for (let i = 0; i < data.handCards.length; i++) {
                const card = data.handCards[i];
                // Use trusted HTML to allow display of things such as &trade; in the card.
                self.handCardList.push({title: $sce.trustAsHtml(card.title),
                                        text:  $sce.trustAsHtml(card.text),
                                        ordinal: 0});
            }
            // Doesn't automatically update; do it manually.
            $scope.$apply();
        },

        // NewTurn: received to start a new turn with a new player and question card.
        NewTurn: function(data) {
            $log.log('cb.NewTurn: ', data);

            // Reset turn variables.
            self.handCardsSelected = 0;
            self.guessCount = 0;
            self.guesses = [];
            self.guessesRevealed = false;

            // Get the data for the turn from the server.
            self.upPlayerName = data.player.playerName;
            self.questionCard = {title: $sce.trustAsHtml(data.questionCard.title),
                                 text:  $sce.trustAsHtml(data.questionCard.text)};

            // Set a flag to tell whether the 'up' player is me.
            for (let i = 0; i < self.playerList.length; i++){
                let player = self.playerList[i];
                if (player.playerName = data.player.playerName){
                    self.upPlayerIsMe = player.self;
                    break;
                }
            }

            // If current player is not up, make sure to fill out the hand.
            if (!self.upPlayerIsMe) {
                // Fill our hand with answer cards.
                GameService.send('NeedHandCards', {holding: self.handCardList.length})
            }

            // Doesn't automatically update; do it manually.
            $scope.$apply();
        },

        // PlayerList: received whenever the player list changes, to keep our list current.
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
    GameService.send('NeedHandCards', {holding: this.handCardList.length})

}]);
