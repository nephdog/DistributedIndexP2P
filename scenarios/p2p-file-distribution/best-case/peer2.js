const Path = require('path');
const Peer = require('../../../peer/peer');

let files = [];
for(let i=21; i <= 30; i++) {
  files.push({
    rfcNumber: i,
    title: `file${i}.txt`
  });
}

let peer = new Peer(65402, { inputPath: Path.resolve( __dirname, '../../../files'), files, clearOutputDir: true, outputPath: Path.resolve( __dirname, './downloads/p2')});

peer.Initialize();
