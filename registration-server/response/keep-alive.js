const Response = require('../../common/response');

module.exports = (req, res, next, registeredPeers, peerHistory, timestamp, errorMsg) => {
  const cookie = req.body.cookie;
  if(!registeredPeers[cookie]) {
    return {
      status: 400,
      payload: Response.error(400, errorMsg)
    };
  }
  else {
    registeredPeers[cookie].isActive = true;
    registeredPeers[cookie].ttl = 7200;
    return {
      status: 200,
      payload: Response.success()
    };
  }
};
