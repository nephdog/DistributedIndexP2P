const Request = require('request-promise');
const SendRequest = require('./send-request');
const Routes = require('../routes');

module.exports = {
  RFCQuery: (hostname) => {
    return SendRequest(Request.get, `${hostname}${Routes.RFCQuery}`);
  },

  GetRFC: (hostname, rfcNumber) => {
    return SendRequest(Request.get, `${hostname}${Routes.GetRFC}`, { rfcNumber });
  }
}
