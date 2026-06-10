export function erf(x: number): number {
  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x);
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const t = 1 / (1 + p * absX);
  const y =
    1 -
    (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) *
      t *
      Math.exp(-absX * absX));

  return sign * y;
}

export function normalCDF(x: number, mean: number, sd: number): number {
  if (sd <= 0) {
    throw new Error("표준편차는 0보다 커야 합니다.");
  }

  return 0.5 * (1 + erf((x - mean) / (sd * Math.SQRT2)));
}
