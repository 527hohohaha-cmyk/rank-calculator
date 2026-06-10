import type { RankInputs, ScoreDirection } from "../types/rank";

interface InputFormProps {
  inputs: RankInputs;
  onChange: (field: keyof RankInputs, value: string | ScoreDirection) => void;
}

const requiredFields: Array<{
  id: keyof RankInputs;
  label: string;
  placeholder: string;
}> = [
  { id: "score", label: "내 점수", placeholder: "예: 87" },
  { id: "mean", label: "평균", placeholder: "예: 72.5" },
  { id: "sd", label: "표준편차", placeholder: "예: 12.1" },
  { id: "n", label: "표본수", placeholder: "예: 100" },
];

const optionalFields: Array<{
  id: keyof RankInputs;
  label: string;
  placeholder: string;
}> = [
  { id: "q1", label: "Q1", placeholder: "1사분위수" },
  { id: "q2", label: "Q2, 중앙값", placeholder: "중앙값" },
  { id: "q3", label: "Q3", placeholder: "3사분위수" },
  { id: "min", label: "min", placeholder: "최솟값" },
  { id: "max", label: "max", placeholder: "최댓값" },
];

export function InputForm({ inputs, onChange }: InputFormProps) {
  return (
    <section className="panel input-panel" aria-labelledby="input-title">
      <div className="panel-header">
        <div>
          <p className="eyebrow">요약통계량 입력</p>
          <h2 id="input-title">점수와 통계값</h2>
        </div>
        <span className="mode-pill">
          {inputs.direction === "higher" ? "높을수록 좋음" : "낮을수록 좋음"}
        </span>
      </div>

      <div className="field-grid">
        {requiredFields.map((field) => (
          <label className="field" key={field.id}>
            <span>{field.label} *</span>
            <input
              inputMode="decimal"
              value={inputs[field.id]}
              placeholder={field.placeholder}
              onChange={(event) => onChange(field.id, event.target.value)}
            />
          </label>
        ))}
      </div>

      <div className="segmented" role="radiogroup" aria-label="점수 방향">
        <button
          type="button"
          className={inputs.direction === "higher" ? "active" : ""}
          onClick={() => onChange("direction", "higher")}
        >
          높은 점수가 유리
        </button>
        <button
          type="button"
          className={inputs.direction === "lower" ? "active" : ""}
          onClick={() => onChange("direction", "lower")}
        >
          낮은 점수가 유리
        </button>
      </div>

      <div className="optional-block">
        <div>
          <p className="eyebrow">선택 입력</p>
          <h3>분위수 정보</h3>
        </div>
        <div className="field-grid compact">
          {optionalFields.map((field) => (
            <label className="field" key={field.id}>
              <span>{field.label}</span>
              <input
                inputMode="decimal"
                value={inputs[field.id]}
                placeholder={field.placeholder}
                onChange={(event) => onChange(field.id, event.target.value)}
              />
            </label>
          ))}
        </div>
      </div>
    </section>
  );
}
