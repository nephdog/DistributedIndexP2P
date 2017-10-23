const Path = require('path');
const Peer = require('../../../peer/peer');

let files = [];
for(let i=51; i <= 60; i++) {
  files.push({
    rfcNumber: i,
    title: `file${i}.txt`
  });
}

let peer = new Peer(65405, { inputPath: Path.resolve( __dirname, '../../../files'), files, clearOutputDir: true, outputPath: Path.resolve( __dirname, './downloads/p5')});

peer.Initialize();
