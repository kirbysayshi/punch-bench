var fs = require('fs');
var path = require('path');

var testPath = process.argv[2];

try {
  fs.statSync(testPath);
} catch (e) {
  throw new Error('Could not load test file, tried path ' + process.argv[2]);
  process.exit(1);
}

var bench = fs.readFileSync(path.join(__dirname, '../src/bench.js'), 'utf8');
var testFile = fs.readFileSync(testPath, 'utf8');

var output = bench.replace('/** TESTS GO HERE **/', testFile)
  + '\n'
  + (testFile.indexOf('punch.go()') > -1 ? '' : 'punch.go();\n');

console.log(output);
