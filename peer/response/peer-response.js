const query = require('./query');
const retrieve = require('./retrieve');
const Response = require('../../common/response');

const HandleRequest = (req, res, next, handler, checkJSON, index, files, errorMsg) => {
  const contentType = req.contentType();
  if(checkJSON && contentType !== 'application/json') {
    res.send(415, Response.error(415, `Invalid Content-Type: ${contentType}. Supported Content-Type is application/json.`));
    next();
  }
  else {
    let payload;
    let status;
    try {
      const result = handler(req, res, next, index, files, errorMsg);
      payload = result.payload;
      status = result.status;
    }
    catch(error) {
      console.log(error);
      status = 400;
      payload = Response.error(400, errorMsg);
    }
    finally {
      res.send(status, payload);
      next();
    }
  }
};

module.exports = {
  RFCQuery: (req, res, next, index, files) => {
    HandleRequest(req, res, next, query, false, index, files);
  },

  GetRFC: (req, res, next, index, files) => {
    HandleRequest(req, res, next, retrieve, true, index, files, 'Invalid request body, expected valid RFC Number');
  }
}
