# Data Sources

Baseline date: 2026-04-13

## Production Sources

### Yahoo Finance

Used for market indicators and live model input series.

Symbols:

- KOSPI: `^KS11`
- KOSPI 200: `^KS200`
- EWY: `EWY`
- KORU: `KORU`
- S&P 500: `^GSPC`
- NASDAQ 100: `^NDX`
- Dow Jones: `^DJI`
- VIX: `^VIX`
- WTI: `CL=F`
- Gold: `GC=F`
- US 10Y: `^TNX`
- SOX: `^SOX`
- USD/KRW: `KRW=X`

Important distinction:

- dashboard cards may show market-standard displayed change;
- live model inputs use the KRX `15:30 KST` sync basis when available;
- while EWY is not tradable at `15:30 KST`, the live EWY + FX path waits for U.S. premarket open, then uses a one-time KOSPI 200 night-futures bridge sampled every 2 minutes for 5 slots.

### Naver Finance

Used for KOSPI open and close verification.

Endpoint:

- `https://polling.finance.naver.com/api/realtime/domestic/index/KOSPI`

Rules:

- actual open is read from Naver when the session date matches;
- actual close is accepted after the market is closed or the timestamp is at or after `15:30 KST`.

### eSignal KOSPI 200 Day Futures

Used for day futures close settlement.

Sources:

- page: `https://esignal.co.kr/kospi200-futures/`
- cache JSON: `https://esignal.co.kr/data/cache/kospif_day.js`
- socket endpoint: `https://esignal.co.kr/proxy/8889/socket.io/`

Final settlement rule:

- session close before `15:45 KST` is provisional;
- final day futures close is trusted only from eSignal socket `session-close-socket` at or after `15:45 KST`;
- `day_futures_close_cache.json` must not permanently cache a same-day provisional value as final.

### eSignal KOSPI 200 Night Futures

Used for comparison-only night futures simple conversion and the K200F card.

Sources:

- page: `https://esignal.co.kr/kospi200-futures-night/`
- cache JSON: `https://esignal.co.kr/data/cache/kospif_ngt.js`

Rules:

- night futures change must be recalculated versus the final day futures close when that close is available;
- night futures are considered live only when source freshness is inside the stale window and the night operation window is active;
- night futures are not model inputs.

## Cache Files

Live refresh reads and writes JSON state through Cloud Storage and bundled static fallbacks.

Key files:

- `prediction.json`
- `indicators.json`
- `history.json`
- `live_prediction_series.json`
- `prediction_archive.json`
- `day_futures_close_cache.json`
- `night_futures_source_cache.json`

## Public Display Policy

- Each market card may expose its data source label.
- KOSPI 200 night futures source links remain disabled in the UI by policy.
- Public values are research and comparison values, not guaranteed trading data.
