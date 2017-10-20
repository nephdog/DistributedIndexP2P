const Promise = require('bluebird');
const Restify = require('restify');

const RegistrationServer = require('./request/registration-server');
const PeerRequest = require('./request/peer-request');
const Routes = require('./routes');
const PeerResponse = require('./response/peer-response');

const ttl = 7200;
const address = '127.0.0.1';

module.exports = class {
  constructor(port, fileInfo) {
    this.outputPath = fileInfo.outputPath;
    this.inputPath = fileInfo.inputPath;
    this.hostname = `http://${address}:${port}`;
    this.index = {}
    this.files = {};
    if(fileInfo.inputPath && fileInfo.files) {
      fileInfo.files.forEach((file) => {
        this.index[file.rfcNumber] = {
          rfcNumber: file.rfcNumber,
          title: file.title,
          ttl,
          hostnames: [this.hostname]
        }
        this.files[file.rfcNumber] = {
          path: fileInfo.inputPath,
          name: file.title
        }
      });
    }
    this.port = port;
    this.cookie = null;
    this.peers = null;
    this.server = null;

    this.lastSync = new Date().getTime();
    this.OnRFCQuery = this.OnRFCQuery.bind(this);
    this.OnGetRFC = this.OnGetRFC.bind(this);
  }

  DecrementTTL() {
    const timestamp =  new Date().getTime();
    const ellapsed = (this.lastSync - timestamp) * 0.001;
    Object.keys(this.index).forEach((rfcNumber) => {
      if(!this.files[rfcNumber]) {
        this.index[rfcNumber].ttl = this.index[rfcNumber].ttl - ellapsed;
      }
    });
    this.lastSync = timestamp;
  }

  Initialize() {
    return Promise.all([
      this.StartServer(),
      this.Register()
    ]);
  }

  StartServer() {
    this.server = Restify.createServer();
    this.server.use(Restify.plugins.bodyParser({ mapParams: false }));
    this.server.get(Routes.RFCQuery, this.OnRFCQuery);
    this.server.get(Routes.GetRFC, this.OnGetRFC);
    return new Promise((resolve, reject) => {
      this.server.listen(this.port, address, ()=> {
          console.log(`Peer listening on port ${this.port}`);
          resolve();
      });
    });
  }

  OnRFCQuery(req, res, next) {
    this.DecrementTTL();
    return PeerResponse.RFCQuery(req, res, next, this.index, this.files);
  }

  OnGetRFC(req, res, next) {
    this.DecrementTTL();
    return  PeerResponse.RFCQuery(req, res, next, this.index, this.files);
  }

  Register() {
    return RegistrationServer.Register(this.port)
    .then((response) => {
      this.cookie = response.data.cookie;
    })
  }

  KeepAlive() {
    return RegistrationServer.KeepAlive(this.cookie)
  }

  Leave() {
    return RegistrationServer.Leave(this.cookie)
  }

  PQuery() {
    return RegistrationServer.PQuery(this.cookie)
    .then((response) => {
      this.peers = response.data.peers;
    });
  }

  RFCQuery(hostname) {
    return PeerRequest.RFCQuery(hostname)
    .then((response) => {
      Object.keys(response.data.index).forEach((rfcNumber) => {
        if(!this.index[rfcNumber]) {
          this.index[rfcNumber] = response.data.index[rfcNumber];
        }
        else {
          response.data.index[rfcNumber].hostnames.forEach((hostname) => {
            if(this.index[rfcNumber].hostnames.indexOf(hostname) == -1) {
              this.index[rfcNumber].hostnames.push(hostname);
            }
          })
        }
      });
    });
  }

  GetRFC(hostname, file) {

  }
}
