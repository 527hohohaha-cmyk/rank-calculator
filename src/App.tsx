import { useMemo, useState } from "react";
import { CombinedExamForm } from "./components/CombinedExamForm";
import { InputForm } from "./components/InputForm";
import { ResultCard } from "./components/ResultCard";
import { WarningBox } from "./components/WarningBox";
import { calculateMixedDistributionCDF } from "./lib/mixedDistribution";
import { normalCDF } from "./lib/normal";
import { parsePastedExamInputs, parsePastedRankInputs } from "./lib/pasteParser";
import { quantileCDF } from "./lib/quantile";
import { probabilityToRank } from "./lib/rank";
import { validateCombinedInputs, validateInputs } from "./lib/validation";
import type { CombinedRankInputs, ExamInputs, RankInputs, RankResult } from "./types/rank";

const defaultInputs: RankInputs = {
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

const emptyExamInputs: ExamInputs = {
  score: "",
  mean: "",
  sd: "",
  q1: "",
  q2: "",
  q3: "",
  min: "",
  max: "",
};

const initialCombinedInputs: CombinedRankInputs = {
  midterm: { ...emptyExamInputs },
  finalExam: { ...emptyExamInputs },
  midtermWeight: "40",
  finalWeight: "60",
  n: "",
  direction: "higher",
};

export default function App() {
  const [calculatorMode, setCalculatorMode] = useState<"single" | "combined">("single");
  const [inputs, setInputs] = useState<RankInputs>(defaultInputs);
  const [combinedInputs, setCombinedInputs] =
    useState<CombinedRankInputs>(initialCombinedInputs);
  const [pasteWarnings, setPasteWarnings] = useState<string[]>([]);
  const [combinedPasteWarnings, setCombinedPasteWarnings] = useState<string[]>([]);

  const validation = useMemo(() => validateInputs(inputs), [inputs]);
  const combinedValidation = useMemo(
    () => validateCombinedInputs(combinedInputs),
    [combinedInputs],
  );
  const singleResults = useMemo((): RankResult[] | undefined => {
    if (!validation.parsed || !validation.mode || validation.errors.length > 0) {
      return undefined;
    }

    const { parsed, mode } = validation;
    const normalResult = probabilityToRank(
      normalCDF(parsed.score, parsed.mean, parsed.sd),
      parsed.n,
      parsed.direction,
      "normal",
    );

    if (mode !== "quantile") {
      return [normalResult];
    }

    const quantileP =
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
        : undefined;

    if (quantileP === undefined) {
      return [normalResult];
    }

    return [
      probabilityToRank(quantileP, parsed.n, parsed.direction, "quantile"),
      normalResult,
    ];
  }, [validation]);

  const combinedResults = useMemo((): RankResult[] | undefined => {
    if (!combinedValidation.parsed || combinedValidation.errors.length > 0) {
      return undefined;
    }

    const mixed = calculateMixedDistributionCDF(combinedValidation.parsed);
    return [
      probabilityToRank(
        mixed.cumulativeProbability,
        combinedValidation.parsed.n,
        combinedValidation.parsed.direction,
        "mixed",
      ),
    ];
  }, [combinedValidation]);

  const activeValidation =
    calculatorMode === "single" ? validation : combinedValidation;
  const results = calculatorMode === "single" ? singleResults : combinedResults;
  const activeN =
    calculatorMode === "single" ? validation.parsed?.n : combinedValidation.parsed?.n;
  const warnings = [
    ...activeValidation.warnings,
    ...(calculatorMode === "single" ? pasteWarnings : combinedPasteWarnings),
  ];
  if (results?.some((result) => result.rangeIsUnstable)) {
    warnings.push("불확실성 범위가 불안정할 수 있습니다.");
  }

  function handleChange(field: keyof RankInputs, value: string | RankInputs["direction"]) {
    setPasteWarnings([]);
    setInputs((current) => ({ ...current, [field]: value }));
  }

  function handleReset() {
    setInputs(defaultInputs);
    setPasteWarnings([]);
  }

  function handleApplyPastedText(text: string) {
    const parsed = parsePastedRankInputs(text);
    setPasteWarnings(parsed.warnings);

    if (Object.keys(parsed.values).length === 0) {
      return;
    }

    setInputs((current) => ({
      ...current,
      ...parsed.values,
    }));
  }

  function handleCombinedChange(
    field: "midtermWeight" | "finalWeight" | "n" | "direction",
    value: string | RankInputs["direction"],
  ) {
    setCombinedPasteWarnings([]);
    setCombinedInputs((current) => ({ ...current, [field]: value }));
  }

  function handleCombinedExamChange(
    exam: "midterm" | "finalExam",
    field: keyof ExamInputs,
    value: string,
  ) {
    setCombinedPasteWarnings([]);
    setCombinedInputs((current) => ({
      ...current,
      [exam]: {
        ...current[exam],
        [field]: value,
      },
    }));
  }

  function handleApplyExamPastedText(exam: "midterm" | "finalExam", text: string) {
    const parsed = parsePastedExamInputs(text);
    const examLabel = exam === "midterm" ? "중간고사" : "기말고사";
    setCombinedPasteWarnings(
      parsed.warnings.map((warning) => `${examLabel}: ${warning}`),
    );

    if (Object.keys(parsed.values).length === 0) {
      return;
    }

    setCombinedInputs((current) => ({
      ...current,
      [exam]: {
        ...current[exam],
        ...parsed.values,
      },
    }));
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

      <div className="mode-switch" role="tablist" aria-label="계산기 모드">
        <button
          type="button"
          className={calculatorMode === "single" ? "active" : ""}
          onClick={() => setCalculatorMode("single")}
        >
          단일 시험
        </button>
        <button
          type="button"
          className={calculatorMode === "combined" ? "active" : ""}
          onClick={() => setCalculatorMode("combined")}
        >
          중간+기말
        </button>
      </div>

      <div className="layout">
        {calculatorMode === "single" ? (
          <InputForm
            inputs={inputs}
            onChange={handleChange}
            onReset={handleReset}
            onApplyPastedText={handleApplyPastedText}
            onClearPasteWarnings={() => setPasteWarnings([])}
          />
        ) : (
          <CombinedExamForm
            inputs={combinedInputs}
            onChange={handleCombinedChange}
            onExamChange={handleCombinedExamChange}
            onApplyExamPastedText={handleApplyExamPastedText}
            onClearPasteWarnings={() => setCombinedPasteWarnings([])}
          />
        )}
        <div className="side-column">
          <WarningBox errors={activeValidation.errors} warnings={warnings} />
          {!activeValidation.isRequiredComplete && (
            <section className="panel empty-state">
              <h2>필수 입력값을 입력하세요</h2>
              <p>
                {calculatorMode === "single"
                  ? "내 점수, 평균, 표준편차, 표본수가 모두 있어야 결과가 표시됩니다."
                  : "중간고사와 기말고사의 내 점수, 평균, 표준편차, 표본수, 가중치가 모두 있어야 결과가 표시됩니다."}
              </p>
            </section>
          )}
          {activeValidation.isRequiredComplete && results && activeN !== undefined && (
            <div className="result-stack">
              {results.map((result) => (
                <ResultCard key={result.mode} result={result} n={activeN} />
              ))}
            </div>
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
        <p>
          중간+기말 모드는 두 시험 분포가 독립이라고 가정하고 가중합 분포를 근사합니다.
          실제 두 시험 점수의 상관관계가 크면 결과가 달라질 수 있습니다.
        </p>
      </section>
    </main>
  );
}
