const query = require('./query');
const retrieve = require('./retrieve');
const Response = require('../../common/response');

const HandleRequest = (req, res, next, handler, checkJSON, index, files, errorMsg, verbose) => {
  const contentType = req.contentType();
  if(checkJSON && contentType !== 'application/json') {
    res.send(415, Response.error(415, `Invalid Content-Type: ${contentType}. Supported Content-Type is application/json.`));
    next();
  }
  else {
    let payload;
    let status;
    handler(req, res, next, index, files, verbose)
    .then((result) => {
      payload = result.payload;
      status = result.status;
    })
    .catch((error) => {
      status = 400;
      payload = Response.error(400, errorMsg);
    })
    .then(() => {
      res.send(status, payload);
      next();
    });
  }
};

module.exports = {
  RFCQuery: (req, res, next, index, files, verbose) => {
    HandleRequest(req, res, next, query, false, index, files, '', verbose);
  },

  GetRFC: (req, res, next, index, files, verbose) => {
    HandleRequest(req, res, next, retrieve, true, index, files, 'Invalid request body, expected valid RFC Number', verbose);
  }
}
