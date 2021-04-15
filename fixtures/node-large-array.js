/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-env node */

const {punch, go, configure} = require('../');

const hugeArray = Array(10000).fill('yo');

punch(function manualForLoop (done) {
  for (let i = 0; i < hugeArray.length; i++) {
    hugeArray[i];
  }
  done();
});

punch(function forEachLoop (done) {
  hugeArray.forEach(function (entry) {
    entry;
  });
  done();
});

// eslint-disable-next-line no-undef
configure({ count: 10000 });

go(({ results }) => {
  console.log(results);
});
