const Path = require('path');
const Peer = require('../../../peer/peer');

let files = [];
for(let i=41; i <= 50; i++) {
  files.push({
    rfcNumber: i,
    title: `file${i}.txt`
  });
}

let peer = new Peer(65404, { inputPath: Path.resolve( __dirname, '../../../files'), files, clearOutputDir: true, outputPath: Path.resolve( __dirname, './downloads/p4')});

peer.Initialize();
