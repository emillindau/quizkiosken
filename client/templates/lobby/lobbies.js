Template.lobbies.onCreated(function() {
  const template = this;
  template.autorun(function() {
    const handle = template.subscribe('Lobbies.notStarted');
  });
});

Template.lobbies.helpers({
  lbs: function() {
    return Lobbies.find({});
  },
});

Template.lobbies.events({

});