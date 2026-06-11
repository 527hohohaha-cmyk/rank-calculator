import type { RankInputs } from "../types/rank";

type RankPasteField = Exclude<keyof RankInputs, "direction">;

export interface PasteParseResult {
  values: Partial<RankInputs>;
  warnings: string[];
}

const NUMERIC_FIELDS: RankPasteField[] = [
  "score",
  "mean",
  "sd",
  "n",
  "q1",
  "q2",
  "q3",
  "min",
  "max",
];

const LABELS: Record<RankPasteField, string[]> = {
  score: ["score", "내점수", "내 점수", "점수", "x"],
  mean: ["mean", "평균", "avg", "average"],
  sd: ["sd", "표준편차", "표준 편차", "standard deviation", "std"],
  n: ["n", "표본수", "인원", "인원수", "sample size"],
  q1: ["q1", "Q1", "1사분위", "제1사분위"],
  q2: ["q2", "Q2", "중앙값", "median", "med"],
  q3: ["q3", "Q3", "3사분위", "제3사분위"],
  min: ["min", "최소", "최솟값", "최소값"],
  max: ["max", "최대", "최댓값", "최대값"],
};

const NUMBER_PATTERN = "-?\\d+(?:\\.\\d+)?";

export function parsePastedRankInputs(text: string): PasteParseResult {
  const warnings: string[] = [];
  const trimmed = text.trim();

  if (trimmed === "") {
    return {
      values: {},
      warnings: ["붙여넣기 내용이 비어 있습니다."],
    };
  }

  const labelValues = parseLabeledValues(trimmed);
  if (Object.keys(labelValues).length > 0) {
    return { values: labelValues, warnings };
  }

  const numbers = extractNumbers(trimmed);
  if (numbers.length < 4) {
    return {
      values: {},
      warnings: [
        "숫자만 붙여넣을 때는 최소한 내 점수, 평균, 표준편차, 표본수 순서로 4개 이상 입력해야 합니다.",
      ],
    };
  }

  if (numbers.length > NUMERIC_FIELDS.length) {
    warnings.push("입력 가능한 9개 값을 초과한 숫자는 무시했습니다.");
  }

  const values: Partial<RankInputs> = {};
  numbers.slice(0, NUMERIC_FIELDS.length).forEach((value, index) => {
    values[NUMERIC_FIELDS[index]] = value;
  });

  return { values, warnings };
}

function parseLabeledValues(text: string): Partial<RankInputs> {
  const values: Partial<RankInputs> = {};
  const aliases = Object.entries(LABELS)
    .flatMap(([field, labels]) =>
      labels.map((label) => ({ field: field as RankPasteField, label })),
    )
    .sort((a, b) => b.label.length - a.label.length);

  for (const { field, label } of aliases) {
    const pattern = new RegExp(
      `${labelBoundary(label)}${escapeRegex(label)}${labelBoundary(label)}\\s*(?:[:=]\\s*)?(${NUMBER_PATTERN})`,
      "giu",
    );
    for (const match of text.matchAll(pattern)) {
      values[field] = match[1];
    }
  }

  return values;
}

function extractNumbers(text: string): string[] {
  return text.match(new RegExp(NUMBER_PATTERN, "g")) ?? [];
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function labelBoundary(label: string): string {
  return /^[a-z0-9]+$/i.test(label) ? "\\b" : "";
}
