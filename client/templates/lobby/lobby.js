Template.lobby.onCreated(function() {
  const template = this;
  const lobbyId = Router.current().params._id;

  template.autorun(function() {
    const handle = template.subscribe('Lobby', lobbyId);
    template.subscribe('Teams.lobby', lobbyId);

    if(handle.ready()) {
      console.log('ready');
      const lobby = Lobbies.findOne({_id: lobbyId});
      const clientId = Meteor.userId();

      if(clientId && lobby) {
        if(lobby.clients && lobby.clients.includes(clientId)) {
          console.log('client already present in lobby');
        } else {
          console.log('need to add client to lobby');
          // Add client even though server started..
          Meteor.call('addClientToLobby', clientId, lobbyId, (err, res) => {
            console.log('client added');
          });

          if(!lobby.started) {
            console.log('lobby has not started');
          } else {
            console.log('lobby already started');
          }
        }
      }
    }
  });
});

Template.lobby.onDestroyed(function() {
  // Need to tell the server that we quit
  console.log('Removing client from user');
  Meteor.call('removeClientFromLobby', Meteor.userId(), Router.current().params._id, (err, res) => {
    // Handle silently
  });
});

Template.lobby.helpers({
  lobby: function() {
      return Lobbies.findOne({_id: Router.current().params._id});
  },
  isAdmin: function() {
      const lobby = Lobbies.findOne({_id: Router.current().params._id});
      const clientId = Meteor.userId();
      return lobby.adminId === clientId;
  },
  isStarted: function() {
    return Lobbies.findOne({_id: Router.current().params._id}).started;
  },
  allowTeams: function() {
    return Lobbies.findOne({_id: Router.current().params._id}).allowTeams;
  },
});

Template.lobby.events({
  'click .js-start': function(event, template) {
    event.preventDefault();
    Meteor.call('startQuiz', Router.current().params._id, 20, (err, res) => {
      if(!err) {
        console.log(res);
      }
    });
  },
  'click .js-allow-team': function(event, template) {
    event.preventDefault();
    Meteor.call('allowTeams', Router.current().params._id, !Lobbies.findOne({_id: Router.current().params._id}).allowTeams, (err, res) => {
      // Handle silent
    });
  },
  'click .js-join-red': function(event, template) {
    event.preventDefault();
    _joinTeam('red', Router.current().params._id, Meteor.userId());
  },
  'click .js-join-blue': function(event, template) {
    event.preventDefault();
    _joinTeam('blue', Router.current().params._id, Meteor.userId());
  },
  'click .js-delete-lobby': function(event, template) {
    event.preventDefault();
    Meteor.call('deleteLobby', Router.current().params._id, Meteor.userId(), (err, res) => {
      // Handle silent
      if(res) {
        Router.go('/');
      }
    });
  },
});

const _joinTeam = (team, lobbyId, clientId) => {
  Meteor.call('joinTeam', team, lobbyId, clientId, (err, res) => {
    // Handle silent
  });
}
