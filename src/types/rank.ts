export type ScoreDirection = "higher" | "lower";

export type CalculationMode = "normal" | "quantile";

export interface RankInputs {
  score: string;
  mean: string;
  sd: string;
  n: string;
  q1: string;
  q2: string;
  q3: string;
  min: string;
  max: string;
  direction: ScoreDirection;
}

export interface ParsedInputs {
  score: number;
  mean: number;
  sd: number;
  n: number;
  q1?: number;
  q2?: number;
  q3?: number;
  min?: number;
  max?: number;
  direction: ScoreDirection;
}

export interface RankResult {
  mode: CalculationMode;
  cumulativeProbability: number;
  upperProbability: number;
  expectedRank: number;
  topPercent: number;
  percentile: number;
  lowerRank: number;
  upperRank: number;
  rangeIsUnstable: boolean;
}

export interface ValidationResult {
  parsed?: ParsedInputs;
  mode?: CalculationMode;
  errors: string[];
  warnings: string[];
  isRequiredComplete: boolean;
}
