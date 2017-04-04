/**
 *  apples_against_humanity - Apples-to-Apples and Cards Against Humanity multi-player game.
 *  Copyright (C) 2017 by Wade Wooldridge
 *
 *  app_controllers.js - Main code for client Angular controllers.
 */

/**
 *  Set up basic Angular controllers, one for each page.
 */
var app = angular.module('aahClientApp');

// Controller for Choose Game page.
app.controller('chooseGameController', ['$interval', '$location', '$log', 'GameService', function($interval, $location, $log, GameService){
    $log.log('chooseGameController');
    const self = this;

    // Default to no games found.
    this.gameTable = undefined;
    this.gameTableEmpty = true;

    // Interval promise for updates; need to cancel when leaving this controller.
    this.intervalCounter = 0;
    this.intervalPromise = undefined;

    // Start the interval timer.
    this.startIntervalTimer = function() {
        $log.log('cgc.startIntervalTimer');
        this.intervalPromise = $interval(this.handleIntervalTimer, 500);
    };

    // Stop the interval timer.
    this.stopIntervalTimer = function() {
        $log.log('cgc.stopIntervalTimer');
        $interval.cancel(this.intervalPromise);
        this.intervalPromise = undefined;
    };

    // Handle interval timer: poll for game list.
    this.handleIntervalTimer = function() {
        // First interval is 500ms, then 2s after that.
        self.intervalCounter++;
        if (self.intervalCounter % 4 !== 1)
            return;

        $log.log('cgc.handleIntervalTimer');
        GameService.getGameTable().then(function(gameTable) {
            $log.log('handleIntervalTimer: got new gameTable');
            self.gameTable = gameTable;
            self.gameTableEmpty = (Object.keys(gameTable).length === 0);
        })
    };

    // Handle click on Join Game button.
    this.joinGame = function(gameId) {
        $log.log('cgc.joinGame: ' + gameId);
        this.stopIntervalTimer();

        // Set the current game, and go to the join dialog.
        GameService.setCurrentGame(gameId);
        $location.url('/join');
    };

    // Handle click on Start New Game.
    this.newGame = function(gameTypeApples) {
        $log.log('cgc.newGame: ' + gameTypeApples);
        this.stopIntervalTimer();

        // Start a new game on the server.
        GameService.startNewGame(gameTypeApples).then(function() {
            $log.log('cgc.newGame: complete');
            $location.url('/new');
        });

    };

    // Code that gets executed on controller initialization.
    $log.log('cgc:init');
    this.startIntervalTimer();

    // If we are already connected, force a disconnect. Otherwise browsing "back" to this page leaves the
    // connection open, and can cause ambiguous results for what game this player is a member of. Clear
    // out the callbacks as well, so we don't get callbacks from other controllers.
    if (GameService.isConnected()) {
        $log.log('cgc:init: forcing disconnect');
        GameService.registerCallbacks({});
        GameService.disconnect();
    }

}]);

// Controller for Join Game page.
app.controller('joinGameController', ['$interval', '$location', '$log', '$scope', '$window', 'GameService',
                            function($interval, $location, $log, $scope, $window, GameService){
    $log.log('joinGameController');
    const self = this;

    // This controller's copy of the current game.
    this.currentGame = GameService.getCurrentGame();

    // Variables to model the game name and player (host) name.
    this.gameName = '';
    this.playerName = '';

    // Variable to model the PlayerList received from the server.
    this.playerList = [];

    // Which player is the host, and which is me.
    this.hostPlayerIndex = undefined;
    this.mePlayerIndex = undefined;

    // Game flags.
    this.gameOver = false;

    // Handler for Launch button.
    this.onLaunchButton = function() {
        $log.log('jgc.onLaunchButton');

        // Tell the game server that we are launched. We don't change pages until it responds with 'Launched'.
        GameService.send('Launch', {});
    };

    // Handler for changing game name: notify the server.
    this.onGameNameChange = function() {
        $log.log('ngc.onGameNameChange: ' + this.gameName);
        GameService.setCurrentGameName(this.gameName);
    };

    // Handler for changing player name: notify the server.
    this.onPlayerNameChange = function() {
        $log.log('jgc.onPlayerNameChange: ' + this.playerName);
        GameService.setCurrentPlayerName(this.playerName);
    };

    // Code that gets executed on controller initialization.
    $log.log('jgc:init');
    GameService.connect();
    GameService.registerCallbacks({
        // disconnect: received on unexpected socket disconnect.
        disconnect: function() {
            $log.log('cb.disconnect');

            // Set the flag to keep anyone from playing on.
            self.gameOver = true;

            // Make a pop-up to make sure everyone sees that the game is toast.
            alert('Unexpected disconnect from server');
        },
        // GameOver: received instead of Launched if too many people drop out to continue.
        GameOver: function(data) {
            $log.log('cb.GameOver: ', data);
            // Set the flag to keep anyone from playing on.
            self.gameOver = true;

            // Make a pop-up to make sure everyone sees that the game is over.
            alert('Game Over: ' + data.messageText);

            // Doesn't automatically update; do it manually.
            $scope.$apply();
        },
        GameName: function(data) {
            $log.log('cb.GameName: ', data);
            self.gameName = data.gameName;
            // Doesn't automatically update; do it manually.
            $scope.$apply();
        },
        JoinSucceeded: function(data) {
            $log.log('cb.JoinSucceeded: ', data);
        },
        JoinFailed: function(data) {
            $log.log('cb.JoinFailed: ', data);
            // Make a pop-up to make sure the player sees the failure.
            alert('JoinGame failed: ' + data.reason);
        },
        Launched: function(data) {
            $log.log('cb.Launched: ', data);
            $location.path('/play').replace();
            // Doesn't automatically update; do it manually.
            $scope.$apply();
        },
        PlayerList: function(data) {
            $log.log('cb.PlayerList: ', data);
            self.playerList = data.playerList;
            self.hostPlayerIndex = data.hostPlayerIndex;
            self.mePlayerIndex = data.mePlayerIndex;

            // Doesn't automatically update; do it manually.
            $scope.$apply();
        }
    });
    $('#player-name-input').focus();

}]);

// Controller for New Game page.
app.controller('newGameController', ['$interval', '$location', '$log', '$scope', '$window', 'GameService',
                            function($interval, $location, $log, $scope, $window, GameService){
    $log.log('newGameController');
    var self = this;

    // This controller's copy of the current game.
    this.currentGame = GameService.getCurrentGame();

    // Variables to model the game name and player (host) name.
    this.gameName = '';
    this.playerName = '';

    // Variable to model the PlayerList received from the server.
    this.playerList = [];

    // Which player is the host, and which is me.
    this.hostPlayerIndex = undefined;
    this.mePlayerIndex = undefined;

    // Game flags.
    this.gameOver = false;

    // Handler for changing game name: notify the server.
    this.onGameNameChange = function() {
        $log.log('ngc.onGameNameChange: ' + this.gameName);
        GameService.setCurrentGameName(this.gameName);
    };

    // Handler for changing player name: notify the server.
    this.onPlayerNameChange = function() {
        $log.log('ngc.onPlayerNameChange: ' + this.playerName);
        GameService.setCurrentPlayerName(this.playerName);
    };

    // Handler for Launch button.
    this.onLaunchButton = function() {
        $log.log('ngc.onLaunchButton');

        // Tell the game server that we are launched. We don't change pages until it responds with 'Launched'.
        GameService.send('Launch', {});
    };

    // Code that gets executed on controller initialization.
    $log.log('ngc:init');
    GameService.connect();
    GameService.registerCallbacks({
        // disconnect: received on unexpected socket disconnect.
        disconnect: function() {
            $log.log('cb.disconnect');

            // Set the flag to keep anyone from playing on.
            self.gameOver = true;

            // Make a pop-up to make sure everyone sees that the game is toast.
            alert('Unexpected disconnect from server');
        },
        // GameOver: received instead of Launched if too many people drop out to continue.
        GameOver: function(data) {
            $log.log('cb.GameOver: ', data);
            // Set the flag to keep anyone from playing on.
            self.gameOver = true;

            // Make a pop-up to make sure everyone sees that the game is over.
            alert('Game Over: ' + data.messageText);

            // Doesn't automatically update; do it manually.
            $scope.$apply();
        },
        JoinSucceeded: function(data) {
            $log.log('cb.JoinSucceeded: ', data);
        },
        JoinFailed: function(data) {
            $log.log('cb.JoinFailed: ', data);
            // Make a pop-up to make sure the player sees the failure.
            alert('JoinGame failed: ' + data.reason);
        },
        Launched: function(data) {
            $log.log('cb.Launched: ', data);
            $location.path('/play').replace();
            // Doesn't automatically update; do it manually.
            $scope.$apply();
        },
        PlayerList: function(data) {
            $log.log('cb.PlayerList: ', data);
            self.playerList = data.playerList;
            self.hostPlayerIndex = data.hostPlayerIndex;
            self.mePlayerIndex = data.mePlayerIndex;

            // Doesn't automatically update; do it manually.
            $scope.$apply();
        }
    });

    // Start with the focus in the first field; autofocus not reliable on all browsers.
    $('#game-name-input').focus();
}]);

// Controller for Play Game page.
app.controller('playGameController', ['$interval', '$location', '$log', '$sce', '$scope', 'GameService', function($interval, $location, $log, $sce, $scope, GameService){
    $log.log('playGameController');
    const self = this;

    // This controller's copy of the current game.
    this.currentGame = GameService.getCurrentGame();
    this.gameTypeClass = (this.currentGame.gameTypeApples ? 'a2a' : 'cah');

    // PlayerList received from the server.
    this.playerList = [];

    // Which player is the host, which is the judge, and which is me.
    this.hostPlayerIndex = undefined;
    this.judgePlayerIndex = undefined;
    this.judgePlayerName = undefined;
    this.mePlayerIndex = undefined;

    // Game status summary from the server, and list of status as history.
    this.gameStatus = '';
    this.historyList = [];

    // Current player's hand: the answer cards that we hold.
    this.handCardList = [];
    this.handCardsSelected = 0;
    this.playedThisHand = false;

    // Current question card.
    this.questionCard = undefined;

    // Solutions, and flag for when they are revealed.
    // Server just gives a count until the solutions are finally revealed.
    this.solutionCount = 0;
    this.solutionList = [];
    this.solutionsRevealed = false;

    // Flags for when the winner of the hand is revealed.
    this.winnerRevealed = false;
    this.winningSolutionIndex = undefined;
    this.winningPlayerIndex = undefined;

    // Flags for game over.
    this.gameOver = false;

    // Select a card in the hand when it is clicked.
    this.onHandCardClick = function(index) {
        $log.log('onHandCardClick: index ' + index + ', selected: ' + self.handCardsSelected);
        const questionCard = self.questionCard;
        const clickedCard = self.handCardList[index];

        if (self.gameOver) {
            // Reject click if game over.
            $log.log('onHandCardClick: game over');
            return;
        } else if (questionCard === undefined) {
            // Reject click if no questionCard.
            $log.log('onHandCardClick: no questionCard');
            return;
        } else if (self.playedThisHand) {
            // Reject if already played this hand.
            $log.log('onHandCardClick: already played');
            return;
        } else if (self.judgePlayerIndex === self.mePlayerIndex) {
            // Reject click if this player is the judge.
            $log.log('onHandCardClick: judge');
            return;
        } else if (clickedCard.ordinal !== 0 &&
                clickedCard.ordinal === self.handCardsSelected) {
            // Click on last/only card clicked; undo the selection;
            $log.log('onHandCardClick: undo');
            clickedCard.ordinal = 0;
            self.handCardsSelected--;
            return;
        } else if (self.handCardsSelected >= self.questionCard.pick) {
            // Reject click if max answers already selected.
            $log.log('onHandCardClick: max');
            return;
        }

        // All checks passed; mark this card as selected, and update the count.
        $log.log('onHandCardClick: select');
        clickedCard.ordinal = ++self.handCardsSelected;
    };

    // Play the selected cards from the hand.
    this.onPlayButton = function() {
        $log.log('onPlayButton');
        const questionCard = self.questionCard;

        if (self.gameOver) {
            // Reject click if game over.
            $log.log('onPlayButton: game over');
            return;
        } else if (questionCard === undefined) {
            // Reject click if no questionCard.
            $log.log('onPlayButton: no questionCard');
            return;
        } else if (self.playedThisHand) {
            // Reject if already played this hand.
            $log.log('onPlayButton: already played');
            return;
        } else if (self.judgePlayerIndex === self.mePlayerIndex) {
            // Reject click if this player is the judge.
            $log.log('onPlayButton: judge is me');
            return;
        } else if (self.handCardsSelected !== self.questionCard.pick) {
            // Reject click if not enough cards selected.
            $log.log('onPlayButton: pick more');
            return;
        }

        // Loop through the cards once to build the solution from the selected cards.
        // Go backwards, so we can remove the played cards from the hand without screwing up the loop.
        let cards = [];
        for (let i = self.handCardList.length - 1; i >= 0; i--) {
            let card = self.handCardList[i];
            if (card.ordinal) {
                cards[card.ordinal - 1] = card;
                self.handCardList.splice(i, 1);
            }
        }

        // Send the solution to the server.
        GameService.send('Solution', {solution: {playerIndex: self.mePlayerIndex, cards: cards}});
        self.playedThisHand = true;
    };

    // Reset the selected cards from the hand.
    this.onResetButton = function() {
        $log.log('onResetButton');
        const questionCard = self.questionCard;

        if (self.gameOver) {
            // Reject click if game over.
            $log.log('onResetButton: game over');
            return;
        } else if (questionCard === undefined) {
            // Reject click if no questionCard.
            $log.log('onResetButton: no questionCard');
            return;
        } else if (self.playedThisHand) {
            // Reject if already played this hand.
            $log.log('onResetButton: already played');
            return;
        } else if (self.judgePlayerIndex === self.mePlayerIndex) {
            // Reject click if this player is the judge.
            $log.log('onResetButton: judge is me');
            return;
        } else if (self.handCardsSelected === 0) {
            // Reject click if nothing selected.
            $log.log('onResetButton: none selected');
            return;
        }

        // All checks passed; reset the selected cards in the hand.
        self.resetHandSelection();
    };

    // Reset the selected cards from the hand.
    this.resetHandSelection = function() {
        $log.log('resetHandSelection');
        for (let i = 0; i < self.handCardList.length; i++) {
            self.handCardList[i].ordinal = 0;
        }
        self.handCardsSelected = 0;
    };

    // Allow the judge to click on the solution that wins this hand.
    this.onSolutionClick = function(index) {
        $log.log('onSolutionClick: ' + index);
        const questionCard = self.questionCard;

        if (self.gameOver) {
            // Reject click if game over.
            $log.log('onSolutionClick: game over');
            return;
        } else if (questionCard === undefined) {
            // Reject click if no questionCard.
            $log.log('onSolutionClick: no questionCard');
            return;
        } else if (self.judgePlayerIndex !== self.mePlayerIndex) {
            // Reject click if this player is not the judge.
            $log.log('onSolutionClick: judge is not me');
            return;
        } else if (self.solutionCount < (self.playerList.length - 1)) {
            // Reject click if we don't have a full set of solutions in.
            $log.log('onSolutionClick: not all solutions in');
            debugger;
            return;
        } else if (self.playedThisHand) {
            // Reject click if already selected one.
            $log.log('onSolutionClick: already played');
            return;
        }

        // All checks passed; send the winner over to the server.
        GameService.send('JudgeSolutions', {
            winningSolutionIndex: index,
            winningPlayerIndex: self.solutionList[index].playerIndex});
        self.playedThisHand = true;
    };

    // Code that gets executed on controller initialization.
    $log.log('pgc:init');
    GameService.registerCallbacks({
        // disconnect: received on unexpected socket disconnect.
        disconnect: function() {
            $log.log('cb.disconnect');

            // Set the flag to keep anyone from playing on.
            self.gameOver = true;

            // Make a pop-up to make sure everyone sees that the game is toast.
            alert('Unexpected disconnect from server');
        },

        // AbortHand: received when a player disconnects, so we have to abort the current hand.
        AbortHand: function(data) {
            $log.log('cb.AbortHand: ', data);

            // Currently this is a placeholder. There is no work here; it is handled by the subsequent NewHand event.
        },

        // GameOver: received if a winner is declared, or if too many people drop out to continue.
        GameOver: function(data) {
            $log.log('cb.GameOver: ', data);
            // Set the flag to keep anyone from playing on.
            self.gameOver = true;

            // Log some status messages
            self.gameStatus = 'Game Over: ' + data.messageText;
            self.historyList.push('Game Over: ' + data.messageText);
            self.historyList.push(data.scoreText);

            // Make a pop-up to make sure everyone sees that the game is over.
            alert(data.messageText + '\n' + data.scoreText);

            // Doesn't automatically update; do it manually.
            $scope.$apply();
            // Manually scroll to the bottom of the history.
            let selector = $('#history-scroll');
            $(selector).animate({ scrollTop: $(selector).prop('scrollHeight')}, 1000);
        },

        // GameStatus: received throughout; update the current gameStatus and the historyList.
        GameStatus: function(data) {
            $log.log('cb.GameStatus: ', data);
            self.gameStatus = data.gameStatus;
            self.historyList.push(data.gameStatus);
            // Doesn't automatically update; do it manually.
            $scope.$apply();
            // Manually scroll to the bottom of the history.
            let selector = $('#history-scroll');
            $(selector).animate({ scrollTop: $(selector).prop('scrollHeight')}, 1000);
        },

        // HandCards: received when the game server fills out our hand.
        HandCards: function(data) {
            $log.log('cb.HandCards: ', data);
            // Add each of the new cards to the hand.
            for (let i = 0; i < data.handCards.length; i++) {
                const card = data.handCards[i];
                // Use trusted HTML to allow display of things such as &trade; in the card.
                self.handCardList.push({title: card.title,
                                        text: card.text,
                                        safeTitle: $sce.trustAsHtml(card.title),
                                        safeText:  $sce.trustAsHtml(card.text),
                                        ordinal: 0});
            }
            // Doesn't automatically update; do it manually.
            $scope.$apply();
        },

        // HandOver: received when the game server gets the final judging.
        HandOver: function(data) {
            $log.log('cb.HandOver: ', data);

            // Save the winner information.
            self.winningSolutionIndex = data.winningSolutionIndex;
            self.winningPlayerIndex = data.winningPlayerIndex;

            // Update the score of the winning player.
            self.playerList[data.winningPlayerIndex].score++;

            // Reveal the players that go with the solutions.
            self.winnerRevealed = true;

            // Doesn't automatically update; do it manually.
            $scope.$apply();
        },

        // NewHand: received to start a new turn with a new player and question card.
        NewHand: function(data) {
            $log.log('cb.NewHand: ', data);

            // Reset turn variables.
            self.resetHandSelection();
            self.solutionCount = 0;
            self.solutionList = [];
            self.solutionsRevealed = false;
            self.playedThisHand = false;
            self.winnerRevealed = false;
            self.winningSolutionIndex = undefined;
            self.winningPlayerIndex = undefined;
            self.gameOver = false;

            // Get the data for the turn from the server.
            self.judgePlayerIndex = data.judgePlayerIndex;
            if (self.judgePlayerIndex !== undefined)
                self.judgePlayerName = self.playerList[self.judgePlayerIndex].playerName;

            const card = data.questionCard;
            self.questionCard = {title: card.title,
                                 text: card.text,
                                 safeTitle: $sce.trustAsHtml(card.title),
                                 safeText:  $sce.trustAsHtml(card.text),
                                 pick: card.pick};

            // Fill out our hand with answer cards.
            GameService.send('NeedHandCards', {holding: self.handCardList.length})

            // Reset the cards on the board so they show only outlines until somebody plays.
            self.solutionList = [];
            for (let i = 0; i < self.playerList.length - 1; i++) {
                let blankSolution = {playerIndex: 0, cards: []};
                for (let i = 0; i < self.questionCard.pick; i++) {
                    blankSolution.cards.push({});
                }

                self.solutionList[i] = blankSolution;
            }

            // Doesn't automatically update; do it manually.
            $scope.$apply();
        },

        // PlayerList: received whenever the player list changes, to keep our list current.
        PlayerList: function(data) {
            $log.log('cb.PlayerList: ', data);
            self.playerList = data.playerList;
            self.hostPlayerIndex = data.hostPlayerIndex;
            self.judgePlayerIndex = data.judgePlayerIndex;
            if (self.judgePlayerIndex !== undefined) {
                if (self.playerList[self.judgePlayerIndex] === undefined) {
                    debugger;
                }
                self.judgePlayerName = self.playerList[self.judgePlayerIndex].playerName;
            }
            self.mePlayerIndex = data.mePlayerIndex;

            // Doesn't automatically update; do it manually.
            $scope.$apply();
        },

        // SolutionCount: received when a player plays a solution, but the server is still waiting for more.
        SolutionCount: function(data) {
            $log.log('cb.SolutionCount: ', data);
            self.solutionCount = data.solutionCount;
            // Doesn't automatically update; do it manually.
            $scope.$apply();
        },

        // SolutionList: received when all players have played a solution, and they can be revealed.
        SolutionList: function(data) {
            $log.log('cb.SolutionList: ', data);
            self.solutionList = data.solutionList;

            // Fix up the solutions to be safe to display.
            for (let solutionIndex = 0; solutionIndex < self.solutionList.length; solutionIndex++) {
                let solution = self.solutionList[solutionIndex];

                for (let cardIndex = 0; cardIndex < solution.cards.length; cardIndex++) {
                    let card = solution.cards[cardIndex];
                    card.safeTitle = $sce.trustAsHtml(card.title);
                    card.safeText = $sce.trustAsHtml(card.text);
                }
            }

            // Update the solutionCount used in some conditionals.
            self.solutionCount = self.solutionList.length;

            // Now flag that they can be revealed.
            self.solutionsRevealed = true;
            // Doesn't automatically update; do it manually.
            $scope.$apply();
        }
    });

    // Tell the game server that we are ready to start.
    GameService.send('ReadyToStart', {});
}]);
