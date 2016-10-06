// This is the lib version of this util, in the event you want a node-only
// benchmark, or more control.

var fs = require('fs');

var bench = fs.readFileSync('./src/bench.js', 'utf8');

eval(bench); // YUUUUP

module.exports = punch;
