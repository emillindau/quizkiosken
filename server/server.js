import gravatar from 'gravatar';
Meteor.startup(function() {
  console.log('Server started');
});

// Hook for intercepting creation of accounts
Accounts.onCreateUser(function(options, user) {
  const email = user.emails[0].address;
  const url = gravatar.url(email, {s: '200', protocol: 'http', d: 'retro', r: 'pg'});
  user.avatar = url;

  return user;
});
