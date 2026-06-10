export interface QuantileSummary {
  min: number;
  q1: number;
  q2: number;
  q3: number;
  max: number;
}

export interface QuantileDistributionMoments {
  impliedMean: number;
  impliedSd: number;
}

const POINTS = [0, 0.25, 0.5, 0.75, 1] as const;

export function quantileCDF(score: number, summary: QuantileSummary): number {
  const values = [summary.min, summary.q1, summary.q2, summary.q3, summary.max];

  if (score <= summary.min) return 0;
  if (score >= summary.max) return 1;

  for (let i = 0; i < values.length - 1; i += 1) {
    const leftX = values[i];
    const rightX = values[i + 1];
    const leftP = POINTS[i];
    const rightP = POINTS[i + 1];

    if (score <= rightX) {
      if (rightX === leftX) return rightP;
      return leftP + (rightP - leftP) * ((score - leftX) / (rightX - leftX));
    }
  }

  return 1;
}

export function getQuantileDistributionMoments(
  summary: QuantileSummary,
): QuantileDistributionMoments {
  const segments: Array<[number, number]> = [
    [summary.min, summary.q1],
    [summary.q1, summary.q2],
    [summary.q2, summary.q3],
    [summary.q3, summary.max],
  ];
  const segmentMeans = segments.map(([a, b]) => (a + b) / 2);
  const segmentVars = segments.map(([a, b]) => ((b - a) ** 2) / 12);
  const impliedMean = segmentMeans.reduce((sum, mean) => sum + 0.25 * mean, 0);
  const impliedVariance = segmentVars.reduce(
    (sum, variance, index) =>
      sum + 0.25 * (variance + (segmentMeans[index] - impliedMean) ** 2),
    0,
  );

  return {
    impliedMean,
    impliedSd: Math.sqrt(impliedVariance),
  };
}
