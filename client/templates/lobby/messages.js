import moment from 'moment';

Template.messages.onCreated(function() {
  const template = this;
  template.autorun(function() {
    const handle = template.subscribe('Messages.lobby', Router.current().params._id);
  });
});

Template.messages.helpers({
  messages: function() {
    return Messages.find({lobby: Router.current().params._id}, {sort: {created: 1}});
  },
  getFormatDate: function(mDate) {
    return moment(mDate).format('HH:mm:ss');
  },
  getName: function(clientId) {
    if(clientId === 'server')
      return clientId;
    const user = Meteor.users.findOne({_id: clientId});
    return user.username || 'unknown';
  },
});
