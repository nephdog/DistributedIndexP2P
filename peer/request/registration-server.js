const Routes = require('../../common/routes');
const Request = require('request-promise');
const SendRequest = require('./send-request');

const host = 'http://localhost:65423';

module.exports = {
  Register: (port, verbose) => {
    return SendRequest(Request.post, `${host}${Routes.Register}`, { port })
    .then((response) => {
      if(verbose) {
        console.log('\nPeer, response to register received:');
        console.log(JSON.stringify(response));
      }
      return response;
    });
  },

  Leave: (cookie, verbose) => {
    return SendRequest(Request.post, `${host}${Routes.Leave}`, { cookie })
    .then((response) => {
      if(verbose) {
        console.log('\nPeer, response to leave received:');
        console.log(JSON.stringify(response));
      }
      return response;
    });
  },

  KeepAlive: (cookie, verbose) => {
    return SendRequest(Request.post, `${host}${Routes.KeepAlive}`, { cookie })
    .then((response) => {
      if(verbose) {
        console.log('\nPeer, response to keep alive received :');
        console.log(JSON.stringify(response));
      }
      return response;
    });
  },

  PQuery: (cookie, verbose) => {
    return SendRequest(Request.get, `${host}${Routes.PQuery}`, { cookie })
    .then((response) => {
      if(verbose) {
        console.log('\nPeer, response to peer query received:');
        console.log(JSON.stringify(response));
      }
      return response;
    });
  }
}
