const Promise = require('bluebird');
const Path = require('path');
const Shell = require('shelljs');
const RegistrationServer = require('../../registration-server/registration-server');
const Peer = require('../../peer/peer');
const WriteFile = Promise.promisify(require('fs').writeFile);
const SaveResults = require('../save-results.js');


const worstCaseResultsPath = Path.resolve( __dirname, './results/worst-case');
const bestCaseResultsPath = Path.resolve( __dirname, './results/best-case');
const worstCaseDownloadPath = Path.resolve( __dirname, './downloads/worst-case');
const bestCaseDownloadPath = Path.resolve( __dirname, './downloads/best-case');
Shell.rm('-rf', Path.resolve( __dirname, './downloads'));
Shell.rm('-rf', Path.resolve( __dirname, './results'));
Shell.mkdir('-p', Path.join(worstCaseResultsPath, '/csv'));
Shell.mkdir('-p', Path.join(worstCaseResultsPath, '/html'));
Shell.mkdir('-p', Path.join(bestCaseResultsPath, '/csv'));
Shell.mkdir('-p', Path.join(bestCaseResultsPath, '/html'));
Shell.mkdir('-p', worstCaseDownloadPath);
Shell.mkdir('-p', bestCaseDownloadPath);

let files = [];
for(let i=1; i <= 60; i++) {
  files.push({
    rfcNumber: i,
    title: `file${i}.txt`
  });
}

const RequestFilesSync = (peer, indexList, startTime, finishTimes) => {
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
    return peer.GetRFC(rfc.hostname, rfc.rfcNumber)
    .then(() => {
      finishTimes.push(new Date().getTime() - startTime);
      return RequestFilesSync(peer, indexList, startTime, finishTimes);
    })
  }
};

const RequestFilesAsync = (peer, indexList, startTime, finishTimes) => {
  const hostnames = Object.keys(indexList);
  if(hostnames.length === 0) {
    return Promise.resolve(finishTimes);
  }
  else {
    const rfcs = []
    Object.keys(indexList).forEach((hostname) => {
      rfcs.push(indexList[hostname].pop())
      if(indexList[hostname].length === 0) {
        delete indexList[hostname];
      }
    });

    return Promise.all(rfcs.map((rfc) => {
      return peer.GetRFC(rfc.hostname, rfc.rfcNumber)
      .then(() => {
        finishTimes.push(new Date().getTime() - startTime);
      })
    }))
    .then(() => {
      return RequestFilesAsync(peer, indexList, startTime, finishTimes);
    });;
  }
};

const RunScenario = (outputPath, recursiveRequest, csvPath, htmlPath) => {
  const peers = [
    new Peer(65400, { inputPath: Path.resolve( __dirname, '../../files'), outputPath: Path.join(outputPath, '/p0'), files: files.slice(0,10)}),
    new Peer(65401, { inputPath: Path.resolve( __dirname, '../../files'), outputPath: Path.join(outputPath, '/p1'), files: files.slice(10,20)}),
    new Peer(65402, { inputPath: Path.resolve( __dirname, '../../files'), outputPath: Path.join(outputPath, '/p2'), files: files.slice(20,30)}),
    new Peer(65403, { inputPath: Path.resolve( __dirname, '../../files'), outputPath: Path.join(outputPath, '/p3'), files: files.slice(30,40)}),
    new Peer(65404, { inputPath: Path.resolve( __dirname, '../../files'), outputPath: Path.join(outputPath, '/p4'), files: files.slice(40,50)}),
    new Peer(65405, { inputPath: Path.resolve( __dirname, '../../files'), outputPath: Path.join(outputPath, '/p5'), files: files.slice(50)})
  ];

  return RegistrationServer.Start()
  .then(() => {
    return Promise.all(peers.map((peer) => {
      return peer.Initialize()
    }));
  })
  .then(() => {
    return Promise.all(peers.map((peer) => {
      return peer.PQuery();
    }));
  })
  .then(() => {
    return Promise.all(peers.map((peer) => {
      return peer.RFCQueryAllPeers();
    }));
  })
  .then(() => {
    return Promise.all(peers.map((peer) => {
      const indexByPeer = {};
      Object.keys(peer.index).forEach((rfcNumber) => {
        const hostname = peer.index[rfcNumber][0].hostname;
        if(hostname !== peer.hostname){
          if(!indexByPeer[hostname]) {
            indexByPeer[hostname] = [];
          }
          indexByPeer[hostname].push(peer.index[rfcNumber][0]);
        }
      });
      return recursiveRequest(peer, indexByPeer, new Date().getTime(), []);
    }));
  })
  .then((times) => {
    return SaveResults(times, csvPath, htmlPath, 0);
  })
  .then(() => {
    return Promise.all([RegistrationServer.Stop()].concat(peers.map((peer) => {
      return peer.StopServer();
    })));
  })
};


RunScenario(worstCaseDownloadPath, RequestFilesSync, Path.join(worstCaseResultsPath, '/csv'), Path.join(worstCaseResultsPath, '/html'))
.then(() => {
  return RunScenario(bestCaseDownloadPath, RequestFilesAsync, Path.join(bestCaseResultsPath, '/csv'), Path.join(bestCaseResultsPath, '/html'))
})
.then(() => {
  process.exit();
})
