# apples_against_humanity
"Apples to Apples" and "Cards Against Humanity" multi-player server in Node.JS.

Version 1.0.2 of the application is currently deployed at
http://games.wadewooldridge.com:3000

## Source Code Notes
- A diagram showing the overview of the client and server components can
be found in the file README.png.
- Since the code can play both Apples to Apples and Cards Against Humanity,
the code is written generic between the two.  Some of the terms that have
been used throughout the code:
    - a2a: shorthand for Apples To Apples.
    - cah: shorthand for Cards Against Humanity.
    - cardTypeApples: true if playing a2a, false if playing cah.
    - questionCard: the green card for a2a, or the black card for cah.
    - answerCard: the red card for a2a, or the white card for cah.
    - solution: an array of one or more answers cards from one player.
    - judge: the player that chooses the best solution from the other players.
    - host: the player that creates, configures, and launches the game.

## To Do:
- Add ability to send messages to another player or all players.
- Add alert that leaving the Play Game window will exit the game.
- Make the mobile version use a "slide right" to see the player's hand.
- Clean up CAH fit of multiple cards in solution on mobile.
- Check into using a "text fit" library to better fit card text.
