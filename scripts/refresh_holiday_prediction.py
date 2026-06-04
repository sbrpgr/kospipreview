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


def _get_close_on_or_before(ticker_symbol: str, target_date_iso: str, period: str = "10d") -> dict | None:
    """Return {'date': ISO, 'close': float} for the latest row on or before target_date."""
    try:
        hist = yf.Ticker(ticker_symbol).history(period=period).dropna(subset=["Close"])
        if hist.empty:
            return None
        target = date.fromisoformat(target_date_iso)
        for row in reversed(list(hist.itertuples())):
            row_date = row.Index.date() if hasattr(row.Index, "date") else None
            if row_date is None:
                continue
            if row_date <= target:
                return {"date": row_date.isoformat(), "close": round(float(row.Close), 6)}
        return None
    except Exception:
        return None


def get_current_price(ticker_symbol: str) -> float | None:
    """Get the most recent price including premarket/after-hours via 1m intraday."""
    try:
        hist = yf.Ticker(ticker_symbol).history(period="1d", interval="1m")
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

    last_session = get_last_krx_session()
    if not last_session:
        print("[model2] ERROR: could not get last KRX session.")
        return 1

    krx_date = last_session["date"]
    prev_close = last_session["close"]
    print(f"[model2] Last KRX: {krx_date}, prevClose={prev_close}")

    ewy_baseline = _get_close_on_or_before("EWY", krx_date)
    krw_baseline = _get_close_on_or_before("KRW=X", krx_date)

    if not ewy_baseline or not krw_baseline:
        print(f"[model2] ERROR: baseline fetch failed. EWY={ewy_baseline}, KRW={krw_baseline}")
        return 1

    print(f"[model2] EWY baseline {ewy_baseline['date']}={ewy_baseline['close']}, KRW={krw_baseline['close']}")

    current_ewy = get_current_price("EWY")
    current_krw = get_current_price("KRW=X")

    if current_ewy is None or current_krw is None:
        print(f"[model2] ERROR: current price fetch failed. EWY={current_ewy}, KRW={current_krw}")
        return 1

    print(f"[model2] Current EWY={current_ewy}, KRW={current_krw}")

    ewy_log_return = math.log(current_ewy / ewy_baseline["close"]) * 100
    krw_log_return = math.log(current_krw / krw_baseline["close"]) * 100
    print(f"[model2] EWY log ret={ewy_log_return:.4f}%, KRW log ret={krw_log_return:.4f}%")

    diagnostics = _load_json(DIAGNOSTICS_PATH)
    if not diagnostics:
        print("[model2] ERROR: backtest_diagnostics.json not found.")
        return 1

    result = calculate_model2(ewy_log_return, krw_log_return, diagnostics, prev_close)
    if not result:
        print("[model2] ERROR: model calculation failed — missing coefficients.")
        return 1

    prediction_target = resolve_prediction_target(now_kst, krx_date)
    print(f"[model2] Target={prediction_target}, prediction={result['pointPrediction']} ({result['predictedChangePct']:+.4f}%)")

    payload = {
        "calculationMode": "holiday_ewy_direct",
        "isHolidayMode": True,
        "predictionDateIso": prediction_target.isoformat(),
        "predictionDate": format_date_label(prediction_target),
        "prevClose": prev_close,
        "prevCloseDate": krx_date,
        "pointPrediction": result["pointPrediction"],
        "predictedChangePct": result["predictedChangePct"],
        "rangeLow": result["rangeLow"],
        "rangeHigh": result["rangeHigh"],
        "ewyBaselineDate": ewy_baseline["date"],
        "ewyBaselineClose": ewy_baseline["close"],
        "ewyCurrentPrice": current_ewy,
        "ewyLogReturnPct": round(ewy_log_return, 4),
        "krwBaselineClose": krw_baseline["close"],
        "krwCurrentRate": current_krw,
        "krwLogReturnPct": round(krw_log_return, 4),
        "model": {
            "engine": "HolidayEWYDirect",
            "fitR2": result.get("fitR2"),
            "corePct": result.get("corePct"),
            "kospiMappedPct": result.get("kospiMappedPct"),
        },
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
