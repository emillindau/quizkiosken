import {string_score} from 'string_score';
import striptags from 'striptags';
import events from 'events';

let eventEmitter = new events.EventEmitter();

Meteor.methods({
  createLobby(clientId, name, noOfQuestions, quizSource, allowMusic, onlyMusic) {
    console.log('Creating lobby');

    const id = Lobbies.insert({
      adminId: clientId,
      started: false,
      finished: false,
      name: name || 'Le Juck Quiz',
      numberOfQuestions: noOfQuestions || 10,
      quizSource: quizSource,
      allowTeams: false,
      allowMusic: allowMusic,
      clients: [clientId],
      onlyMusic: onlyMusic,
    });
    _addLobbyToUser(clientId, id);
    return id;
  },
  allowTeams(lobbyId, val) {
    return Lobbies.update({_id: lobbyId}, {$set: {allowTeams: val}});
  },
  addClientToLobby(clientId, lobbyId) {
    // First add lobbyId to User object
    _addLobbyToUser(clientId, lobbyId);
    return Lobbies.update({_id : lobbyId}, {$addToSet: {clients: clientId}});
  },
  startQuiz(lobbyId) {
    return Lobbies.update({_id: lobbyId}, {$set: {started: true, numberOfRounds: 0}});
  },
  startQuizInLobby(lobbyId) {
    return Meteor.call('nextQuestion', lobbyId);
  },
  joinTeam(teamName, lobbyId, clientId) {
    check(teamName, String);

    if(teamName !== 'red' && teamName !== 'blue') {
      throw new Meteor.Error('Team error');
    }

    const lobby = Lobbies.findOne({_id: lobbyId});
    if(lobby && lobby.allowTeams) {
      // Kinda safe to continue
      const teams = Teams.find({lobby: lobbyId});
      if(teams && teams.count() === 2) { // Teams are defined
        console.log('teams are defined');
        console.log('found two teams');
        teams.forEach(team => {
          // Remove and populate
          if(team.name === teamName) {
            const u = Teams.update({_id: team._id}, {$addToSet: {clients: clientId}});
            console.log('updated correct team', u);
          } else {
            const u2 = Teams.update({_id: team._id}, {$pull: {clients: clientId}});
            console.log('updated oterh team', u2);
          }
        });

        const le = teams.count();
        console.log('found ', le);

      } else { // Teams are undefined and should be inserted
        const team1 = Teams.insert({
          lobby: lobbyId,
          clients: [clientId],
          name: teamName
        });

        const team2 = Teams.insert({
          lobby: lobbyId,
          clients: [],
          name: _getOtherTeam(teamName)
        });
        console.log('inserted team1', team1);
        console.log('inserted team2', team2);
      }
    } else {
      console.log('Error lobby');
      throw new Meteor.Error('Teams are not allowed');
    }
  },
  deleteLobby(lobbyId, clientId) {
    _clear();
    return _removeQuiz(lobbyId);
  },
});

const _getOtherTeam = (name) => {
  return name === 'red' ? 'blue' : 'red';
}

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
  const result = Meteor.users.update({_id: clientId}, {$set: {lobby: lobbyId, currentLobbyValue: 0}}); // Just one
  return result;
}

const _finishGame = (lobbyId) => {
  _clear();
  const winner = Meteor.users.find({lobby: lobbyId}, {sort: {currentLobbyValue: -1}, limit: 1}).fetch();
  const username = winner[0] ? (winner[0].username ? winner[0].username : 'Uknown') : 'Unknown';
  _addMessage('server', lobbyId, 'That is it foks! The winner was: ' + username + '! GGWP!');
  Meteor.setTimeout(function() {
    _removeQuiz(lobbyId);
  }, 15000);
}

const _removeQuiz = (lobbyId) => {
  console.log('Removing quiz!');
  Music.remove({lobby: lobbyId});
  Teams.remove({lobby: lobbyId});
  Messages.remove({lobby: lobbyId});
  Questions.remove({lobbyId: lobbyId});
  const users = Meteor.users.find({lobby: lobbyId});
  users.forEach((user) => {
    _removeLobbyFromClient(user._id, lobbyId);
  });
  Lobbies.remove({_id: lobbyId});
  return true;
}

const _removeLobbyFromClient = (clientId, lobbyId) => {
  console.log('Removing lobby from client');
  return Meteor.users.update({_id: clientId}, {$set: {lobby: null, currentLobbyValue: 0}});
}

if(Meteor.isServer) {
  Meteor.methods({
    addQuestion(question, category, val, answer) {
      check(question, String);
      check(category, String);
      check(val, Number);
      check(answer, String);
      if(val <= 99 || val >= 3001) {
        throw new Meteor.Error('Range Error');
      }

      if(!question || !answer) {
        throw new Meteor.Error('Can not be empty');
      }
      console.log('question', question);
      console.log('answer', answer);
      console.log('val', val);
      console.log('category', category);

      const params = {
        answer: answer,
        value: val,
        question: question,
        categoryName: category
      };
      HTTP.call('POST', 'https://mandrom.se/api/questions', {params: params}, (err, res) => {
        if(err) {
          return false;
        }
        return true;
      });
    },
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

        let sometimes = (Math.floor(Math.random() * (100 - 0 + 1)) + 0) % 3 === 0;
        if((lobby.allowMusic && sometimes) || lobby.onlyMusic) {
          _getQuestionMusic(lobbyId).then((q) => {
            return _returnQuestion(q, lobbyId);
          });
        } else {
          if(lobby.quizSource === 'quiz') {
            _getQuestionQuizAPI().then((q) => {
              return _returnQuestion(q, lobbyId);
            }).catch((e) => {
              console.log(e);
              return false;
            });
          } else {
            _getQuestionJs().then((q) => {
              return _returnQuestion(q, lobbyId);
            }).catch((e) => {
              console.log(e);
              return false;
            });
          }
        }
      }
    },
    checkAnswer(clientId, lobbyId, answer) {
      const lobby = Lobbies.findOne({_id: lobbyId});
      const question = Questions.findOne({lobbyId: lobby._id});
      if(question.correctAnswer) { // If the Question is already answered
        return {data: false};
      }

      const qA = question.answer.toUpperCase();
      const a = answer.toUpperCase();
      const score = qA.score(a);

      let treshold = 0.7;
      if(qA.length >= 22) {
        treshold = 0.8;
      } else if(qA.length >= 12) {
        treshold = 0.9;
      } else {
        treshold = 1;
      }

      console.log('\n=========');
      console.log('answer', question.answer);
      console.log('guess', answer);
      console.log('treshold', treshold);
      console.log('score', score);
      console.log('\n=========');

      // Add to message collection for displaying to other clients
      _addMessage(clientId, lobbyId, answer);

      if(score >= treshold) {
        const usr = Meteor.users.findOne({_id: clientId});
        const answer = question.isMusic ? (question.artist + ' - ' + question.answer) : question.answer;
        const correctMessage = 'Yes! That is it! ' + usr.username + ' you gorgeous bastard! ' + answer + ' is indeed correct!'

        // Clear clue interval
        _clear();

        // If two users answers at the same time
        const checkAgain = Questions.findOne({lobbyId: lobby._id});
        if(checkAgain.correctAnswer) {
          return {data: false};
        }

        Questions.update({_id: question._id}, {$set: {correctAnswer: clientId, visibleAnswer: question.answer}});
        const val = Meteor.users.update({_id: clientId}, {$inc: {currentLobbyValue: question.value}});

        // Call next question in 5 sek
        _addMessage('server', lobbyId, correctMessage);
        _addMessage('server', lobbyId, 'Next question coming up!');

        Meteor.setTimeout(function () {
          Meteor.call('nextQuestion', lobbyId);
        }, 7500);

        return {data: true, value: question.answer};
      }
      return {data: false};
    },
    stopQuiz(clientId, lobbyId) {
      // Check if admin
      return _finishGame(lobbyId);
    },
    removeClientFromLobby(clientId, lobbyId) {
      console.log('Initialized removeClientFromLobby');
      if(!lobbyId) { // Is probably undefined
        console.log('lobbyId was undefined');
        const result = Meteor.users.findOne({_id: clientId});
        lobbyId = result.lobby;
      }
      console.log('lobbyId', lobbyId);
      console.log('clientId', clientId);
      const res = Lobbies.update({_id: lobbyId}, {$pull: {clients: clientId}});
      console.log('Client removed from lobby', res);
      _checkAdminRoleOnRemove(clientId, lobbyId);
      return _removeLobbyFromClient(clientId, lobbyId);
    },
  });
}

const _checkAdminRoleOnRemove = (clientId, lobbyId) => {
  console.log('Checking admin role');
  const lobby = Lobbies.findOne({_id: lobbyId});
  if(!lobby || !lobby.clients || lobby.clients.length === 0) {
    // We should remove lobby
    return _removeQuiz(lobbyId);
  }

  let newAdmin;
  if(clientId === lobby.adminId) { // If it is the admin that is has been removed
    lobby.clients.forEach((client) => {
      if(client !== lobby.adminId) {
        newAdmin = client;
      }
    });
    console.log('newAdmin is:', newAdmin);
    return Lobbies.update({_id: lobbyId}, {$set: {adminId: newAdmin}});
  }

  // Set admin to remaining client
  return true;
}

const _returnQuestion = (currentQuestion, lobbyId) => {
  currentQuestion.lobbyId = lobbyId; // Attach lobbyId to question
  if(Questions.findOne({lobbyId: lobbyId})) {
    Questions.remove({lobbyId: lobbyId}, (err, res) => {

    });
  }

  // Start clue interval && question interval
  _startClueInterval(currentQuestion, lobbyId);
  Lobbies.update({_id: lobbyId}, {$inc: {numberOfRounds: 1}});
  return Questions.insert(currentQuestion);
}

const _getQuestionMusic = (lobbyId) => {
  return new Promise((resolve, reject) => {
    const musicPresent = Music.find({lobby: lobbyId}).count();
    console.log('musicPresent', musicPresent);
    if(musicPresent) {
      console.log('Should fetch from mongo instead loool');
      const rand = Math.floor(Math.random() * ((musicPresent-1) - 0 + 1)) + 0;
      // .limit(-1).skip(yourRandomNumber).next();
      const res = Music.find({}, {limit: -1, skip: rand}).fetch();
      console.log(res);
      resolve(res[0]);
    } else {
      const tunes = Meteor.myFunctions.getTunes().then((tunes) => {
        Music.remove({lobby: lobbyId});
        console.log('tunes length', tunes.length);
        tunes.forEach(t => {
          if(t.url) {
            const t1 = {
              lobby: lobbyId,
              id: t.id,
              answer: t.name, //random.artist
              artist: t.artist,
              url: t.url,
              isMusic: true,
              value: 2000,
              category_name: 'Musikfråga!',
              correctAnswer: null,
              visibleAnswer: null,
            }
            Music.insert(t1);
          } else {
            console.log('filtered away');
          }
        });

        const length = tunes.length-1;
        const rand = Math.floor(Math.random() * (length - 0 + 1)) + 0;
        const random = tunes[rand];
        const question = {
          id: random.id,
          answer: random.name, //random.artist
          artist: random.artist,
          url: random.url,
          isMusic: true,
          value: 2000,
          category_name: 'Musikfråga!',
          correctAnswer: null,
          visibleAnswer: null,
        }
        console.log('question', question);
        resolve(question);
      });
    }

  });
}

const _getQuestionJs = () => {
  return new Promise((resolve, reject) => {
    HTTP.call('GET', 'http://jservice.io/api/random', {params: {}}, (err, res) => {
      if(err) {
        reject(err);
      }
      if(res.data) {
        const qArr = res.data.map((q) => {
          const question = {
            id: q.id,
            answer: striptags(q.answer),
            question: q.question,
            value: q.value || 500,
            category_id: q.category_id,
            game_id: q.game_id,
            category_name: q.category.title,
            clues_count: q.category.clues_count,
            correctAnswer: null,
            visibleAnswer: null,
            isMusic: false,
          };
          return question;
        });
        const currentQuestion = qArr[0];
        resolve(currentQuestion);
      } else {
        reject();
      }
    });
  });
}

const _getQuestionQuizAPI = () => {
  return new Promise((resolve, reject) => {
    HTTP.call('GET', 'https://mandrom.se/api/questions/random', {}, (err, res) => {
      if(err) {
        reject(err);
      } else {
        if(res.data) {
          const questionFromApi = res.data;
          const question = {
            id: questionFromApi._id,
            category_name: questionFromApi.categoryName,
            question: questionFromApi.question,
            value: questionFromApi.value,
            answer: questionFromApi.answer,
            correctAnswer: null,
            visibleAnswer: null,
            category_id: 1,
            clues_count: 0,
            game_id: 0,
            isMusic: false,
          };
          console.log(question);
          resolve(question);
        } else {
          reject();
        }
      }
    });
  });
}


let clueInterval, questionInterval;
const _clear = () => {
  Meteor.clearInterval(clueInterval);
}

const _startClueInterval = (question, lobbyId) => {
  if(clueInterval) {
    _clear();
  }

  let currentClueIdx = 0; // Show clues until this index

  clueInterval = Meteor.setInterval(function() {
    const clue = getClue(question.answer, currentClueIdx);
    currentClueIdx++;
    _addMessage('server', lobbyId, clue);

    checkStopClue(currentClueIdx, lobbyId, question.answer, question._id);
  }, 6000);
}

function checkStopClue(clueIdx, lobbyId, answer, qId) {
  if(clueIdx >= answer.length) {
    // At this point we should cancel current question
    Questions.update({_id: qId}, {$set: {correctAnswer: true, visibleAnswer: answer}});
    _clear();

    _addMessage('server', lobbyId, 'You guys are terrible :( the correct answer was "'+answer+'" We\'ll do next question instead');

    Meteor.setTimeout(function () {
      Meteor.call('nextQuestion', lobbyId);
    }, 5000);
  }
}

function getClue(answer, clueIndex) {
  let clue = '';

  for(let i = 0; i < answer.length; i++) {
    const character = answer[i];
    if(i < clueIndex) {
      clue += character;
      if(character === ' ') {
        clueIndex++;
      }
    } else {
      if(character === ' ') {
        clue += ' ';
      } else {
        clue += '*';
      }
    }
  }
  return clue;
}
