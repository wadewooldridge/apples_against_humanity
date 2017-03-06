/**
 *  apples_against_humanity - Apples-to-Apples and Cards Against Humanity multi-player game.
 *  Copyright (C) 2017 by Wade Wooldridge
 *
 *  GameList.js - Keep track of the games currently in progress.
 */

/**
 *  Player = main object to hold information about a player.
 */
class Player {
    /**
     *  Constructor to initialize basic information about the player.
     */
    constructor(playerName) {
        console.log('Player:constructor');
        this.playerName = playerName;
    }

}

/**
 *  Game - main object to hold state of a single game.
 */
class Game {
    /**
     *  Constructor to initialize basic information about the game.
     */
    constructor(gameId, gameTypeApples) {
        console.log('Game constructor: ' + gameId + ', ' + gameTypeApples);
        this.gameId = gameId;
        this.gameTypeApples = gameTypeApples;
        this.gameName = '';
        this.hostName = '';
        this.launched = false;

        // So far, no players.
        this.playerCount = 0;
        this.players = [];
    }
}

/**
 *  lastGameId - Keep track of last one used.
 */
var lastGameId = 12345;

/**
 *  gameList - Main list of active games, keyed by gameCode.
 */
var gameList = {};

/**
 *  getNextGameId - Get next ID and update the global.
 */
function getNextGameId() {
    lastGameId += 257;
    return lastGameId;
}

/**
 *  Create a game.
 */
exports.create = function(gameTypeApples) {
    var gameId = getNextGameId();
    gameList[gameId] = new Game(gameId, gameTypeApples);
    return gameId;
};

/**
 *  Get all games.
 */
exports.getAll = function() {
    var retObj = {};
    for (var key in gameList) {
        var retMember = gameList[key];
        retObj[key] = JSON.parse(JSON.stringify(retMember));
    }
    return retObj;
};

/**
 *  Get games by gameType.
 */
exports.getByGameType = function(gameTypeApples) {
    var retObj = {};
    for (var key in gameList) {
        var retMember = gameList[key];
        if (retMember.gameTypeApples === gameTypeApples) {
            retObj[key] = JSON.parse(JSON.stringify(retMember));
        }
    }
    return retObj;
};

/**
 *  Get games by gameId.
 */
exports.getById = function(gameId) {
    return gameList[gameId];
};

/**
 *  Join an existing game.
 */
exports.join = function(gameId, playerName, server) {
    var success = true;
    console.log('GameList.join: ' + gameId + ', ' + playerName + ', ' + server);
    console.dir(server);

    return success;
};

/**
 *  Set up handlers for the event emitter events we expect on the socket.
 */
exports.setEventHandlers = function(socket) {
    console.log('GameList.setEventHandlers: ' + socket.id);

    socket.on('GameName', function(data) {
        console.log('GameList.setGameName: ', data);
    });

    socket.on('PlayerName', function(data) {
        console.log('GameList.setGameName: ', data);
    });

};
