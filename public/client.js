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
    // Main (new game) page.
        .when('/', {
            templateUrl: 'new_game.html',
            controller: 'newGameController',
            controllerAs: 'ngc'
        })
        // Game play page.
        .when('/play',{
            templateUrl: 'play_game.html',
            controller: 'playGameController',
            controllerAs: 'pgc'
        })
        .otherwise({
            redirectTo: "/"
        })
});

app.controller('newGameController', function($log){
    $log.log('newGameController');
    var self = this;

    // Which game is selected.
    this.gameTypeApples = true;

    // Handle click on Start New Game.
    this.startGame = function() {
        $log.log('startGame');
    }

});

app.controller('playGameController', function($log){
    $log.log('playGameController');
});

