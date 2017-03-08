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
        this.socketId = socket.id;
        this.playerName = '';
        // Which game has this player joined.
        this.gameId = undefined;
        // Player is the host of this game.
        this.host = false;
        // Game variables.
        this.score = 0;
        this.up = false;
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
        this.launched = false;

        // So far, no players.
        this.playerCount = 0;
        this.playerList = [];
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
 *  gameTable - Main table of active games, keyed by gameCode.
 */
var gameTable = {};

/**
 *  playerTable - Main table of active players, keyed by socket ID.
 */
var playerTable = {};

/**
 *  getNextGameId - Get next ID and update the global.
 */
function getNextGameId() {
    lastGameId += 257;
    return lastGameId;
}

/**
 *  Copy the game object, including a sanitized player list with the sockets.
 */
function copyGame(game) {
    //console.log('copyGame: ', game);
    var gameCopy = {};

    for (var key in game) {
        if (key === 'playerList') {
            gameCopy.playerList = copyPlayerList(game);
        } else {
            gameCopy[key] = game[key];
        }
    }
    return gameCopy;
}

/**
 *  Copy a player, sanitized by throwing out the socket field.
 */
function copyPlayer(player) {
    //console.log('copyPlayer: ', player);
    var playerCopy = {};

    for (var key in player) {
        if (key !== 'socket') {
            playerCopy[key] = player[key];
        }
    }
    return playerCopy;
}

/**
 *  Copy the player list from a game, sanitizing it to return to the client.
 *  The player list contains the socket and all of its information, so we
 *  don't want to just do a copy of it.
 */
function copyPlayerList(game) {
    //console.log('copyPlayerList: ', game);
    var playerList = game.playerList;
    var playerListCopy = [];

    for (var i = 0; i < playerList.length; i++) {
        playerListCopy.push(copyPlayer(game.playerList[i]));
    }
    return playerListCopy;
}

/**
 *  Create a game.
 */
exports.createGame = createGame = function(gameTypeApples) {
    var gameId = getNextGameId();
    gameTable[gameId] = new Game(gameId, gameTypeApples);
    return gameId;
};

/**
 *  Create a Player object for the socket.
 */
exports.createPlayer = createPlayer = function(socket) {
    var player = new Player(socket);
    playerTable[socket.id] = player;
    return player;
};

/**
 *  Get all games.
 */
exports.getAllGames = getAllGames = function() {
    console.log('GameList.getAllGames');
    var retObj = {};
    for (var key in gameTable) {
        var game = gameTable[key];
        retObj[key] = copyGame(game);
    }
    return retObj;
};

/**
 *  Get games by gameType.
 */
exports.getGamesByGameType = getGamesByGameType = function(gameTypeApples) {
    var retObj = {};
    for (var key in gameTable) {
        var game = gameTable[key];
        if (game.gameTypeApples === gameTypeApples) {
            retObj[key] = copyGame(game);
        }
    }
    return retObj;
};

/**
 *  Get games by gameId.
 */
exports.getGameByGameId = getGameByGameId = function(gameId) {
    return gameTable[gameId];
};

/**
 *  Get debug dump information.
 */
exports.getDebugDump = function() {
    // Build sanitized version of gameTable.
    var gameTableCopy = {};
    for (var key in gameTable) {
        gameTableCopy[key] = copyGame(gameTable[key]);
    }

    // Build sanititized version of playerTable.
    var playerTableCopy = {};
    for (key in playerTable) {
        playerTableCopy[key] = copyPlayer(playerTable[key]);
    }

    return {
        lastGameId: lastGameId,
        playerTable: playerTableCopy,
        gameTable: gameTableCopy
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
        var game = gameTable[gameId];
        game.gameName = gameName;

        // Notify all players of the updated game name.
        io.to(game.roomId).emit('GameName', {gameName: gameName});
    });

    socket.on('JoinGame', function(data) {
        var gameId = data.gameId;
        console.log('on.JoinGame: ' + gameId + ' + ' + socket.id);
        var player = playerTable[socket.id];
        var game = getGameByGameId(gameId);
        if (game) {
            game.playerCount++;
            game.playerList.push(player);
            player.gameId = gameId;

            // If the first player in, call him the host.
            player.host = (game.playerCount === 1);

            // Use the gameId as the socket.io room identifier.
            socket.join(game.roomId);

            // Notify this player that the JoinGame succeeded.
            socket.emit('JoinSucceeded', {});

            // Notify this player of the current game name.
            socket.emit('GameName', {gameName: game.gameName});

            // Notify all players of the updated Player list.
            io.to(game.roomId).emit('PlayerList', {playerList: copyPlayerList(game)});

        } else {
            console.log('on.JoinGame failed to find gameId: ' + gameId);
            socket.emit('JoinFailed', {reason: 'Game ID ' + gameId + ' not found.'})
        }

    });

    socket.on('PlayerName', function(data) {
        console.log('on.PlayerName: ' + socket.id + ' = ' + data.playerName);

        // Update the playerName in the Player object.
        var player = playerTable[socket.id];
        player.playerName = data.playerName;

        // If the player is in a game, notify the other game members of the new name.
        var gameId = player.gameId;
        if (gameId) {
            var game = getGameByGameId(gameId);

            // Notify all players of the updated Player list.
            io.to(game.roomId).emit('PlayerList', {playerList: copyPlayerList(game)});
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
