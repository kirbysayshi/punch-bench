/* eslint-env shared-node-browser */

// This file cannot require anything, since it might get copy/pasted into a
// browser later. It has to be self-contained.

// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./declarations.d.ts" />

async function __bench(
  fn: PunchBench.BenchedFunction,
  times: number,
  timingFn: PunchBenchOptions["nowFn"]
) {
  const durations: number[] = [];
  let frames = 0;
  let ref = 0;

  if (typeof window !== "undefined" && window.requestAnimationFrame) {
    const doFrame = () =>
      window.requestAnimationFrame(() => {
        frames++;
        ref = doFrame();
      });
  }

  for (let i = 0; i < times; i++) {
    await new Promise<void>((resolve) => {
      const start = timingFn();
      fn(() => {
        const end = timingFn();
        durations.push(end - start);
        resolve();
      });
    });
  }

  if (typeof window !== "undefined" && window.cancelAnimationFrame) {
    window.cancelAnimationFrame(ref);
  }

  return { durations, frames };
}

async function __compare(
  tests: PunchBench.BenchedFunction[],
  times: number,
  timingFn: PunchBenchOptions["nowFn"]
) {
  const results: PunchBench.BenchResult[] = [];

  for (let i = 0; i < tests.length; i++) {
    const testFn = tests[i]!;
    const { durations, frames } = await __bench(testFn, times, timingFn);
    results.push({ name: testFn.name, durations, frames });
  }

  return results;
}

function __minMaxMeanMedianPct99Pct95(times: number[], frames: number): PunchBench.Stats {
  const min = Math.min.apply(null, times);
  const max = Math.max.apply(null, times);
  const mean = times.reduce((sum, curr) => sum + curr, 0) / times.length;
  const sortedAsc = times.slice().sort((a, b) => a - b);
  const median = sortedAsc[Math.floor((times.length - 1) / 2)]!;
  const pct99 = sortedAsc[Math.round((times.length - 1) * 0.99)]!;
  const pct95 = sortedAsc[Math.round((times.length - 1) * 0.95)]!;
  const sum = times.reduce((sum, curr) => sum + curr, 0);
  return { min, max, mean, median, pct99, pct95, sum, frames };
}

function __summarize(namedStats: PunchBench.NamedStats[]) {
  return Object.keys(namedStats[0]!.stats)
    .map((name) => statSummary(namedStats, name as keyof PunchBench.Stats))
    .reduce((all, curr) => {
      all[curr.type] = curr;
      return all;
    }, {} as PunchBench.SummarizedStats);

  function statSummary(
    namedStats: PunchBench.NamedStats[],
    statName: keyof PunchBench.Stats
  ): PunchBench.SingleStatSummary {
    const values = namedStats.map(({ stats }) => stats[statName]);
    const total = values.reduce((all, v) => all + v, 0);
    const idxFastest = values.indexOf(Math.min.apply(null, values));
    const idxSlowest = values.indexOf(Math.max.apply(null, values));
    const diff = values[idxSlowest]! - values[idxFastest]!;
    // If the slowest is zero... then it's likely something has been optimized out.
    // TODO: fix this case.
    const pctFaster =
      1 -
      values[idxFastest]! /
        (values[idxSlowest]! === 0 ? 1 : values[idxSlowest]!);
    const pctFasterPrint = (pctFaster * 100).toFixed(2) + "%";
    const nameFastest = namedStats[idxFastest]!.name;
    const nameSlowest = namedStats[idxSlowest]!.name;
    return {
      type: statName,
      fastest: nameFastest,
      slowest: nameSlowest,
      pctFaster,
      percentFaster: pctFasterPrint,
      difference: diff.toFixed(3) + "ms",
      total: total.toFixed(3) + "ms",
    };
  }
}

function __compute(results: PunchBench.BenchResult[]) {
  const stats = results.map((result) => ({
    name: result.name,
    stats: __minMaxMeanMedianPct99Pct95(result.durations, result.frames),
  }));
  return stats;
}

function __asTable(summaries: PunchBench.SummarizedStats) {
  const fieldNames = [
    "fastest",
    "percentFaster",
    "difference",
    "total",
  ] as (keyof PunchBench.SingleStatSummary)[];

  const colSize = 20;
  let out =
    "" +
    padColumn("stat", colSize) +
    fieldNames.reduce((all, name) => all + padColumn(name, colSize), "") +
    "\n";

  out += out.replace(/./g, "-");

  (Object.keys(summaries) as (keyof PunchBench.Stats)[]).forEach((statName) => {
    const stats = summaries[statName];
    out +=
      "" +
      padColumn(statName, colSize) +
      fieldNames.reduce(
        (all, name) => all + padColumn(stats[name] as string, colSize),
        ""
      ) +
      "\n";
  });

  console.log(out);
  return out;

  function padColumn(text: string, intended: number) {
    const pad = Array(intended).fill(" ").join("");
    return (text + pad).slice(0, intended);
  }
}

const __envTimes = {
  node: function () {
    const now = process.hrtime();
    return (now[0] * 1e9 + now[1]) / 1e6;
  },
  browser: function () {
    return window.performance.now();
  },
};

// GLOBAL STATE, YEAH IT'S NOT GREAT BUT IT'S SIMPLE.
const __tests: PunchBench.BenchedFunction[] = [];

const __defaultOptions = {
  count: 1000,
  nowFn:
    typeof process !== "undefined" &&
    process.release &&
    process.release.name === "node"
      ? __envTimes.node
      : __envTimes.browser,
};

type PunchBenchOptions = typeof __defaultOptions;

let __opts: null | PunchBenchOptions = null;

function punch(fn: PunchBench.BenchedFunction) {
  if (!fn) throw new Error("Expected a function, instead got " + fn);
  __tests.push(fn);
}

punch.configure = function (opts: Partial<PunchBenchOptions>) {
  __opts = Object.assign({}, __defaultOptions, opts);
};

punch.go = function (cb?: PunchBench.OnFinished) {
  if (!__opts) throw new Error(".configure has not been called! Abort.");
  __compare(__tests, __opts.count, __opts.nowFn).then((results) => {
    const computed = __compute(results);
    const summaries = __summarize(computed);
    const table = __asTable(summaries);
    if (cb) return cb(table, results, computed, summaries);
  });
};

punch.reset = function () {
  punch.configure({});
  __tests.length = 0;
};

// Kick off initial configuration population.
punch.configure({});

if (typeof module !== "undefined" && "exports" in module) {
  module.exports = punch;
}

// The following comment will be replaced with the contents of the
// user-provided test file.
/** TESTS GO HERE **/
