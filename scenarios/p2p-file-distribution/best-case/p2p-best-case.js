const Promise = require('bluebird');
const Path = require('path');
const Shell = require('shelljs');
const Request = require('request-promise');
const SaveResults = require('../../save-results.js');
const Routes = require('../../../common/routes');

const resultsPathCSV = Path.resolve( __dirname, './results/csv');
const resultsPathHTML = Path.resolve( __dirname, './results/html');
Shell.rm('-rf', Path.resolve( __dirname, './results'));
Shell.mkdir('-p', resultsPathCSV);
Shell.mkdir('-p', resultsPathHTML);

const timeout = 2500;
const json = true;

const StartScenario = (port) => {
  const url = `http://127.0.0.1:${port}${Routes.ScenarioP2PBest}`;
  return Request.get({url, json, timeout})
  .then((response) => {
    return JSON.parse(response);
  })
}

Promise.all([
  StartScenario(65400), //Peer0
  StartScenario(65401), //Peer1
  StartScenario(65402), //Peer2
  StartScenario(65403), //Peer3
  StartScenario(65404), //Peer4
  StartScenario(65405)  //Peer5
])
.then((times) => {
  return SaveResults(times, resultsPathCSV, resultsPathHTML, 0);
})
.then(() => {
  process.exit();
});
