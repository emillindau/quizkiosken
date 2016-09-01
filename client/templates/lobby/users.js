Template.users.onCreated(function() {
  const template = this;
  template.autorun(function() {
    template.subscribe('userLobbyData', Router.current().params._id);
  });
});

Template.users.helpers({
  players: function() {
    const players = Meteor.users.find({lobby: Router.current().params._id});
    console.log(players.fetch());
    return players;
  },
});