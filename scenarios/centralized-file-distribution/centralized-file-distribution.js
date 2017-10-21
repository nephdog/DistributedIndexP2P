const Promise = require('bluebird');
const Path = require('path');
const Shell = require('shelljs');
const RegistrationServer = require('../../registration-server/registration-server');
const Peer = require('../../peer/peer');
const SaveResults = require('../save-results.js');

const resultsPathCSV = Path.resolve( __dirname, './results/csv');
const resultsPathHTML = Path.resolve( __dirname, './results/html');
Shell.rm('-rf', Path.resolve( __dirname, './downloads'));
Shell.rm('-rf', Path.resolve( __dirname, './results'));
Shell.mkdir('-p', resultsPathCSV);
Shell.mkdir('-p', resultsPathHTML);

let files = [];
for(let i=1; i <= 60; i++) {
  files.push({
    rfcNumber: i,
    title: `file${i}.txt`
  });
}

const peers = [
  new Peer(65400, { inputPath: Path.resolve( __dirname, '../../files'), files}),
  new Peer(65401, { outputPath: Path.resolve( __dirname, './downloads/p1')}),
  new Peer(65402, { outputPath: Path.resolve( __dirname, './downloads/p2')}),
  new Peer(65403, { outputPath: Path.resolve( __dirname, './downloads/p3')}),
  new Peer(65404, { outputPath: Path.resolve( __dirname, './downloads/p4')}),
  new Peer(65405, { outputPath: Path.resolve( __dirname, './downloads/p5')})
];

const peerSubset = peers.slice(1);

const RequestFilesRecursively = (rfcNumber, peer, startTime, finishTimes) => {
  if(rfcNumber > 50) {
    return Promise.resolve(finishTimes);
  }
  else {
    return peer.GetRFC(peers[0].hostname, rfcNumber)
    .then(() => {
      if(finishTimes) {
        finishTimes.push(new Date().getTime() - startTime);
      }
      else {
        finishTimes = [new Date().getTime() - startTime];
      }
      return RequestFilesRecursively(rfcNumber + 1, peer, startTime, finishTimes);
    })
  }
}

RegistrationServer.Start()
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
  return Promise.all(peerSubset.map((peer) => {
    return peer.RFCQuery(peers[0].hostname);
  }));
})
.then(() => {
  return Promise.all(peerSubset.map((peer) => {
    return RequestFilesRecursively(1, peer, new Date().getTime(), []);
  }))
})
.then((times) => {
  return SaveResults(times, resultsPathCSV, resultsPathHTML, 1);
})
.then(() => {
  process.exit();
});
