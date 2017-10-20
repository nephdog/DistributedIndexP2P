const Response = require('../../common/response');

module.exports = (req, res, next, index, files) => {
  return {
    status: 200,
    payload: Response.success({ index })
  };
};
