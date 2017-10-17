const Restify = require('restify');
const Routes = require('../common/routes');
const PeerRequests = require('./peer-requests');

const port = 65423;
const server = Restify.createServer();
server.use(Restify.plugins.bodyParser({ mapParams: false }));
server.post(Routes.Register, PeerRequests.Register);
server.post(Routes.Leave, PeerRequests.Leave);
server.get(Routes.PQuery, PeerRequests.PQuery);
server.post(Routes.KeepAlive, PeerRequests.KeepAlive);
server.listen(port, () => {
  console.log(`Registration Server listening on port ${port}`);
});
