const Promise = require('bluebird');
const Path = require('path');
const ReadFile = Promise.promisify(require('fs').readFile);

const Response = require('../../common/response');

module.exports = (req, res, next, index, files, verbose) => {
  if(verbose) {
    console.log('\nPeer, request for GetRFC received:');
    console.log(JSON.stringify(req.body));
  }
  const rfcNumber = JSON.parse(req.body).rfcNumber;
  if(!files[rfcNumber]) {
    return Promise.reject(new Error());
  }
  else {
    const file = files[rfcNumber];
    return ReadFile(Path.join(file.path, file.name), 'utf8')
    .then((content) => {
      return {
        status: 200,
        payload: Response.success({ filename: file.name, content })
      }
    })
  }
};
