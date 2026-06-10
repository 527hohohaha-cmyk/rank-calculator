import type { RankResult } from "../types/rank";

interface ResultCardProps {
  result: RankResult;
  n: number;
}

export function ResultCard({ result, n }: ResultCardProps) {
  const modeLabel = result.mode === "normal" ? "정규분포 가정" : "분위수 기반 근사분포";

  return (
    <section className="panel result-panel" aria-labelledby="result-title">
      <div className="panel-header">
        <div>
          <p className="eyebrow">근사 추정 결과</p>
          <h2 id="result-title">예상 석차</h2>
        </div>
        <span className="mode-pill strong">{modeLabel}</span>
      </div>

      <div className="rank-hero">
        <span className="rank-value">약 {formatRank(result.expectedRank)}등</span>
        <span className="rank-total">/ {n.toLocaleString("ko-KR")}명</span>
      </div>

      <div className="metric-grid">
        <div className="metric">
          <span>상위 백분율</span>
          <strong>상위 {formatPercent(result.topPercent)}%</strong>
        </div>
        <div className="metric">
          <span>누적 백분위</span>
          <strong>{formatPercent(result.percentile)} percentile</strong>
        </div>
        <div className="metric wide">
          <span>대략적 범위</span>
          <strong>
            {formatRank(result.lowerRank)}등 ~ {formatRank(result.upperRank)}등
          </strong>
        </div>
      </div>

      <div className="interpretation">
        <p>입력된 요약통계량을 바탕으로 한 예상값입니다.</p>
        <p>원자료가 없으므로 실제 석차와 차이가 날 수 있습니다.</p>
      </div>
    </section>
  );
}

function formatPercent(value: number): string {
  return value.toLocaleString("ko-KR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

function formatRank(value: number): string {
  return Math.round(value).toLocaleString("ko-KR");
}
