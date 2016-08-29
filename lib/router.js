Router.configure({
  layoutTemplate: 'ApplicationLayout'
});

Router.route('/', {
  action: function() {
    this.render('home');
  }
});

Router.route('/question/add', {
  action: function() {
    this.render('addQuestion');
  }
});

Router.route('/quiz/edit/:_id', {
  action: function() {
    this.render('editQuiz');
  }
});

Router.route('/lobby/:_id', {
  action: function() {
    this.render('lobby');
  }
});

/* Router.route('/quiz/edit/:_id', {
    action: function() {
        this.render('editQuiz', {
            data: () => {
                return Quizzes.findOne({_id: this.params._id});
            }
        });
    }
}); */
