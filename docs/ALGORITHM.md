# Algorithm

## Current Operating Model

Baseline date: 2026-04-13

The production prediction engine is `EWY Synthetic K200 Ridge`.

The main model prediction does not use KOSPI 200 night futures as an input. Night futures are published as a comparison benchmark only.

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
- `18:00~09:00`: append live prediction trend observations.

## Model Input Basis

Live model returns are anchored to the KRX close sync basis.

For each live symbol, the refresh process uses:

1. first same-day quote at or after `15:30 KST` when available;
2. otherwise the latest quote before `15:30 KST` inside the allowed lookback window;
3. Yahoo standard displayed change only as a fallback when no KRX-sync intraday basis is available.

This is important for EWY. Yahoo may display EWY premarket change versus the previous U.S. regular close, but the model must compare EWY from the Korean close sync point.

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

4. Stabilization
   - Prediction changes are guard-banded.
   - Live refresh applies a small smoothing weight to reduce one-minute jump noise.
   - The model must not force night-futures direction into `pointPrediction`.
   - The model must not force EWY direction matching when the full statistical mapping produces a different valid result.

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

EWY + FX simple conversion is separate from the statistical model. It replaces the
night-futures input with the KRX-close-synchronized EWY and USD/KRW move.

Formula:

```text
ewyFxSimpleChangePct = exp((EWY_log_return + USDKRW_log_return) / 100) - 1
ewyFxSimplePoint = KOSPI_close(D) * (1 + ewyFxSimpleChangePct)
```

Required basis:

- `KOSPI_close(D)` is the current completed KOSPI close after `15:30 KST`.
- EWY and USD/KRW returns use the same KRX `15:30 KST` baseline as the model inputs.
- No residual model, K200 mapping, or night-futures value is used.

## Recent Actual Records

`history.json` stores actual verification rows.

Tracked fields:

- `actualOpen`
- `actualClose`
- `dayFuturesClose`
- `nightFuturesClose`
- fixed pre-open `modelPrediction`
- fixed pre-open `nightFuturesSimpleOpen`
- fixed pre-open `ewyFxSimpleOpen`

Day/night futures close fields are tracked only for recent actual rows dated
`2026-04-14` or later. The `2026-04-13` row remains blank for both fields.

For a trading day, the fixed model prediction should come from the last valid pre-open series row before `09:00 KST`, or from the archive fallback.
