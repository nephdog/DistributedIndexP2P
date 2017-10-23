const Path = require('path');
const Peer = require('../../peer/peer');

let peer = new Peer(65402, { clearOutputDir: true, outputPath: Path.resolve( __dirname, './downloads/p2')});

peer.Initialize();
