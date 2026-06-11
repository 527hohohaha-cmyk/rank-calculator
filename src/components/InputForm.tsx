import { useState } from "react";
import type { RankInputs, ScoreDirection } from "../types/rank";

interface InputFormProps {
  inputs: RankInputs;
  onChange: (field: keyof RankInputs, value: string | ScoreDirection) => void;
  onReset: () => void;
  onApplyPastedText: (text: string) => void;
  onClearPasteWarnings: () => void;
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

export function InputForm({
  inputs,
  onChange,
  onReset,
  onApplyPastedText,
  onClearPasteWarnings,
}: InputFormProps) {
  const [pasteText, setPasteText] = useState("");

  function handleApplyPaste() {
    onApplyPastedText(pasteText);
  }

  function handleClearPasteText() {
    setPasteText("");
    onClearPasteWarnings();
  }

  function handleReset() {
    setPasteText("");
    onClearPasteWarnings();
    onReset();
  }

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

      <div className="paste-box">
        <div>
          <p className="eyebrow">복사붙여넣기 자동 입력</p>
          <h3>복사붙여넣기 자동 입력</h3>
          <p className="helper-text">
            엑셀, 메모장, 카카오톡 등에서 복사한 값을 붙여넣으면 입력칸에 자동 반영할 수 있습니다.
          </p>
        </div>
        <textarea
          value={pasteText}
          onChange={(event) => setPasteText(event.target.value)}
          placeholder={
            "예: 내 점수 80 평균 70 표준편차 10 표본수 100 Q1 60 Q2 70 Q3 80 min 40 max 100\n또는 엑셀에서 80 70 10 100 60 70 80 40 100 순서로 붙여넣기"
          }
          rows={4}
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

      <div className="form-actions">
        <button type="button" className="secondary-action danger" onClick={handleReset}>
          초기화
        </button>
      </div>
    </section>
  );
}
