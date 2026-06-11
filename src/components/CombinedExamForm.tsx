import { useState } from "react";
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
  onApplyExamPastedText: (exam: "midterm" | "finalExam", text: string) => void;
  onClearPasteWarnings: () => void;
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
  onApplyExamPastedText,
  onClearPasteWarnings,
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
        onApplyPastedText={(text) => onApplyExamPastedText("midterm", text)}
        onClearPasteWarnings={onClearPasteWarnings}
      />
      <ExamSection
        title="기말고사 분포"
        inputs={inputs.finalExam}
        onChange={(field, value) => onExamChange("finalExam", field, value)}
        onApplyPastedText={(text) => onApplyExamPastedText("finalExam", text)}
        onClearPasteWarnings={onClearPasteWarnings}
      />
    </section>
  );
}

interface ExamSectionProps {
  title: string;
  inputs: ExamInputs;
  onChange: (field: keyof ExamInputs, value: string) => void;
  onApplyPastedText: (text: string) => void;
  onClearPasteWarnings: () => void;
}

function ExamSection({
  title,
  inputs,
  onChange,
  onApplyPastedText,
  onClearPasteWarnings,
}: ExamSectionProps) {
  const [pasteText, setPasteText] = useState("");

  function handleApplyPaste() {
    onApplyPastedText(pasteText);
  }

  function handleClearPasteText() {
    setPasteText("");
    onClearPasteWarnings();
  }

  return (
    <div className="exam-block">
      <div>
        <p className="eyebrow">시험별 입력</p>
        <h3>{title}</h3>
      </div>
      <div className="paste-box compact-paste-box">
        <p className="helper-text">
          {title} 값을 복사해 붙여넣으면 이 시험 입력칸에만 반영됩니다.
        </p>
        <textarea
          value={pasteText}
          onChange={(event) => setPasteText(event.target.value)}
          placeholder={
            "예: 내 점수 80 평균 70 표준편차 10 Q1 60 Q2 70 Q3 80 min 40 max 100\n또는 80 70 10 60 70 80 40 100 순서로 붙여넣기"
          }
          rows={3}
        />
        <div className="form-actions compact-actions">
          <button type="button" className="primary-action" onClick={handleApplyPaste}>
            붙여넣기 적용
          </button>
          <button type="button" className="secondary-action" onClick={handleClearPasteText}>
            내용 지우기
          </button>
        </div>
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
