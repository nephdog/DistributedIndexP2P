const Promise = require('bluebird');
const Restify = require('restify');

const Routes = require('../common/routes');
const PeerRequests = require('./peer-requests');

const address = '127.0.0.1';
const port = 65423;

module.exports = {
  Start: () => {
    const server = Restify.createServer();
    server.use(Restify.plugins.bodyParser({ mapParams: false }));
    server.post(Routes.Register, PeerRequests.Register);
    server.post(Routes.Leave, PeerRequests.Leave);
    server.get(Routes.PQuery, PeerRequests.PQuery);
    server.post(Routes.KeepAlive, PeerRequests.KeepAlive);
    return new Promise((resolve, reject) => {
      server.listen(port, address, ()=> {
          console.log(`Registration server listening on port ${port}`);
          resolve();
      });
    });
  }
};
