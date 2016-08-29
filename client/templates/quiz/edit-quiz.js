Template.editQuiz.onCreated(function() {
  const template = this;
  template.autorun(function() {
    template.subscribe('Questions.quiz', Router.current().params._id);
  });
});

Template.editQuiz.helpers({
  ready: function() {
    return Template.instance().subscriptionsReady();
  },
  questions: function() {
    return Questions.find({quiz: Router.current().params._id});
  }
});
