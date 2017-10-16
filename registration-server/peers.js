const Response = require('./response');
const GenerateUUID = require('uuid/v4');

let registeredPeers = {};
let peerHistory = {};
let ttlTimestamp = new Date().getTime();
const thirtyDaysMS = 2592000000;

const decrementTTL = (currentTime) => {
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

const calculateTimesRegistered = (peerId, currentTime) => {
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

const getActivePeers = (peerId) => {
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

module.exports = {
  Register: (req, res, next) => {
    const timestamp = new Date().getTime();
    decrementTTL(timestamp);
    const contentType = req.contentType();
    if(contentType !== 'application/json') {
      res.send(415, Response.error(415, `Invalid Content-Type: ${contentType}. Supported Content-Type is application/json.`));
      next();
    }
    else {
      let payload;
      let status;
      try {
        const port = Number(req.body.port);
        if(isNaN(port) || port < 65400 || port > 65500) {
          status = 400;
          payload = Response.error(400, 'Invalid request body, expected valid port within range: 65400 - 65500');
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
            peer.ttl = 7200;
            peer.port = port;
            peer.timesRegistered = calculateTimesRegistered(cookie, timestamp) + 1;
            peer.lastRegistered = timestamp;
            peerHistory[cookie].push(timestamp);
          }
          else {
            cookie = GenerateUUID();
            peerHistory[cookie] = [timestamp];
            registeredPeers[cookie] = {
              isActive: true,
              hostname,
              ttl: 7200,
              port,
              timesRegistered: 1,
              lastRegistered: timestamp,
              cookie
            };
          }
          status = 200;
          payload = Response.success({cookie});
        }
      }
      catch(error) {
        status = 400;
        payload = Response.error(400, 'Invalid request body, expected valid port within range: 65400 - 65500');
      }
      finally {
        res.send(status, payload);
        next();
      }
    }
  },

  Leave: (req, res, next) => {
    const timestamp = new Date().getTime();
    decrementTTL(timestamp);
    const contentType = req.contentType();
    if(contentType !== 'application/json') {
      res.send(415, Response.error(415, `Invalid Content-Type: ${contentType}. Supported Content-Type is application/json.`));
      next();
    }
    let payload;
    let status;
    try {
      const cookie = req.body.cookie;
      if(!registeredPeers[cookie]) {
        status = 400;
        payload = Response.error(400, 'Invalid request body, expected valid registered cookie');
      }
      else {
        registeredPeers[cookie].isActive = false;
        registeredPeers[cookie].ttl = 0;
        status = 200;
        payload = Response.success();
      }
    }
    catch(error) {
      status = 400;
      payload = Response.error(400, 'Invalid request body, expected valid registered cookie');
    }
    finally {
      res.send(status, payload);
      next();
    }
  },

  PQuery: (req, res, next) => {
    const timestamp = new Date().getTime();
    decrementTTL(timestamp);
    const contentType = req.contentType();
    if(contentType !== 'application/json') {
      res.send(415, Response.error(415, `Invalid Content-Type: ${contentType}. Supported Content-Type is application/json.`));
      next();
    }
    let payload;
    let status;
    try {
      const cookie = JSON.parse(req.body).cookie;
      if(!registeredPeers[cookie]) {
        status = 400;
        payload = Response.error(400, 'Invalid request body, expected valid registered cookie');
      }
      else {
        const activePeers = getActivePeers(cookie);
        status = 200;
        payload = Response.success(activePeers);
      }
    }
    catch(error) {
      console.log(error);
      status = 400;
      payload = Response.error(400, 'Invalid request body, expected valid registered cookie');
    }
    finally {
      res.send(status, payload);
      next();
    }
  },

  KeepAlive: (req, res, next) => {
    const timestamp = new Date().getTime();
    decrementTTL(timestamp);
    const contentType = req.contentType();
    if(contentType !== 'application/json') {
      res.send(415, Response.error(415, `Invalid Content-Type: ${contentType}. Supported Content-Type is application/json.`));
      next();
    }
    let payload;
    let status;
    try {
      const cookie = req.body.cookie;
      if(!registeredPeers[cookie]) {
        status = 400;
        payload = Response.error(400, 'Invalid request body, expected valid registered cookie');
      }
      else {
        registeredPeers[cookie].isActive = true;
        registeredPeers[cookie].ttl = 7200;
        status = 200;
        payload = Response.success();
      }
    }
    catch(error) {
      status = 400;
      payload = Response.error(400, 'Invalid request body, expected valid registered cookie');
    }
    finally {
      res.send(status, payload);
      next();
    }
  }
};
