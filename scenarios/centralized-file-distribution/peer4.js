const Path = require('path');
const Peer = require('../../peer/peer');

let peer = new Peer(65404, { clearOutputDir: true, outputPath: Path.resolve( __dirname, './downloads/p4')});

peer.Initialize();
