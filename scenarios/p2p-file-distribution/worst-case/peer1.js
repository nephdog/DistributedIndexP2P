const Path = require('path');
const Peer = require('../../../peer/peer');

let files = [];
for(let i=11; i <= 20; i++) {
  files.push({
    rfcNumber: i,
    title: `file${i}.txt`
  });
}

let peer = new Peer(65401, { inputPath: Path.resolve( __dirname, '../../../files'), files, clearOutputDir: true, outputPath: Path.resolve( __dirname, './downloads/p1')});

peer.Initialize();
