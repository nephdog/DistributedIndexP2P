const Request = require('request-promise');
const SendRequest = require('./send-request');
const Routes = require('../routes');

module.exports = {
  RFCQuery: (hostname, verbose) => {
    return SendRequest(Request.get, `${hostname}${Routes.RFCQuery}`)
    .then((response) => {
      if(verbose) {
        console.log('\nPeer, response to RFCQuery received:');
        console.log(JSON.stringify(response));
      }
      return response;
    })
  },

  GetRFC: (hostname, rfcNumber, verbose) => {
    return SendRequest(Request.get, `${hostname}${Routes.GetRFC}`, { rfcNumber })
    .then((response) => {
      if(verbose) {
        console.log('\nPeer, response to GetRFC received:');
        console.log(JSON.stringify(response));
      }
      return response;
    });
  }
}
