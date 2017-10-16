const Restify = require('restify');
const Endpoints = require('./endpoints');
const Peers = require('./peers');

const port = 65423;
const server = Restify.createServer();
server.use(Restify.plugins.bodyParser({ mapParams: false }));
server.post(Endpoints.Register, Peers.Register);
server.post(Endpoints.Leave, Peers.Leave);
server.get(Endpoints.PQuery, Peers.PQuery);
server.post(Endpoints.KeepAlive, Peers.KeepAlive);
server.listen(port, () => {
  console.log(`Registration Server listening on port ${port}`);
});
