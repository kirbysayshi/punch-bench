// This file cannot require anything, since it might get copy/pasted into a
// browser later. It has to be self-contained.

function __bench (fn, times, timingFn, complete) {
  var durations = [];
  var remaining = times;
  var lastStart = timingFn();

  function after() {
    var duration = timingFn() - lastStart;
    durations.push(duration);

    if (remaining > 0) {
      setTimeout(function () {
        remaining -= 1;
        lastStart = timingFn();
        fn(after);
      });
    } else {
      return complete(durations.slice(1));
    }
  }

  after(0);
}

function __compare (tests, times, timingFn, complete) {
  var remaining = tests;
  var results = [];
  var testFn;

  function run (result) {
    if (result) results.push({ name: testFn.name, durations: result });
    testFn = remaining.shift();
    if (testFn) {
      return __bench(testFn, times, timingFn, run);
    } else {
      return complete(results.slice(0));
    }
  }

  run();
}

function __minMaxMeanMedianPct99Pct95 (times) {
  var min = Math.min.apply(null, times);
  var max = Math.max.apply(null, times);
  var mean = times.reduce((sum, curr) => sum + curr, 0) / times.length;
  var sortedAsc = times.sort((a, b) => a - b);
  var median = sortedAsc[Math.floor((times.length - 1) / 2)];
  var pct99 = sortedAsc[Math.round((times.length - 1) * 0.99)];
  var pct95 = sortedAsc[Math.round((times.length - 1) * 0.95)];
  return { min, max, mean, median, pct99, pct95 };
}

function __summarize (namedStats) {
  return Object.keys(namedStats[0].stats)
    .map(name => statSummary(namedStats, name))
    .reduce((all, curr) => {
      all[curr.type] = curr;
      return all;
    }, {});

  function statSummary (namedStats, statName) {
    var values = namedStats.map(({ stats }) => stats[statName]);
    var idxFastest = values.indexOf(Math.min.apply(null, values));
    var idxSlowest = values.indexOf(Math.max.apply(null, values));
    var diff = values[idxSlowest] - values[idxFastest];
    var pctFaster = 1 - (values[idxFastest] / values[idxSlowest]);
    var pctFasterPrint = (pctFaster * 100).toFixed(2) + '%';
    var nameFastest = namedStats[idxFastest].name;
    var nameSlowest = namedStats[idxSlowest].name;
    return {
      type: statName,
      fastest: nameFastest,
      slowest: nameSlowest,
      pctFaster,
      percentFaster: pctFasterPrint,
      difference: diff.toFixed(2) + 'ms',
    }
  }
}

function __compute (results) {
  var stats = results.map(result => ({
    name: result.name,
    stats: __minMaxMeanMedianPct99Pct95(result.durations)
  }));
  return stats;
}

function __asTable (summaries) {
  var fieldNames = [ 'fastest', 'percentFaster', 'difference' ];

  var colSize = 20;
  var out = ''
    + padColumn('stat', colSize)
    + fieldNames.reduce((all, name) => all + padColumn(name, colSize), '')
    + '\n';

  out += out.replace(/./g, '-');

  Object.keys(summaries).forEach(statName => {
    var stats = summaries[statName];
    out += ''
      + padColumn(statName, colSize)
      + fieldNames.reduce((all, name) =>
        all + padColumn(stats[name], colSize), '')
      + '\n';
  });

  console.log(out);

  function padColumn (text, intended) {
    var pad = Array(intended).fill(' ').join('');
    return (text + pad).slice(0, intended);
  }
}

var __envTimes = {
  node: function () {
    var now = process.hrtime();
    return (now[0] * 1e9 + now[1]) / 1e6;
  },
  browser: function () {
    return window.performance.now();
  }
}

// GLOBAL STATE, YEAH IT'S NOT GREAT BUT IT'S SIMPLE.
var __tests = [];

var __defaultOptions = {
  count: 1000,
  nowFn: typeof process !== 'undefined' && process.release && process.release.name === 'node'
    ? __envTimes.node
    : __envTimes.browser,
}

var __opts = null;

function punch(fn) {
  if (!fn) throw new Error('Expected a function, instead got ' + fn);
  __tests.push(fn);
}

punch.configure = function (opts) {
  __opts = Object.assign({}, __defaultOptions, opts);
}

punch.go = function () {
  __compare(__tests, __opts.count, __opts.nowFn, function (results) {
    var computed = __compute(results);
    var summaries = __summarize(computed);
    __asTable(summaries);
  });
}

punch.reset = function () {
  punch.configure({});
  __tests.length = 0;
}

// Kick off initial configuration population.
punch.configure({});

// The following comment will be replaced with the contents of the
// user-provided test file.
/** TESTS GO HERE **/
