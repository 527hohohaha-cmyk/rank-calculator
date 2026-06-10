import type { CalculationMode, RankResult, ScoreDirection } from "../types/rank";

export function probabilityToRank(
  cumulativeProbability: number,
  n: number,
  direction: ScoreDirection,
  mode: CalculationMode,
): RankResult {
  const p = clamp(cumulativeProbability, 0, 1);
  const upperProbability = direction === "higher" ? 1 - p : p;
  const meanY = (n - 1) * upperProbability;
  const varianceY = (n - 1) * upperProbability * (1 - upperProbability);
  const sdY = Math.sqrt(varianceY);
  const lowerRank = 1 + Math.max(0, meanY - 1.96 * sdY);
  const upperRank = 1 + Math.min(n - 1, meanY + 1.96 * sdY);

  return {
    mode,
    cumulativeProbability: p,
    upperProbability,
    expectedRank: 1 + meanY,
    topPercent: upperProbability * 100,
    percentile: p * 100,
    lowerRank,
    upperRank,
    rangeIsUnstable: n < 30 || upperProbability < 0.02 || upperProbability > 0.98,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
