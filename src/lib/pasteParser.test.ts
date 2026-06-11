import { describe, expect, it } from "vitest";
import { parsePastedExamInputs, parsePastedRankInputs } from "./pasteParser";

describe("parsePastedRankInputs", () => {
  it("parses four numeric values in order", () => {
    const result = parsePastedRankInputs("80 70 10 100");

    expect(result.values).toMatchObject({
      score: "80",
      mean: "70",
      sd: "10",
      n: "100",
    });
  });

  it("parses nine numeric values in order", () => {
    const result = parsePastedRankInputs("80 70 10 100 60 70 80 40 100");

    expect(result.values).toMatchObject({
      score: "80",
      mean: "70",
      sd: "10",
      n: "100",
      q1: "60",
      q2: "70",
      q3: "80",
      min: "40",
      max: "100",
    });
  });

  it("parses comma-separated numeric values", () => {
    const result = parsePastedRankInputs("80, 70, 10, 100");

    expect(result.values).toMatchObject({
      score: "80",
      mean: "70",
      sd: "10",
      n: "100",
    });
  });

  it("parses tab-separated numeric values", () => {
    const result = parsePastedRankInputs("80\t70\t10\t100");

    expect(result.values).toMatchObject({
      score: "80",
      mean: "70",
      sd: "10",
      n: "100",
    });
  });

  it("parses Korean labeled values", () => {
    const result = parsePastedRankInputs(`내 점수: 80
평균: 70
표준편차: 10
표본수: 100`);

    expect(result.values).toMatchObject({
      score: "80",
      mean: "70",
      sd: "10",
      n: "100",
    });
  });

  it("parses English labeled values", () => {
    const result = parsePastedRankInputs("score=80 mean=70 sd=10 n=100");

    expect(result.values).toMatchObject({
      score: "80",
      mean: "70",
      sd: "10",
      n: "100",
    });
  });

  it("parses partial labeled values only", () => {
    const result = parsePastedRankInputs("평균 70 표준편차 10");

    expect(result.values).toMatchObject({
      mean: "70",
      sd: "10",
    });
    expect(result.values.score).toBeUndefined();
    expect(result.values.n).toBeUndefined();
  });

  it("warns when fewer than four numeric values are pasted", () => {
    const result = parsePastedRankInputs("80 70 10");

    expect(result.values).toEqual({});
    expect(result.warnings).toContain(
      "숫자만 붙여넣을 때는 최소한 내 점수, 평균, 표준편차, 표본수 순서로 4개 이상 입력해야 합니다.",
    );
  });

  it("ignores numeric values beyond the ninth value with a warning", () => {
    const result = parsePastedRankInputs("80 70 10 100 60 70 80 40 100 999");

    expect(result.values).toMatchObject({
      score: "80",
      mean: "70",
      sd: "10",
      n: "100",
      q1: "60",
      q2: "70",
      q3: "80",
      min: "40",
      max: "100",
    });
    expect(result.warnings).toContain("입력 가능한 9개 값을 초과한 숫자는 무시했습니다.");
  });
});

describe("parsePastedExamInputs", () => {
  it("parses three numeric exam values in order", () => {
    const result = parsePastedExamInputs("80 70 10");

    expect(result.values).toMatchObject({
      score: "80",
      mean: "70",
      sd: "10",
    });
  });

  it("parses eight numeric exam values in order", () => {
    const result = parsePastedExamInputs("80 70 10 60 70 80 40 100");

    expect(result.values).toMatchObject({
      score: "80",
      mean: "70",
      sd: "10",
      q1: "60",
      q2: "70",
      q3: "80",
      min: "40",
      max: "100",
    });
  });

  it("parses labeled exam values and ignores n", () => {
    const result = parsePastedExamInputs(
      "내 점수 80 평균 70 표준편차 10 표본수 100 Q1 60",
    );

    expect(result.values).toMatchObject({
      score: "80",
      mean: "70",
      sd: "10",
      q1: "60",
    });
    expect("n" in result.values).toBe(false);
  });

  it("warns when fewer than three numeric exam values are pasted", () => {
    const result = parsePastedExamInputs("80 70");

    expect(result.values).toEqual({});
    expect(result.warnings).toContain(
      "시험별 숫자만 붙여넣을 때는 최소한 내 점수, 평균, 표준편차 순서로 3개 이상 입력해야 합니다.",
    );
  });

  it("ignores numeric exam values beyond the eighth value with a warning", () => {
    const result = parsePastedExamInputs("80 70 10 60 70 80 40 100 999");

    expect(result.values).toMatchObject({
      score: "80",
      mean: "70",
      sd: "10",
      q1: "60",
      q2: "70",
      q3: "80",
      min: "40",
      max: "100",
    });
    expect(result.warnings).toContain("시험별 입력 가능한 8개 값을 초과한 숫자는 무시했습니다.");
  });
});
