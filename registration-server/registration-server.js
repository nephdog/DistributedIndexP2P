const Promise = require('bluebird');
const Restify = require('restify');

const Routes = require('../common/routes');
const PeerRequests = require('./peer-requests');

const address = '127.0.0.1';
const port = 65423;
let server;

module.exports = {
  Start: (verbose) => {
    server = Restify.createServer();
    server.use(Restify.plugins.bodyParser({ mapParams: false }));
    server.post(Routes.Register, (req, res, next) => { PeerRequests.Register(req, res, next, verbose) });
    server.post(Routes.Leave, (req, res, next) => { PeerRequests.Leave(req, res, next, verbose) });
    server.get(Routes.PQuery, (req, res, next) => { PeerRequests.PQuery(req, res, next, verbose) });
    server.post(Routes.KeepAlive, (req, res, next) => { PeerRequests.KeepAlive(req, res, next, verbose) });
    return new Promise((resolve, reject) => {
      server.listen(port, address, ()=> {
        if(verbose) {
          console.log(`Registration server listening on port ${port}`);
        }
        resolve();
      });
    });
  },

  Stop: (verbose) => {
    return new Promise((resolve, reject) => {
      server.close(()=> {
        if(verbose) {
          console.log(`Registration server closed on port ${port}`);
        }
        resolve();
      });
    });
  }
};
