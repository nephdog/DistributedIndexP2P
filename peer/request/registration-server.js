const Routes = require('../../common/routes');
const Request = require('request-promise');
const SendRequest = require('./send-request');

const host = 'http://localhost:65423';

module.exports = {
  Register: (port) => {
    return SendRequest(Request.post, `${host}${Routes.Register}`, { port });
  },

  Leave: (cookie) => {
    return SendRequest(Request.post, `${host}${Routes.Leave}`, { cookie });
  },

  KeepAlive: (cookie) => {
    return SendRequest(Request.post, `${host}${Routes.KeepAlive}`, { cookie });
  },

  PQuery: (cookie) => {
    return SendRequest(Request.get, `${host}${Routes.PQuery}`, { cookie });
  }
}
