const Path = require('path');
const Peer = require('../../../peer/peer');

let files = [];
for(let i=31; i <= 40; i++) {
  files.push({
    rfcNumber: i,
    title: `file${i}.txt`
  });
}

let peer = new Peer(65403, { inputPath: Path.resolve( __dirname, '../../../files'), files, clearOutputDir: true, outputPath: Path.resolve( __dirname, './downloads/p3')});

peer.Initialize();
