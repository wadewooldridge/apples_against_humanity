/**
 *  apples_against_humanity - Apples-to-Apples and Cards Against Humanity multi-player game.
 *  Copyright (C) 2017 by Wade Wooldridge
 *
 *  app_routing.js - Main code for client Angular routing.
 */

/**
 *  Set up basic Angular routing.
 */
var app = angular.module('aahClientApp');

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
        .when('/join', {
            templateUrl: 'join_game.html',
            controller: 'joinGameController',
            controllerAs: 'jgc'
        })
        // New Game page.
        .when('/new', {
            templateUrl: 'new_game.html',
            controller: 'newGameController',
            controllerAs: 'ngc'
        })
        // Play game page.
        .when('/play', {
            templateUrl: 'play_game.html',
            controller: 'playGameController',
            controllerAs: 'pgc'
        })
        .otherwise({
            redirectTo: "/"
        })
});

app.controller('routeController', function($log){
    $log.log('routeController');
});
