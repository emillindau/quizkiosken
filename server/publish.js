Meteor.publish('Questions.all', function() {
  return Questions.find({});
});

Meteor.publish('Lobbies.notStarted', function() {
  return Lobbies.find({started: {$ne: true}});
});

Meteor.publish('Teams.lobby', function(lobbyId) {
  return Teams.find({lobby: lobbyId});
});

Meteor.publish('Questions.lobby', function(lobbyId) {
  return Questions.find({lobbyId: lobbyId}, {fields: {
    _id: 1,
    question: 1,
    lobbyId: 1,
    value: 1,
    category_id: 1,
    game_id: 1,
    category_name: 1,
    clues_count: 1,
    correctAnswer: 1,
    visibleAnswer: 1,
    isMusic: 1,
    url: 1,
  }});
});

Meteor.publish('Messages.lobby', function(lobbyId) {
  return Messages.find({lobby: lobbyId}, {limit: 10, sort: {created: -1}});
});

Meteor.publish("userLobbyData", function (lobbyId) {
  return Meteor.users.find({lobby: lobbyId}, {fields: {
    'username': 1,
    'lobby': 1,
    'currentLobbyValue': 1,
    'avatar': 1,
  }});
});

Meteor.publish('Lobby', function(id) {
  return Lobbies.find({_id: id});
});

Meteor.publish('pquests.polled', function() {
  console.log('pquests.polled');
  const publishedKeys = {};

  const poll = () => {
    try {
      const res = HTTP.call('GET', 'http://jservice.io/api/random', {params: {}});
      if(res.data) {
        const qArr = res.data.map((q) => {
          const question = {
            id: q.id,
            answer: q.answer,
            question: q.question,
            value: q.value,
            category_id: q.category_id,
            game_id: q.game_id,
            category_name: q.category.title,
            clues_count: q.category.clues_count,
          };
          return question;
        });
        console.log(qArr);

        qArr.forEach((question) => {
          const _id = question.id;
          if(publishedKeys[_id]) {
            this.changed('pquests', _id, question);
          } else {
            publishedKeys[_id] = true;
            this.added('pquests', _id, question);
          }
        });
      }
      // console.log(res);
    } catch(e) {
      console.log('error', e);
    }
  }

  poll();
  this.ready();

  const interval = Meteor.setInterval(poll, 60000);

  this.onStop(() => {
    Meteor.clearInterval(interval);
  });
});
