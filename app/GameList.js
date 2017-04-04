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
        //console.log('getRandomCard: ' + this.deckName);

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
        this.playerName = '';
        // Which game has this player joined.
        this.gameId = undefined;
        // Player is ready to play.
        this.ready = false;
        // Game variables.
        this.score = 0;
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
        this.gameLaunched = false;
        this.gameOver = false;

        // Decks to be used for the game.
        this.questionDeck = undefined;
        this.answerDeck = undefined;

        // List of players.
        this.playerList = [];
        this.hostPlayerIndex = undefined;
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
 *  Remove a player from the game, adjusting the game as necessary.
 */
function removePlayerFromGame(player, gameId) {
    const socketId = player.socketId;
    const game = gameTable[gameId];
    console.log('removePlayerFromGame: ' + gameId + ' - ' + socketId);
    if (game === undefined) {
        return;
    }

    // Step through the game's players and find the matching socket ID.
    for (let i = 0; i < game.playerList.length; i++) {
        if (game.playerList[i].socketId === socketId) {
            const deletedHost = (i === game.hostPlayerIndex);

            // Remove this player from the playerList.
            game.playerList.splice(i, 1);

            if (game.playerList.length === 0) {
                // If no more players in this game, delete the game.
                console.log('removePlayerFromGame: deleting gameId ' + gameId);
                delete gameTable[gameId];
                return;
            } else if (game.playerList.length <= 2 && game.gameLaunched && !game.gameOver) {
                // If not enough players to continue on with the game, it is game over.
                // Check gameLaunched flag, as players can leave a game that is not yet launched.
                // Check gameOver flag, to prevent notifying multiple times as players quit.
                console.log('removePlayerFromGame: game over, only ' + game.playerList.length + ' players');
                sendGameOver(game, 'Not enough players left to continue.');
                return;
            } else if (deletedHost) {
                // Reassign host flag to the next user.
                game.hostPlayerIndex = 0;
            }
            break;
        }
    }

    // Notify all players of the updated Player list.
    // The judgePlayerIndex might be temporarily invalid, so send it as zero.
    io.to(game.roomId).emit('PlayerList', {playerList: copyPlayerList(game),
        hostPlayerIndex: game.hostPlayerIndex,
        judgePlayerIndex: 0});

    // If the game has launched, but is not yet over, abort the hand and start a new one.
    if (game.gameLaunched && !game.gaveOver) {
        // Notify the remaining players that a player has left.
        sendGameStatus(game, player.playerName + ' has left the game; aborting current hand.');

        // Notify that the current hand is being aborted.
        io.to(game.roomId).emit('AbortHand', {});

        // Now try to start a new hand.
        startNextHand(game);
    }
}

/**
 *  Send a GameOver event, gathering extra score information.
 */
function sendGameOver(game, messageText) {
    console.log('sendGameOver: ' + game.gameId + ': ' + messageText);

    // If the gameOver flag is already set, we have already sent out the GameOver message; just return.
    if (game.gameOver) {
        console.log('sendGameOver: game already over');
        return;
    }

    // Set the flag to prevent duplicate notifications.
    game.gameOver = true;

    // Get the playerList, and sort by descending scores.
    let playerList = copyPlayerList(game);
    playerList.sort(function(p1, p2) {return p2.score - p1.score});

    // Build a string representing the scores.
    let scoreText = 'Final scores: ';
    for (let i = 0; i < playerList.length; i++) {
        let player = playerList[i];
        if (i !== 0)
            scoreText += ', ';
        scoreText += player.playerName + ' = ' + player.score;
    }

    io.to(game.roomId).emit('GameOver', {messageText: messageText, scoreText: scoreText});
}

/**
 *  Send a GameStatus event to all players in game.
 */
function sendGameStatus(game, messageText) {
    console.log('sendGameStatus: ' + game.gameId + ': ' + messageText);

    io.to(game.roomId).emit('GameStatus', {gameStatus: messageText});
}

/**
 *  Send a PlayerLIst event to all players in game, gathering data as needed.
 */
function sendPlayerList(game) {
    //console.log('sendPlayerList: ' + game.gameId);

    io.to(game.roomId).emit('PlayerList', {playerList: copyPlayerList(game),
                                           hostPlayerIndex: game.hostPlayerIndex,
                                           judgePlayerIndex: 0});
}

/**
 *  Start the next hand for a game.
 */
function startNextHand(game) {
    console.log('startNextHand: ' + game.gameId);

    // Choose the first/next player that is the judge.
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
    io.to(game.roomId).emit('NewHand', {
        judgePlayerIndex: game.judgePlayerIndex,
        questionCard: questionCard
    });
    sendGameStatus(game, 'New turn: ' + game.playerList[game.judgePlayerIndex].playerName + ' is the judge; everyone else make a play.');
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
 *  Get all games (only return games that can be joined, i.e. not launched and not over).
 */
exports.getAllGames = getAllGames = function() {
    console.log('GameList.getAllGames');
    const retObj = {};
    for (let key in gameTable) {
        const game = gameTable[key];
        if (!game.gameLaunched && !game.gameOver) {
            retObj[key] = copyGame(game);
        }
    }
    return retObj;
};

/**
 *  Get games by gameType (only return games that can be joined, i.e. not launched and not over).
 */
exports.getGamesByGameType = getGamesByGameType = function(gameTypeApples) {
    const retObj = {};
    for (let key in gameTable) {
        const game = gameTable[key];
        if (game.gameTypeApples === gameTypeApples && !game.gameLaunched && !game.gameOver) {
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

    // Build sanitized version of playerTable.
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
            removePlayerFromGame(player, gameId);
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

        // Protect against a race condition of deleting the game and getting this message.
        if (game !== undefined) {
            game.gameName = gameName;

            // Notify all players of the updated game name.
            io.to(game.roomId).emit('GameName', {gameName: gameName});
        }
    });

    // JoinGame: received from any player to join an existing game.
    socket.on('JoinGame', function(data) {
        const gameId = data.gameId;
        console.log('on.JoinGame: ' + gameId + ' + ' + socket.id);
        const player = playerTable[socket.id];
        const game = getGameByGameId(gameId);
        if (game) {
            if (game.gameLaunched) {
                console.log('on.JoinGame failed to join gameId: ' + gameId + ': game launched');
                socket.emit('JoinFailed', {reason: 'Game ID ' + gameId + ' is already launched.'})
            } else if (game.gameOver) {
                console.log('on.JoinGame failed to join gameId: ' + gameId + ': game over');
                socket.emit('JoinFailed', {reason: 'Game ID ' + gameId + ' is already over.'})
            } else {
                // If this player is already a member of another game, remove him from that
                // game, and delete that game if there are no more players.
                if (player.gameId) {
                    console.log('on.JoinGame: removing player ' + player.socketId + ' from gameId: ' + player.gameId);
                    removePlayerFromGame(player, player.gameId);
                }

                // Add the player to the specified game.
                game.playerList.push(player);
                player.gameId = gameId;

                // If the first player in, call him the host.
                if (game.hostPlayerIndex === undefined) {
                    game.hostPlayerIndex = 0;
                }

                // Use the gameId as the socket.io room identifier.
                socket.join(game.roomId);

                // Notify this player that the JoinGame succeeded.
                socket.emit('JoinSucceeded', {});

                // Notify this player of the current game name.
                socket.emit('GameName', {gameName: game.gameName});

                // Notify all players of the updated Player list.
                sendPlayerList(game);
            }

        } else {
            console.log('on.JoinGame failed to find gameId: ' + gameId);
            socket.emit('JoinFailed', {reason: 'Game ID ' + gameId + ' not found.'})
        }

    });

    // JudgeSolutions: received when the judge has picked the best solution offered.
    socket.on('JudgeSolutions', function(data) {
        const player = playerTable[socket.id];
        const game = gameTable[player.gameId];
        const winningSolutionIndex = data.winningSolutionIndex;
        const winningPlayerIndex = data.winningPlayerIndex;
        const winningPlayerName = game.playerList[winningPlayerIndex].playerName;
        console.log('on.JudgeSolutions: ' + player.gameId + ' = solution ' + winningSolutionIndex + ', player ' + winningPlayerIndex);

        // Update the score of the player selected.
        game.playerList[winningPlayerIndex].score++;

        // Send a status update.
        sendGameStatus(game, winningPlayerName + ' wins the hand.');

        // Send out a notification of the winner of the hand.
        io.to(game.roomId).emit('HandOver', {
            winningSolutionIndex: winningSolutionIndex,
            winningPlayerIndex: winningPlayerIndex
        });

        // Set a timer to start the next hand.
        setTimeout(function() {
            console.log('Game ' + game.gameId + ' new hand timer');
            startNextHand(game);
        }, 5000);
    });

    // Launch: received from host when all players have joined.
    socket.on('Launch', function(data) {
        const player = playerTable[socket.id];
        const game = gameTable[player.gameId];
        console.log('on.Launch: ' + player.gameId);
        game.gameLaunched = true;

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
                sendGameStatus(game, 'Game has run out of answer cards.');
                break;
            } else {
                //console.log('on.NeedHandCards: ' + card);
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
            if (game === undefined)
                return;

            // Notify all players of the updated Player list.
            sendPlayerList(game);
        }
    });

    // ReadyToStart: received from all players after Launch, to know when to start the first hand.
    socket.on('ReadyToStart', function(data) {
        const player = playerTable[socket.id];
        const game = gameTable[player.gameId];
        console.log('on.ReadyToStart: ' + socket.id);
        player.ready = true;

        // Make sure this player has an up-to-date copy of the playerList for the new controller.
        sendPlayerList(game);
        console.log('ReadyToStart: ' + game.judgePlayerIndex);

        // Keep track of when everyone is ready, to start the next round.
        let readyCount = 0;
        const playerCount = game.playerList.length;
        for (let i = 0; i < playerCount; i++) {
            if (game.playerList[i].ready)
                readyCount++;
        }

        if (readyCount === playerCount) {
            // Everyone is ready, start the next round.
            sendGameStatus(game, 'Everyone is ready.');
            startNextHand(game);
        } else {
            // Not everyone is ready yet.
            sendGameStatus(game, 'Waiting for players to be ready (' + readyCount + '/' + playerCount + ').');
        }
    });

    // Solution: received from each non-judge player during the hand, with their proposed solution.
    socket.on('Solution', function(data) {
        const player = playerTable[socket.id];
        const game = gameTable[player.gameId];
        console.log('on.Solution: ' + socket.id);

        // Add this to the list of solutions played.
        game.solutionList.push(data.solution);

        // If we still need more solutions, just send back SolutionCount, otherwise SolutionList.
        if (game.solutionList.length < (game.playerList.length - 1)) {
            io.to(game.roomId).emit('SolutionCount', {solutionCount: game.solutionList.length});
            sendGameStatus(game, game.playerList[game.judgePlayerIndex].playerName +
                    ' is the judge; waiting for everyone to make a play (' +
                    game.solutionList.length + '/' + (game.playerList.length - 1) + ').');
        } else {
            // Sort the list in alphabetical order by the title or text of the first card;
            // this will effectively randomize the list, so no one knows who played what card.
            game.solutionList.sort(function(a, b) {
                let aCard = a.cards[0];
                let bCard = b.cards[0];
                let aCompare = (aCard.title ? aCard.title : aCard.text);
                let bCompare = (bCard.title ? bCard.title : bCard.text);
                if (aCompare < bCompare)
                    return -1;
                else if (aCompare > bCompare)
                    return 1;
                else
                    return 0;
            });

            io.to(game.roomId).emit('SolutionList', {solutionList: game.solutionList});
            sendGameStatus(game, game.playerList[game.judgePlayerIndex].playerName + ': choose the best solution.');
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
