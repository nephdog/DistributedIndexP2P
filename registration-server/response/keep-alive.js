const Response = require('../../common/response');

module.exports = (req, res, next, registeredPeers, peerHistory, timestamp, ttl, errorMsg, verbose) => {
  if(verbose) {
    console.log('\nRegistration Server, request to keep alive received:');
    console.log(JSON.stringify(req.body))
  }
  const cookie = req.body.cookie;
  if(!registeredPeers[cookie]) {
    return {
      status: 400,
      payload: Response.error(400, errorMsg)
    };
  }
  else {
    registeredPeers[cookie].isActive = true;
    registeredPeers[cookie].ttl = ttl;
    return {
      status: 200,
      payload: Response.success()
    };
  }
};
