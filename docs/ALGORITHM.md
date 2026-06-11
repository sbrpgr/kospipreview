# Algorithm

## Current Operating Model

Baseline date: 2026-04-13

The production prediction engine is `EWY Synthetic K200 Ridge`.

The main live model prediction uses a one-time KOSPI 200 night-futures bridge only to cover the EWY no-trade gap between the KRX close and the U.S. premarket open. After that bridge point is set, live movement comes from EWY, USD/KRW, and the auxiliary U.S. signals. Night futures are still published separately as a comparison benchmark.

Primary output:

- next KOSPI opening point prediction: `pointPrediction`
- prediction band: `rangeLow`, `rangeHigh`
- predicted change from the latest KOSPI close: `predictedChangePct`
- comparison-only night futures simple conversion: `nightFuturesSimplePoint`
- comparison-only EWY + USD/KRW simple conversion: `ewyFxSimplePoint`

## Time Anchors

All production time gates use Asia/Seoul time.

- `09:00`: roll prediction target to the next business day and set pending state until the next operating window.
- `15:30`: start live prediction operation for the next trading day.
- `15:30`: use the completed KOSPI close as `prevClose`.
- `15:45`: accept KOSPI 200 day futures close as final settlement only after this time.
- U.S. premarket open through `09:00`: append live prediction trend observations.
  - During U.S. daylight time this starts at `17:00 KST`.
  - During U.S. standard time this starts at `18:00 KST`.

## Model Input Basis

Live model returns are anchored to the KRX close sync basis, then bridged to the first usable EWY premarket basis while EWY cannot be traded at `15:30 KST`.

For each live symbol, the refresh process uses:

1. before the U.S. premarket bridge is ready, keep `ewyFxSimplePoint` and `pointPrediction` blank;
2. from the U.S. premarket open, sample the KOSPI 200 night-futures return every 2 minutes for 5 slots;
   during U.S. daylight time, also sample the `18:00~18:08 KST` night-futures-open window if the `17:00 KST` window did not provide a complete scheduled bridge;
3. use the latest bridge sample as the one-time `15:30 -> EWY premarket` anchor;
4. after the bridge anchor, calculate EWY, USD/KRW, and auxiliary returns from that bridge timestamp;
5. Yahoo standard displayed change is used only as a fallback when no synchronized intraday basis is available.

This is important for EWY. Yahoo may display EWY premarket change versus the previous U.S. regular close, but the model must not treat that display value as the Korean close-to-current return.

Indicator cards may still display standard market-session change values. That display basis must not be confused with model input basis.

## Prediction Calculation

1. Core signal
   - EWY and USD/KRW are the core signals.
   - The core layer estimates a synthetic KOSPI 200 overnight return.
   - EWY and KRW coefficients are calibrated from recent data and blended with structural weights.

2. Residual correction
   - SOX, S&P 500, NASDAQ 100, Dow, WTI, Gold, and US 10Y are residual or auxiliary signals.
   - Residual correction is capped.
   - If recent validation does not improve accuracy, residual weight is reduced or disabled.

3. KOSPI mapping
   - Synthetic K200 return is mapped to KOSPI opening return through a Ridge mapping layer.
   - The mapping intercept is allowed to represent learned opening drift.
   - Strong EWY + USD/KRW trend moves must not be compressed below the configured trend-follow floor.

4. Stabilization
   - Prediction changes are guard-banded.
   - Live refresh applies a small smoothing weight to reduce one-minute jump noise.
   - The model must not force the live night-futures path into `pointPrediction` after the one-time EWY bridge has been set.
   - The model must not force EWY direction matching when the full statistical mapping produces a different valid result.
   - The strong trend-follow floor uses EWY + USD/KRW after the bridge point.

## Night Futures Simple Conversion

Night futures simple conversion is separate from the model.

Formula:

```text
nightFuturesSimplePoint = KOSPI_close(D) * (K200_night(t) / K200_day_close(D))
nightFuturesSimpleChangePct = K200_night(t) / K200_day_close(D) - 1
```

Required basis:

- `KOSPI_close(D)` is the current completed KOSPI close after `15:30 KST`.
- `K200_day_close(D)` is the final KOSPI 200 day futures close.
- Final day futures close is trusted only when the source is the eSignal socket close at or after `15:45 KST`.

## EWY + FX Simple Conversion

EWY + FX simple conversion is separate from the statistical model. Until EWY can be
collected at `15:30 KST`, it uses the same one-time night-futures bridge as the live
model, then applies only EWY and USD/KRW movement after that bridge timestamp.

Formula:

```text
ewyFxSimpleChangePct = exp((bridge_log_return + EWY_log_return_after_bridge + USDKRW_log_return_after_bridge) / 100) - 1
ewyFxSimplePoint = KOSPI_close(D) * (1 + ewyFxSimpleChangePct)
```

Required basis:

- `KOSPI_close(D)` is the current completed KOSPI close after `15:30 KST`.
- The bridge log return is sampled from KOSPI 200 night futures at U.S. premarket open.
- EWY and USD/KRW returns are measured from the bridge timestamp onward.
- No residual model or K200 mapping is used in the EWY + FX simple conversion.

## Independent Model 2

Model 2 is the independent EWY/FX composite engine published through
`holiday_prediction.json`, `holiday_prediction_series.json`, and
`holiday_history.json`.

Purpose:

- provide a standing model for Korean-market holidays and other no-KRX-open
  windows;
- use EWY and USD/KRW as the direct replacement axis for unavailable local
  night-futures information;
- add only bounded composite-market residual information after the EWY/KRW
  core.

Allowed inputs:

- the latest synchronized KOSPI close baseline from the KRX operating session;
- EWY and USD/KRW baseline/current prices;
- an optional manual clock-sync anchor from the primary payload's
  `pointPrediction`, used only to align Model 2's initial live reference clock
  for the same prediction date; if unavailable, `ewyFxSimplePoint` may be used
  as a fallback anchor;
- diagnostics-generated EWY/FX correction coefficients, including
  `direct_blend_weight`;
- bounded composite indicators such as S&P 500, NASDAQ, Dow, SOX, VIX, Gold,
  WTI, and U.S. 10Y.

Forbidden inputs:

- KOSPI 200 night futures prices, returns, or `nightFuturesSimplePoint`;
- the primary model's `pointPrediction` or any other model prediction during
  normal Model 2 runs; manual `clock_sync=on` may use the primary
  `pointPrediction` once as the same-date baseline anchor, and scheduled runs
  may auto-use it once only to repair a same-target non-clock-synced
  `kospi_close` baseline after the primary forecast is ready;
- manual direct-blend tuning in live refresh code.

Runtime invariants:

- `independentModel` must be `true`;
- `usesOtherModelPrediction` must be `false`;
- `nightFuturesUsed` must be `false`;
- `nightFuturesReadThisRun` must be `false` for normal and forced production
  repairs;
- `model.engine` must remain `EWYFXHybridCompositeNoNightFutures`;
- the direct-vs-learned EWY/FX blend must come from diagnostics and may be
  raised automatically only by the documented high-move or low-confidence
  rules;
- the EWY/FX trend-follow floor is applied independently from Model 2's own
  EWY/KRW signal and raw return. Model 2 must not continuously copy the
  primary model's `pointPrediction`.

The historical one-time night-futures bootstrap path is kept only as an
explicit legacy migration/test path and is disabled by default. It must not be
used for current production Model 2 refreshes.

If Model 2 is started after the primary live model has already synchronized its
live clock, a manual `clock_sync=on` repair can reset Model 2's baseline to the
primary `pointPrediction` and the current EWY/KRW prices. This is a one-time
reference-clock sync, not a continuous copy of the primary model prediction;
the payload must record `clockSyncUsed: true` and still keep
`usesOtherModelPrediction: false`.

Scheduled Model 2 runs also auto-apply that same one-time baseline sync when a
new prediction target is stuck on a same-session `kospi_close` baseline and the
primary same-target `pointPrediction` is already available. Auto sync must not
fall back to `ewyFxSimplePoint` and must not repeat after a clock-synced
baseline already exists for the same session and target.

After a clock-sync baseline is set, Model 2 must not add a second residual,
intercept, or composite offset at the sync instant. It tracks later EWY/KRW
movement from the synced baseline and records `clockSyncAnchorKind` plus
`ewyFxReferencePoint` for diagnostics and audit.

Clock-synced Model 2 payloads also record `ewyFxReferencePoint`, the primary
`ewyFxSimplePoint` observed when that Model 2 JSON was generated. The homepage
must not add later primary EWY/FX drift to the raw Model 2 point; doing so can
double-move the displayed value during large EWY/FX swings. Staleness should be
fixed by refreshing Model 2 JSON.

For clock-synced Model 2, the server should track the current primary EWY+FX
reference plus the one-time sync spread:

`point = current_ewy_fx_reference + (clock_sync_point - clock_sync_ewy_fx_reference)`

It should not compound the entire EWY/KRW return from the synced model point,
because that turns the initial sync spread into a growing premium in large
EWY/FX moves. The trend-follow floor is skipped for clock-synced tracking to
avoid a second adjustment on top of the reference spread.

When Model 2 runs from a workflow-seeded `prediction.json`, the seed must be
fresh enough for that reference. If the local primary snapshot `generatedAt` is
older than 120 seconds, Model 2 refetches the public primary JSON before using
`pointPrediction` or `ewyFxSimplePoint` as any clock-sync/reference field.

Model 2 is expected to stay directionally comparable with the primary model
when EWY/KRW and night-futures signals agree. It is not expected to match the
primary model point-for-point when the primary model's live night-futures
bridge materially diverges from EWY/KRW, because that bridge is the dependency
Model 2 removes.

## EWY + FX Trend Follow Floor

The K200-to-KOSPI mapping can under-react when EWY + USD/KRW makes a large
overnight move. The model therefore applies a trend-follow floor when the
EWY + USD/KRW move is large enough to make near-flat model output unreliable.

Current production rule:

- medium trigger: absolute EWY + USD/KRW log-return signal at or above `0.45%`;
- medium floor: final model log return should reach at least `70%` of that EWY + USD/KRW signal;
- high trigger: absolute EWY + USD/KRW log-return signal at or above `2.0%`;
- high floor: final model log return should reach at least `78%` of that EWY + USD/KRW signal;
- per-update adjustment cap: `1.75%` log-return;
- inputs: EWY and USD/KRW after the one-time bridge point;
- the night-futures bridge is used only for the premarket synchronization gap.

Diagnostics:

- `model.trendFollowApplied`
- `model.trendFollowSignalPct`
- `model.trendFollowMinPct`
- `model.trendFollowAdjustmentPct`

## Recent Actual Records

`history.json` stores actual verification rows.

Tracked fields:

- `actualOpen`
- `actualClose`
- `dayFuturesClose`, final same-date day futures settlement only
- `nightFuturesClose`, the pre-open night session close for that actual date
- fixed pre-open `modelPrediction`
- fixed pre-open `nightFuturesSimpleOpen`
- fixed pre-open `ewyFxSimpleOpen`

Night futures simple values must be fixed from the last valid observation for
the target night session. The value should not disappear just because the
night futures market has closed before `09:00 KST`; only quotes outside the
target night-session window should be rejected.

The `nightFuturesClose` stored in an actual row must come from the same
pre-open fixed prediction snapshot. It must not be overwritten by the next
night session that starts after the actual date's domestic close.

Day/night futures close fields are tracked only for recent actual rows dated
`2026-04-14` or later. The `2026-04-13` row remains blank for both fields.

For a trading day, the fixed model prediction should come from the last valid pre-open series row before `09:00 KST`, or from the archive fallback.
