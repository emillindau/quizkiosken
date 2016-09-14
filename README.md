# Quizkiosken
## easy
* Users can rate questions (needs to be implemented in quiz-api as well)
* Fix ui for users display in started-mode (and lobby-mode)
* Limit number of guesses per second, or something like it

## medium
* Stupid self-learning (as in, no of guesses until correct and time it took will generate easy/medium/hard (and possibly value of question))
* Save random question to db to regenerate new questions that are truly random (reuse id from quiz-api)
* Highscore
* Friendlist
* Invite friends to lobby
* Password on lobbies (look at curvefever for easy example)
* Profile-page
* Instead of value on questions you will receive a fixed amount depending on how long it took to answer
* Musikfrågor och ev. bildfrågor

## hard
* Better string_score (i dunno)
* Teams? (started but may delete it now)

## hard af
* Mobilanpassade frågor och utformning (Svarsalternativ istället för skriva svar)

## done aka next release 0.2.0
* Give adminrole to players when a. admin leaves, b. user enters empty lobby
* Clues now works with spaces
* Reselect the input field when new question
* Indicate when an question is rerendered (new question)
* Server will cancel question when he is about to write the full answer (can't guess anymore)
* Fix that players sometimes gets kicked and cant rejoin (should be able to join whenever)
