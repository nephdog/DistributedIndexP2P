const Path = require('path');
const Peer = require('../../peer/peer');

let peer = new Peer(65403, { clearOutputDir: true, outputPath: Path.resolve( __dirname, './downloads/p3')});

peer.Initialize();
