const Promise = require('bluebird');
const Path = require('path');
const Shell = require('shelljs');
const RegistrationServer = require('../../registration-server/registration-server');
const Peer = require('../../peer/peer');

Shell.rm('-rf', Path.resolve( __dirname, './downloads'));

let files = [];
for(let i=1; i <= 2; i++) {
  files.push({
    rfcNumber: i,
    title: `file${i}.txt`
  });
}

let peers = [
  new Peer(65400, { outputPath: Path.resolve( __dirname, './downloads/peerA')}, true),   //Peer A
  new Peer(65401, { inputPath: Path.resolve( __dirname, '../../files'), files}, true)    //Peer B
];

RegistrationServer.Start(true)
.then(() => {
  return Promise.all(peers.map((peer) => {
    return peer.Initialize();
  }));
})
.then(() => {
  return peers[0].PQuery();
})
.then(() => {
  return peers[0].RFCQuery(peers[1].hostname);
})
.then(() => {
  return peers[0].GetRFC(peers[1].hostname, 1)
})
.then(() => {
  return peers[1].Leave();
})
.then(() => {
  return peers[0].PQuery();
})
.then(() => {
  process.exit();
})
