# Model2 EWY/FX Clock Sync Work Spec

Date: 2026-06-09 KST

## Scope

Add a manual reference-clock sync path for independent Model2 so an already-running primary live model and Model2
can start from the same EWY/FX display reference when Model2 is repaired or reissued after the primary model has
already synchronized its live clock.

This is a Model2 JSON generation and operations workflow change. It must not change the primary prediction model,
Cloud Run refresh behavior, Cloud Scheduler cadence, frontend rendering, or Firebase Hosting rewrites.

## Problem

Model2 was correctly isolated from night-futures input, but after a late manual repair it reused the KOSPI close
baseline while the primary model had already synchronized its EWY/FX display clock. That made Model2 appear stuck
around the older KOSPI-close reference even though the homepage EWY+FX simple conversion had moved materially higher.

The specific production symptom was:

- primary model and Model2 both targeted `2026-06-09`;
- primary EWY+FX simple point was around the high `7,800` range;
- Model2 stayed around `7,718.119` because its reference clock had not been synchronized.

## Implemented Behavior

`refresh-holiday-prediction` now supports a manual `clock_sync=on` dispatch input.

When `clock_sync=on` is used:

- Model2 baseline point is reset to the primary payload's `ewyFxSimplePoint` for the same `predictionDateIso`;
- Model2 baseline prices are reset to the current EWY/KRW and composite prices at that sync timestamp;
- Model2 continues to calculate its own point prediction from EWY/KRW, diagnostics, residual features, and its
  trend-follow floor;
- Model2 records `clockSyncUsed: true`, `clockSyncSource: primary_ewy_fx_simple_clock_sync`, and
  `clockSyncPoint`;
- Model2 still publishes `usesOtherModelPrediction: false`, `nightFuturesUsed: false`, and
  `nightFuturesReadThisRun: false`.

The clock sync target is the primary EWY+FX simple point, not the primary `pointPrediction`.

After a clock-sync baseline exists, forced Model2 reissues must preserve that baseline unless `clock_sync=on` is
explicitly requested again. A forced run must not silently fall back to `kospi_close`, because that reintroduces the
reference-clock gap.

The homepage display also applies a live EWY+FX stale-compensation layer for clock-synced Model2 values. Model2 JSON
records `ewyFxReferencePoint` at generation time, and the frontend adds only the latest primary `ewyFxSimplePoint`
movement after that reference point. This prevents stale Model2 cards when GitHub scheduled runs lag, while avoiding
double-counting after a normal Model2 JSON refresh.

## Files

- `.github/workflows/refresh-holiday-prediction.yml`
- `scripts/refresh_holiday_prediction.py`
- `frontend/src/components/live-dashboard.tsx`
- `frontend/src/lib/data.ts`
- `docs/ALGORITHM.md`
- `docs/CLOUD_RUN_LIVE_REFRESH.md`
- `docs/OPERATIONS_INDEX.md`
- `docs/MODEL2_CLOCK_SYNC_WORK_SPEC_2026-06-09.md`

## Manual Repair Command

Use this only when Model2 needs a one-time reference-clock alignment to the primary EWY+FX simple point:

```bash
gh workflow run refresh-holiday-prediction.yml --ref main -f force=on -f clear_stale=off -f clock_sync=on
```

Do not use this to force Model2 to match the primary model prediction. If the primary model's night-futures bridge
materially diverges from EWY/KRW, a gap can still be valid.

## Safety Constraints

- Do not copy primary `pointPrediction` into Model2.
- Do not read or use night-futures prices in normal or clock-sync Model2 runs.
- Keep `independentModel: true`.
- Keep `usesOtherModelPrediction: false`.
- Keep `nightFuturesUsed: false`.
- Keep `nightFuturesReadThisRun: false`.
- Keep Model2 frontend display gated by matching `predictionDateIso`.
- If frontend stale compensation is used, calculate the drift from `ewyFxReferencePoint` first and fall back to
  `clockSyncPoint` only for older JSON payloads.
- Do not deploy Cloud Run or run Cloud Build for this repair.
- Publish only `holiday_prediction.json`, `holiday_prediction_series.json`, and `holiday_history.json` through the
  Model2 JSON workflow.

## Verification

Local verification:

- `python -m py_compile scripts/refresh_holiday_prediction.py scripts/guard_live_json_publish.py` passed.
- A local clock-sync simulation set `baselineSource` to `primary_ewy_fx_simple_clock_sync`, set
  `clockSyncUsed: true`, matched `clockSyncPoint` to primary `ewyFxSimplePoint`, and produced a Model2 point in
  the same live reference range.
- `python -m unittest tests.test_model2_independence` passed, including the guard that forced runs preserve an
  existing clock-sync baseline.
- `npm run build` passed after adding the homepage live EWY+FX stale-compensation display.
- `git diff --check` passed for the script, workflow, and operations docs.

Production verification:

- Commit: `504ee5fc Add model2 EWY FX clock sync repair`
- Workflow: GitHub Actions `refresh-holiday-prediction`
- Run: `27145266257`
- Dispatch inputs: `force=on`, `clear_stale=off`, `clock_sync=on`
- Result: success
- Published Model2 value: `7,862.5118` (`+5.051858%`)
- Previous stale/reference-misaligned Model2 value: `7,718.119`
- Primary model value at verification: `7,876.16` (`+5.23%`)
- Model2 JSON recorded:
  - `baselineSource: primary_ewy_fx_simple_clock_sync`
  - `clockSyncUsed: true`
  - `nightFuturesUsed: false`
  - `usesOtherModelPrediction: false`

## Cost Guardrail

This repair used the Model2 Cloud Storage JSON workflow only. Cloud Run, Cloud Build, and Firebase Hosting were not
required for the clock-sync JSON repair.
