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

export function inverseNormalCDF(p: number, mean = 0, sd = 1): number {
  if (sd <= 0) {
    throw new Error("표준편차는 0보다 커야 합니다.");
  }
  if (p <= 0) return Number.NEGATIVE_INFINITY;
  if (p >= 1) return Number.POSITIVE_INFINITY;

  const a = [
    -3.969683028665376e1,
    2.209460984245205e2,
    -2.759285104469687e2,
    1.38357751867269e2,
    -3.066479806614716e1,
    2.506628277459239,
  ];
  const b = [
    -5.447609879822406e1,
    1.615858368580409e2,
    -1.556989798598866e2,
    6.680131188771972e1,
    -1.328068155288572e1,
  ];
  const c = [
    -7.784894002430293e-3,
    -3.223964580411365e-1,
    -2.400758277161838,
    -2.549732539343734,
    4.374664141464968,
    2.938163982698783,
  ];
  const d = [
    7.784695709041462e-3,
    3.224671290700398e-1,
    2.445134137142996,
    3.754408661907416,
  ];
  const plow = 0.02425;
  const phigh = 1 - plow;
  let z: number;

  if (p < plow) {
    const q = Math.sqrt(-2 * Math.log(p));
    z =
      (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  } else if (p <= phigh) {
    const q = p - 0.5;
    const r = q * q;
    z =
      (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) *
      q /
      (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  } else {
    const q = Math.sqrt(-2 * Math.log(1 - p));
    z =
      -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }

  return mean + sd * z;
}
