const Promise = require('bluebird');
const Response = require('../../common/response');

module.exports = (req, res, next, index, files) => {
  return Promise.resolve({
    status: 200,
    payload: Response.success({ index })
  });
};
