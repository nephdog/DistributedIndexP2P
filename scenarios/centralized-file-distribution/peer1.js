const Path = require('path');
const Peer = require('../../peer/peer');

let peer = new Peer(65401, { clearOutputDir: true, outputPath: Path.resolve( __dirname, './downloads/p1')});

peer.Initialize();
