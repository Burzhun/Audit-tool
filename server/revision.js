const path = require('path');
var fs = require('fs');

function getBuildNumber() {
  const contents = fs.readFileSync(path.join(__dirname, 'build_number'), 'utf8').toString().trim()
  return `0.${contents}`
}

module.exports = { getBuildNumber }
