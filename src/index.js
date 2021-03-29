/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-env node */

// This is the lib version of this util, in the event you want a node-only
// benchmark, or more control.

const fs = require('fs');
const path = require('path');

const bench = fs.readFileSync(path.join(__dirname, './bench.js'), 'utf8');

eval(bench); // YUUUUP

// This is provided by the `eval` above.
/** @type {import('./bench').PunchBenchModule} */
var punch;

module.exports = punch;
