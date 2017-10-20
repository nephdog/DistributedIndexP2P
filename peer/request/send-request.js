const timeout = 2500;
const json = true;

module.exports = (method, url, body) => {
  return method({ url, body, json, timeout })
  .then((response) => {
    return JSON.parse(response);
  });
}
