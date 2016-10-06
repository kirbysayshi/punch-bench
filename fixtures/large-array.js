// `punch` is provided by the punch-bench harness

var hugeArray = Array(10000).fill('yo');

punch(function manualForLoop (done) {
  for (var i = 0; i < hugeArray.length; i++) {
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
