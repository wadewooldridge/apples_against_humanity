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
    const self = this;

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
     *  Current player list.
     */
    this.currentPlayerList = undefined;

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
    this.isConnected            = function() {return (this.socket !== undefined)};

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
        const url = $location.protocol() + '://' +
                    $location.host() + ':' +
                    $location.port() + '/games';
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
        const url = $location.protocol() + '://' +
                    $location.host() + ':' +
                    $location.port() + '/new/' + (gameTypeApples ? 'a2a' : 'cah');
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
        if (this.currentGameTable !== null) {
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
        const cb = this.callbacks[message];
        if (cb) {
            cb(data);
        }
    };

    /**
     *  Connect a socket to the game server.
     */
    this.connect = function() {
        $log.log('GameService.connect');

        // Double-check that we don't already have a socket; if so, we will not get the connect
        // event back, so we have to explicitly send a JoinGame message to connect to the right game.
        if (this.socket !== undefined) {
            $log.log('GameServer.connect: already connected');
            self.send('JoinGame', {gameId: self.currentGame.gameId});
            return;
        }

        // Create a socket to the server.
        const url = $location.protocol() + '://' + $location.host() + ':3001';
        $log.log(url);
        this.socket = io(url);

        // Set message handler for when the connection starts.
        this.socket.on('connect', function () {
            const socket = this;
            $log.log('io.connect: ' + socket.id);
            self.send('JoinGame', {gameId: self.currentGame.gameId});
        });

        // Set message handler for if the connection breaks.
        this.socket.on('disconnect', function() {
            $log.log('io.disconnect');
            self.socket = undefined;
            self.checkCallback('disconnect');
        });

        // These various handlers received messages from the server, update the
        // service's copy of any data, and call back to the controller as registered.
        this.socket.on('AbortHand', function(data) {
            $log.log('on.AbortHand');
            self.checkCallback('AbortHand', data);
        });

        this.socket.on('GameName', function(data) {
            $log.log('on.GameName');
            self.checkCallback('GameName', data);
        });

        this.socket.on('GameStatus', function(data) {
            $log.log('on.GameStatus');
            self.checkCallback('GameStatus', data);
        });

        this.socket.on('GameOver', function(data) {
            $log.log('on.GameOver');
            self.checkCallback('GameOver', data);
        });

        this.socket.on('HandCards', function(data) {
            $log.log('on.HandCards');
            self.checkCallback('HandCards', data);
        });

        this.socket.on('HandOver', function(data) {
            $log.log('on.HandOver');
            self.checkCallback('HandOver', data);
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

        this.socket.on('NewHand', function(data) {
            $log.log('on.NewHand');
            self.checkCallback('NewHand', data);
        });

        this.socket.on('PlayerList', function(data) {
            $log.log('on.PlayerList: ', data);
            const playerList = data.playerList;
            //console.log('ID: ' + self.socket.id);
            //console.dir(playerList);

            // Fix up the PlayerList with a flag of whether each user is the current user.
            for (let i = 0; i < playerList.length; i++) {
                const player = playerList[i];
                if (player.socketId === self.socket.id) {
                    data.mePlayerIndex = i;
                    break;
                }
            }
            self.currentPlayerList = playerList;
            self.checkCallback('PlayerList', data);
        });

        this.socket.on('SolutionCount', function(data) {
            $log.log('on.SolutionCount');
            self.checkCallback('SolutionCount', data);
        });

        this.socket.on('SolutionList', function(data) {
            $log.log('on.SolutionList');
            self.checkCallback('SolutionList', data);
        });

    };

    /**
     *  Disconnect the socket from the game server.
     */
    this.disconnect = function() {
        $log.log('GameService.disconnect');

        // Double-check to see if we are already disconnected.
        if (this.socket === undefined) {
            $log.log('GameServer.disconnect: already disconnected');
            return;
        }

        // Force a disconnect.
        this.socket.disconnect();
        this.socket = undefined;
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
