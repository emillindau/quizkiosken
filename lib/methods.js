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
    console.log('lobby', lobby);
    if(!lobby) {
      return Lobbies.insert({
        _id: lobbyId,
        adminId: clientId,
        started: false,
        finished: false,
        clients: [clientId],
      });
    }
    return lobby._id;
  },
  addClientToLobby(clientId, lobbyId) {
    return Lobbies.update({_id : lobbyId}, {$addToSet: {clients: clientId}});
  },
  startQuiz(lobbyId) {
    return Lobbies.update({_id: lobbyId}, {$set: {started: true}});
  },
});

if(Meteor.isServer) {
  Meteor.methods({
    nextQuestion(clientId, lobbyId) {
      const lobby = Lobbies.findOne({_id: lobbyId});
      if(lobby) {
        if(lobby.adminId === clientId) {
          // It was the admin who requested the change.

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
      if(qA.length > 5) { // Only check answers fuzzy which is less than five chars
        treshold = 0.7
      } else { // Else it is a
        treshold = 1;
      }
      if(score >= treshold) {
        console.log('correct answer');
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