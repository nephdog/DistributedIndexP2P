const Response = require('../../common/response');
const GenerateUUID = require('uuid/v4');

const thirtyDaysMS = 2592000000;

const CalculateTimesRegistered = (peerId, currentTime, peerHistory) => {
  const history = peerHistory[peerId];
  if(history) {
    let timesRegistered = 0;
    history.forEach((timeRegistered) => {
      if(currentTime - timeRegistered < thirtyDaysMS) {
        timesRegistered++;
      }
    });
    return timesRegistered;
  }
  else {
    return 0;
  }
};

module.exports = (req, res, next, registeredPeers, peerHistory, timestamp, ttl, errorMsg) => {
  const port = Number(req.body.port);
  if(isNaN(port) || port < 65400 || port > 65500) {
    return {
      status: 400,
      payload: Response.error(400, errorMsg)
    };
  }
  else {
    const hostname = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;
    let peer = null;
    for(const registeredPeer in registeredPeers) {
      if(registeredPeers[registeredPeer].hostname === hostname && registeredPeers[registeredPeer].port === port) {
        peer = registeredPeers[registeredPeer];
        break;
      }
    }

    let cookie;
    if(peer) {
      cookie = peer.cookie;
      peer.isActive = true;
      peer.ttl = ttl;
      peer.port = port;
      peer.timesRegistered = CalculateTimesRegistered(cookie, timestamp, peerHistory) + 1;
      peer.lastRegistered = timestamp;
      peerHistory[cookie].push(timestamp);
    }
    else {
      cookie = GenerateUUID();
      peerHistory[cookie] = [timestamp];
      registeredPeers[cookie] = {
        isActive: true,
        hostname,
        ttl,
        port,
        timesRegistered: 1,
        lastRegistered: timestamp,
        cookie
      };
    }

    return {
      status: 200,
      payload: Response.success({cookie})
    };
  }
};
