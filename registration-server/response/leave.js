const Response = require('../../common/response');

module.exports = (req, res, next, registeredPeers, peerHistory, timestamp, ttl, errorMsg) => {
  const cookie = req.body.cookie;
  if(!registeredPeers[cookie]) {
    return {
      status: 400,
      payload: Response.error(400, errorMsg)
    };
  }
  else {
    registeredPeers[cookie].isActive = false;
    registeredPeers[cookie].ttl = 0;
    return {
      status: 200,
      payload: Response.success()
    };
  }
};
