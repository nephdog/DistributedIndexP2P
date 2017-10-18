const Response = require('../common/response');
const register = require('./response/register');
const leave = require('./response/leave');
const keepAlive = require('./response/keep-alive');
const query = require('./response/query');

const ttl = 7200;
let registeredPeers = {};
let peerHistory = {};
let ttlTimestamp = new Date().getTime();

const DecrementTTL = (currentTime) => {
  const ellapsed = (currentTime - ttlTimestamp) * 0.001;
  Object.keys(registeredPeers).forEach((peer) => {
    if(registeredPeers[peer].isActive) {
      registeredPeers[peer].ttl = registeredPeers[peer].ttl - ellapsed;
      if(registeredPeers[peer].ttl <= 0) {
        registeredPeers[peer].isActive = false;
        registeredPeers[peer].ttl = 0;
      }
    }
  });
  ttlTimestamp = currentTime;
};

const HandleRequest = (req, res, next, handler, errorMsg) => {
  const timestamp = new Date().getTime();
  DecrementTTL(timestamp);
  const contentType = req.contentType();
  if(contentType !== 'application/json') {
    res.send(415, Response.error(415, `Invalid Content-Type: ${contentType}. Supported Content-Type is application/json.`));
    next();
  }
  else {
    let payload;
    let status;
    try {
      const result = handler(req, res, next, registeredPeers, peerHistory, timestamp, errorMsg);
      payload = result.payload;
      status = result.status;
    }
    catch(error) {
      status = 400;
      payload = Response.error(400, errorMsg);
    }
    finally {
      res.send(status, payload);
      next();
    }
  }
};

module.exports = {
  Register: (req, res, next) => {
    HandleRequest(req, res, next, register, ttl, 'Invalid request body, expected valid port within range: 65400 - 65500');
  },
  Leave: (req, res, next) => {
    HandleRequest(req, res, next, leave, ttl, 'Invalid request body, expected valid registered cookie');
  },
  PQuery: (req, res, next) => {
    HandleRequest(req, res, next, query, ttl, 'Invalid request body, expected valid registered cookie');
  },
  KeepAlive: (req, res, next) => {
    HandleRequest(req, res, next, keepAlive, ttl, 'Invalid request body, expected valid registered cookie');
  }
};
