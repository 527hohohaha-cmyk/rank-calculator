import type {
  CalculationMode,
  CombinedRankInputs,
  CombinedValidationResult,
  ExamInputs,
  ParsedExamInputs,
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

export function validateCombinedInputs(inputs: CombinedRankInputs): CombinedValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const requiredComplete =
    inputs.n.trim() !== "" &&
    inputs.midtermWeight.trim() !== "" &&
    inputs.finalWeight.trim() !== "" &&
    examRequiredComplete(inputs.midterm) &&
    examRequiredComplete(inputs.finalExam);

  if (!requiredComplete) {
    return { errors, warnings, isRequiredComplete: false };
  }

  const n = parseNumber(inputs.n);
  const midtermWeight = parseNumber(inputs.midtermWeight);
  const finalWeight = parseNumber(inputs.finalWeight);

  if (n === undefined || !Number.isInteger(n) || n < 2) {
    errors.push("표본수는 2 이상의 정수여야 합니다.");
  }
  if (midtermWeight === undefined || midtermWeight < 0) {
    errors.push("중간고사 가중치는 0 이상의 숫자여야 합니다.");
  }
  if (finalWeight === undefined || finalWeight < 0) {
    errors.push("기말고사 가중치는 0 이상의 숫자여야 합니다.");
  }
  if (
    midtermWeight !== undefined &&
    finalWeight !== undefined &&
    midtermWeight + finalWeight <= 0
  ) {
    errors.push("중간고사와 기말고사 가중치의 합은 0보다 커야 합니다.");
  }

  const midterm = validateExamInputs(inputs.midterm, "중간고사", errors, warnings);
  const finalExam = validateExamInputs(inputs.finalExam, "기말고사", errors, warnings);

  if (
    errors.length > 0 ||
    n === undefined ||
    midtermWeight === undefined ||
    finalWeight === undefined ||
    midterm === undefined ||
    finalExam === undefined
  ) {
    return { errors, warnings, isRequiredComplete: true };
  }

  const weightSum = midtermWeight + finalWeight;
  const normalizedMidtermWeight = midtermWeight / weightSum;
  const normalizedFinalWeight = finalWeight / weightSum;
  if (Math.abs(weightSum - 1) > 1e-9 && Math.abs(weightSum - 100) > 1e-9) {
    warnings.push("가중치는 입력한 두 값의 합으로 자동 정규화됩니다.");
  }
  if (n < 30) {
    warnings.push("표본수가 작아 실제 석차와 차이가 클 수 있습니다.");
  }
  warnings.push("중간고사와 기말고사 점수 분포는 서로 독립이라고 가정해 최종 분포를 근사합니다.");
  if (midterm.mode === "quantile" || finalExam.mode === "quantile") {
    warnings.push("분위수 기반 분포가 포함되어 최종 분포는 격자 근사로 계산됩니다.");
  }

  return {
    parsed: {
      midterm,
      finalExam,
      midtermWeight,
      finalWeight,
      normalizedMidtermWeight,
      normalizedFinalWeight,
      finalScore:
        normalizedMidtermWeight * midterm.score + normalizedFinalWeight * finalExam.score,
      n,
      direction: inputs.direction,
    },
    errors,
    warnings,
    isRequiredComplete: true,
  };
}

function parseNumber(value: string): number | undefined {
  if (value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function examRequiredComplete(inputs: ExamInputs): boolean {
  return ["score", "mean", "sd"].every((field) => inputs[field as keyof ExamInputs].trim() !== "");
}

function validateExamInputs(
  inputs: ExamInputs,
  label: string,
  errors: string[],
  warnings: string[],
): ParsedExamInputs | undefined {
  const score = parseNumber(inputs.score);
  const mean = parseNumber(inputs.mean);
  const sd = parseNumber(inputs.sd);

  if (score === undefined) errors.push(`${label} 내 점수는 숫자여야 합니다.`);
  if (mean === undefined) errors.push(`${label} 평균은 숫자여야 합니다.`);
  if (sd === undefined || sd <= 0) errors.push(`${label} 표준편차는 0보다 커야 합니다.`);

  const quantileValues = Object.fromEntries(
    QUANTILE_FIELDS.map((field) => [field, parseNumber(inputs[field])]),
  ) as Record<(typeof QUANTILE_FIELDS)[number], number | undefined>;
  const filledQuantileCount = QUANTILE_FIELDS.filter(
    (field) => inputs[field].trim() !== "",
  ).length;

  for (const field of QUANTILE_FIELDS) {
    if (inputs[field].trim() !== "" && quantileValues[field] === undefined) {
      errors.push(`${label} ${labelFor(field)}은 숫자여야 합니다.`);
    }
  }

  if (filledQuantileCount > 0 && filledQuantileCount < QUANTILE_FIELDS.length) {
    warnings.push(`${label} 분위수 기반 계산을 하려면 Q1, Q2, Q3, min, max를 모두 입력해야 합니다.`);
  }

  if (score === undefined || mean === undefined || sd === undefined || sd <= 0) {
    return undefined;
  }

  const parsed: ParsedExamInputs = {
    score,
    mean,
    sd,
    mode: "normal",
  };

  if (filledQuantileCount === QUANTILE_FIELDS.length) {
    const { min, q1, q2, q3, max } = quantileValues;
    if (
      min === undefined ||
      q1 === undefined ||
      q2 === undefined ||
      q3 === undefined ||
      max === undefined
    ) {
      return parsed;
    }

    if (!(min <= q1 && q1 < q2 && q2 < q3 && q3 <= max)) {
      errors.push(`${label} 분위수는 min <= Q1 < Q2 < Q3 <= max 순서를 만족해야 합니다.`);
    } else {
      parsed.mode = "quantile";
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
        warnings.push(`${label} 분포가 비대칭일 가능성이 큽니다.`);
      }
      if (Math.abs(impliedMean - mean) > sd * 0.5) {
        warnings.push(`${label} 입력 평균과 분위수 기반 근사분포의 평균이 다소 차이납니다.`);
      }
      if (Math.abs(impliedSd - sd) > sd * 0.5) {
        warnings.push(`${label} 입력 표준편차와 분위수 기반 근사분포의 표준편차가 다소 차이납니다.`);
      }
    }
  }

  const min = quantileValues.min;
  const max = quantileValues.max;
  if (min !== undefined && max !== undefined && min <= max) {
    if (mean < min || mean > max) {
      warnings.push(`${label} 평균이 입력된 최솟값과 최댓값 범위 밖에 있습니다.`);
    }
    if (score < min || score > max) {
      warnings.push(`${label} 내 점수가 입력된 최솟값과 최댓값 범위 밖에 있습니다.`);
    }
  }

  return parsed;
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
