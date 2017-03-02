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

    // Default which game is selected.
    this.gameTypeApples = true;

    // Default to no games found.
    this.gameList = undefined;
    this.gameListEmpty = true;

    // Handle click on Join Game button.
    this.joinGame = function(gameId) {
        $log.log('joinGame: ' + gameId);
    };

    // Handle click on Start New Game.
    this.newGame = function(gameTypeApples) {
        $log.log('newGame: ' + gameTypeApples);

        GameService.connect();

        $location.url('/join');
    };

    // Set interval timer to update list of available games.
    this.intervalPromise = $interval(function() {
        $log.log('interval');
        GameService.getGameList().then(function(gameList) {
            $log.log('got new gameList');
            self.gameList = gameList;
            self.gameListEmpty = (Object.keys(gameList).length === 0);
        })
    }, 2000);
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

    /**
     *  Call game server to get the current list of games.
     */
    this.getGameList = function() {
        $log.log('GameServer.getGameList');
        var url = 'http://localhost:3000/games';
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
                $log.log('getGameList: ' + response);
                return response.data;
            })
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

