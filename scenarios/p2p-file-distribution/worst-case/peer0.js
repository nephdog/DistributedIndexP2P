const Path = require('path');
const Peer = require('../../../peer/peer');

let files = [];
for(let i=1; i <= 10; i++) {
  files.push({
    rfcNumber: i,
    title: `file${i}.txt`
  });
}

let peer = new Peer(65400, { inputPath: Path.resolve( __dirname, '../../../files'), files, clearOutputDir: true, outputPath: Path.resolve( __dirname, './downloads/p0')});

peer.Initialize();
