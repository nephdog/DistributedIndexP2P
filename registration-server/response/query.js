const Response = require('../../common/response');

const GetActivePeers = (peerId, registeredPeers) => {
  let activePeers = [];
  Object.keys(registeredPeers).forEach((registeredPeer) => {
      const peer = registeredPeers[registeredPeer];
      if(peer.cookie !== peerId && peer.isActive) {
        activePeers.push({
          hostname: peer.hostname,
          port: peer.port
        });
      }
  });
  return activePeers;
};

module.exports = (req, res, next, registeredPeers, peerHistory, timestamp, ttl, errorMsg, verbose) => {
  if(verbose) {
    console.log('\nRegistration Server, request for peer query received:');
    console.log(req.body);
  }
  const cookie = JSON.parse(req.body).cookie;
  if(!registeredPeers[cookie]) {
    return {
      status: 400,
      payload: Response.error(400, errorMsg)
    };
  }
  else {
    const peers = GetActivePeers(cookie, registeredPeers);
    registeredPeers[cookie].isActive = true;
    registeredPeers[cookie].ttl = ttl;
    return {
      status: 200,
      payload: Response.success({ peers })
    };
  }
};
