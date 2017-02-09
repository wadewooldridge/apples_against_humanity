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
app.controller('chooseGameController', ['$interval', '$log', 'GameService', function($interval, $log, GameService){
    $log.log('chooseGameController');
    var self = this;

    // Which game is selected.
    this.gameTypeApples = true;

    // Handle click on Start New Game.
    this.newGame = function() {
        $log.log('newGame');
    };

    // Set interval timer to update list of available games.

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
app.service('GameService', ['$http', '$log', '$q', function($http, $log, $q) {
    $log.log('GameService: factory');



}]);

