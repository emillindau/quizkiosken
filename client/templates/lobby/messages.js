Template.messages.onCreated(function() {
  const template = this;
  template.autorun(function() {
    const handle = template.subscribe('Messages.lobby', Router.current().params._id);
  });
});

Template.messages.helpers({
  messages: function() {
    return Messages.find({lobby: Router.current().params._id}, {sort: {created: 1}});
  }
});
