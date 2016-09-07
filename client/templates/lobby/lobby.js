Template.lobby.onCreated(function() {
  const template = this;
  const lobbyId = Router.current().params._id;
  template.autorun(function() {
    const handle = template.subscribe('Lobby', lobbyId);
    template.subscribe('Teams.lobby', lobbyId);
    if(handle.ready()) {
      console.log('ready');
      const lobby = Lobbies.findOne({_id: lobbyId});
      const clientId = Meteor.userId();

      if(clientId && lobby) {
        if(lobby.clients && lobby.clients.includes(clientId)) {
          console.log('client already present in lobby');
        } else {
          console.log('need to add client to lobby');
          // Add client even though server started..
          Meteor.call('addClientToLobby', clientId, lobbyId, (err, res) => {
            console.log('client added');
          });

          if(!lobby.started) {
            console.log('lobby has not started');
          } else {
            console.log('lobby already started');
          }
        }
      }
    }
  });
});

Template.lobby.onDestroyed(function() {
  // Need to tell the server that we quit
  Meteor.call('removeClientFromLobby', Meteor.userId(), Router.current().params._id, (err, res) => {
    // Handle silently
  });
});

Template.lobby.helpers({
  lobby: function() {
      return Lobbies.findOne({_id: Router.current().params._id});
  },
  isAdmin: function() {
      const lobby = Lobbies.findOne({_id: Router.current().params._id});
      const clientId = Meteor.userId();
      return lobby.adminId === clientId;
  },
  isStarted: function() {
    return Lobbies.findOne({_id: Router.current().params._id}).started;
  },
  allowTeams: function() {
    return Lobbies.findOne({_id: Router.current().params._id}).allowTeams;
  },
});

Template.lobby.events({
  'click .js-start': function(event, template) {
    event.preventDefault();
    Meteor.call('startQuiz', Router.current().params._id, 20, (err, res) => {
      if(!err) {
        console.log(res);
      }
    });
  },
  'click .js-allow-team': function(event, template) {
    event.preventDefault();
    Meteor.call('allowTeams', Router.current().params._id, !Lobbies.findOne({_id: Router.current().params._id}).allowTeams, (err, res) => {
      // Handle silent
    });
  },
  'click .js-join-red': function(event, template) {
    event.preventDefault();
    _joinTeam('red', Router.current().params._id, Meteor.userId());
  },
  'click .js-join-blue': function(event, template) {
    event.preventDefault();
    _joinTeam('blue', Router.current().params._id, Meteor.userId());
  },
  'click .js-delete-lobby': function(event, template) {
    event.preventDefault();
    Meteor.call('deleteLobby', Router.current().params._id, Meteor.userId(), (err, res) => {
      // Handle silent
      if(res) {
        Router.go('/');
      }
    });
  },
});

const _joinTeam = (team, lobbyId, clientId) => {
  Meteor.call('joinTeam', team, lobbyId, clientId, (err, res) => {
    // Handle silent
  });
}

/** START OF STARTED TEMPLATE **/
Template.started.onCreated(function() {
  const template = this;
  const lobby = Lobbies.findOne({_id: Router.current().params._id});
  const clientId = Meteor.userId();
  if(lobby.clients && lobby.clients.includes(clientId)) {
    console.log('You will participate in quiz!');
    if(clientId === lobby.adminId) {
      console.log('You are admin and will start!');
      Meteor.call('startQuizInLobby', lobby._id, (err, res) => {
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
      console.log('started handle ready');
    }
  })
});

Template.started.onRendered(function() {
  $('#answer').select();
});

Template.started.helpers({
  isActivePlayer: function() {
    const lobby = Lobbies.findOne({_id: Router.current().params._id});
    return lobby.clients && lobby.clients.includes(Meteor.userId());
  },
  current: function() {
    console.log(Questions.findOne({lobbyId: Router.current().params._id}));
    return Questions.findOne({lobbyId: Router.current().params._id});
  },
  correctAnswer: function() {
    const question = Questions.findOne({lobbyId: Router.current().params._id});
    return question.visibleAnswer;
  },
  players: function() {
    const players = Meteor.users.find({lobby: Router.current().params._id}, {sort: {currentLobbyValue: -1}});
    return players;
  },
  isAdmin: function() {
      const lobby = Lobbies.findOne({_id: Router.current().params._id});
      const clientId = Meteor.userId(); // Session.get('clientId');
      return lobby.adminId === clientId;
  }
});

Template.started.events({
  'submit #answerForm': function(event) {
    event.preventDefault();
    console.log('submit');
    const answer = $('#answer').val().trim();
    console.log('answer', answer);
    Meteor.call('checkAnswer', Meteor.userId(), Router.current().params._id, answer, (err, res) => {
      if(res) {
        if(res.data) {
          console.log('correct ANSWER!!!');
          // $('body').css('background', '#2ECC40');
        } else {
          $('.answer-form').addClass('flash');
          setTimeout(function() {
            $('.answer-form').removeClass('flash');
          }, 700);
          console.log('not correct answer :(');
          // $('body').css('background', '#FF4136');
        }
      }
      $('#answer').val('');// = '';
      $('#answer').select();
    });
  },
  'click .js-stop': function(event) {
    console.log('stopping quiz');
    Meteor.call('stopQuiz', Meteor.userId(), Router.current().params._id, (err, res) => {

    });
  },
});
