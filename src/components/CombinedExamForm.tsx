import type { CombinedRankInputs, ExamInputs, ScoreDirection } from "../types/rank";

interface CombinedExamFormProps {
  inputs: CombinedRankInputs;
  onExamChange: (
    exam: "midterm" | "finalExam",
    field: keyof ExamInputs,
    value: string,
  ) => void;
  onChange: (
    field: "midtermWeight" | "finalWeight" | "n" | "direction",
    value: string | ScoreDirection,
  ) => void;
}

const requiredFields: Array<{
  id: keyof ExamInputs;
  label: string;
  placeholder: string;
}> = [
  { id: "score", label: "내 점수", placeholder: "예: 87" },
  { id: "mean", label: "평균", placeholder: "예: 72.5" },
  { id: "sd", label: "표준편차", placeholder: "예: 12.1" },
];

const optionalFields: Array<{
  id: keyof ExamInputs;
  label: string;
  placeholder: string;
}> = [
  { id: "q1", label: "Q1", placeholder: "1사분위수" },
  { id: "q2", label: "Q2, 중앙값", placeholder: "중앙값" },
  { id: "q3", label: "Q3", placeholder: "3사분위수" },
  { id: "min", label: "min", placeholder: "최솟값" },
  { id: "max", label: "max", placeholder: "최댓값" },
];

export function CombinedExamForm({
  inputs,
  onExamChange,
  onChange,
}: CombinedExamFormProps) {
  return (
    <section className="panel input-panel" aria-labelledby="combined-input-title">
      <div className="panel-header">
        <div>
          <p className="eyebrow">중간+기말 가중합</p>
          <h2 id="combined-input-title">시험별 분포와 가중치</h2>
        </div>
        <span className="mode-pill">
          {inputs.direction === "higher" ? "높을수록 좋음" : "낮을수록 좋음"}
        </span>
      </div>

      <div className="field-grid">
        <label className="field">
          <span>표본수 *</span>
          <input
            inputMode="numeric"
            value={inputs.n}
            placeholder="예: 100"
            onChange={(event) => onChange("n", event.target.value)}
          />
        </label>
        <label className="field">
          <span>중간고사 가중치 *</span>
          <input
            inputMode="decimal"
            value={inputs.midtermWeight}
            placeholder="예: 40"
            onChange={(event) => onChange("midtermWeight", event.target.value)}
          />
        </label>
        <label className="field">
          <span>기말고사 가중치 *</span>
          <input
            inputMode="decimal"
            value={inputs.finalWeight}
            placeholder="예: 60"
            onChange={(event) => onChange("finalWeight", event.target.value)}
          />
        </label>
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

      <ExamSection
        title="중간고사 분포"
        inputs={inputs.midterm}
        onChange={(field, value) => onExamChange("midterm", field, value)}
      />
      <ExamSection
        title="기말고사 분포"
        inputs={inputs.finalExam}
        onChange={(field, value) => onExamChange("finalExam", field, value)}
      />
    </section>
  );
}

interface ExamSectionProps {
  title: string;
  inputs: ExamInputs;
  onChange: (field: keyof ExamInputs, value: string) => void;
}

function ExamSection({ title, inputs, onChange }: ExamSectionProps) {
  return (
    <div className="exam-block">
      <div>
        <p className="eyebrow">시험별 입력</p>
        <h3>{title}</h3>
      </div>
      <div className="field-grid compact">
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
  );
}
