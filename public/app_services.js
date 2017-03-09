/**
 *  apples_against_humanity - Apples-to-Apples and Cards Against Humanity multi-player game.
 *  Copyright (C) 2017 by Wade Wooldridge
 *
 *  app_services.js - Main code for client Angular services.
 *  There is one main GameService that holds the client context of the current game and interfaces to the server.
 */

/**
 *  Set up basic Angular services.
 */
var app = angular.module('aahClientApp');

// Service for interfacing to the game server.
app.service('GameService', ['$http', '$location', '$log', '$q', function($http, $location, $log, $q) {
    $log.log('GameService: factory');
    var self = this;

    /**
     *  Current list of possible games.
     */
    this.currentGameTable = undefined;

    /**
     *  Current game being played.
     */
    this.currentGameId = undefined;
    this.currentGame = undefined;

    /**
     *  Simpler getter methods.
     */
    this.getCurrentGameTable    = function() {return this.currentGameTable};
    this.getCurrentGameId       = function() {return this.currentGameId};
    this.getCurrentGame         = function() {return this.currentGame};

    /**
     *  Main socket for the connection to the game server.
     */
    this.socket = undefined;

    /**
     *  Callbacks that the controller has requested.
     */
    this.callbacks = {};

    /********************************************************************************/
    /*  Methods related to the Web API.                                             */
    /********************************************************************************/

    /**
     *  Call game server to get the current list of games.
     */
    this.getGameTable = function() {
        $log.log('GameService.getGameTable');
        var url = 'http://192.168.1.137:3000/games';

        return $http({
            method: 'GET',
            url: url
        })
            .catch(function(_error) {
                $log.warn(_error);
                $q.reject(_error);
            })
            .then(function(response) {
                $log.log('getGameTable: ', response);
                self.currentGameTable = response.data;
                return self.currentGameTable;
            })
    };

    /**
     *  Call game server to start a new game of the specified type.
     */
    this.startNewGame = function(gameTypeApples) {
        $log.log('GameService.startNewGame: ' + gameTypeApples);
        var url = 'http://192.168.1.137:3000/new/' + (gameTypeApples ? 'a2a' : 'cah');
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
        if (this.currentGameTable != null) {
            this.currentGame = this.currentGameTable[gameId];
        }
    };

    /********************************************************************************/
    /*  Methods related to the Socket.io API.                                       */
    /********************************************************************************/

    /**
     *  Check if the controller has requested a callback for this message, and if so, call it back.
     */
    this.checkCallback = function(message, data) {
        //$log.log('GameService.checkCallback: ' + message);
        var cb = this.callbacks[message];
        if (cb) {
            cb(data);
        }
    };

    /**
     *  Connect a socket to the game server.
     */
    this.connect = function() {
        $log.log('GameService.connect');

        this.socket = io('http://192.168.1.137:3001');

        this.socket.on('connect', function () {
            var socket = this;
            $log.log('io.connect: ' + socket.id);
            self.send('JoinGame', {gameId: self.currentGame.gameId});
        });

        this.socket.on('test', function (data) {
            $log.log('io.test: ',  data);
        });

        // These various handlers received messages from the server, update the
        // service's copy of any data, and call back to the controller as registered.
        this.socket.on('GameName', function(data) {
            $log.log('on.GameName');
            self.checkCallback('GameName', data);
        });

        this.socket.on('Launched', function(data) {
            $log.log('on.Launched');
            self.checkCallback('Launched', data);
        });

        this.socket.on('JoinFailed', function(data) {
            $log.log('on.JoinFailed');
            self.checkCallback('JoinFailed', data);
        });

        this.socket.on('JoinSucceeded', function(data) {
            $log.log('on.JoinSucceeded');
            self.checkCallback('JoinSucceeded', data);
        });

        this.socket.on('PlayerList', function(data) {
            $log.log('on.PlayerList: ', data);

            // Fix up the PlayerList with a flag of whether each user is the current user.
            var playerList = data.playerList;
            console.log('ID: ' + self.socket.id);
            console.dir(playerList);
            for (var i = 0; i < playerList.length; i++) {
                var player = playerList[i];
                player.self = (player.socketId === self.socket.id);

                // Add a flag in the data of whether the current player is the host.
                if (player.self) {
                    data.iAmTheHost = player.host;
                }
            }
            self.checkCallback('PlayerList', data);
        });
    };

    /**
     *  Register callbacks in the controller to notify on certain socket.io events.
     */
    this.registerCallbacks = function(callbacks) {
        $log.log('GameService.registerCallbacks: ', callbacks);
        this.callbacks = callbacks;
    };

    /**
     *  Set the name of the current game.
     */
    this.setCurrentGameName = function(gameName) {
        $log.log('GameService.setCurrentGameName: ' + gameName);
        this.currentGame.gameName = gameName;
        this.send('GameName', {
            gameId: this.currentGame.gameId,
            gameName: gameName});
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
