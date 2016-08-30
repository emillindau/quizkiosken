import {string_score} from 'string_score';

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
  startQuiz(lobbyId) {
    return Lobbies.update({_id: lobbyId}, {$set: {started: true}});
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
  const result = Meteor.users.update({_id: clientId}, {$set: {lobby: lobbyId}}); // Just one
  console.log('Added lobbyId to user', result);
  return result;
}

if(Meteor.isServer) {
  Meteor.methods({
    nextQuestion(clientId, lobbyId) {
      const lobby = Lobbies.findOne({_id: lobbyId});
      if(lobby) {
        if(lobby.adminId === clientId) { // It was the admin who requested the change.
          _clear();

          HTTP.call('GET', 'http://jservice.io/api/random', {params: {}}, (err, res) => {
            if(res.data) {
              const qArr = res.data.map((q) => {
                const question = {
                  id: q.id,
                  answer: q.answer,
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
              return Questions.insert(currentQuestion);
            }
          });
        }
      }
    },
    checkAnswer(clientId, lobbyId, answer) {
      const lobby = Lobbies.findOne({_id: lobbyId});
      const question = Questions.findOne({lobbyId: lobby._id});
      console.log('checkingAnswer', question);
      const qA = question.answer.toUpperCase();
      const a = answer.toUpperCase();
      console.log(qA);
      console.log(a);
      const score = qA.score(a);
      console.log(score);

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
        // Clear clue interval
        _clear();
        Questions.update({_id: question._id}, {$set: {correctAnswer: clientId, visibleAnswer: question.answer}});
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
    for(let i = 0; i < length; i++) {
      if(i <= currentClueIdx) {
        clue += question.answer[i];
      } else {
        clue += '*';
      }
    }
    currentClueIdx++;
    _addMessage('server', lobbyId, clue);
  }, 10000);
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