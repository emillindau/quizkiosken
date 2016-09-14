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
    const q = Questions.findOne({lobbyId: Router.current().params._id});
    $('#answer').select();
    if(!q.visibleAnswer) {
      $('.hquestion').addClass('flash-white');
      setTimeout(function() {
        $('.hquestion').removeClass('flash-white');
      }, 700);
    }

    return q;
  },
  isMusic: function() {
    const question = Questions.findOne({lobbyId: Router.current().params._id});
    return question.isMusic;
  },
  play: function() {
    const question = Questions.findOne({lobbyId: Router.current().params._id});
    if(question && !question.visibleAnswer) {
      console.log('trying to play audio');
      _stop();
      Template.started.audio = new Audio(question.url);
      Template.started.audio.play();
    }
  },
  stop: function() {
    _stop();
  },
  correctAnswer: function() {
    const question = Questions.findOne({lobbyId: Router.current().params._id});
    console.log('question from visible', question);
    if(question.visibleAnswer) {
      _stop();
    }
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

Template.started.audio;
const _stop = function() {
  if(Template.started.audio) {
    Template.started.audio.pause();
  }
}

Template.started.events({
  'submit #answerForm': function(event) {
    event.preventDefault();
    const answer = $('#answer').val().trim();
    Meteor.call('checkAnswer', Meteor.userId(), Router.current().params._id, answer, (err, res) => {
      if(res) {
        if(res.data) {
          console.log(':)');
          // $('body').css('background', '#2ECC40');
        } else {
          $('.answer-form').addClass('flash');
          setTimeout(function() {
            $('.answer-form').removeClass('flash');
          }, 700);
          console.log(':(');
          // $('body').css('background', '#FF4136');
        }
      }
      $('#answer').val('');// = '';
      $('#answer').select();
    });
  },
  'click .js-stop': function(event) {
    console.log('stopping quiz');
    _stop();
    Meteor.call('stopQuiz', Meteor.userId(), Router.current().params._id, (err, res) => {

    });
  },
});
