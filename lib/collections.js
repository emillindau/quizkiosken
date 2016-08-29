Quizzes = new Mongo.Collection('quizzes');
Questions = new Mongo.Collection('questions');
Lobbies = new Mongo.Collection('lobbies');
PQuests = new Mongo.Collection('pquests');


/*
Lobbies.schema = new SimpleSchema({
  name: {type: String},
  players: {type: [Object]},
  quiz: {type: String},
  status: {type: String},
  private: {type: Boolean}
});
*/

/*Questions.schema = new SimpleSchema({
  question: {type: String},
  category: {type: String},
  quiz: {type: String},
  answers: {type: [Object]}
});*/

Quizzes.schema = new SimpleSchema({
  name: {type: String, min: 1, max: 50}
});

// Deny all client-side updates
Quizzes.deny({
  insert() { return true; },
  update() { return true; },
  remove() { return true; },
});

Questions.deny({
  insert() { return true; },
  update() { return true; },
  remove() { return true; },
});

Lobbies.deny({
  insert() { return true; },
  update() { return true; },
  remove() { return true; },
});
