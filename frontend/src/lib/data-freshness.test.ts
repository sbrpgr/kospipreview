import { describe, expect, it } from "vitest";
import type { HistoryData, IndicatorData, PredictionData } from "./data";
import { calculateDataFreshness } from "./data-freshness";

function fixtures(generatedAt: string, recordDate: string) {
  const prediction = {
    generatedAt,
    lastCalculatedAt: generatedAt,
    latestRecordDate: recordDate,
  } as PredictionData;
  const indicators = {
    generatedAt,
    primary: [{ key: "ewy", label: "EWY", value: "100", changePct: 0, updatedAt: generatedAt }],
    secondary: [],
  } as IndicatorData;
  const history = {
    generatedAt,
    summary: { mae30d: 0 },
    records: [{ date: recordDate }],
  } as HistoryData;
  return { prediction, indicators, history };
}

describe("calculateDataFreshness", () => {
  it("marks recent live data as fresh", () => {
    const now = Date.parse("2026-07-13T00:00:00+09:00");
    const data = fixtures("2026-07-12T14:58:00+00:00", "2026-07-13");

    expect(calculateDataFreshness(data.prediction, data.indicators, data.history, now).status).toBe("fresh");
  });

  it("marks old payloads and records as stale", () => {
    const now = Date.parse("2026-07-13T00:00:00+09:00");
    const data = fixtures("2026-07-08T00:00:00+00:00", "2026-07-07");

    expect(calculateDataFreshness(data.prediction, data.indicators, data.history, now).status).toBe("stale");
  });
});
