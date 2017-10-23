const Path = require('path');
const Peer = require('../../peer/peer');

let files = [];
for(let i=1; i <= 60; i++) {
  files.push({
    rfcNumber: i,
    title: `file${i}.txt`
  });
}

let peer = new Peer(65400, { inputPath: Path.resolve( __dirname, '../../files'), files});

peer.Initialize();
