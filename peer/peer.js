const Promise = require('bluebird');
const Restify = require('restify');
const Path = require('path');
const Shell = require('shelljs');
const WriteFile = Promise.promisify(require('fs').writeFile);
const RegistrationServer = require('./request/registration-server');
const PeerRequest = require('./request/peer-request');
const Routes = require('./routes');
const PeerResponse = require('./response/peer-response');
const CommonRoutes = require('../common/routes');

const ttl = 7200;
const address = '127.0.0.1';

module.exports = class {
  constructor(port, fileInfo, verbose) {
    this.verbose = verbose;
    this.hostname = `http://${address}:${port}`;
    this.index = {}
    this.files = {};
    if(fileInfo) {
      this.outputPath = fileInfo.outputPath;
      this.inputPath = fileInfo.inputPath;
      this.clearOutputDir = fileInfo.clearOutputDir;
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
    }

    this.port = port;
    this.cookie = null;
    this.peers = null;
    this.server = null;

    this.lastSync = new Date().getTime();
    this.OnRFCQuery = this.OnRFCQuery.bind(this);
    this.OnGetRFC = this.OnGetRFC.bind(this);
    this.OnScenarioCentalized = this.OnScenarioCentalized.bind(this);
    this.OnScenarioP2PWorst = this.OnScenarioP2PWorst.bind(this);
    this.OnScenarioP2PBest = this.OnScenarioP2PBest.bind(this);
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
    if(this.clearOutputDir) {
      Shell.rm('-rf', this.outputPath);
    }
    if(this.outputPath) {
      Shell.mkdir('-p', this.outputPath);
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
    this.server.get(CommonRoutes.ScenarioCentralized, this.OnScenarioCentalized);
    this.server.get(CommonRoutes.ScenarioP2PWorst, this.OnScenarioP2PWorst);
    this.server.get(CommonRoutes.ScenarioP2PBest, this.OnScenarioP2PBest);
    return new Promise((resolve, reject) => {
      this.server.listen(this.port, address, ()=> {
        if(this.verbose) {
          console.log(`Peer listening on port ${this.port}`);
        }
        resolve();
      });
    });
  }

  StopServer() {
    return new Promise((resolve, reject) => {
      this.server.close(() => {
        if(this.verbose) {
          console.log(`Peer closed on port ${this.port}`);
        }
        resolve();
      });
    });
  }

  OnRFCQuery(req, res, next) {
    this.DecrementTTL();
    return PeerResponse.RFCQuery(req, res, next, this.index, this.files, this.verbose);
  }

  OnGetRFC(req, res, next) {
    this.DecrementTTL();
    return PeerResponse.GetRFC(req, res, next, this.index, this.files, this.verbose);
  }

  Register() {
    return RegistrationServer.Register(this.port, this.verbose)
    .then((response) => {
      this.cookie = response.data.cookie;
    })
  }

  KeepAlive() {
    return RegistrationServer.KeepAlive(this.cookie, this.verbose)
  }

  Leave() {
    return RegistrationServer.Leave(this.cookie, this.verbose)
  }

  PQuery() {
    return RegistrationServer.PQuery(this.cookie, this.verbose)
    .then((response) => {
      this.peers = response.data.peers;
    });
  }

  RFCQuery(hostname) {
    return PeerRequest.RFCQuery(hostname, this.verbose)
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
    return PeerRequest.GetRFC(hostname, rfcNumber, this.verbose)
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

  RFCQueryAllPeers() {
    return Promise.all(this.peers.map((peer) => {
      return this.RFCQuery(`http://${peer.hostname}:${peer.port}`);
    }));
  }

  RequestFilesSync(indexList, startTime, finishTimes) {
    const hostnames = Object.keys(indexList);
    if(hostnames.length === 0) {
      return Promise.resolve(finishTimes);
    }
    else {
      const hostname = hostnames[0];
      const rfc = indexList[hostname].pop();
      if(indexList[hostname].length === 0) {
        delete indexList[hostname];
      }
      return this.GetRFC(rfc.hostname, rfc.rfcNumber)
      .then(() => {
        finishTimes.push(new Date().getTime() - startTime);
        return this.RequestFilesSync(indexList, startTime, finishTimes);
      })
    }
  }

  IndexByPeer() {
    const indexByPeer = {};
    Object.keys(this.index).forEach((rfcNumber) => {
      const hostname = this.index[rfcNumber][0].hostname;
      if(hostname !== this.hostname){
        if(!indexByPeer[hostname]) {
          indexByPeer[hostname] = [];
        }
        indexByPeer[hostname].push(this.index[rfcNumber][0]);
      }
    });
    return indexByPeer;
  }

  OnScenarioCentalized(req, res, next) {
    return this.PQuery()
    .then(() => {
      return this.RFCQueryAllPeers();
    })
    .then(() => {
      let indexList = this.IndexByPeer();
      Object.keys(indexList).forEach((hostname) => {
        indexList[hostname] = indexList[hostname].slice(0,50);
      });
      return this.RequestFilesSync(indexList, new Date().getTime(), []);
    })
    .then((times) => {
      res.send(200, JSON.stringify(times));
    });
  }

  OnScenarioP2PWorst(req, res, next) {
    return this.PQuery()
    .then(() => {
      return this.RFCQueryAllPeers();
    })
    .then(() => {
      return this.RequestFilesSync(this.IndexByPeer(), new Date().getTime(), []);
    })
    .then((times) => {
      res.send(200, JSON.stringify(times));
    });
  }

  OnScenarioP2PBest(req, res, next) {
    return this.PQuery()
    .then(() => {
      return this.RFCQueryAllPeers();
    })
    .then(() => {
      const indexList = this.IndexByPeer();
      return Promise.all(Object.keys(indexList).map((hostname) => {
        const index = {};
        index[hostname] = indexList[hostname];
        return this.RequestFilesSync(index, new Date().getTime(), []);
      }))
      .then((times) => {
        let allTimes = [];
        times.forEach((time) => {
          allTimes = allTimes.concat(time);
        })
        allTimes.sort((a,b) => {
          return a-b;
        })
        return allTimes;
      })
    })
    .then((times) => {
      res.send(200, JSON.stringify(times));
    });
  }
}
