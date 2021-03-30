/* eslint-env shared-node-browser */

export interface BenchedFunction {
  (done: () => void): void;
}

export type PunchBenchResult = {
  table: string;
  results: BenchResult[];
  computed: NamedStats[];
  summaries: SummarizedStats;
};

export type OnFinished = (result: PunchBenchResult) => void;

export type BenchResult = {
  name: string;
  durations: number[];
  frames: number;
  ticks: number;
};

export type Stats = {
  min: number;
  max: number;
  mean: number;
  median: number;
  pct99: number;
  pct95: number;
  sum: number;
  frames: number;
  ticks: number;
  pctFramesOnTime: number;
  pctTicksOnTime: number;
};

export type SingleStatSummary = {
  type: keyof Stats;
  fastest: string;
  slowest: string;
  pctFaster: number;
  percentFaster: string;
  difference: string;
  total: string;
};

export type NamedStats = { name: string; stats: Stats };

export type SummarizedStats = { [Name in keyof Stats]: SingleStatSummary };

async function __bench(
  fn: BenchedFunction,
  times: number,
  timingFn: PunchBenchOptions["nowFn"]
) {
  const durations: number[] = [];
  let frames = 0;
  let ticks = 0;
  let animHandle = 0;
  let timeoutHandle: NodeJS.Timeout | number = 0;

  function doFrame() {
    frames++;
    animHandle = requestAnimationFrame(doFrame);
  }

  function doTick() {
    ticks++;
    timeoutHandle = setTimeout(doTick);
  }

  if (typeof window !== "undefined" && window.requestAnimationFrame) {
    doFrame();
  }

  doTick();

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
    window.cancelAnimationFrame(animHandle);
  }

  clearTimeout(timeoutHandle);

  return { durations, frames, ticks };
}

async function __compare(
  tests: BenchedFunction[],
  times: number,
  timingFn: PunchBenchOptions["nowFn"]
) {
  const results: BenchResult[] = [];

  for (let i = 0; i < tests.length; i++) {
    const testFn = tests[i]!;
    const { durations, frames, ticks } = await __bench(testFn, times, timingFn);
    results.push({ name: testFn.name, durations, frames, ticks });
  }

  return results;
}

function __minMaxMeanMedianPct99Pct95(
  times: number[],
  frames: number,
  ticks: number
): Stats {
  const min = Math.min.apply(null, times);
  const max = Math.max.apply(null, times);
  const mean = times.reduce((sum, curr) => sum + curr, 0) / times.length;
  const sortedAsc = times.slice().sort((a, b) => a - b);
  const median = sortedAsc[Math.floor((times.length - 1) / 2)]!;
  const pct99 = sortedAsc[Math.round((times.length - 1) * 0.99)]!;
  const pct95 = sortedAsc[Math.round((times.length - 1) * 0.95)]!;
  const sum = times.reduce((sum, curr) => sum + curr, 0);
  const expectedFramesAt60FPS = sum / (1000 / 60);
  const expectedTicks = sum / (typeof process !== "undefined" ? 1 : 4); // Typical NODEJS/DOM clamping;
  const pctFramesOnTime = frames / expectedFramesAt60FPS;
  const pctTicksOnTime = ticks / expectedTicks;
  return {
    min,
    max,
    mean,
    median,
    pct99,
    pct95,
    sum,
    frames,
    ticks,
    pctFramesOnTime,
    pctTicksOnTime,
  };
}

function __summarize(namedStats: NamedStats[]) {
  return Object.keys(namedStats[0]!.stats)
    .map((name) => statSummary(namedStats, name as keyof Stats))
    .reduce((all, curr) => {
      all[curr.type] = curr;
      return all;
    }, {} as SummarizedStats);

  function statSummary(
    namedStats: NamedStats[],
    statName: keyof Stats
  ): SingleStatSummary {
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

function __compute(results: BenchResult[]): NamedStats[] {
  const stats = results.map((result) => ({
    name: result.name,
    stats: __minMaxMeanMedianPct99Pct95(
      result.durations,
      result.frames,
      result.ticks
    ),
  }));
  return stats;
}

function __asTable(summaries: SummarizedStats) {
  const fieldNames = [
    "fastest",
    "percentFaster",
    "difference",
    "total",
  ] as (keyof SingleStatSummary)[];

  const colSize = 20;
  let out =
    "" +
    padColumn("stat", colSize) +
    fieldNames.reduce((all, name) => all + padColumn(name, colSize), "") +
    "\n";

  out += out.replace(/./g, "-");

  (Object.keys(summaries) as (keyof Stats)[]).forEach((statName) => {
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

const __defaultOptions = {
  count: 1000,
  nowFn:
    typeof process !== "undefined" &&
    process.release &&
    process.release.name === "node"
      ? __envTimes.node
      : __envTimes.browser,
};

export type PunchBenchOptions = typeof __defaultOptions;

class PunchBench {
  private tests: BenchedFunction[] = [];
  constructor(private opts: PunchBenchOptions = __defaultOptions) {
    this.configure(opts);
  }

  // NOTE: using arrow assignment syntax to enable destructuring these from the
  // instance. It's just a little nicer to use in a module file.

  configure = (opts: PunchBenchOptions): void => {
    this.opts = Object.assign({}, __defaultOptions, opts);
  };

  punch = (fn: BenchedFunction): void => {
    this.tests.push(fn);
  };

  go = async (cb?: OnFinished): Promise<PunchBenchResult> => {
    const results = await __compare(
      this.tests,
      this.opts.count,
      this.opts.nowFn
    );
    const computed = __compute(results);
    const summaries = __summarize(computed);
    const table = __asTable(summaries);
    const finished = { table, results, computed, summaries };
    if (cb) cb(finished);
    return finished;
  };
}

// make a default instance
export const { punch, go, configure } = new PunchBench();

export { PunchBench };
