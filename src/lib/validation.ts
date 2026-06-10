import type {
  CalculationMode,
  ParsedInputs,
  RankInputs,
  ValidationResult,
} from "../types/rank";
import { getQuantileDistributionMoments } from "./quantile";

const REQUIRED_FIELDS = ["score", "mean", "sd", "n"] as const;
const QUANTILE_FIELDS = ["q1", "q2", "q3", "min", "max"] as const;

export function validateInputs(inputs: RankInputs): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const requiredComplete = REQUIRED_FIELDS.every((field) => inputs[field].trim() !== "");

  if (!requiredComplete) {
    return { errors, warnings, isRequiredComplete: false };
  }

  const score = parseNumber(inputs.score);
  const mean = parseNumber(inputs.mean);
  const sd = parseNumber(inputs.sd);
  const n = parseNumber(inputs.n);

  if (score === undefined) errors.push("내 점수는 숫자여야 합니다.");
  if (mean === undefined) errors.push("평균은 숫자여야 합니다.");
  if (sd === undefined || sd <= 0) errors.push("표준편차는 0보다 커야 합니다.");
  if (n === undefined || !Number.isInteger(n) || n < 2) {
    errors.push("표본수는 2 이상의 정수여야 합니다.");
  }

  const quantileValues = Object.fromEntries(
    QUANTILE_FIELDS.map((field) => [field, parseNumber(inputs[field])]),
  ) as Record<(typeof QUANTILE_FIELDS)[number], number | undefined>;
  const filledQuantileCount = QUANTILE_FIELDS.filter(
    (field) => inputs[field].trim() !== "",
  ).length;

  for (const field of QUANTILE_FIELDS) {
    if (inputs[field].trim() !== "" && quantileValues[field] === undefined) {
      errors.push(`${labelFor(field)}은 숫자여야 합니다.`);
    }
  }

  if (filledQuantileCount > 0 && filledQuantileCount < QUANTILE_FIELDS.length) {
    warnings.push("분위수 기반 계산을 하려면 Q1, Q2, Q3, min, max를 모두 입력해야 합니다.");
  }

  if (errors.length > 0 || score === undefined || mean === undefined || sd === undefined || n === undefined) {
    return { errors, warnings, isRequiredComplete: true };
  }

  const parsed: ParsedInputs = {
    score,
    mean,
    sd,
    n,
    direction: inputs.direction,
  };

  if (n < 30) {
    warnings.push("표본수가 작아 실제 석차와 차이가 클 수 있습니다.");
  }

  let mode: CalculationMode = "normal";
  const allQuantilesPresent = filledQuantileCount === QUANTILE_FIELDS.length;

  if (allQuantilesPresent) {
    const { min, q1, q2, q3, max } = quantileValues;

    if (
      min === undefined ||
      q1 === undefined ||
      q2 === undefined ||
      q3 === undefined ||
      max === undefined
    ) {
      return { errors, warnings, isRequiredComplete: true };
    }

    if (!(min <= q1 && q1 < q2 && q2 < q3 && q3 <= max)) {
      errors.push("분위수는 min <= Q1 < Q2 < Q3 <= max 순서를 만족해야 합니다.");
    } else {
      mode = "quantile";
      parsed.min = min;
      parsed.q1 = q1;
      parsed.q2 = q2;
      parsed.q3 = q3;
      parsed.max = max;
      const { impliedMean, impliedSd } = getQuantileDistributionMoments({
        min,
        q1,
        q2,
        q3,
        max,
      });

      if (Math.abs(mean - q2) > sd) {
        warnings.push("분포가 비대칭일 가능성이 큽니다.");
      }
      if (Math.abs(impliedMean - mean) > sd * 0.5) {
        warnings.push(
          "입력한 평균과 분위수 기반 근사분포의 평균이 다소 차이납니다. 요약통계량이 서로 일관적인지 확인하세요.",
        );
      }
      if (Math.abs(impliedSd - sd) > sd * 0.5) {
        warnings.push(
          "입력한 표준편차와 분위수 기반 근사분포의 표준편차가 다소 차이납니다. 실제 분포 추정의 불확실성이 커질 수 있습니다.",
        );
      }
    }
  }

  const min = quantileValues.min;
  const max = quantileValues.max;
  if (min !== undefined && max !== undefined && min <= max) {
    if (mean < min || mean > max) {
      warnings.push("평균이 입력된 최솟값과 최댓값 범위 밖에 있습니다.");
    }
    if (score < min || score > max) {
      warnings.push("내 점수가 입력된 최솟값과 최댓값 범위 밖에 있습니다.");
    }
  }

  return { parsed, mode, errors, warnings, isRequiredComplete: true };
}

function parseNumber(value: string): number | undefined {
  if (value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function labelFor(field: string): string {
  const labels: Record<string, string> = {
    q1: "Q1",
    q2: "Q2",
    q3: "Q3",
    min: "min",
    max: "max",
  };
  return labels[field] ?? field;
}
