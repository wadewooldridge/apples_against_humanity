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

    /********************************************************************************/
    /*  Methods related to the Web API.                                             */
    /********************************************************************************/

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

    /********************************************************************************/
    /*  Methods related to the Socket.io API.                                       */
    /********************************************************************************/

    /**
     *  Connect a socket to the game server.
     */
    this.connect = function() {
        $log.log('GameService.connect');

        this.socket = io('http://localhost:3001');

        this.socket.on('connect', function () {
            var socket = this;
            $log.log('io.connect: ' + socket.id);
            self.send('JoinGame', {gameId: self.currentGame.gameId});
        });

        this.socket.on('test', function (data) {
            $log.log('io.test: ',  data);
        });

        this.socket.on('PlayerList')
    };

    /**
     *  Register callbacks in the controller to notify on certain socket.io events.
     */
    this.registerCallbacks = function(callbacks) {
        $log.log('GameService.registerCallbacks: ', callbacks);

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