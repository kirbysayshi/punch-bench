punch-bench
===========

Benchmark different functions and get useful stats with zero config / mangling of numbers. This takes simple functions and generates the actual JS to run in your testing environment. Imagine benchmarking `fetch` vs `XMLHttpRequest`.

There is also a node-only API that will do function benchmarking as well!

```
$ punch-bench ./my-test.js | node
stat                fastest             percentFaster       difference
--------------------------------------------------------------------------------
min                 manualForLoop       98.98%              0.63ms
max                 manualForLoop       75.99%              1.71ms
mean                manualForLoop       98.47%              0.78ms
median              manualForLoop       98.67%              0.70ms
pct99               manualForLoop       96.72%              1.56ms
pct95               manualForLoop       98.54%              1.19ms
```

Usage (generated benchmarks)
----------------------------

First make the test file:

```
// my-test.js
// `punch` is provided by the punch-bench harness
var hugeArray = Array(1000).fill('yo');

// The function name will be used in the stats report
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

// you can have as many as you want...

// Optionally configure the test
punch.configure({ count: 10000 });
```

Then get the generated test:

```
$ punch-bench ./my-test.js

... a whole bunch of JS ...
```

Might be easier to use clipboard helpers:

```
$ punch-bench ./my-test.js | pbcopy

```

And then paste that into a browser DevTools console or node:

```
$ pbpaste | node

stat                fastest             percentFaster       difference
--------------------------------------------------------------------------------
min                 manualForLoop       98.98%              0.63ms
max                 manualForLoop       75.99%              1.71ms
mean                manualForLoop       98.47%              0.78ms
median              manualForLoop       98.67%              0.70ms
pct99               manualForLoop       96.72%              1.56ms
pct95               manualForLoop       98.54%              1.19ms
```

You can even go in one step if testing in node:

```
$ punch-bench ./my-test.js | node
```

Usage (node-only)
-----------------

First make the test file:

```
// my-test.js
var punch = require('punch');
var hugeArray = Array(1000000).fill('yo');

// The function name will be used in the stats report
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

// Optionally configure the test
punch.configure({
  count: 10000
});

// execute!
punch.go();
```

Options
-------

### `count` (default: 100)

The number of iterations for each test.

```
punch.configure({ count: 10000 });
```

### `nowFn` (default: environment-specific)

A function that returns relative milliseconds, used to time-diff runs. In a browser, this will be `window.performance.now`, in node it is `(process.hrtime()[0] * 1e9 + process.hrtime()[1]) / 1000`. The proper function is automatically determined, but you can specify something different if you have more exotic environment. It is used for relative comparisons, so it does not need to be related to Epoch.

```
punch.configure({
  nowFn: function () {
    return Date.now();
  }
});
```

Rationale
---------

Sometimes you want to compare things, but don't want to worry about suites and events and stats and whatnot. And sometimes you want to test things in a browser, but don't want to worry about `require` or libraries. So this utility outputs the JS you need to execute in a browser or node to get some useful stats.

TODO
----

- Tests: not 100% critical yet, since this is still pretty simple. But the data structures are pretty weird, so tests would help make that clearer.
- Refactor general structure. Everything is `__prefixed` right now to prevent script collisions, but that could be avoided by making them hang off of `punch`.

License
-------

MIT
