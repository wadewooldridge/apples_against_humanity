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
    constructor(socket) {
        console.log('Player.constructor: ' + socket.id);
        this.socket = socket;
        this.playerName = '';
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
        this.playerList = {};
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
 *  playerList - Main list of active players, keyed by socket ID.
 */
var playerList = {};

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
exports.createGame = createGame = function(gameTypeApples) {
    var gameId = getNextGameId();
    gameList[gameId] = new Game(gameId, gameTypeApples);
    return gameId;
};

/**
 *  Create a Player object for the socket.
 */
exports.createPlayer = createPlayer = function(socket) {
    var player = new Player(socket);
    playerList[socket.id] = player;
    return player;
};

/**
 *  Get all games.
 */
exports.getAll = getAll = function() {
    console.log('getAll');
    console.dir(gameList);
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
exports.getByGameType = getByGameType = function(gameTypeApples) {
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
exports.getById = getById = function(gameId) {
    return gameList[gameId];
};

/**
 *  Get debug dump information.
 */
exports.getDebugDump = function() {
    var playerListCopy = {};
    for (var key in playerList) {
        var player = playerList[key];
        playerListCopy[key] = {
            playerName: player.playerName
        }
    }

    return {
        lastGameId: lastGameId,
        playerList: playerListCopy,
        gameList: gameList
    }
};

/**
 *  Join an existing game.
 */
exports.join = join = function(gameId, playerName, server) {
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
        var gameId = data.gameId;
        var gameName = data.gameName;
        console.log('GameList.setGameName: ' + gameId + ' = ' + gameName);
        gameList[gameId].gameName = gameName;
    });

    socket.on('JoinGame', function(data) {
        console.log('GameList.joinGame: ' + data.gameId + ' + ' + socket.id);
        var player = playerList[socket.id];
        var game = getById(data.gameId);
        if (game) {
            game.playerCount++;
            game.playerList[socket.id] = player.playerName;
            socket.emit('JoinSucceeded', {});
        } else {
            console.log('GameList:joinGame failed to find gameId: ' + gameId);
            socket.emit('JoinFailed', {reason: 'Game ID ' + gameId + ' not found.'})
        }

    });

    socket.on('PlayerName', function(data) {
        console.log('GameList.setPlayerName: ' + socket.id + ' = ' + data.playerName);
        var player = playerList[socket.id];
        player.playerName = data.playerName;
    });

};
