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
        this.gameId = undefined;
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
        this.roomId = 'Room-' + gameId;
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
 *  io - Copy of io from server.js.
 */
var io = undefined;

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

        // Note that we do not try to clone the entire Player object; that can cause loops in the data.
        // That does mean we have to modify this code if new attributes are added to the Player object.
        playerListCopy[key] = {
            playerName: player.playerName,
            gameId: player.gameId
        }
    }

    return {
        lastGameId: lastGameId,
        playerList: playerListCopy,
        gameList: gameList
    }
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
        var game = gameList[gameId];
        game.gameName = gameName;

        // Notify all players of the updated game name.
        io.to(game.roomId).emit('GameName', {gameName: gameName});
    });

    socket.on('JoinGame', function(data) {
        var gameId = data.gameId;
        console.log('GameList.joinGame: ' + gameId + ' + ' + socket.id);
        var player = playerList[socket.id];
        var game = getById(gameId);
        if (game) {
            game.playerCount++;
            game.playerList[socket.id] = player.playerName;
            player.gameId = gameId;

            // Use the gameId as the socket.io room identifier.
            socket.join(game.roomId);

            // Notify this player that the JoinGame succeeded.
            socket.emit('JoinSucceeded', {});

            // Notify this player of the current game name.
            socket.emit('GameName', {gameName: game.gameName});

            // Notify all players of the updated Player list.
            io.to(game.roomId).emit('PlayerList', {playerList: game.playerList});

        } else {
            console.log('GameList:joinGame failed to find gameId: ' + gameId);
            socket.emit('JoinFailed', {reason: 'Game ID ' + gameId + ' not found.'})
        }

    });

    socket.on('PlayerName', function(data) {
        console.log('GameList.setPlayerName: ' + socket.id + ' = ' + data.playerName);

        // Update the playerName in the Player object.
        var player = playerList[socket.id];
        player.playerName = data.playerName;

        // If the player is in a game, update the playerName in the Game object.
        var gameId = player.gameId;
        if (gameId) {
            var game = getById(gameId);
            game.playerList[socket.id] = data.playerName;

            // Notify all players of the updated Player list.
            io.to(game.roomId).emit('PlayerList', {playerList: game.playerList});
        }
    });

};

/**
 *  Set up handlers for the event emitter events we expect on the socket.
 */
exports.setIo = function(ioCopy) {
    console.log('GameList.setIo');
    io = ioCopy;
};
