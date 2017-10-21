const Promise = require('bluebird');
const Path = require('path');
const Shell = require('shelljs');
const WriteFile = Promise.promisify(require('fs').writeFile);


const SaveIndividualResults = (times, peerNumber, csvPath, htmlPath) => {
  const file = Path.join(csvPath, `results-peer${peerNumber}.csv`);
  const csv = [['Number of RFCs', 'Cumulative Download Time(milliseconds)']].concat(times.map((time, rfcNumber) => {
    return [rfcNumber + 1, time];
  })).join('\n');
  return WriteFile(file, csv)
  .then(() => {
    const htmlFile = Path.join(htmlPath, `results-peer${peerNumber}.html`);
    Shell.exec(`cat ${file} | chart-csv > ${htmlFile}`);
  })
};

const SaveCumulativeResults = (times, csvPath, htmlPath, indexOffset) => {
  const file = Path.join(csvPath, 'results-all.csv');
  const peerCDT = times.map((time, index) => { return `Peer${index+indexOffset} CDT(milliseconds)` });
  const csvHeaders = [['Number of RFCs'].concat(peerCDT)];
  const csvValues = [];
  for(let i=0; i< times.length; i++) {
    for(let j=0; j< times[i].length; j++) {
      if(!csvValues[j]){
        csvValues[j] = [j+1];
      }
      csvValues[j].push(times[i][j]);
    }
  }
  const csv = csvHeaders.concat(csvValues).join('\n');
  return WriteFile(file, csv)
  .then(() => {
    const htmlFile = Path.join(htmlPath, 'results-all.html');
    Shell.exec(`cat ${file} | chart-csv > ${htmlFile}`);
  })
};

module.exports = (times, csvPath, htmlPath, indexOffset) => {
  return Promise.all(times.map((time, index) => {
    return SaveIndividualResults(time, index+indexOffset, csvPath, htmlPath);
  }).concat([
    SaveCumulativeResults(times, csvPath, htmlPath, indexOffset)
  ]));
}
