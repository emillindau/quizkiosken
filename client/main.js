// Subscriptions for the whole app
console.log('main.js', Session.get('clientId'));
if(!Session.get('clientId')) {
  Meteor.call('connect', (err, res) => {
    if(!err) {
      console.log('main.js', res);
      Session.set('clientId', res);
    }
  });
} else {
  console.log(Session.get('clientId'));
}
