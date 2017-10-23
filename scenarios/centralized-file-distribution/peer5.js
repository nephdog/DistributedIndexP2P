const Path = require('path');
const Peer = require('../../peer/peer');

let peer = new Peer(65405, { clearOutputDir: true, outputPath: Path.resolve( __dirname, './downloads/p5')});

peer.Initialize();
