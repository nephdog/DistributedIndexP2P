const Request = require('request-promise');

const hostname = 'http://localhost:65423';
const timeout = 2500;
const json = true;


const RegisterPeer = () => {
  const url = `${hostname}/peer/register`;
  const body = { port: 65400 };
  return Request.post({ url, json, timeout, body });
}

const LeavePeer = (cookie) => {
  const url = `${hostname}/peer/leave`;
  const body = { cookie };
  return Request.post({ url, json, timeout, body });
}

const KeepAlivePeer = (cookie) => {
  const url = `${hostname}/peer/keep-alive`;
  const body = { cookie };
  return Request.post({ url, json, timeout, body });
}

const QueryPeers = (cookie) => {
  const url = `${hostname}/peer/query`;
  const body = { cookie };
  return Request.get({ url, json, timeout, body });
}

RegisterPeer()
/*
.then((response) => {
  const cookie = JSON.parse(response).data.cookie;
  return LeavePeer(cookie);
})*/

/*
.then((response) => {
  const cookie = JSON.parse(response).data.cookie;
  return KeepAlivePeer(cookie);
})
*/

.then((response) => {
  const cookie = JSON.parse(response).data.cookie;
  return QueryPeers(cookie);
})
.then((response) => {
  console.log(response);
});
