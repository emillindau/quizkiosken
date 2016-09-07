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