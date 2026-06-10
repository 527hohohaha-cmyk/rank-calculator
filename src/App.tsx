import { useMemo, useState } from "react";
import { InputForm } from "./components/InputForm";
import { ResultCard } from "./components/ResultCard";
import { WarningBox } from "./components/WarningBox";
import { normalCDF } from "./lib/normal";
import { quantileCDF } from "./lib/quantile";
import { probabilityToRank } from "./lib/rank";
import { validateInputs } from "./lib/validation";
import type { RankInputs } from "./types/rank";

const initialInputs: RankInputs = {
  score: "",
  mean: "",
  sd: "",
  n: "",
  q1: "",
  q2: "",
  q3: "",
  min: "",
  max: "",
  direction: "higher",
};

export default function App() {
  const [inputs, setInputs] = useState<RankInputs>(initialInputs);

  const validation = useMemo(() => validateInputs(inputs), [inputs]);
  const result = useMemo(() => {
    if (!validation.parsed || !validation.mode || validation.errors.length > 0) {
      return undefined;
    }

    const { parsed, mode } = validation;
    const p =
      mode === "quantile" &&
      parsed.min !== undefined &&
      parsed.q1 !== undefined &&
      parsed.q2 !== undefined &&
      parsed.q3 !== undefined &&
      parsed.max !== undefined
        ? quantileCDF(parsed.score, {
            min: parsed.min,
            q1: parsed.q1,
            q2: parsed.q2,
            q3: parsed.q3,
            max: parsed.max,
          })
        : normalCDF(parsed.score, parsed.mean, parsed.sd);

    return probabilityToRank(p, parsed.n, parsed.direction, mode);
  }, [validation]);

  const warnings = [...validation.warnings];
  if (result?.rangeIsUnstable) {
    warnings.push("불확실성 범위가 불안정할 수 있습니다.");
  }

  function handleChange(field: keyof RankInputs, value: string) {
    setInputs((current) => ({ ...current, [field]: value }));
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">요약통계량 기반</p>
          <h1>석차계산기</h1>
        </div>
        <p>
          원자료 없이 평균, 표준편차, 분위수 요약값으로 예상 석차와 백분위를 계산합니다.
        </p>
      </header>

      <div className="layout">
        <InputForm inputs={inputs} onChange={handleChange} />
        <div className="side-column">
          <WarningBox errors={validation.errors} warnings={warnings} />
          {!validation.isRequiredComplete && (
            <section className="panel empty-state">
              <h2>필수 입력값을 입력하세요</h2>
              <p>내 점수, 평균, 표준편차, 표본수가 모두 있어야 결과가 표시됩니다.</p>
            </section>
          )}
          {validation.isRequiredComplete && result && validation.parsed && (
            <ResultCard result={result} n={validation.parsed.n} />
          )}
        </div>
      </div>

      <section className="caution-box">
        <h2>통계적 주의사항</h2>
        <p>
          평균과 표준편차만 입력하면 정규분포를 가정합니다. Q1, Q2, Q3, min, max를
          모두 입력하면 분위수 기반 근사분포를 사용합니다.
        </p>
        <p>
          Q값이 있어도 실제 분포를 완전히 복원할 수 없으므로 결과는 확정 석차가
          아니라 근사 추정에 따른 예상 석차입니다.
        </p>
      </section>
    </main>
  );
}
