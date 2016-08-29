Meteor.startup(function() {
  console.log('Server started');

  /*let count = Quizzes.find({name: 'General'}).count();
  console.log('Quiz count', count);
  if(count === 0) {
    let id = Quizzes.insert({name: 'General'});

    for(let i = 0; i < 10; i++) {
      let Q = {
        question: '#' + i + ' Who put the ram in the damaram?',
        category: 'Silly',
        quiz: id,
        answers: [
          {
            answer: 'Tom holadoli',
            correct: false
          },
          {
            answer: 'Bob robendob',
            correct: false
          },
          {
            answer: 'Ken rombalingidong',
            correct: false
          },
          {
            answer: 'Joakim norberg',
            correct: true
          }
        ]
      };
      Questions.insert(Q);
    }
    console.log('Questions count: ', Questions.find().count());
  }*/
});
