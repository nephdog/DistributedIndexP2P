const Promise = require('bluebird');
const Restify = require('restify');
const Path = require('path');
const WriteFile = Promise.promisify(require('fs').writeFile);
const MakeDir = require('shelljs').mkdir;
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
        this.index[file.rfcNumber] = [{
          rfcNumber: file.rfcNumber,
          title: file.title,
          ttl,
          hostname: this.hostname
        }];

        this.files[file.rfcNumber] = {
          path: fileInfo.inputPath,
          name: file.title
        };
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
    const ellapsed = (timestamp - this.lastSync) * 0.001;
    const removeRFCs = [];
    Object.keys(this.index).forEach((rfcNumber) => {
      if(!this.files[rfcNumber]) {
        const validRecords = [];
        this.index[rfcNumber].forEach((rfcRecord) => {
          rfcRecord.ttl = rfcRecord.ttl - ellapsed;
          if(rfcRecord.ttl > 0) {
            validRecords.push(rfcRecord);
          }
        });
        if(validRecords.length > 0) {
          this.index[rfcNumber] = validRecords;
        }
        else {
          removeRFCs.push(rfcNumber);
        }
      }
    });
    removeRFCs.forEach((rfcNumber)=> {
      delete this.index[rfcNumber];
    });
    this.lastSync = timestamp;
  }

  Initialize() {
    if(this.outputPath) {
      MakeDir('-p', this.outputPath);
    }
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
    return  PeerResponse.GetRFC(req, res, next, this.index, this.files);
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
          this.index[rfcNumber] =response.data.index[rfcNumber];
        }
        else {
          let records = [];
          for(let i=0; i < response.data.index[rfcNumber].length; i++) {
            const responseRecord = response.data.index[rfcNumber][i];
            let foundMatch = false;
            for(let j=0; j < this.index[rfcNumber].length; j++) {
              let indexRecord = this.index[rfcNumber][j];
              if(indexRecord.hostname === responseRecord.hostname) {
                indexRecord.ttl = indexRecord.ttl > responseRecord.ttl ? indexRecord.ttl : responseRecord.ttl;
                foundMatch = true;
                break;
              }
            }
            if(!foundMatch) {
              records.push(responseRecord);
            }
          }
          this.index[rfcNumber] = this.index[rfcNumber].concat(records);
        }
      });
    });
  }

  GetRFC(hostname, rfcNumber) {
    return PeerRequest.GetRFC(hostname, rfcNumber)
    .then((response) => {
      const fileData = response.data.filename;
      return WriteFile(Path.join(this.outputPath, response.data.filename), response.data.content)
      .then(() => {
        this.files[rfcNumber] = {
          path: this.outputPath,
          name: response.data.filename
        };
        this.index[rfcNumber].push({
          rfcNumber,
          title: response.data.filename,
          ttl,
          hostname: this.hostname
        });
      })
    });
  }
}
