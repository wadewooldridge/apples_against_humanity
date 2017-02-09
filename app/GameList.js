/**
 *  apples_against_humanity - Apples-to-Apples and Cards Against Humanity multi-player game.
 *  Copyright (C) 2017 by Wade Wooldridge
 *
 *  GameList.js - Keep track of the games currently in progress.
 */

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
    gameList[gameId] = {
        gameId: gameId,
        gameTypeApples: gameTypeApples,
        host: '',
        playerCount: 0
    };
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
exports.join = function(gameId, name, server) {
    var success = true;
    console.log('gameList.join: ' + gameId + ', ' + name + ', ' + server);
    console.dir(server);

    return success;
};

