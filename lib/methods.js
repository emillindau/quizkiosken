import {string_score} from 'string_score';
import striptags = from 'striptags';

Meteor.methods({
  addQuiz(name) {
    const quiz = {
      name: name
    };
    Quizzes.schema.validate(quiz);

    let result = Quizzes.insert(quiz);
    return result;
  },
  connect() {
    return generateUniqueIndex();
  },
  createLobby(clientId) {
    const lobbyId = generateUniqueIdx(UNIQ_IDX);
    const lobby = Lobbies.findOne({_id: lobbyId});

    if(!lobby) {
      console.log('Creating lobby');
      _addLobbyToUser(clientId, lobbyId);
      return Lobbies.insert({
        _id: lobbyId,
        adminId: clientId,
        started: false,
        finished: false,
        clients: [clientId],
      });
    }
    console.log('Returning previous lobby');
    return lobby._id;
  },
  addClientToLobby(clientId, lobbyId) {
    // First add lobbyId to User object
    _addLobbyToUser(clientId, lobbyId);
    return Lobbies.update({_id : lobbyId}, {$addToSet: {clients: clientId}});
  },
  removeClientFromLobby(clientId, lobbyId) {

  },
  startQuiz(lobbyId, numberOfQuestions) {
    return Lobbies.update({_id: lobbyId}, {$set: {started: true, numberOfQuestions: numberOfQuestions, numberOfRounds: 0}});
  },
  startQuizInLobby(lobbyId) {
    return Meteor.call('nextQuestion', lobbyId);
  },
});

const _addMessage = (clientId, lobbyId, message) => {
  return Messages.insert({
    from: clientId,
    created: new Date(),
    lobby: lobbyId,
    value: message,
    correct: false,
  });
}

const _addLobbyToUser = (clientId, lobbyId) => {
  console.log('Adding lobby to user');
  const result = Meteor.users.update({_id: clientId}, {$set: {lobby: lobbyId, currentLobbyValue: 0}}); // Just one
  console.log('Added lobbyId to user', result);
  return result;
}

const _finishGame = (lobbyId) => {
  _clear();
  const winner = Meteor.users.find({lobby: lobbyId}, {sort: {currentLobbyValue: -1}, limit: 1});
  _addMessage('server', lobbyId, 'That is it foks! The winner was: ' + winner.username + '! GGWP!');
}

if(Meteor.isServer) {
  Meteor.methods({
    nextQuestion(lobbyId) {
      Messages.remove({lobby: lobbyId});
      const lobby = Lobbies.findOne({_id: lobbyId});

      if(lobby) {
        // Check if the number of questions been answered
        if(lobby.numberOfRounds >= lobby.numberOfQuestions) {
          _finishGame(lobbyId);
          return;
        }
        _clear();

        HTTP.call('GET', 'http://jservice.io/api/random', {params: {}}, (err, res) => {
          if(res.data) {
            const qArr = res.data.map((q) => {
              const question = {
                id: q.id,
                answer: striptags(q.answer),
                question: q.question,
                value: q.value,
                category_id: q.category_id,
                game_id: q.game_id,
                category_name: q.category.title,
                clues_count: q.category.clues_count,
                correctAnswer: null,
                visibleAnswer: null,
              };
              return question;
            });
            const currentQuestion = qArr[0];
            currentQuestion.lobbyId = lobbyId; // Attach lobbyId to question
            console.log(currentQuestion);
            if(Questions.findOne({lobbyId: lobbyId})) {
              Questions.remove({lobbyId: lobbyId}, (err, res) => {
                console.log('err', err);
                console.log('deleted', res);
              });
            }

            // Start clue interval && question interval
            _startClueInterval(currentQuestion, lobbyId);
            Lobbies.update({_id: lobbyId}, {$inc: {numberOfRounds: 1}});
            return Questions.insert(currentQuestion);
          }
        });
      }
    },
    checkAnswer(clientId, lobbyId, answer) {
      const lobby = Lobbies.findOne({_id: lobbyId});
      const question = Questions.findOne({lobbyId: lobby._id});
      if(question.correctAnswer) { // If the Question is already answered
        return {data: false};
      }

      console.log('checkingAnswer', question);
      const qA = question.answer.toUpperCase();
      const a = answer.toUpperCase();
      const score = qA.score(a);

      let treshold = 0.7;
      if(qA.length >= 12) {
        treshold = 0.6;
      } else if(qA.length >= 6) {
        treshold = 0.7
      } else {
        treshold = 1;
      }

      // Add to message collection for displaying to other clients
      _addMessage(clientId, lobbyId, answer);

      if(score >= treshold) {
        console.log('correct answer');
        const usr = Meteor.users.findOne({_id: clientId});
        const correctMessage = 'Yes! That is it! ' + usr.username + ' you gorgeous bastard! ' + question.answer + ' is indeed correct!'
        _addMessage('server', lobbyId, correctMessage);

        // Clear clue interval
        _clear();
        Questions.update({_id: question._id}, {$set: {correctAnswer: clientId, visibleAnswer: question.answer}});
        const val = Meteor.users.update({_id: clientId}, {$inc: {currentLobbyValue: question.value}});
        console.log('adding score to user', val);

        // Call next question in 5 sek
        _addMessage('server', lobbyId, 'Next question coming up!');
        Meteor.setTimeout(function () {
          Meteor.call('nextQuestion', lobbyId);
        }, 7500);

        return {data: true, value: question.answer};
      }
      console.log('incorrect answer');
      return {data: false};
    },
  });
}

let UNIQ_CLIENT_ID = 100;
let UNIQ_IDX = 10000000;


let clueInterval, questionInterval;
const _clear = () => {
  console.log('clearing interval');
  Meteor.clearInterval(clueInterval);
}

const _startClueInterval = (question, lobbyId) => {
  let currentClueIdx = 0;
  clueInterval = Meteor.setInterval(function () {
    const length = question.answer.length;
    let clue = '';
    let skipNext = false;
    for(let i = 0; i < length; i++) {
      if(skipNext) {
        skipNext = false;
        continue;
      }
      if(i <= currentClueIdx) {
        if(question.answer[i] === ' ') {
          clue += question.answer[i];
          const oneMoreIdx = i + 1;
          clue += question.answer[oneMoreIdx];
          skipNext = true;
        } else {
          clue += question.answer[i];
        }
      } else {
        if(question.answer[i] === ' ') {
          clue += ' ';
        } else {
          clue += '*';
        }
      }
    }
    currentClueIdx++;
    _addMessage('server', lobbyId, clue);
  }, 6000);
}
var generateUniqueIdx = function(uniqueIndex) {
  var idx = uniqueIndex.toString(36);
  UNIQ_IDX++;
  return idx;
}
const generateUniqueIndex = () => {
  let id = UNIQ_CLIENT_ID.toString(36);
  UNIQ_CLIENT_ID++;
  return id;
}