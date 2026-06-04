#!/usr/bin/env python3
"""
Model 2: Holiday EWY Direct Prediction.

Activates on weekdays when KRX is closed (public holiday) but US markets are open.
Uses the last KRX session's EWY close as the baseline — no night-futures bridge needed.

Outputs (isolated, never overwrites existing files):
  holiday_prediction.json
  holiday_prediction_series.json
  holiday_history.json
"""

import json
import math
import sys
from datetime import date, datetime, time, timedelta, timezone
from pathlib import Path

import yfinance as yf

KST = timezone(timedelta(hours=9))

ROOT = Path(__file__).resolve().parent.parent
OUTPUT_DIR = ROOT / "frontend" / "public" / "data"

DIAGNOSTICS_PATH = OUTPUT_DIR / "backtest_diagnostics.json"
HOLIDAY_PREDICTION_PATH = OUTPUT_DIR / "holiday_prediction.json"
HOLIDAY_SERIES_PATH = OUTPUT_DIR / "holiday_prediction_series.json"
HOLIDAY_HISTORY_PATH = OUTPUT_DIR / "holiday_history.json"

BAND_MAE_MULTIPLIER = 1.5   # Wider band than normal model to signal reduced confidence
SERIES_MAX_ROWS = 1080
HISTORY_MAX_ROWS = 60

# US premarket opens ~09:00 UTC (04:00 ET), post-market closes ~22:00 UTC (18:00 ET)
US_ACTIVE_START_UTC = 9 * 60   # minutes
US_ACTIVE_END_UTC = 22 * 60


def _load_json(path: Path) -> dict:
    try:
        return json.loads(path.read_text(encoding="utf-8")) if path.exists() else {}
    except Exception:
        return {}


def _write_json(path: Path, data: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def _to_float(value) -> float | None:
    try:
        f = float(value)
        return f if math.isfinite(f) else None
    except (TypeError, ValueError):
        return None


# ---------------------------------------------------------------------------
# Market state detection
# ---------------------------------------------------------------------------

def is_krx_holiday(now_kst: datetime) -> bool:
    """True when KRX has no trading session today.

    Checks whether any 1-minute candle falls within today's regular
    KRX session window (09:00–15:30 KST). This is more reliable than
    a simple date comparison because Yahoo Finance sometimes labels the
    previous day's daily bar with today's calendar date.
    """
    if now_kst.weekday() >= 5:
        return True
    today = now_kst.date()
    session_open_kst = datetime.combine(today, time(9, 0), tzinfo=KST)
    session_close_kst = datetime.combine(today, time(15, 30), tzinfo=KST)
    try:
        hist = yf.Ticker("^KS11").history(period="2d", interval="1m")
        if hist.empty:
            print("[model2] ^KS11 1m history empty — assuming holiday.")
            return True
        for ts in hist.index:
            ts_kst = ts.astimezone(KST) if getattr(ts, "tzinfo", None) else ts.replace(tzinfo=KST)
            if session_open_kst <= ts_kst <= session_close_kst:
                print(f"[model2] KRX session candle found at {ts_kst.strftime('%H:%M')} KST — not a holiday.")
                return False
        print(f"[model2] No candles in today's KRX session window — holiday confirmed.")
        return True
    except Exception as e:
        print(f"[model2] ^KS11 check failed ({e}) — conservative: assume holiday.")
        return True


def is_us_market_active(now_utc: datetime) -> bool:
    """True during US premarket + regular + early post-market window."""
    minutes = now_utc.hour * 60 + now_utc.minute
    return US_ACTIVE_START_UTC <= minutes <= US_ACTIVE_END_UTC


# ---------------------------------------------------------------------------
# Market data fetching
# ---------------------------------------------------------------------------

def get_last_krx_session() -> dict | None:
    """Return {'date': ISO, 'close': float} for the most recent KRX session."""
    try:
        hist = yf.Ticker("^KS11").history(period="10d").dropna(subset=["Close"])
        if hist.empty:
            return None
        last = hist.iloc[-1]
        session_date = last.name.date() if hasattr(last.name, "date") else None
        if session_date is None:
            return None
        return {"date": session_date.isoformat(), "close": round(float(last["Close"]), 2)}
    except Exception:
        return None


def _get_prev_session_close(ticker_symbol: str, krx_date_iso: str) -> dict | None:
    """Return the daily close on or before krx_date — used as the EWY/KRW baseline."""
    try:
        hist = yf.Ticker(ticker_symbol).history(period="10d").dropna(subset=["Close"])
        if hist.empty:
            return None
        target = date.fromisoformat(krx_date_iso)
        for row in reversed(list(hist.itertuples())):
            row_date = row.Index.date() if hasattr(row.Index, "date") else None
            if row_date is None:
                continue
            if row_date <= target:
                return {"date": row_date.isoformat(), "close": round(float(row.Close), 6)}
        return None
    except Exception as e:
        print(f"[model2] Prev session close error ({ticker_symbol}): {e}")
        return None


def get_us_premarket_open_price(ticker_symbol: str, now_utc: datetime) -> dict | None:
    """Return the first 1m candle at/after 09:00 UTC (18:00 KST, US premarket open).

    This aligns model2's EWY baseline with model1's night-futures bridge timing,
    ensuring both models measure EWY movement from the same reference point.
    """
    premarket_utc = now_utc.replace(hour=9, minute=0, second=0, microsecond=0)
    try:
        # prepost=True includes pre/after-market candles for US equities
        hist = yf.Ticker(ticker_symbol).history(period="1d", interval="1m", prepost=True)
        if hist.empty:
            return None
        for ts in hist.index:
            ts_utc = ts.astimezone(timezone.utc) if getattr(ts, "tzinfo", None) else ts.replace(tzinfo=timezone.utc)
            if ts_utc >= premarket_utc:
                close = float(hist.loc[ts, "Close"])
                if math.isfinite(close) and close > 0:
                    return {"timestamp": ts_utc.isoformat(), "close": round(close, 6)}
        return None
    except Exception as e:
        print(f"[model2] Premarket baseline error ({ticker_symbol}): {e}")
        return None


def get_current_price(ticker_symbol: str) -> float | None:
    """Get the most recent price including premarket/after-hours via 1m intraday."""
    try:
        hist = yf.Ticker(ticker_symbol).history(period="1d", interval="1m", prepost=True)
        if not hist.empty:
            f = float(hist["Close"].iloc[-1])
            if math.isfinite(f) and f > 0:
                return round(f, 6)
    except Exception:
        pass
    # Fallback to fast_info
    try:
        price = yf.Ticker(ticker_symbol).fast_info.last_price
        f = float(price)
        return round(f, 6) if math.isfinite(f) else None
    except Exception:
        return None


# ---------------------------------------------------------------------------
# Prediction calculation (same Ridge formula as main model)
# ---------------------------------------------------------------------------

def calculate_model2(
    ewy_log_return_pct: float,
    krw_log_return_pct: float,
    diagnostics: dict,
    prev_close: float,
) -> dict | None:
    correction = diagnostics.get("ewyFxCorrection", {})
    mapping = diagnostics.get("k200Mapping", {})

    intercept = _to_float(correction.get("intercept"))
    ewy_coef = _to_float(correction.get("ewy_coef"))
    krw_coef = _to_float(correction.get("krw_coef"))
    fit_r2 = _to_float(correction.get("r2"))
    map_intercept = _to_float(mapping.get("intercept"))
    map_beta = _to_float(mapping.get("beta"))
    mae = _to_float(diagnostics.get("mae"))

    if any(v is None for v in [intercept, ewy_coef, krw_coef, map_intercept, map_beta]):
        return None

    # Synthetic K200 return
    core_pct = intercept + ewy_coef * ewy_log_return_pct + krw_coef * krw_log_return_pct

    # K200 → KOSPI mapping
    kospi_pct = map_intercept + map_beta * core_pct

    point = prev_close * math.exp(kospi_pct / 100)
    change_pct = (math.exp(kospi_pct / 100) - 1) * 100

    # Wider band than normal model to signal reduced confidence
    half_band = (mae * BAND_MAE_MULTIPLIER * prev_close / 100) if mae else abs(kospi_pct / 100 * prev_close * 0.5)

    return {
        "pointPrediction": round(point, 2),
        "predictedChangePct": round(change_pct, 4),
        "rangeLow": round(point - half_band, 2),
        "rangeHigh": round(point + half_band, 2),
        "corePct": round(core_pct, 4),
        "kospiMappedPct": round(kospi_pct, 4),
        "fitR2": fit_r2,
    }


# ---------------------------------------------------------------------------
# Prediction target resolution
# ---------------------------------------------------------------------------

def next_weekday(base: date) -> date:
    candidate = base + timedelta(days=1)
    while candidate.weekday() >= 5:
        candidate += timedelta(days=1)
    return candidate


def resolve_prediction_target(now_kst: datetime, krx_last_date: str) -> date:
    """Next KRX weekday after today (holiday). Rolls past today if it's a holiday."""
    today = now_kst.date()
    candidate = next_weekday(today)
    return candidate


def format_date_label(d: date) -> str:
    return d.strftime("%Y년 %m월 %d일")


# ---------------------------------------------------------------------------
# Series update
# ---------------------------------------------------------------------------

def update_series(payload: dict, now_utc: datetime, prediction_target: date) -> None:
    series = _load_json(HOLIDAY_SERIES_PATH)
    target_iso = prediction_target.isoformat()
    records = [
        r for r in series.get("records", [])
        if isinstance(r, dict) and r.get("predictionDateIso") == target_iso
    ]

    now_kst = now_utc.astimezone(KST)
    minute_prefix = now_utc.replace(second=0, microsecond=0).isoformat()[:16]

    # Replace existing row for this UTC minute
    records = [r for r in records if str(r.get("observedAt", ""))[:16] != minute_prefix]
    records.append({
        "predictionDateIso": target_iso,
        "observedAt": now_utc.replace(microsecond=0).isoformat(),
        "kstTime": now_kst.strftime("%H:%M"),
        "pointPrediction": payload["pointPrediction"],
        "predictedChangePct": payload["predictedChangePct"],
        "ewyLogReturnPct": payload["ewyLogReturnPct"],
        "krwLogReturnPct": payload["krwLogReturnPct"],
    })

    records = sorted(records, key=lambda r: str(r.get("observedAt", "")))[-SERIES_MAX_ROWS:]

    _write_json(HOLIDAY_SERIES_PATH, {
        "generatedAt": now_utc.isoformat(),
        "predictionDateIso": target_iso,
        "records": records,
    })


# ---------------------------------------------------------------------------
# History update
# ---------------------------------------------------------------------------

def _try_get_actual_open() -> float | None:
    try:
        hist = yf.Ticker("^KS11").history(period="1d", interval="1m")
        if hist.empty:
            return None
        val = float(hist.iloc[0]["Open"])
        return round(val, 2) if math.isfinite(val) else None
    except Exception:
        return None


def update_history(payload: dict, now_utc: datetime, prediction_target: date) -> None:
    now_kst = now_utc.astimezone(KST)
    history = _load_json(HOLIDAY_HISTORY_PATH)
    records: list[dict] = list(history.get("records", []))
    target_iso = prediction_target.isoformat()

    # Try actual open when running on the prediction target day after 09:00 KST
    actual_open = None
    if now_kst.date() == prediction_target and now_kst.time() >= time(9, 0):
        actual_open = _try_get_actual_open()

    existing = next((r for r in records if r.get("date") == target_iso), None)
    if existing is None:
        existing = {"date": target_iso}
        records.append(existing)

    existing["model2Prediction"] = payload["pointPrediction"]
    existing["rangeLow"] = payload["rangeLow"]
    existing["rangeHigh"] = payload["rangeHigh"]
    existing["prevClose"] = payload["prevClose"]
    existing["predictionGeneratedAt"] = payload["generatedAt"]

    # Only set actualOpen once — do not overwrite after it's recorded
    if actual_open is not None and "actualOpen" not in existing:
        existing["actualOpen"] = actual_open

    records = sorted(records, key=lambda r: str(r.get("date", "")), reverse=True)[:HISTORY_MAX_ROWS]

    _write_json(HOLIDAY_HISTORY_PATH, {
        "generatedAt": now_utc.isoformat(),
        "records": records,
    })


# ---------------------------------------------------------------------------
# Clear stale prediction on normal trading days
# ---------------------------------------------------------------------------

def _clear_holiday_prediction(now_utc: datetime) -> None:
    """Reset holiday_prediction.json to a null state when KRX is open."""
    existing = _load_json(HOLIDAY_PREDICTION_PATH)
    # Only clear if there's a non-null prediction — avoid unnecessary writes.
    if existing.get("pointPrediction") is None:
        return
    print("[model2] Clearing stale holiday prediction (KRX is open).")
    _write_json(HOLIDAY_PREDICTION_PATH, {
        "calculationMode": "holiday_ewy_direct",
        "isHolidayMode": False,
        "predictionDateIso": None,
        "predictionDate": None,
        "pointPrediction": None,
        "predictedChangePct": None,
        "rangeLow": None,
        "rangeHigh": None,
        "generatedAt": now_utc.isoformat(),
    })


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def run() -> int:
    now_utc = datetime.now(timezone.utc)
    now_kst = now_utc.astimezone(KST)

    if now_kst.weekday() >= 5:
        print("Weekend — skipping.")
        return 0

    if not is_us_market_active(now_utc):
        print("US market not active — skipping update.")
        return 0

    print(f"[model2] Running. KST={now_kst.strftime('%Y-%m-%d %H:%M')}")

    # ── Step 1: Get model1 prediction state (for anchor and prediction target) ──
    model1 = _load_json(OUTPUT_DIR / "prediction.json")
    prev_close = _to_float(model1.get("prevClose"))
    prev_close_date = model1.get("prevCloseDate") or model1.get("latestRecordDate")
    prediction_date_iso = model1.get("predictionDateIso")
    night_simple_point = _to_float(model1.get("nightFuturesSimplePoint"))

    if not prediction_date_iso or prev_close is None:
        print("[model2] model1 prediction.json not ready — skipping.")
        return 0

    prediction_target = date.fromisoformat(prediction_date_iso)
    print(f"[model2] Target={prediction_target}, prevClose={prev_close} ({prev_close_date})")

    # ── Step 2: Load existing model2 state ──
    existing = _load_json(HOLIDAY_PREDICTION_PATH)
    anchor = _to_float(existing.get("anchor"))
    anchor_ewy = _to_float(existing.get("anchorEwy"))
    anchor_krw = _to_float(existing.get("anchorKrw"))
    existing_prev_close_date = existing.get("prevCloseDate")

    # ── Step 3: Set anchor ONCE per prediction cycle ──
    # Anchor resets when prevCloseDate changes (new KRX session rolled over)
    need_anchor = (
        anchor is None
        or anchor_ewy is None
        or anchor_krw is None
        or existing_prev_close_date != prev_close_date
    )

    if need_anchor:
        current_ewy_for_anchor = get_current_price("EWY")
        current_krw_for_anchor = get_current_price("KRW=X")
        if current_ewy_for_anchor is None or current_krw_for_anchor is None:
            print(f"[model2] Cannot set anchor: EWY={current_ewy_for_anchor}, KRW={current_krw_for_anchor}")
            return 1

        # Use nightFuturesSimplePoint as anchor if available, else prevClose
        if night_simple_point is not None and night_simple_point > 0:
            anchor = night_simple_point
            print(f"[model2] NEW anchor from nightFuturesSimplePoint: {anchor}")
        else:
            anchor = prev_close
            print(f"[model2] NEW anchor from prevClose (night futures unavailable): {anchor}")

        anchor_ewy = current_ewy_for_anchor
        anchor_krw = current_krw_for_anchor
        print(f"[model2] anchor_ewy={anchor_ewy}, anchor_krw={anchor_krw}")
    else:
        print(f"[model2] Reusing anchor={anchor}, anchor_ewy={anchor_ewy}, anchor_krw={anchor_krw}")

    # ── Step 4: Get current prices ──
    current_ewy = get_current_price("EWY")
    current_krw = get_current_price("KRW=X")

    if current_ewy is None or current_krw is None:
        print(f"[model2] ERROR: price fetch failed. EWY={current_ewy}, KRW={current_krw}")
        return 1

    # ── Step 5: Calculate — anchor + EWY/KRW change ──
    # EWY up = KOSPI up | KRW weaker (up) = KOSPI down
    ewy_log = math.log(current_ewy / anchor_ewy) * 100
    krw_log = math.log(anchor_krw / current_krw) * 100  # inverted: weaker won = negative
    net_log = ewy_log + krw_log
    point = anchor * math.exp(net_log / 100)
    change_from_prev = (point / prev_close - 1) * 100

    print(f"[model2] EWY: {anchor_ewy} → {current_ewy} ({ewy_log:+.4f}%)")
    print(f"[model2] KRW: {anchor_krw} → {current_krw} (adj {krw_log:+.4f}%)")
    print(f"[model2] Target={prediction_target}, prediction={round(point,2)} ({change_from_prev:+.4f}% from prevClose)")

    # Band (±1% of anchor as simple reference range)
    half_band = anchor * 0.01
    result = {
        "pointPrediction": round(point, 2),
        "predictedChangePct": round(change_from_prev, 4),
        "rangeLow": round(point - half_band, 2),
        "rangeHigh": round(point + half_band, 2),
    }
    payload = {
        "calculationMode": "ewy_direct_anchor",
        "predictionDateIso": prediction_target.isoformat(),
        "predictionDate": format_date_label(prediction_target),
        "prevClose": prev_close,
        "prevCloseDate": prev_close_date,
        "pointPrediction": result["pointPrediction"],
        "predictedChangePct": result["predictedChangePct"],
        "rangeLow": result["rangeLow"],
        "rangeHigh": result["rangeHigh"],
        # Anchor — set once per prediction cycle
        "anchor": round(anchor, 2),
        "anchorEwy": anchor_ewy,
        "anchorKrw": anchor_krw,
        # Current prices
        "ewyCurrentPrice": current_ewy,
        "krwCurrentRate": current_krw,
        "ewyLogPct": round(ewy_log, 4),
        "krwLogPct": round(krw_log, 4),
        "model": {"engine": "AnchorEWYKRW"},
        "generatedAt": now_utc.isoformat(),
    }

    _write_json(HOLIDAY_PREDICTION_PATH, payload)
    print(f"[model2] Written: {HOLIDAY_PREDICTION_PATH.name}")

    update_series(payload, now_utc, prediction_target)
    print(f"[model2] Series updated: {HOLIDAY_SERIES_PATH.name}")

    update_history(payload, now_utc, prediction_target)
    print(f"[model2] History updated: {HOLIDAY_HISTORY_PATH.name}")

    return 0


if __name__ == "__main__":
    sys.exit(run())
