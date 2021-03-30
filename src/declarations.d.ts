// declare namespace PunchBench {

export as namespace PunchBench;

export interface BenchedFunction {
  (done: () => void): void;
}

export type PunchBenchModule = typeof punch;

export type OnFinished = (
  table: string,
  results: BenchResult[],
  computed: { name: string; stats: Stats }[],
  summaries: SummarizedStats
) => void;

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
  frames: number; // higher is better
  ticks: number; // higher is better
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

// }
