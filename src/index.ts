/* eslint-env shared-node-browser */

import { table } from "table";
import { plot } from "asciichart";
import { largestTriangleThreeBuckets } from "./downsample";

export interface BenchedFunction {
  (done: () => void): void;
}

export type PunchBenchResult = {
  results: Required<BenchResult>[];
};

export type PunchBenchOnFinished = (result: PunchBenchResult) => void;

export type BenchResult = {
  name: string;
  durations: number[];
  frames: number;
  ticks: number;
  benchDuration: number;
  stats?: Stats;
  plot?: string;
  table?: string;
};

export type Stats = {
  min: number;
  max: number;
  mean: number;
  median: number;
  percentile99: number;
  percentile95: number;
  sum: number;
  pctFramesOnTime: number;
  pctTicksOnTime: number;
};

export const defaultCallback: PunchBenchOnFinished = function printResults(
  pb: PunchBenchResult
) {
  pb.results.forEach((result) => {
    console.log(result.name);
    console.log(result.plot);
    console.log(result.table);
    console.log();
  });
};

async function __bench(
  name: string,
  fn: BenchedFunction,
  times: number,
  timingFn: PunchBenchOptions["nowFn"]
): Promise<BenchResult> {
  const durations: number[] = [];
  let frames = 0;
  let ticks = 0;
  let animHandle = 0;
  let timeoutHandle: NodeJS.Timeout | number = 0;

  // TODO: warmup runs?
  // TODO: calibration runs? probably not.

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

  const benchStart = timingFn();

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

  const benchEnd = timingFn();

  if (typeof window !== "undefined" && window.cancelAnimationFrame) {
    window.cancelAnimationFrame(animHandle);
  }

  clearTimeout(timeoutHandle);

  return {
    name,
    durations,
    frames,
    ticks,
    benchDuration: benchEnd - benchStart,
  };
}

async function __compare(
  tests: BenchedFunction[],
  times: number,
  timingFn: PunchBenchOptions["nowFn"]
) {
  const results: BenchResult[] = [];

  for (let i = 0; i < tests.length; i++) {
    const testFn = tests[i] as BenchedFunction;
    // Give the browser time for GC, hopefully.
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const result = await __bench(testFn.name, testFn, times, timingFn);
    results.push(result);
  }

  return results;
}

function __minMaxMeanMedianPct99Pct95(
  times: number[],
  frames: number,
  ticks: number,
  benchDuration: number
): Stats {
  const min = Math.min.apply(null, times);
  const max = Math.max.apply(null, times);
  const mean = times.reduce((sum, curr) => sum + curr, 0) / times.length;
  const sortedAsc = times.slice().sort((a, b) => a - b);
  const median = sortedAsc[Math.floor((times.length - 1) / 2)] as number;
  const percentile99 = sortedAsc[
    Math.floor((times.length - 1) * 0.99)
  ] as number;
  const percentile95 = sortedAsc[
    Math.floor((times.length - 1) * 0.95)
  ] as number;
  const sum = times.reduce((sum, curr) => sum + curr, 0);
  const expectedFramesAt60FPS = benchDuration / (1000 / 60);
  const expectedTicks =
    benchDuration / (typeof process !== "undefined" ? 1 : 4); // Typical NODEJS/DOM clamping;
  const pctFramesOnTime = frames / expectedFramesAt60FPS;
  const pctTicksOnTime = ticks / expectedTicks;
  return {
    min,
    max,
    mean,
    median,
    percentile99,
    percentile95,
    sum,
    pctFramesOnTime,
    pctTicksOnTime,
  };
}

function __attachStats(
  results: BenchResult[],
  opts: PunchBenchOptions
): Required<BenchResult>[] {
  let max = -Infinity;

  results.forEach((result) => {
    result.stats = __minMaxMeanMedianPct99Pct95(
      result.durations,
      result.frames,
      result.ticks,
      result.benchDuration
    );
    max = Math.max(max, result.stats.max);

    const rows: [string, number | string][] = [];

    // TODO: nice names for each stat (with descriptions?)

    for (const [name, value] of Object.entries(result.stats)) {
      rows.push([name, value.toFixed(8)]);
    }

    rows.push(
      ["total ticks", result.ticks],
      ["total frames", result.frames],
      ["total duration", result.benchDuration]
    );

    result.table = table(rows);
  });

  results.forEach((result) => {
    result.plot = simplifyAndPlot(result, max, opts.plotWidth, opts.plotHeight);
  });

  return results.map((result) => {
    for (const [key, val] of Object.entries(result)) {
      if (val === undefined)
        throw new Error(`Forgot to handle a required value! ${key} was ${val}`);
    }
    return result as Required<BenchResult>;
  });
}

function simplifyAndPlot(
  result: BenchResult,
  maxValue: number,
  buckets = 80,
  height = 20
) {
  const simplified = largestTriangleThreeBuckets(
    result.durations.map((d, i) => [i, d] as const),
    buckets
  );

  const padding = Array(maxValue.toFixed(4).length).fill(' ').join('');

  return plot(
    simplified.map((p) => p[1]),
    { height, min: 0, max: maxValue, format: (x: number) => {
      return (padding + x.toFixed(4)).slice(-padding.length)
    } }
  );
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
  plotWidth: 80,
  plotHeight: 20,
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

  configure = (opts: Partial<PunchBenchOptions>): void => {
    this.opts = Object.assign({}, __defaultOptions, opts);
  };

  punch = (fn: BenchedFunction): void => {
    this.tests.push(fn);
  };

  go = async (
    cb: PunchBenchOnFinished = defaultCallback
  ): Promise<PunchBenchResult> => {
    const results = __attachStats(
      await __compare(this.tests, this.opts.count, this.opts.nowFn),
      this.opts
    );

    // TODO: plot framerate? Will require measuring each frame/tick's time

    const finished = { results };
    cb(finished);
    return finished;
  };
}

// provide a default instance
export const { punch, go, configure } = new PunchBench();

export { PunchBench };
