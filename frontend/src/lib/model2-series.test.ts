import { describe, expect, it } from "vitest";
import { selectActiveModel2Records } from "./model2-series";

describe("selectActiveModel2Records", () => {
  it("keeps only records for the active prediction target", () => {
    const records = [
      { predictionDateIso: "2026-07-10", observedAt: "2026-07-09T20:00:00Z", pointPrediction: 7400 },
      { predictionDateIso: "2026-07-13", observedAt: "2026-07-10T20:00:00Z", pointPrediction: 7550 },
    ];

    expect(selectActiveModel2Records(records, "2026-07-13")).toEqual([records[1]]);
  });

  it("drops the pre-sync clock epoch once synced records exist", () => {
    const records = [
      {
        predictionDateIso: "2026-07-13",
        observedAt: "2026-07-10T10:49:00Z",
        pointPrediction: 7392.75,
        clockSyncUsed: false,
      },
      {
        predictionDateIso: "2026-07-13",
        observedAt: "2026-07-10T10:53:00Z",
        pointPrediction: 7563.55,
        clockSyncUsed: true,
      },
    ];

    expect(selectActiveModel2Records(records, "2026-07-13")).toEqual([records[1]]);
  });

  it("keeps unsynced records when no synced epoch exists yet", () => {
    const records = [
      {
        predictionDateIso: "2026-07-13",
        observedAt: "2026-07-10T10:49:00Z",
        pointPrediction: 7392.75,
        clockSyncUsed: false,
      },
    ];

    expect(selectActiveModel2Records(records, "2026-07-13")).toEqual(records);
  });
});
