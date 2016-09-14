import SpotifyWebApi from 'spotify-web-api-node';

const QUIZKIOSKEN_PLAYLIST = '11ueqwsyteIPQ9bowZy05e';

if(Meteor.isServer) {
  // credentials are optional
  let spotifyApi = new SpotifyWebApi({
    clientId : Meteor.settings.spotify.client_id,
    clientSecret : Meteor.settings.spotify.client_secret,
  });

  // Retrieve an access token.
  spotifyApi.clientCredentialsGrant()
  .then(function(data) {
    console.log('The access token expires in ' + data.body['expires_in']);
    console.log('The access token is ' + data.body['access_token']);

    // Save the access token so that it's used in future calls
    spotifyApi.setAccessToken(data.body['access_token']);
  }, function(err) {
        console.log('Something went wrong when retrieving an access token', err);
  });

  // Server only methods for spotify
  Meteor.myFunctions = {
    getTunes: function() {
      return _getPlaylist();
    },
  }

  const _getPlaylistOffset = (limit, offset) => {
    return new Promise((resolve, reject) => {
      spotifyApi.getPlaylistTracks('mctw', QUIZKIOSKEN_PLAYLIST, { 'offset' : offset, 'limit' : limit, 'fields' : ['items', 'next'] }).then(function(data) {
        resolve(data.body);
      }, function(err) {
        console.log('Something went wrong!', err);
        reject(err);
      }).catch(e => {
        console.log(e);
      });
    });
  }

  const _getTune = (track) => {
    const tune = {
      id: track.track.id,
      name: track.track.name,
      artist: track.track.artists[0].name,
      url: track.track.preview_url
    };
    return tune;
  }

  const _getPlaylist = () => {
    return new Promise((resolve, reject) => {
      spotifyApi.getPlaylist('mctw', QUIZKIOSKEN_PLAYLIST)
      .then(function(data) {
        const total = data.body.tracks.total;
        const next = data.body.tracks.next;
        let tunes = data.body.tracks.items.map((track) => {
          const tune = _getTune(track);
          return tune;
        }).filter((t) => {
          if(t.url) {
            return true;
          } else {
            return false;
          }
        });

        if(next) {
          _getPlaylistOffset(100, offset).then(res => {
            let i = 0;
            res.items.forEach(track => {
              if(track.track.preview_url) {
                const tune = _getTune(track);
                tunes.push(tune);
              } else {
                i++;
              }
            });
            resolve(tunes);
          });
        } else {
          resolve(tunes);
        }
      }, function(err) {
        console.log('Something went wrong!', err);
      });
    });
  }
}
