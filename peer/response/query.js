const Promise = require('bluebird');
const Response = require('../../common/response');

module.exports = (req, res, next, index, files, verbose) => {
  if(verbose) {
    console.log('\nPeer, request for RFCQuery received:');
  }
  return Promise.resolve({
    status: 200,
    payload: Response.success({ index })
  });
};
