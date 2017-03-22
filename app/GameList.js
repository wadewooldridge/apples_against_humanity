/**
 *  apples_against_humanity - Apples-to-Apples and Cards Against Humanity multi-player game.
 *  Copyright (C) 2017 by Wade Wooldridge
 *
 *  GameList.js - Keep track of the games currently in progress.
 */

/**
 *  Deck - hold a set of cards and select one at random.
 */
class Deck {
    /**
     *  Constructor to copy the array of cards passed in.
     *  Each card is just a string for the text on that card.
     */
    constructor(deckName, cardArray) {
        console.log('Deck.constructor: ' + deckName + ' + ' + cardArray.length + ' cards');
        this.deckName = deckName;
        this.cardArray = cardArray.slice();
    }

    getRandomCard() {
        console.log('getRandomCard: ' + this.deckName);

        if (this.cardArray.length === 0) {
            return null;
        } else {
            const index = Math.floor(Math.random() * this.cardArray.length);
            // splice returns the array spliced out; return the first element as the card spliced out.
            return this.cardArray.splice(index, 1)[0];
        }
    }

}

/**
 *  Player - main object to hold information about a player.
 */
class Player {
    /**
     *  Constructor to initialize basic information about the player.
     */
    constructor(socket) {
        console.log('Player.constructor: ' + socket.id);
        this.socket = socket;
        this.socketId = socket.id;
        this.playerName = 'TBD';
        // Which game has this player joined.
        this.gameId = undefined;
        // Player is the host of this game.
        this.host = false;
        // Player is ready to play.
        this.ready = false;
        // Game variables.
        this.score = 0;
        // This player is the judge of this hand.
        this.judge = false;
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
        this.gameName = 'TBD';
        this.launched = false;

        // Decks to be used for the game.
        this.questionDeck = undefined;
        this.answerDeck = undefined;

        // List of players.
        this.playerList = [];
        this.judgePlayerIndex = undefined;

        // Collected solutions for this hand.
        this.solutionList = [];
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
 *  Master deck arrays - These are loaded once during startup, and copied for individual games.
 *  Note that question cards are an object with a text and pick count; answer cards are only text.
 */
var a2aQuestionDeckArray = [];
var a2aAnswerDeckArray = [];
var cahQuestionDeckArray = [];
var cahAnswerDeckArray = [];

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
    const gameCopy = {};

    for (let key in game) {
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
    const playerCopy = {};

    for (let key in player) {
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
    const playerList = game.playerList;
    const playerListCopy = [];

    for (let i = 0; i < playerList.length; i++) {
        playerListCopy.push(copyPlayer(game.playerList[i]));
    }
    return playerListCopy;
}

/**
 *  Create a game.
 */
exports.createGame = createGame = function(gameTypeApples) {
    const gameId = getNextGameId();
    gameTable[gameId] = new Game(gameId, gameTypeApples);
    return gameId;
};

/**
 *  Create a Player object for the socket.
 */
exports.createPlayer = createPlayer = function(socket) {
    const player = new Player(socket);
    playerTable[socket.id] = player;
    return player;
};

/**
 *  Get all games.
 */
exports.getAllGames = getAllGames = function() {
    console.log('GameList.getAllGames');
    const retObj = {};
    for (let key in gameTable) {
        const game = gameTable[key];
        retObj[key] = copyGame(game);
    }
    return retObj;
};

/**
 *  Get games by gameType.
 */
exports.getGamesByGameType = getGamesByGameType = function(gameTypeApples) {
    const retObj = {};
    for (let key in gameTable) {
        const game = gameTable[key];
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
    const gameTableCopy = {};
    for (let key in gameTable) {
        gameTableCopy[key] = copyGame(gameTable[key]);
    }

    // Build sanititized version of playerTable.
    const playerTableCopy = {};
    for (let key in playerTable) {
        playerTableCopy[key] = copyPlayer(playerTable[key]);
    }

    return {
        lastGameId: lastGameId,
        playerTable: playerTableCopy,
        gameTable: gameTableCopy
    }
};

/**
 *  Load the decks from the JSON files.
 *  Note that these were imported, and have their own formats.
 */
exports.loadMasterDecks = function(a2aJson, cahJson) {
    console.log('GameList.loadMasterDecks');

    // Load A2A decks: questions are green, answers are red.
    for (let i = 0; i < a2aJson.greenCards.length; i++) {
        const card = a2aJson.greenCards[i];
        const text = card.text;

        // Split the A2A answer cards into a title and text fields based on the parentheses.
        const parenIndex = text.indexOf('(');
        if (parenIndex === -1) {
            // Parenthesis was not found; use the whole string as the text.
            a2aQuestionDeckArray.push({title: '', text: text, pick: 1});
        } else {
            a2aQuestionDeckArray.push({title: text.substr(0, parenIndex).trim(),
                                       text:  text.substr(parenIndex).trim(),
                                       pick: 1});
        }
    }

    for (let i = 0; i < a2aJson.redCards.length; i++) {
        const card = a2aJson.redCards[i];
        const text = card.text;

        // Split the A2A answer cards into a title and text fields based on the dash.
        const dashIndex = text.indexOf('-');
        if (dashIndex === -1) {
            // Dash was not found; use the whole string as the text.
            a2aAnswerDeckArray.push({title: '', text: text});
        } else {
            a2aAnswerDeckArray.push({title: text.substr(0, dashIndex).trim(),
                                     text:  text.substr(dashIndex + 1).trim()})
        }
    }

    // Load CAH decks: questions are black, answers are white.
    for (let i = 0; i < cahJson.blackCards.length; i++) {
        const card = cahJson.blackCards[i];
        cahQuestionDeckArray.push(card);
    }

    for (let i = 0; i < cahJson.whiteCards.length; i++) {
        const card = cahJson.whiteCards[i];
        cahAnswerDeckArray.push({title: '', text: card});
    }
};

/**
 *  Set up handlers for the event emitter events we expect on the socket.
 */
exports.setEventHandlers = function(socket) {
    console.log('GameList.setEventHandlers: ' + socket.id);

    // Handle disconnect.
    socket.on('disconnect', function() {
        console.log('on.disconnect: ' + socket.id);
        const player = playerTable[socket.id];

        // If joined in a game, remove from the game.
        const gameId = player.gameId;
        if (gameId) {
            const game = gameTable[gameId];
            for (let i = 0; i < game.playerList.length; i++) {
                if (game.playerList[i].socketId === socket.id) {
                    const deletedHost = game.playerList[i].host;
                    console.log('on.disconnect: ' + gameId + ' - ' + socket.id);
                    game.playerList.splice(i, 1);

                    if (game.playerList.length === 0) {
                        // If no more players in this game, delete the game.
                        console.log('on.disconnect: deleting gameId ' + gameId);
                        delete gameTable[gameId];
                    } else if (deletedHost) {
                        // Reassign host flag to the next user.
                        game.playerList[0].host = true;
                    }
                    break;
                }
            }

            // Notify all players of the updated Player list.
            io.to(game.roomId).emit('PlayerList', {playerList: copyPlayerList(game)});
        }

        // Remove from the playerTable.
        delete playerTable[socket.id];
    });

    // Event emitter handlers for the game.
    // GameName: received from host when changing the game name during configuration.
    socket.on('GameName', function(data) {
        const gameId = data.gameId;
        const gameName = data.gameName;
        console.log('GameList.setGameName: ' + gameId + ' = ' + gameName);
        const game = gameTable[gameId];
        game.gameName = gameName;

        // Notify all players of the updated game name.
        io.to(game.roomId).emit('GameName', {gameName: gameName});
    });

    // JoinGame: received from any player to join an existing game.
    socket.on('JoinGame', function(data) {
        const gameId = data.gameId;
        console.log('on.JoinGame: ' + gameId + ' + ' + socket.id);
        const player = playerTable[socket.id];
        const game = getGameByGameId(gameId);
        if (game) {
            game.playerList.push(player);
            player.gameId = gameId;

            // If the first player in, call him the host.
            player.host = (game.playerList.length === 1);

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

    // Launch: received from host when all players have joined.
    socket.on('Launch', function(data) {
        const player = playerTable[socket.id];
        const game = gameTable[player.gameId];
        console.log('on.Launch: ' + player.gameId);

        // Load the card decks for the game. Make a copy of the master decks.
        if (game.gameTypeApples) {
            game.questionDeck = new Deck('A2A Questions', a2aQuestionDeckArray);
            game.answerDeck = new Deck('A2A Answers', a2aAnswerDeckArray);
        } else {
            game.questionDeck = new Deck('CAH Questions', cahQuestionDeckArray);
            game.answerDeck = new Deck('CAH Answers', cahAnswerDeckArray);
        }

        // Notify all players that the game is launched.
        io.to(game.roomId).emit('Launched', {});
    });

    // NeedHandCards: received from any player at the start of a hand, to replenish played cards.
    socket.on('NeedHandCards', function(data) {
        const player = playerTable[socket.id];
        const game = gameTable[player.gameId];
        console.log('on.NeedHandCards: ' + socket.id + ' has ' + data.holding);

        // Send back answer cards to fill out the player's hand. Default to ten cards.
        const handCards = [];
        for (let i = data.holding; i < 10; i++) {
            const card = game.answerDeck.getRandomCard();

            // Check whether we have run out of cards; should never really happen.
            if (card === null) {
                io.to(game.roomId).emit('GameStatus', {gameStatus: 'Game has run out of answer cards.'});
                break;
            } else {
                console.log('on.NeedHandCards: ' + card);
                handCards.push(card);
            }
        }

        // Send the array of new answer cards back to the user.
        socket.emit('HandCards', {handCards: handCards});
    });

    // PlayerName: received from any player while joining, to set that player's name.
    socket.on('PlayerName', function(data) {
        console.log('on.PlayerName: ' + socket.id + ' = ' + data.playerName);

        // Update the playerName in the Player object.
        const player = playerTable[socket.id];
        player.playerName = data.playerName;

        // If the player is in a game, notify the other game members of the new name.
        const gameId = player.gameId;
        if (gameId) {
            const game = getGameByGameId(gameId);

            // Notify all players of the updated Player list.
            io.to(game.roomId).emit('PlayerList', {playerList: copyPlayerList(game)});
        }
    });

    // ReadyToStart: received from all players after Launch, to know when to start the first hand.
    socket.on('ReadyToStart', function(data) {
        const player = playerTable[socket.id];
        const game = gameTable[player.gameId];
        console.log('on.ReadyToStart: ' + socket.id);
        player.ready = true;

        // Make sure this player has an up-to-date copy of the playerList for the new controller.
        io.to(game.roomId).emit('PlayerList', {playerList: copyPlayerList(game)});

        // Keep track of when everyone is ready, to start the next round.
        let readyCount = 0;
        const playerCount = game.playerList.length;
        for (let i = 0; i < playerCount; i++) {
            if (game.playerList[i].ready)
                readyCount++;
        }

        if (readyCount === playerCount) {
            // Everyone is ready, start the next round.
            io.to(game.roomId).emit('GameStatus', {gameStatus: 'Everyone is ready.'});

            // Set up for the first turn. Choose the first/next player that is the judge.
            if (game.judgePlayerIndex === undefined) {
                game.judgePlayerIndex = Math.floor(Math.random() * game.playerList.length);
            } else {
                game.judgePlayerIndex++;
                if (game.judgePlayerIndex >= game.playerList.length)
                    game.judgePlayerIndex = 0;
            }
            console.log('judgePlayerIndex: ' + game.judgePlayerIndex);

            // Reset the solutions for the new hand.
            game.solutionList = [];

            // Pick a random question card.
            let questionCard = game.questionDeck.getRandomCard();

            // Send notification of new turn.
            io.to(game.roomId).emit('NewTurn', {
                player: copyPlayer(game.playerList[game.judgePlayerIndex]),
                questionCard: questionCard
            });
            io.to(game.roomId).emit('GameStatus',
                {gameStatus: 'New turn: ' + game.playerList[game.judgePlayerIndex].playerName + ' is the judge; everyone else make a play.'});
        } else {
            // Not everyone is ready yet.
            io.to(game.roomId).emit('GameStatus',
                {gameStatus: 'Waiting for players to be ready (' + readyCount + '/' + playerCount + ').'});
        }
    });

    // Solution: received from each non-judge player during the hand, with their proposed solution.
    socket.on('Solution', function(data) {
        const player = playerTable[socket.id];
        const game = gameTable[player.gameId];
        console.log('on.Solution: ' + socket.id);

        // Add a player reference to this solution, so we can know later who won.
        data.solution.player = player;

        // Add this to the list of solutions played.
        game.solutionList.push(data.solution);

        // If we still need more solutions, just send back SolutionCount, otherwise SolutionList.
        if (game.solutionList.length < (game.playerList.length - 1)) {
            io.to(game.roomId).emit('SolutionCount', {solutionCount: game.solutionList.length});
            io.to(game.roomId).emit('GameStatus',
                {gameStatus: game.playerList[game.judgePlayerIndex].playerName + ' is the judge; waiting for everyone to make a play (' +
                    game.solutionList.length + '/' + (game.playerList.length - 1) + ').'});
        } else {
            io.to(game.roomId).emit('SolutionList', {solutionList: game.solutionList});
            io.to(game.roomId).emit('GameStatus',
                {gameStatus: game.playerList[game.judgePlayerIndex].playerName + ', choose the best solution.'});
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
