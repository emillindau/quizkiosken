Template.appErrors.helpers({
  errors: function() {
    let err = Session.get('error');
    if(err) {
      Meteor.setTimeout(removeErrors, 20000);
    }
    return err;
  }
});

Template.appErrors.onDestroyed(function() {
  Meteor.clearTimeout();
});

Template.appErrors.events({
  'click button.close': function(event) {
    event.preventDefault();
    removeErrors();
  }
});

function removeErrors() {
  $('.alert').hide('slow', function() {
    Session.set('error', null);
  });
}
