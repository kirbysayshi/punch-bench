#!/usr/bin/env node

/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-env node */

const fs = require('fs');
const path = require('path');

const testPath = process.argv[2];

try {
  fs.statSync(testPath);
} catch (e) {
  throw new Error('Could not load test file, tried path ' + process.argv[2]);
}

const bench = fs.readFileSync(path.join(__dirname, '../dist/bench.js'), 'utf8');
const testFile = fs.readFileSync(testPath, 'utf8');

const output = bench.replace('/** TESTS GO HERE **/', testFile)
  + '\n'
  + (testFile.indexOf('punch.go()') > -1 ? '' : 'punch.go();\n');

console.log(output);
