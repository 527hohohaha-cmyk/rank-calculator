export type ScoreDirection = "higher" | "lower";

export type CalculationMode = "normal" | "quantile" | "mixed";

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

export interface ExamInputs {
  score: string;
  mean: string;
  sd: string;
  q1: string;
  q2: string;
  q3: string;
  min: string;
  max: string;
}

export interface CombinedRankInputs {
  midterm: ExamInputs;
  finalExam: ExamInputs;
  midtermWeight: string;
  finalWeight: string;
  n: string;
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

export type ExamDistributionMode = "normal" | "quantile";

export interface ParsedExamInputs {
  score: number;
  mean: number;
  sd: number;
  mode: ExamDistributionMode;
  q1?: number;
  q2?: number;
  q3?: number;
  min?: number;
  max?: number;
}

export interface ParsedCombinedInputs {
  midterm: ParsedExamInputs;
  finalExam: ParsedExamInputs;
  midtermWeight: number;
  finalWeight: number;
  normalizedMidtermWeight: number;
  normalizedFinalWeight: number;
  finalScore: number;
  n: number;
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

export interface CombinedValidationResult {
  parsed?: ParsedCombinedInputs;
  errors: string[];
  warnings: string[];
  isRequiredComplete: boolean;
}
