Template.home.onCreated(function() {
  const template = this;
  template.autorun(function() {
    // template.subscribe('Quizzes.all'); // Will automatically stop
    // template.subscribe('pquests.polled');
  });
});

Template.home.onRendered(function() {
});

Template.home.onDestroyed(function() {
});

Template.home.helpers({
  appReady: function() {
    return Template.instance().subscriptionsReady();
  },
  questions: function() {
    console.log(PQuests.find({}).fetch());
    return PQuests.find({});
  },
  quizzes: function() {
    return Quizzes.find({});
  }
});

Template.home.events({
  'click .js-submit': (event) => {
    event.preventDefault();
    Meteor.call('createLobby', Meteor.userId(), (err, res) => {
      console.log('lobby created', res);
      Router.go('/lobby/'+res);
    });
    /*let name = $('#quizName').val().trim();
    if(name) {
      Meteor.call('addQuiz', name, (err, res) => {
        if(res) {
          $('#quizName').val('');
        } else {
          Session.set('error', {title: '', message: ''});
        }
      });
    }*/
  },
  'keyup #quizName': (event) => {
    console.log(event);
  }
});
