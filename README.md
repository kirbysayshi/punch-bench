punch-bench
===========

Benchmark web code with nuance!

`punch-bench` is a benchmarking utility that helps you answer questions like:

- Which implementation is absolutely faster?
- Which implementation is consistently faster?
- Which implementation blocks fewer render frames?
- Which implementation blocks fewer event loop ticks?
- What's the worst case performance?

Additionally, `punch-bench` will _generate_ code so you can run your benchmark in whatever environment you'd like, with zero dependencies! Supports TypeScript too (and of course also plain JS)!

[Check the sample output. It even has graphs!](./docs/example-output-chrome.txt)

[But what do those graphs mean?](./docs/analysis.md)

Rationale
---------

Benchmarking is hard, especially on the Web. The tradeoffs are usually not as simple as "what is fastest". What does "fastest" mean? If a function took 100ms of blocking time, and another took 200ms of non-blocking time, which one was "fastest"?

The answer is that is depends on what you need. And `punch-bench` is here to help!.

The name: this library was initially even simpler, referencing the phrase "punch it!" for pressing down on the acelerator pedal in a car (or warp engines...). Now it's a bit more complex but better than ever.

Quick Start
-----------

First, you need a benchmark definition. This is the code that defines the benchmark. For example:

```js
// canvas.ts

const canvas = document.createElement('canvas');
canvas.width = 600;
canvas.height = 600;

punch(function canvasToDataURL(done) {
  canvas.toDataURL('text/jpeg', 0.3);
  done();
});

punch(function canvasToBlob(done) {
  canvas.toBlob(blob => {
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      reader.result;
      done();
    }, false);
    reader.readAsDataURL(blob);
  }, 'image/jpeg', 0.3);
});
```

Quick Start (generate)
----------------------

`punch-bench` can generate code from your benchmark definition to be executed elsewhere:

```sh
npx punch-bench ./canvas.ts
... a lot of code ...
```

This will output a [rollup-ed version of your code](https://rollupjs.org) (your benchmark will be near the bottom, and should be quite readable, unmangled). Either pipe it to a file, or your clipboard:

```sh
# to a file...
npx punch-bench ./canvas.ts > canvas-benchmark.js
```

```sh
# to your clipboard...
npx punch-bench ./canvas.ts | pbcopy
```

Now you can paste the code into a browser console, and after a few seconds you'll see the results! For more details, see [the example analysis](./docs/analysis.md)

```sh
# ...or right back into node to immediately test!
npx punch-bench ./canvas.ts | node
```

Quick Start (library)
-----------

`punch-bench` can also be used as a library (TypeScript or JS), such as within nodejs or a browser bundler like webpack. Using the same example above:

```js
import { PunchBench } from 'punch-bench';

const { punch, configure, go } = new PunchBench();

const canvas = document.createElement('canvas');
canvas.width = 600;
canvas.height = 600;

punch(function canvasToDataURL(done) {
  canvas.toDataURL('text/jpeg', 0.3);
  done();
});

punch(function canvasToBlob(done) {
  canvas.toBlob(blob => {
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      reader.result;
      done();
    }, false);
    reader.readAsDataURL(blob);
  }, 'image/jpeg', 0.3);
});

configure({ count: 100 })

// Don't forget to start the benchmark!
go();
```

The main difference is that you can import either the premade `PunchBench` instance, or create your own like the above code does. `go` also returns a `Promise` so it can be `await`ed.


High Precision Timers
---------------------

Due to security issues, browsers reduced the timing precision exposed to JS code (often rounded to 1ms). For more information, see https://developer.mozilla.org/en-US/docs/Web/API/Performance/now#reduced_time_precision. If you're getting suspciously "even" numbers (lots of zeros) this is probably an issue.


Usage (CLI)
------------

```sh
npx punch-bench [path/to/benchmark.(js|ts)]
```

Outputs a rollup-compiled bundled of your benchmark and `punch-bench`. It also prepends your code with `punch`, `go`, and `configure` variables from a `PunchBench` instance, and if you do not call `go()`, will also append `go()`.

Usage (Library)
---------------

```js

import { PunchBench } from "punch-bench";

// Each of these are optional, in addition to the object itself!
const options = {
  count: 1000,              // number of iterations per test
  plotWidth: 80,            // how wide to plot each graph, in characters
  plotHeight: 20,           // how tall to plot each graph, in lines

  // This will be oe of the following if in a browser or node, respectively.
  // You can pass your own if the environment is more exotic (or does not
  // have one of these APIs), e.g. `() => Date.now()`. It only needs to
  // provide _relative_ time, not epoch time.
  nowFn:
    window.performance.now  // browser
    | () =>                 // node
      (process.hrtime()[0] * 1e9 +
        process.hrtime()[1]) /
      1000; 
}

const b = new PunchBench()

b.punch(function nameOfBenchmark(done) {
  // The function name is used to label the benchmark results!
  
  // Must call done to signal the benchmark is done!
  done()
});

b.configure() // any of the options above

b.go(function optionalCallback(results) => {
  // see PunchBenchResult in src/index.ts
})

// It's also a promise!

;(async function something() {
  const results = await go();
  // do something with these!

  // pass a callback to prevent default dumping to console
  const results2 = await go(() => {});
}());

```



License
-------

MIT
