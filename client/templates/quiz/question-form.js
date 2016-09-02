Template.questionForm.onRendered(function() {
  $('#inputCategory').select();
});

Template.questionForm.events({
  'submit .js-submit-question': function(event) {
    event.preventDefault();

    const question = $('#inputQuestion').val().trim();
    const category = $('#inputCategory').val().trim();
    const val = $('#inputValue').val().trim();
    const answer = $('#inputAnswer').val().trim();

    Meteor.call('addQuestion', question, category, val, answer, (err, res) => {
      // Do stuff
      if(err) {

      } else {
        $('#inputQuestion').val('');
        $('#inputCategory').val('');
        $('#inputValue').val('');
        $('#inputAnswer').val('');
        $('#inputCategory').select();
      }
    });
  }
});

Template.questionForm.helpers({
});
