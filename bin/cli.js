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

// var benchCount = 100;

// var testRoute = 'mixify-view/v1/timestretched-tracklist';
// //var testRoute = 'mixify-view/v1/time-stretch-media?track-gid-with-dashes=ad3f9056-09f0-45bc-94d4-6c3d42894d5b&tempo=120';

// function fetchTest(done) {
//   spfetch('https://spclient.wg.spotify.com/' + testRoute)
//     .then(res => res.json())
//     .then(res => {
//       done();
//     })
// }

// function hermesTest(done) {
//   cosmos.resolver.get('hm://' + testRoute, (err, res) => {
//     res.getJSONBody();
//     done();
//   })
// }

// compare(
//   [ hermesTest, fetchTest ],
//   benchCount,
//   performance.now.bind(performance),
//   asTable.bind(null, testRoute)
// );
