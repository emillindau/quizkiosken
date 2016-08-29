Template.lobby.onCreated(function() {
  const template = this;
  template.autorun(function() {
    const handle = template.subscribe('Lobby', Router.current().params._id);
    if(handle.ready()) {
      console.log('ready');
      const lobby = Lobbies.findOne({_id: Router.current().params._id});
      const clientId = Session.get('clientId');

      if(lobby.clients && lobby.clients.includes(clientId)) {
        console.log('client already present in lobby');
      } else {
        console.log('need to add client to lobby');
        if(!lobby.started) {
          Meteor.call('addClientToLobby', clientId, Router.current().params._id, (err, res) => {
            console.log('client added');
          });
        } else {
          console.log('lobby already started');
        }
      }
    }
  });
});

Template.lobby.helpers({
  lobby: function() {
      return Lobbies.findOne({_id: Router.current().params._id});
  },
  isAdmin: function() {
      const lobby = Lobbies.findOne({_id: Router.current().params._id});
      const clientId = Session.get('clientId');
      return lobby.adminId === clientId;
  },
  isStarted: function() {
    return Lobbies.findOne({_id: Router.current().params._id}).started;
  }
});

Template.lobby.events({
  'click .js-start': function(event, template) {
    event.preventDefault();
    Meteor.call('startQuiz', Router.current().params._id, (err, res) => {
      if(!err) {
        console.log(res);
      }
    });
  },
});

/** START OF STARTED TEMPLATE **/
Template.started.onCreated(function() {
  const template = this;
  const lobby = Lobbies.findOne({_id: Router.current().params._id});
  const clientId = Session.get('clientId');
  if(lobby.clients && lobby.clients.includes(clientId)) {
    console.log('You will participate in quiz!');
    if(clientId === lobby.adminId) {
      console.log('You are admin and will start!');
      Meteor.call('nextQuestion', clientId, lobby._id, (err, res) => {
        console.log(err);
        console.log(res);
      });
    }
  } else {
    console.log('You will not participate :(');
  }

  template.autorun(() => {
    const handle = template.subscribe('Questions.lobby', lobby._id);
    if(handle.ready()) {
      const question = Questions.findOne({lobbyId: lobby._id});
      if(clientId === lobby.adminId) {
        if(question.correctAnswer) { // correctAnswer = id of user with correct answer
          Meteor.setTimeout(() => {
            Meteor.call('nextQuestion', clientId, lobby._id, (err, res) => {
              console.log('new question loaded');
              $('body').css('background', '#FFFFFF');
            });
          }, 5000);
        }
      }
      console.log('started handle ready');
    }
  })
});

Template.started.helpers({
  isActivePlayer: function() {
    const lobby = Lobbies.findOne({_id: Router.current().params._id});
    return lobby.clients && lobby.clients.includes(Session.get('clientId'));
  },
  current: function() {
    console.log(Questions.findOne({lobbyId: Router.current().params._id}));
    return Questions.findOne({lobbyId: Router.current().params._id});
  },
  correctAnswer: function() {
    const question = Questions.findOne({lobbyId: Router.current().params._id});
    return question.visibleAnswer;
  }
});

Template.started.events({
  'submit #answerForm': function(event) {
    event.preventDefault();
    console.log('submit');
    const answer = $('#answer').val().trim();
    console.log('answer', answer);
    Meteor.call('checkAnswer', Session.get('clientId'), Router.current().params._id, answer, (err, res) => {
      if(res) {
        if(res.data) {
          console.log('correct ANSWER!!!');
          $('body').css('background', '#2ECC40');
        } else {
          console.log('not correct answer :(');
          $('body').css('background', '#FF4136');
        }
      }
      $('#answer').val('');// = '';
      $('#answer').select();
    });
  }
});
