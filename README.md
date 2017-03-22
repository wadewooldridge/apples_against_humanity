# apples_against_humanity
"Apples to Apples" and "Cards Against Humanity" multi-player server in Node.JS.

## Source Code Notes
- Since the code can play both Apples to Apples and Cards Against Humanity,
the code is writtent generic between the two.  Some of the terms that have
been used throughout the code:
    - a2a: shorthand for Apples To Apples.
    - cah: shorthand for Cards Against Humanity.
    - cardTypeApples: true if playing a2a, false if playing cah.
    - questionCard: the green card for a2a, or the black card for cah.
    - answerCard: the red card for a2a, or the white card for cah.
    - solution: an array of one or more answers cards from one player.
    - judge: the player that chooses the best solution from the other players.
    - host: the player that creates, configures, and launches the game.