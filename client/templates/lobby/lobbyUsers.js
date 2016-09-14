Template.lobbyUsers.onCreated(function() {
  const template = this;
  template.autorun(function() {
    template.subscribe('userLobbyData', Router.current().params._id);
  });
});

Template.lobbyUsers.helpers({
  players: function() {
    return Meteor.users.find({lobby: Router.current().params._id}, {sort: {'currentLobbyValue': -1}});
  },
  count: function() {
    return Meteor.users.find({lobby: Router.current().params._id}).count();
  }
});
