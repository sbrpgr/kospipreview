# Model2 EWY/FX Clock Sync Work Spec

Date: 2026-06-09 KST

## Scope

Add a manual reference-clock sync path for independent Model2 so an already-running primary live model and Model2
can start from the same live model reference when Model2 is repaired or reissued after the primary model has already
synchronized its live clock.

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

`refresh-holiday-prediction` supports a manual `clock_sync=on` dispatch input.

When `clock_sync=on` is used:

- Model2 baseline point is reset to the primary payload's `pointPrediction` for the same `predictionDateIso` when
  it is available;
- if the primary model point is unavailable, Model2 falls back to the primary payload's `ewyFxSimplePoint`;
- Model2 baseline prices are reset to the current EWY/KRW and composite prices at that sync timestamp;
- after a clock-sync baseline, Model2 tracks later EWY/KRW movement from the synced baseline without adding a second
  residual/intercept offset at the sync instant;
- Model2 records `clockSyncUsed: true`, `clockSyncSource`, `clockSyncPoint`, `clockSyncAnchorKind`, and
  `ewyFxReferencePoint`;
- Model2 still publishes `usesOtherModelPrediction: false`, `nightFuturesUsed: false`, and
  `nightFuturesReadThisRun: false`.

The clock sync target is a one-time baseline alignment. It must not become a continuous copy of the primary model
prediction.

After a clock-sync baseline exists, forced Model2 reissues must preserve that baseline unless `clock_sync=on` is
explicitly requested again. A forced run must not silently fall back to `kospi_close`, because that reintroduces the
reference-clock gap.

The homepage display also applies a live EWY+FX stale-compensation layer for clock-synced Model2 values. Model2 JSON
records `ewyFxReferencePoint` at generation time, and the frontend adds only the latest primary `ewyFxSimplePoint`
movement after that reference point. This prevents stale Model2 cards when GitHub scheduled runs lag, while avoiding
double-counting after a normal Model2 JSON refresh.

2026-06-11 hardening:

- scheduled Model2 runs now auto-apply a one-time `primary_model_prediction_clock_sync` baseline when the current
  target has a non-clock-synced `kospi_close` baseline and the primary payload has a same-target `pointPrediction`;
- auto clock sync does not fall back to `ewyFxSimplePoint`; it waits for the primary model point so normal scheduled
  runs do not anchor to an EWY-only display value;
- once a clock-synced baseline exists for the same target and KRX session, later scheduled or forced reissues reuse
  that baseline instead of repeatedly copying the primary point;
- this protects the new prediction-date rollover where Model2 can otherwise reset to KOSPI close and stop reacting
  through the frontend EWY/FX compensation layer.
- Model2 refetches public `prediction.json` when the seeded local primary snapshot is older than 120 seconds, so
  `clockSyncPrimaryGeneratedAt` and `ewyFxReferencePoint` are tied to a fresh primary reference instead of a stale
  workflow seed.

The current prediction target in the recent-records accuracy table must also use the same frontend-compensated
Model2 value. Do not let `holiday_history.json` raw `model2Prediction` override the live card value for a target
without an actual open.

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

Use this only when Model2 needs a one-time reference-clock alignment to the primary live model point:

```bash
gh workflow run refresh-holiday-prediction.yml --ref main -f force=on -f clear_stale=off -f clock_sync=on
```

Do not use this as a recurring copy of the primary model prediction. If the primary model's night-futures bridge
materially diverges from EWY/KRW after the sync point, a gap can still be valid.

## Safety Constraints

- Do not copy primary `pointPrediction` into normal Model2 runs.
- Manual `clock_sync=on` may use primary `pointPrediction` once as the baseline clock anchor for the same
  `predictionDateIso`.
- Scheduled Model2 runs may auto-use primary `pointPrediction` once only when repairing a non-clock-synced
  same-target `kospi_close` baseline. They must not repeat that sync after a clock-sync baseline exists.
- Scheduled auto clock sync must not fall back to primary `ewyFxSimplePoint`.
- Do not read or use night-futures prices in normal or clock-sync Model2 runs.
- Keep `independentModel: true`.
- Keep `usesOtherModelPrediction: false`.
- Keep `nightFuturesUsed: false`.
- Keep `nightFuturesReadThisRun: false`.
- Keep Model2 frontend display gated by matching `predictionDateIso`.
- Keep Model2 frontend display gated by primary forecast readiness. During KRX regular hours, when the primary
  forecast fields are intentionally blank, clock-synced Model2 must also be hidden instead of falling back to raw
  stale JSON.
- If frontend stale compensation is used, calculate the drift from `ewyFxReferencePoint` first and fall back to
  `clockSyncPoint` only for older JSON payloads.
- For the current prediction target, the accuracy table must prefer the live compensated Model2 value over
  `holiday_history.json` raw history.
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

2026-06-11 local verification must include:

- an auto clock-sync test that repairs a same-target `kospi_close` baseline to the primary model point;
- a guard that an existing same-target clock-sync baseline is reused and not overwritten;
- a guard that scheduled auto sync waits for primary `pointPrediction` and does not use EWY-only fallback;
- a workflow fallback check that `backtest_diagnostics.json` public download failures do not clobber the bundled
  artifact.
- a primary snapshot freshness check that replaces a same-session but stale local `prediction.json` with the public
  artifact before Model2 records `ewyFxReferencePoint`.

Production verification:

- Commit: `b92040a1 Fix model2 clock sync anchor drift`
- Workflow: GitHub Actions `refresh-holiday-prediction`
- Run: `27148551837`
- Dispatch inputs: `force=on`, `clear_stale=off`, `clock_sync=on`
- Result: success
- Published raw Model2 value: `7,877.67` (`+5.25%`)
- Frontend-compensated Model2 display value at verification: `7,872.30` (`+5.183%`)
- Primary model value at verification: `7,877.77` (`+5.26%`)
- Display gap after repair: `-5.47pt`
- Model2 JSON recorded:
  - `baselineSource: primary_model_prediction_clock_sync`
  - `clockSyncUsed: true`
  - `clockSyncAnchorKind: primary_point_prediction`
  - `model.clockSync.trackingApplied: true`
  - `rawResidualPct: 0.0`
  - `residualPct: 0.0`
  - `nightFuturesUsed: false`
  - `usesOtherModelPrediction: false`

2026-06-11 production repair:

- Symptom: after the target rolled to `2026-06-12`, scheduled Model2 published a same-target `kospi_close`
  baseline value of `7,771.1705`, while the primary model was around `7,893`.
- Immediate workflow: `refresh-holiday-prediction` run `27350199639`
- Dispatch inputs: `force=on`, `clear_stale=off`, `clock_sync=on`
- Result: success
- Published raw Model2 value: `7,894.92`
- Model2 JSON recorded:
  - `baselineSource: primary_model_prediction_clock_sync`
  - `baselineResetReason: manual_primary_clock_sync`
  - `clockSyncUsed: true`
  - `clockSyncAnchorKind: primary_point_prediction`
  - `model.clockSync.trackingApplied: true`
  - `rawResidualPct: 0.0`
  - `residualPct: 0.0`
  - `nightFuturesUsed: false`
  - `usesOtherModelPrediction: false`

## Cost Guardrail

This repair used the Model2 Cloud Storage JSON workflow and a hosting-only frontend deploy. Cloud Run and Cloud Build
were not used.

The 2026-06-11 hardening changed the Model2 JSON workflow, script, tests, and documentation only. It did not require
Firebase Hosting, Cloud Run, or Cloud Build deployment.
