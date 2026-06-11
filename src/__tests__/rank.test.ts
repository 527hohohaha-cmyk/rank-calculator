import { describe, expect, it } from "vitest";
import { calculateMixedDistributionCDF, weightedNormalMoments } from "../lib/mixedDistribution";
import { normalCDF } from "../lib/normal";
import { getQuantileDistributionMoments, quantileCDF } from "../lib/quantile";
import { probabilityToRank } from "../lib/rank";
import { validateCombinedInputs, validateInputs } from "../lib/validation";

describe("normalCDF", () => {
  it("returns about 0.5 at the mean", () => {
    expect(normalCDF(70, 70, 10)).toBeCloseTo(0.5, 3);
  });

  it("returns about 0.8413 at mean plus one standard deviation", () => {
    expect(normalCDF(80, 70, 10)).toBeCloseTo(0.8413, 3);
  });
});

describe("quantileCDF", () => {
  const summary = {
    min: 0,
    q1: 25,
    q2: 50,
    q3: 75,
    max: 100,
  };

  it("returns exact probabilities at Q1, Q2, and Q3", () => {
    expect(quantileCDF(25, summary)).toBeCloseTo(0.25);
    expect(quantileCDF(50, summary)).toBeCloseTo(0.5);
    expect(quantileCDF(75, summary)).toBeCloseTo(0.75);
  });
});

describe("getQuantileDistributionMoments", () => {
  it("calculates the implied mean for evenly spaced quantiles", () => {
    const moments = getQuantileDistributionMoments({
      min: 0,
      q1: 25,
      q2: 50,
      q3: 75,
      max: 100,
    });

    expect(moments.impliedMean).toBeCloseTo(50);
  });

  it("calculates a positive implied standard deviation", () => {
    const moments = getQuantileDistributionMoments({
      min: 0,
      q1: 25,
      q2: 50,
      q3: 75,
      max: 100,
    });

    expect(moments.impliedSd).toBeGreaterThan(0);
  });
});

describe("probabilityToRank", () => {
  it("gives a better rank when p is larger and higher scores are better", () => {
    const lowerP = probabilityToRank(0.6, 100, "higher", "normal");
    const higherP = probabilityToRank(0.9, 100, "higher", "normal");

    expect(higherP.expectedRank).toBeLessThan(lowerP.expectedRank);
  });

  it("gives a better rank when p is smaller and lower scores are better", () => {
    const lowerP = probabilityToRank(0.1, 100, "lower", "normal");
    const higherP = probabilityToRank(0.4, 100, "lower", "normal");

    expect(lowerP.expectedRank).toBeLessThan(higherP.expectedRank);
  });
});

describe("calculateMixedDistributionCDF", () => {
  const combinedInputs = {
    midterm: {
      score: 80,
      mean: 70,
      sd: 10,
      mode: "normal" as const,
    },
    finalExam: {
      score: 90,
      mean: 80,
      sd: 10,
      mode: "normal" as const,
    },
    midtermWeight: 40,
    finalWeight: 60,
    normalizedMidtermWeight: 0.4,
    normalizedFinalWeight: 0.6,
    finalScore: 86,
    n: 100,
    direction: "higher" as const,
  };

  it("calculates weighted normal moments", () => {
    const moments = weightedNormalMoments(combinedInputs);

    expect(moments.mean).toBeCloseTo(76);
    expect(moments.sd).toBeCloseTo(Math.sqrt(52));
  });

  it("returns about 0.5 at the weighted mean for normal exams", () => {
    const input = {
      ...combinedInputs,
      midterm: { ...combinedInputs.midterm, score: 70 },
      finalExam: { ...combinedInputs.finalExam, score: 80 },
      finalScore: 76,
    };
    const result = calculateMixedDistributionCDF(input);

    expect(result.cumulativeProbability).toBeCloseTo(0.5, 3);
    expect(result.method).toBe("normal");
  });
});

describe("validateInputs", () => {
  const baseInputs = {
    score: "80",
    mean: "70",
    sd: "10",
    n: "100",
    q1: "",
    q2: "",
    q3: "",
    min: "",
    max: "",
    direction: "higher" as const,
  };

  it("rejects sd <= 0", () => {
    const result = validateInputs({ ...baseInputs, sd: "0" });

    expect(result.errors).toContain("표준편차는 0보다 커야 합니다.");
  });

  it("rejects n < 2", () => {
    const result = validateInputs({ ...baseInputs, n: "1" });

    expect(result.errors).toContain("표본수는 2 이상의 정수여야 합니다.");
  });

  it("rejects invalid quantile order", () => {
    const result = validateInputs({
      ...baseInputs,
      min: "30",
      q1: "20",
      q2: "50",
      q3: "75",
      max: "100",
    });

    expect(result.errors).toContain("분위수는 min <= Q1 < Q2 < Q3 <= max 순서를 만족해야 합니다.");
  });

  it("warns when the input mean differs from the quantile implied mean", () => {
    const result = validateInputs({
      ...baseInputs,
      mean: "10",
      sd: "10",
      min: "0",
      q1: "25",
      q2: "50",
      q3: "75",
      max: "100",
    });

    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toContain(
      "입력한 평균과 분위수 기반 근사분포의 평균이 다소 차이납니다. 요약통계량이 서로 일관적인지 확인하세요.",
    );
  });

  it("warns when the input sd differs from the quantile implied sd", () => {
    const result = validateInputs({
      ...baseInputs,
      mean: "50",
      sd: "1",
      min: "0",
      q1: "25",
      q2: "50",
      q3: "75",
      max: "100",
    });

    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toContain(
      "입력한 표준편차와 분위수 기반 근사분포의 표준편차가 다소 차이납니다. 실제 분포 추정의 불확실성이 커질 수 있습니다.",
    );
  });
});

describe("validateCombinedInputs", () => {
  const baseInputs = {
    midterm: {
      score: "80",
      mean: "70",
      sd: "10",
      q1: "",
      q2: "",
      q3: "",
      min: "",
      max: "",
    },
    finalExam: {
      score: "90",
      mean: "80",
      sd: "10",
      q1: "",
      q2: "",
      q3: "",
      min: "",
      max: "",
    },
    midtermWeight: "40",
    finalWeight: "60",
    n: "100",
    direction: "higher" as const,
  };

  it("normalizes weights and calculates the final score", () => {
    const result = validateCombinedInputs(baseInputs);

    expect(result.errors).toHaveLength(0);
    expect(result.parsed?.normalizedMidtermWeight).toBeCloseTo(0.4);
    expect(result.parsed?.normalizedFinalWeight).toBeCloseTo(0.6);
    expect(result.parsed?.finalScore).toBeCloseTo(86);
  });

  it("rejects zero total weight", () => {
    const result = validateCombinedInputs({
      ...baseInputs,
      midtermWeight: "0",
      finalWeight: "0",
    });

    expect(result.errors).toContain("중간고사와 기말고사 가중치의 합은 0보다 커야 합니다.");
  });
});
