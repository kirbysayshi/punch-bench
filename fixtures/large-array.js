// `punch` is provided by the punch-bench harness

var hugeArray = Array(10000).fill('yo');

// eslint-disable-next-line no-undef
punch(function manualForLoop (done) {
  for (var i = 0; i < hugeArray.length; i++) {
    hugeArray[i];
  }
  done();
});

// eslint-disable-next-line no-undef
punch(function forEachLoop (done) {
  hugeArray.forEach(function (entry) {
    entry;
  });
  done();
});

// eslint-disable-next-line no-undef
punch.configure({ count: 10000 });