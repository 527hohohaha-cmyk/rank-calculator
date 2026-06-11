import { normalCDF, inverseNormalCDF } from "./normal";
import { quantileCDF, type QuantileSummary } from "./quantile";
import type { ParsedCombinedInputs, ParsedExamInputs } from "../types/rank";

export interface MixedDistributionResult {
  cumulativeProbability: number;
  finalMean: number;
  finalSd: number;
  method: "normal" | "grid";
}

const DEFAULT_GRID_SIZE = 181;

export function weightedNormalMoments(input: ParsedCombinedInputs): {
  mean: number;
  sd: number;
} {
  const wm = input.normalizedMidtermWeight;
  const wf = input.normalizedFinalWeight;
  const mean = wm * input.midterm.mean + wf * input.finalExam.mean;
  const variance = (wm * input.midterm.sd) ** 2 + (wf * input.finalExam.sd) ** 2;

  return {
    mean,
    sd: Math.sqrt(variance),
  };
}

export function calculateMixedDistributionCDF(
  input: ParsedCombinedInputs,
  gridSize = DEFAULT_GRID_SIZE,
): MixedDistributionResult {
  const { mean, sd } = weightedNormalMoments(input);

  if (input.midterm.mode === "normal" && input.finalExam.mode === "normal") {
    return {
      cumulativeProbability: normalCDF(input.finalScore, mean, sd),
      finalMean: mean,
      finalSd: sd,
      method: "normal",
    };
  }

  const midtermSamples = buildExamSamples(input.midterm, gridSize);
  const finalSamples = buildExamSamples(input.finalExam, gridSize);
  let count = 0;
  let belowOrEqual = 0;

  for (const midtermValue of midtermSamples) {
    for (const finalValue of finalSamples) {
      const mixedValue =
        input.normalizedMidtermWeight * midtermValue +
        input.normalizedFinalWeight * finalValue;
      count += 1;
      if (mixedValue <= input.finalScore) {
        belowOrEqual += 1;
      }
    }
  }

  return {
    cumulativeProbability: count > 0 ? belowOrEqual / count : Number.NaN,
    finalMean: mean,
    finalSd: sd,
    method: "grid",
  };
}

export function examCDF(score: number, exam: ParsedExamInputs): number {
  if (exam.mode === "quantile") {
    return quantileCDF(score, getQuantileSummary(exam));
  }
  return normalCDF(score, exam.mean, exam.sd);
}

function buildExamSamples(exam: ParsedExamInputs, gridSize: number): number[] {
  return Array.from({ length: gridSize }, (_, index) => {
    const p = (index + 0.5) / gridSize;
    if (exam.mode === "quantile") {
      return inverseQuantileCDF(p, getQuantileSummary(exam));
    }
    return inverseNormalCDF(p, exam.mean, exam.sd);
  });
}

function inverseQuantileCDF(p: number, summary: QuantileSummary): number {
  const points = [
    { x: summary.min, p: 0 },
    { x: summary.q1, p: 0.25 },
    { x: summary.q2, p: 0.5 },
    { x: summary.q3, p: 0.75 },
    { x: summary.max, p: 1 },
  ];

  if (p <= 0) return summary.min;
  if (p >= 1) return summary.max;

  for (let i = 0; i < points.length - 1; i += 1) {
    const left = points[i];
    const right = points[i + 1];
    if (p <= right.p) {
      if (right.p === left.p) return right.x;
      return left.x + ((p - left.p) / (right.p - left.p)) * (right.x - left.x);
    }
  }

  return summary.max;
}

function getQuantileSummary(exam: ParsedExamInputs): QuantileSummary {
  if (
    exam.min === undefined ||
    exam.q1 === undefined ||
    exam.q2 === undefined ||
    exam.q3 === undefined ||
    exam.max === undefined
  ) {
    throw new Error("분위수 기반 분포에 필요한 값이 부족합니다.");
  }

  return {
    min: exam.min,
    q1: exam.q1,
    q2: exam.q2,
    q3: exam.q3,
    max: exam.max,
  };
}
