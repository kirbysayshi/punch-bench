/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-env node */

// This is the lib version of this util, in the event you want a node-only
// benchmark, or more control.

const fs = require('fs');
const path = require('path');

const bench = fs.readFileSync(path.join(__dirname, './dist/bench.js'), 'utf8');

eval(bench); // YUUUUP

// eslint-disable-next-line no-undef
module.exports = punch;
