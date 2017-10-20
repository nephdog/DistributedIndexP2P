
const Promise = require('bluebird');
const Path = require('path');

const RegistrationServer = require('../../registration-server/registration-server');
const Peer = require('../../peer/peer');

let files = [];
for(let i=1; i <= 60; i++) {
  files.push({
    rfcNumber: i,
    title: `file${i}.txt`
  });
}

const peers = [
  new Peer(65400, { inputPath: Path.resolve('../../files'), files}),
  new Peer(65401, { outputPath: Path.resolve('./downloads/p1')}),
  new Peer(65402, { outputPath: Path.resolve('./downloads/p2')}),
  new Peer(65403, { outputPath: Path.resolve('./downloads/p3')}),
  new Peer(65404, { outputPath: Path.resolve('./downloads/p4')}),
  new Peer(65405, { outputPath: Path.resolve('./downloads/p5')})
];

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
  const peerSubset = peers.slice(1);
  return Promise.all(peerSubset.map((peer) => {
    return peer.RFCQuery(peers[0].hostname);
  }));
})
.then(() => {
  peers.forEach((peer) => {
    console.log(peer.index);
  })
})
/*
const Promise = require('bluebird');
const RegistrationServer = require('./request/registration-server');
const Peer = require('./peer');

const peers = [
  new Peer(65400, { inputPath: '../files/peer-a/input', outputPath: '../files/peer-a/output', files: ['file-a.txt']}),
  new Peer(65401, { inputPath: '../files/peer-b/input', outputPath: '../files/peer-b/output', files: ['file-b.txt']}),
  new Peer(65402, { inputPath: '../files/peer-c/input', outputPath: '../files/peer-c/output', files: ['file-c.txt']}),
  new Peer(65403, { inputPath: '../files/peer-d/input', outputPath: '../files/peer-d/output', files: ['file-d.txt']}),
  new Peer(65404, { inputPath: '../files/peer-e/input', outputPath: '../files/peer-e/output', files: ['file-e.txt']}),
  new Peer(65405, { inputPath: '../files/peer-f/input', outputPath: '../files/peer-f/output', files: ['file-f.txt']}),
];

Promise.all([Peer1.InitializeServer(),Peer2.InitializeServer()])
.then(() => {
  return Promise.all([Peer1.Register(), Peer2.Register()])
})
.then(() => {
  return Peer1.PQuery();
})
.then(() => {
  Peer1.peers.forEach((peer) => {
    Peer1.RFCQuery(peer.hostname, peer.port);
  })
})
/*
Promise.all([Peer1.Register(), Peer2.Register()])
.then(() => {
  return Peer1.PQuery();
})
.then(() => {
  console.log(Peer1);
})*/
