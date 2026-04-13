from __future__ import annotations

import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
import warnings
from datetime import date, datetime, time, timedelta, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

import numpy as np
import pandas as pd
import yfinance as yf
from sklearn.decomposition import PCA
from sklearn.linear_model import Ridge
from sklearn.model_selection import TimeSeriesSplit

warnings.filterwarnings("ignore")

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

DATA_DIR = Path(os.environ.get("KOSPI_DAWN_DATA_DIR", ROOT / "frontend" / "public" / "data"))
OUT_DATA_DIR = Path(os.environ.get("KOSPI_DAWN_OUT_DATA_DIR", ROOT / "frontend" / "out" / "data"))
DOCS_DIR = Path(os.environ.get("KOSPI_DAWN_DOCS_DIR", ROOT / "docs"))
# Keep yfinance timezone cache outside the repository so CI git state stays clean.
CACHE_DIR = Path.home() / ".cache" / "kospipreview-yfinance"
DAY_FUTURES_CLOSE_CACHE_FILE = DATA_DIR / "day_futures_close_cache.json"
NIGHT_FUTURES_SOURCE_CACHE_FILE = DATA_DIR / "night_futures_source_cache.json"
PREDICTION_ARCHIVE_FILE = DATA_DIR / "prediction_archive.json"

KST = timezone(timedelta(hours=9))
US_ET = ZoneInfo("America/New_York")
KOREA_TICKERS = {"kospi": "^KS11", "kospi200": "^KS200"}
FEATURE_TICKERS = {
    "ewy": "EWY",
    "koru": "KORU",
    "sp500": "^GSPC",
    "nasdaq": "^NDX",
    "dow": "^DJI",
    "vix": "^VIX",
    "wti": "CL=F",
    "gold": "GC=F",
    "us10y": "^TNX",
    "sox": "^SOX",
    "krw": "KRW=X",
}
MODEL_SIGNAL_KEYS = ["ewy", "krw", "sp500", "nasdaq", "dow", "sox", "wti", "gold", "us10y"]
RESIDUAL_FEATURE_COLUMNS = ["broad_factor", "tech_factor", "semi_factor", "wti_z", "gold_z", "us10y_z"]
MODEL_ONLY_TICKERS = {
    "sp500f": "ES=F",
    "nasdaqf": "NQ=F",
}

INDICATOR_ONLY_TICKERS: dict[str, str] = {}

INDICATOR_TICKERS = {
    **FEATURE_TICKERS,
    **INDICATOR_ONLY_TICKERS,
}
MODEL_TICKERS = {
    **FEATURE_TICKERS,
    **MODEL_ONLY_TICKERS,
}

INDICATOR_SOURCE_URLS = {
    key: f"https://finance.yahoo.com/quote/{ticker.replace('=', '%3D').replace('^', '%5E')}"
    for key, ticker in INDICATOR_TICKERS.items()
}
INDICATOR_SOURCE_URLS["k200f"] = ""

LOOKBACK_DAYS = 3 * 365
ALL_FEATURES = list(MODEL_TICKERS.keys())
HISTORY_RECORDS = 30
HISTORY_ACCUMULATION_START_DATE = date(2026, 4, 9)
RECENT_HISTORY_FILL_DAYS = 5
PREDICTION_ARCHIVE_MAX_RECORDS = 200
ESTIMATED_BAND_MAE_FACTOR = 0.9
ESTIMATED_BAND_MIN_PCT = 0.003
FALLBACK_ESTIMATE_CHANGE_WEIGHT = 0.6
FALLBACK_ESTIMATE_BAND_MAE_FACTOR = 1.1
PREMARKET_TRACK_KEYS = {"ewy", "koru", "sp500", "nasdaq", "dow", "sox"}
PREMARKET_STALE_MINUTES = 45
KRX_SESSION_CLOSE_CUTOFF = time(15, 20)
KRX_SYNC_BASELINE_TIME = time(15, 30)
KRX_SYNC_MAX_LOOKBACK_HOURS = 36
KRX_SYNC_MAX_FORWARD_HOURS = 12
PREDICTION_TARGET_ROLLOVER_TIME = time(9, 0)
PREDICTION_OPERATION_START = time(18, 0)
PREDICTION_OPERATION_END = time(9, 0)

NIGHT_FUTURES_PRIMARY_SCALE = 1.0
AUXILIARY_SIGNAL_WEIGHTS = {
    "sp500": 0.35,
    "nasdaq": 0.30,
    "sox": 0.20,
    "dow": 0.15,
}
BRIDGE_SIGNAL_WEIGHTS = {
    "sp500f": 0.55,
    "nasdaqf": 0.45,
}
US_EQUITY_FACTOR_WEIGHTS = {
    "sp500": 0.30,
    "nasdaq": 0.30,
    "dow": 0.15,
    "sp500f": 0.15,
    "nasdaqf": 0.10,
}
BRIDGE_KRW_BLEND = 0.24
EWY_FX_CORE_EWY_WEIGHT = 1.0
EWY_FX_CORE_KRW_WEIGHT = 1.0
AUXILIARY_SIGNAL_BLEND = 0.18
EWY_FX_CORRECTION_LOOKBACK_DAYS = 160
EWY_FX_CORRECTION_MIN_SAMPLES = 40
EWY_FX_CORRECTION_RECENCY_DECAY = 0.985
EWY_FX_CORRECTION_EWY_COEF_MIN = 0.20
EWY_FX_CORRECTION_EWY_COEF_MAX = 1.80
EWY_FX_CORRECTION_KRW_COEF_MIN = 0.20
EWY_FX_CORRECTION_KRW_COEF_MAX = 1.80
EWY_FX_CORRECTION_INTERCEPT_MIN = -1.50
EWY_FX_CORRECTION_INTERCEPT_MAX = 1.50
EWY_FX_STRUCTURAL_EWY_WEIGHT = 1.0
EWY_FX_STRUCTURAL_KRW_WEIGHT = 1.0
EWY_FX_STRUCTURAL_BLEND = 0.65
EWY_FX_STRUCTURAL_BLEND_HIGH_MOVE = 0.78
EWY_FX_HIGH_MOVE_TRIGGER_PCT = 2.0
EWY_FX_LOW_CONFIDENCE_R2 = 0.20
ML_RESIDUAL_BLEND = 0.12
ML_RESIDUAL_CAP_MIN_PCT = 0.18
ML_RESIDUAL_CAP_MAX_PCT = 0.75
ML_RESIDUAL_CAP_SHARE = 0.45
AUX_RESIDUAL_BLEND = 0.25
AUX_RESIDUAL_CAP_MIN_PCT = 0.15
AUX_RESIDUAL_CAP_MAX_PCT = 0.65
AUX_RESIDUAL_CAP_SHARE = 0.35
ANCHOR_GUARD_BAND_MIN_PCT = 0.35
ANCHOR_GUARD_BAND_MAX_PCT = 1.15
ANCHOR_GUARD_BAND_SHARE = 0.65
ANCHOR_GUARD_BAND_OFFSET_PCT = 0.20
FALLBACK_ML_BLEND = 0.18
FALLBACK_AUX_BLEND = 0.72
FALLBACK_GUARD_BAND_MIN_PCT = 0.55
FALLBACK_GUARD_BAND_SHARE = 0.50
MEAN_REVERSION_THRESHOLD_PCT = 5.0
MEAN_REVERSION_SLOPE = 0.04
MEAN_REVERSION_FLOOR = 0.78
REGIME_CLIP_MIN_PCT = 2.5
REGIME_CLIP_PREV_CLOSE_SHARE = 0.9
REGIME_CLIP_CORE_BUFFER_PCT = 1.25
EWY_ALIGNMENT_TRIGGER_PCT = 1.0
EWY_ALIGNMENT_MIN_SHARE = 0.80
RESIDUAL_MODEL_CAP_MIN_PCT = 0.18
RESIDUAL_MODEL_CAP_MAX_PCT = 0.95
RESIDUAL_MODEL_CAP_SHARE = 0.38
ANCHOR_BIAS_BLEND = 0.12
ANCHOR_BIAS_CAP_PCT = 0.24
SESSION_GUARD_BAND_MIN_PCT = 0.42
SESSION_GUARD_BAND_SHARE = 0.38
BRIDGE_GUARD_BAND_MIN_PCT = 0.65
BRIDGE_GUARD_BAND_SHARE = 0.58
US_PREMARKET_OPEN_ET = time(4, 0)
US_SESSION_END_ET = time(20, 0)
EWY_LIVE_STALE_MINUTES = 45
MACRO_SHOCK_US10Y_TRIGGER_PCT = 1.2
MACRO_SHOCK_WTI_TRIGGER_PCT = 3.0
RISK_OFF_GOLD_TRIGGER_PCT = 0.40
RISK_OFF_VIX_TRIGGER_PCT = 2.0
RISK_OFF_EQUITY_TRIGGER_PCT = -0.40
REGIME_US10Y_PENALTY_WEIGHT = 0.08
REGIME_WTI_PENALTY_WEIGHT = 0.05
REGIME_RISK_OFF_PENALTY_WEIGHT = 0.14
REGIME_POSITIVE_BONUS_WEIGHT = 0.04
REGIME_ADJUSTMENT_CAP_PCT = 0.55

TV_FUTURES_SCAN_URL = "https://scanner.tradingview.com/futures/scan"
TV_KOSPI_NIGHT_SYMBOL = "KRX:K2I1!"
NIGHT_FUTURES_STALE_MINUTES = 180
NIGHT_FUTURES_SOURCE_MIN_REFRESH_SECONDS = 30
NIGHT_FUTURES_OPERATION_START = time(18, 0)
NIGHT_FUTURES_OPERATION_END = time(6, 30)
ESIGNAL_KOSPI_NIGHT_PAGE_URL = "https://esignal.co.kr/kospi200-futures-night/"
ESIGNAL_KOSPI_NIGHT_CACHE_URL = "https://esignal.co.kr/data/cache/kospif_ngt.js"
ESIGNAL_KOSPI_DAY_PAGE_URL = "https://esignal.co.kr/kospi200-futures/"
ESIGNAL_KOSPI_DAY_CACHE_URL = "https://esignal.co.kr/data/cache/kospif_day.js"
ESIGNAL_SOCKET_IO_URL = "https://esignal.co.kr/proxy/8889/socket.io/"
ESIGNAL_ORIGIN_URL = "https://esignal.co.kr"
ESIGNAL_DAY_SYMBOL = "A0166"
ESIGNAL_REQUEST_TIMEOUT = 10
ESIGNAL_USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36"
)
KOSPI_DAY_FUTURES_SESSION_OPEN = time(8, 45)
KOSPI_DAY_FUTURES_SESSION_CLOSE = time(15, 45)

CORE_MODEL_LOOKBACK_DAYS = 180
RESIDUAL_MODEL_LOOKBACK_DAYS = 180
KOSPI_MAPPING_LOOKBACK_DAYS = 240
CORE_MODEL_ALPHA = 1.0
RESIDUAL_MODEL_ALPHA = 2.0
KOSPI_MAPPING_ALPHA = 0.5
RESIDUAL_STD_FLOOR = 1e-6
BASIS_EWMA_DECAY = 0.82
BASIS_EWMA_CAP_PCT = 0.55
SOX_NDX_BETA_CAP = 2.5


def main() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    DOCS_DIR.mkdir(parents=True, exist_ok=True)
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    yf.set_tz_cache_location(str(CACHE_DIR))

    print("Fetching daily market history...")
    market = fetch_market_data()
    print("Fetching intraday indicators...")
    live_market, live_overrides = fetch_live_indicators()
    print("Building training dataset...")
    dataset = build_dataset(market)
    print("Training EWY synthetic KOSPI model...")
    result = train_lgbm(dataset)
    prior_prediction_payload = load_prediction_payload()
    prediction_archive = load_prediction_archive()
    prediction_archive = merge_prediction_into_archive(prediction_archive, prior_prediction_payload)
    prediction_archive = prune_premature_archive_entries(
        prediction_archive, datetime.now(timezone.utc).astimezone(KST)
    )
    print("Writing output JSON files...")
    history_df = build_history_df(result, market, live_market, dataset, prediction_archive)
    latest = build_latest(live_market, result, market, live_overrides)
    prediction_payload = write_prediction_json(latest, result, history_df)
    history_df = overlay_prediction_on_history_df(history_df, prediction_payload)
    prediction_archive = merge_prediction_into_archive(prediction_archive, prediction_payload)
    prediction_archive = prune_premature_archive_entries(
        prediction_archive, datetime.now(timezone.utc).astimezone(KST)
    )
    write_prediction_archive_json(prediction_archive)
    write_history_json(result, history_df)
    write_indicators_json(live_market, market, live_overrides)
    write_diagnostics_json(result)
    print(f"Done. Output directory: {DATA_DIR}")


def write_output_json(file_name: str, payload: dict) -> None:
    encoded = json.dumps(payload, ensure_ascii=False, indent=2)
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    OUT_DATA_DIR.mkdir(parents=True, exist_ok=True)
    (DATA_DIR / file_name).write_text(encoded, encoding="utf8")
    (OUT_DATA_DIR / file_name).write_text(encoded, encoding="utf8")


def parse_prediction_target_date(value: object) -> str | None:
    if not isinstance(value, str):
        return None

    iso_match = re.search(r"\d{4}-\d{2}-\d{2}", value)
    if iso_match:
        return iso_match.group(0)

    num_parts = re.findall(r"\d+", value)
    if len(num_parts) < 3:
        return None

    year, month, day = (int(num_parts[0]), int(num_parts[1]), int(num_parts[2]))
    try:
        return date(year, month, day).isoformat()
    except ValueError:
        return None


def rollforward_business_day(target: date | datetime | pd.Timestamp) -> pd.Timestamp:
    return pd.offsets.BDay().rollforward(pd.Timestamp(target).normalize())


def resolve_prediction_target_timestamp(now_kst: datetime) -> pd.Timestamp:
    today = pd.Timestamp(now_kst.date())
    today_business = rollforward_business_day(today)
    if today_business != today:
        return today_business

    if now_kst.time() >= PREDICTION_TARGET_ROLLOVER_TIME:
        return rollforward_business_day(today + pd.Timedelta(days=1))
    return today


def is_prediction_operation_window(now_kst: datetime) -> bool:
    current = now_kst.time()
    return current >= PREDICTION_OPERATION_START or current < PREDICTION_OPERATION_END


def next_business_day_iso(session_date_value: object) -> str | None:
    if not isinstance(session_date_value, str) or not session_date_value:
        return None

    try:
        session_date = date.fromisoformat(session_date_value)
    except ValueError:
        return None

    return rollforward_business_day(session_date + timedelta(days=1)).date().isoformat()


def load_prediction_payload() -> dict | None:
    path = DATA_DIR / "prediction.json"
    if not path.exists():
        return None

    try:
        payload = json.loads(path.read_text(encoding="utf8"))
    except (OSError, ValueError, TypeError):
        return None

    if not isinstance(payload, dict):
        return None
    return payload


def load_prediction_archive() -> list[dict]:
    if not PREDICTION_ARCHIVE_FILE.exists():
        return []

    try:
        payload = json.loads(PREDICTION_ARCHIVE_FILE.read_text(encoding="utf8"))
    except (OSError, ValueError, TypeError):
        return []

    if not isinstance(payload, dict):
        return []

    records = payload.get("records")
    if not isinstance(records, list):
        return []

    normalized: list[dict] = []
    for record in records:
        if isinstance(record, dict):
            normalized.append(record)
    return normalized


def normalize_prediction_archive_entry(payload: dict) -> dict | None:
    prediction_date_iso = parse_prediction_target_date(
        payload.get("predictionDateIso") or payload.get("predictionDate")
    )
    generated_at = payload.get("generatedAt")
    if not prediction_date_iso or not isinstance(generated_at, str):
        return None

    try:
        low = float(payload.get("rangeLow"))
        high = float(payload.get("rangeHigh"))
        point = float(payload.get("pointPrediction"))
    except (TypeError, ValueError):
        return None

    if low > high:
        low, high = high, low

    night_simple_raw = payload.get("nightFuturesSimplePoint")
    night_simple: float | None
    if night_simple_raw is None:
        night_simple = None
    else:
        try:
            night_simple = float(night_simple_raw)
        except (TypeError, ValueError):
            night_simple = None

    return {
        "predictionDateIso": prediction_date_iso,
        "predictionDate": payload.get("predictionDate"),
        "generatedAt": generated_at,
        "rangeLow": round(low, 2),
        "rangeHigh": round(high, 2),
        "pointPrediction": round(point, 2),
        "nightFuturesSimplePoint": round(night_simple, 2) if night_simple is not None else None,
    }


def merge_prediction_into_archive(archive: list[dict], payload: dict | None) -> list[dict]:
    if payload is None:
        return archive

    entry = normalize_prediction_archive_entry(payload)
    if entry is None:
        return archive

    by_date: dict[str, dict] = {}
    for row in archive:
        normalized = normalize_prediction_archive_entry(row)
        if normalized is None:
            continue
        date_key = normalized["predictionDateIso"]
        existing = by_date.get(date_key)
        if existing is None or str(normalized["generatedAt"]) >= str(existing["generatedAt"]):
            by_date[date_key] = normalized

    date_key = entry["predictionDateIso"]
    existing = by_date.get(date_key)
    if existing is None or str(entry["generatedAt"]) >= str(existing["generatedAt"]):
        by_date[date_key] = entry

    merged = sorted(
        by_date.values(),
        key=lambda row: str(row.get("predictionDateIso", "")),
        reverse=True,
    )[:PREDICTION_ARCHIVE_MAX_RECORDS]
    return merged


def prune_premature_archive_entries(archive: list[dict], now_kst: datetime) -> list[dict]:
    current_target_ts = resolve_prediction_target_timestamp(now_kst)
    if current_target_ts.date() != now_kst.date():
        return archive

    current_target_iso = current_target_ts.date().isoformat()
    pruned: list[dict] = []
    for row in archive:
        prediction_date_iso = parse_prediction_target_date(
            row.get("predictionDateIso") if isinstance(row, dict) else None
        )
        if prediction_date_iso is None or prediction_date_iso <= current_target_iso:
            pruned.append(row)
    return pruned


def write_prediction_archive_json(archive: list[dict]) -> None:
    payload = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "records": archive,
    }
    write_output_json("prediction_archive.json", payload)


def fetch_market_data() -> dict[str, pd.DataFrame]:
    period = f"{LOOKBACK_DAYS}d"
    frames: dict[str, pd.DataFrame] = {}
    all_tickers = {**KOREA_TICKERS, **MODEL_TICKERS, **INDICATOR_ONLY_TICKERS}

    for name, ticker in all_tickers.items():
      print(f"  - downloading {name} ({ticker})")
      df = yf.download(ticker, period=period, interval="1d", auto_adjust=False, progress=False, threads=False)
      if df.empty:
          continue
      if isinstance(df.columns, pd.MultiIndex):
          df.columns = df.columns.get_level_values(0)
      frames[name] = df.rename_axis("date").sort_index()

    return frames


def latest_closed_day_futures_session_date(now_kst: datetime) -> str:
    today = pd.Timestamp(now_kst.date())
    if now_kst.weekday() < 5 and now_kst.time() >= KOSPI_DAY_FUTURES_SESSION_CLOSE:
        target = today
    else:
        target = today - pd.offsets.BDay(1)
    return pd.Timestamp(target).date().isoformat()


def load_day_futures_close_cache() -> dict | None:
    if not DAY_FUTURES_CLOSE_CACHE_FILE.exists():
        return None

    try:
        payload = json.loads(DAY_FUTURES_CLOSE_CACHE_FILE.read_text(encoding="utf8"))
    except (OSError, ValueError, TypeError):
        return None

    session_date = payload.get("session_date")
    if not isinstance(session_date, str) or not session_date:
        return None

    try:
        close = float(payload.get("close"))
    except (TypeError, ValueError):
        return None

    if close == 0:
        return None

    return {
        "close": close,
        "updated_at": payload.get("updated_at"),
        "session_date": session_date,
        "provider": payload.get("provider", "day-close-cache"),
        "selection": payload.get("selection", "cached"),
        "cached_at": payload.get("cached_at"),
    }


def save_day_futures_close_cache(quote: dict) -> None:
    session_date = quote.get("session_date")
    if not session_date:
        return

    try:
        close = float(quote.get("close"))
    except (TypeError, ValueError):
        return

    if close == 0:
        return

    payload = {
        "close": round(close, 6),
        "updated_at": quote.get("updated_at"),
        "session_date": session_date,
        "provider": quote.get("provider", "esignal-day-cache"),
        "selection": quote.get("selection", "session-close"),
        "cached_at": datetime.now(timezone.utc).isoformat(),
    }
    write_output_json("day_futures_close_cache.json", payload)


def fetch_esignal_socket_payload(url: str, referer: str, body: str | None = None) -> str | None:
    headers = {
        "User-Agent": ESIGNAL_USER_AGENT,
        "Referer": referer,
        "Origin": ESIGNAL_ORIGIN_URL,
        "Accept": "*/*",
        "Cache-Control": "no-cache",
    }
    data = None
    method = "GET"
    if body is not None:
        method = "POST"
        headers["Content-Type"] = "text/plain;charset=UTF-8"
        data = body.encode("utf-8")

    req = urllib.request.Request(url, headers=headers, data=data, method=method)
    try:
        with urllib.request.urlopen(req, timeout=ESIGNAL_REQUEST_TIMEOUT) as response:
            return response.read().decode("utf-8")
    except (urllib.error.URLError, TimeoutError):
        return None


def parse_socket_open_packet(payload: str) -> str | None:
    for packet in payload.split("\x1e"):
        if not packet.startswith("0"):
            continue
        try:
            data = json.loads(packet[1:])
        except (TypeError, ValueError):
            continue
        if not isinstance(data, dict):
            continue
        sid = data.get("sid")
        if isinstance(sid, str) and sid:
            return sid
    return None


def parse_socket_event_payload(payload: str) -> list[tuple[str, dict]]:
    events: list[tuple[str, dict]] = []
    for packet in payload.split("\x1e"):
        if not packet.startswith("42"):
            continue
        try:
            parsed = json.loads(packet[2:])
        except (TypeError, ValueError):
            continue
        if not isinstance(parsed, list) or len(parsed) < 2:
            continue

        event_name = parsed[0]
        event_body = parsed[1]
        if isinstance(event_body, str):
            try:
                event_body = json.loads(event_body)
            except (TypeError, ValueError):
                continue

        if not isinstance(event_name, str) or not isinstance(event_body, dict):
            continue
        events.append((event_name, event_body))
    return events


def fetch_esignal_kospi_day_close_quote_from_socket() -> dict | None:
    query = urllib.parse.urlencode(
        {
            "EIO": "4",
            "transport": "polling",
            "t": str(int(datetime.now(timezone.utc).timestamp() * 1000)),
        }
    )
    open_url = f"{ESIGNAL_SOCKET_IO_URL}?{query}"
    open_payload = fetch_esignal_socket_payload(open_url, ESIGNAL_KOSPI_DAY_PAGE_URL)
    if not open_payload:
        return None

    sid = parse_socket_open_packet(open_payload)
    if not sid:
        return None

    sid_query = urllib.parse.urlencode({"EIO": "4", "transport": "polling", "sid": sid})
    sid_url = f"{ESIGNAL_SOCKET_IO_URL}?{sid_query}"
    _ = fetch_esignal_socket_payload(sid_url, ESIGNAL_KOSPI_DAY_PAGE_URL, body="40")

    for _ in range(2):
        poll_url = f"{sid_url}&t={int(datetime.now(timezone.utc).timestamp() * 1000)}"
        poll_payload = fetch_esignal_socket_payload(poll_url, ESIGNAL_KOSPI_DAY_PAGE_URL)
        if not poll_payload:
            continue

        if "2" in poll_payload.split("\x1e"):
            _ = fetch_esignal_socket_payload(sid_url, ESIGNAL_KOSPI_DAY_PAGE_URL, body="3")

        for event_name, event in parse_socket_event_payload(poll_payload):
            if event_name not in {"populate", "kospif_day"}:
                continue

            symbol = str(event.get("symbol", "")).strip()
            if symbol and symbol != ESIGNAL_DAY_SYMBOL:
                continue

            close_raw = event.get("close")
            if close_raw is None:
                continue

            try:
                close_value = float(close_raw)
            except (TypeError, ValueError):
                continue
            if close_value == 0:
                continue

            updated_at: datetime | None = None
            tstamp = event.get("tstamp")
            if isinstance(tstamp, str) and tstamp:
                normalized_tstamp = tstamp.replace("Z", "+00:00")
                try:
                    parsed_tstamp = datetime.fromisoformat(normalized_tstamp)
                except ValueError:
                    parsed_tstamp = None
                if parsed_tstamp is not None:
                    if parsed_tstamp.tzinfo is None:
                        updated_at = parsed_tstamp.replace(tzinfo=timezone.utc)
                    else:
                        updated_at = parsed_tstamp.astimezone(timezone.utc)

            if updated_at is None:
                unix_ts = event.get("unix_timestamp")
                try:
                    if unix_ts is not None:
                        updated_at = datetime.fromtimestamp(int(unix_ts) / 1000, tz=timezone.utc)
                except (TypeError, ValueError):
                    updated_at = None

            if updated_at is None:
                updated_at = datetime.now(timezone.utc)

            session_date = updated_at.astimezone(KST).date().isoformat()
            return {
                "close": close_value,
                "updated_at": updated_at.isoformat(),
                "session_date": session_date,
                "provider": "esignal-socket",
                "selection": "session-close-socket",
            }

    return None


def fetch_esignal_kospi_day_close_quote_from_cache() -> dict | None:
    req = urllib.request.Request(
        ESIGNAL_KOSPI_DAY_CACHE_URL,
        headers={
            "User-Agent": ESIGNAL_USER_AGENT,
            "Referer": ESIGNAL_KOSPI_DAY_PAGE_URL,
            "Accept": "application/json,text/javascript,*/*;q=0.1",
            "Cache-Control": "no-cache",
        },
        method="GET",
    )

    try:
        with urllib.request.urlopen(req, timeout=ESIGNAL_REQUEST_TIMEOUT) as response:
            body = response.read().decode("utf-8")
    except (urllib.error.URLError, TimeoutError):
        return None

    try:
        payload = json.loads(body)
        ticks = payload.get("data", [])
        if not ticks:
            return None
    except (ValueError, TypeError):
        return None

    latest_by_date: dict[str, tuple[datetime, float]] = {}
    for tick in ticks:
        try:
            ts_utc = datetime.fromtimestamp(int(tick[0]) / 1000, tz=timezone.utc)
            price = float(tick[1])
        except (TypeError, ValueError, IndexError):
            continue

        ts_kst = ts_utc.astimezone(KST)
        if not (KOSPI_DAY_FUTURES_SESSION_OPEN <= ts_kst.time() <= KOSPI_DAY_FUTURES_SESSION_CLOSE):
            continue

        date_key = ts_kst.date().isoformat()
        previous = latest_by_date.get(date_key)
        if previous is None or ts_utc > previous[0]:
            latest_by_date[date_key] = (ts_utc, price)

    if latest_by_date:
        latest_date = max(latest_by_date.keys())
        latest_ts, close_price = latest_by_date[latest_date]
        return {
            "close": close_price,
            "updated_at": latest_ts.isoformat(),
            "session_date": latest_date,
            "provider": "esignal-day-cache",
            "selection": "session-close",
        }

    try:
        fallback_tick = ticks[-1]
        fallback_ts = datetime.fromtimestamp(int(fallback_tick[0]) / 1000, tz=timezone.utc)
        fallback_price = float(fallback_tick[1])
    except (TypeError, ValueError, IndexError):
        return None

    return {
        "close": fallback_price,
        "updated_at": fallback_ts.isoformat(),
        "session_date": fallback_ts.astimezone(KST).date().isoformat(),
        "provider": "esignal-day-cache",
        "selection": "latest-tick-fallback",
    }


def fetch_esignal_kospi_day_close_quote() -> dict | None:
    socket_quote = fetch_esignal_kospi_day_close_quote_from_socket()
    if socket_quote:
        return socket_quote
    return fetch_esignal_kospi_day_close_quote_from_cache()


def resolve_day_futures_close_quote() -> dict | None:
    now_kst = datetime.now(timezone.utc).astimezone(KST)
    target_session_date = latest_closed_day_futures_session_date(now_kst)
    cached = load_day_futures_close_cache()

    if cached:
        cached_session_date = str(cached.get("session_date", ""))
        cached_is_socket_close = (
            str(cached.get("provider", "")) == "esignal-socket"
            or str(cached.get("selection", "")) == "session-close-socket"
        )
        if cached_session_date >= target_session_date and cached_is_socket_close:
            cached["selection"] = cached.get("selection", "cached")
            return cached

    fetched = fetch_esignal_kospi_day_close_quote()
    if fetched:
        fetched_session_date = str(fetched.get("session_date", ""))
        if fetched_session_date:
            save_day_futures_close_cache(fetched)
        if cached and fetched_session_date and str(cached.get("session_date", "")) > fetched_session_date:
            return cached
        return fetched

    return cached


def apply_day_futures_reference(
    quote: dict,
    day_close_quote: dict | None,
) -> dict:
    if not day_close_quote:
        return quote

    try:
        day_close = float(day_close_quote["close"])
    except (TypeError, ValueError, KeyError):
        return quote

    if day_close == 0:
        return quote

    quote["previous_close"] = day_close
    quote["day_close"] = day_close
    quote["day_close_updated_at"] = day_close_quote.get("updated_at")
    quote["day_close_date"] = day_close_quote.get("session_date")
    quote["reference_close"] = "day-futures-close"
    price = float(quote.get("price", day_close))
    quote["change_pct"] = (price / day_close - 1) * 100
    return quote


def resolve_night_futures_target_date_iso(
    quote: dict | None,
    day_close_quote: dict | None = None,
) -> str | None:
    if not isinstance(quote, dict):
        return None

    session_date = quote.get("day_close_date")
    if (not isinstance(session_date, str) or not session_date) and isinstance(day_close_quote, dict):
        session_date = day_close_quote.get("session_date")

    next_session_date = next_business_day_iso(session_date)
    if next_session_date:
        return next_session_date

    updated_at = parse_iso_datetime_utc(quote.get("updated_at"))
    if updated_at is None:
        return None
    return updated_at.astimezone(KST).date().isoformat()


def resolve_night_futures_change_for_target(
    target_date_iso: str | None,
    quote: dict | None,
    day_close_quote: dict | None = None,
) -> float | None:
    if not isinstance(target_date_iso, str) or not target_date_iso or not isinstance(quote, dict):
        return None

    normalized_quote = apply_day_futures_reference(dict(quote), day_close_quote)
    if resolve_night_futures_target_date_iso(normalized_quote, day_close_quote) != target_date_iso:
        return None

    change_pct = normalized_quote.get("change_pct")
    if change_pct is not None:
        try:
            return float(change_pct)
        except (TypeError, ValueError):
            pass

    try:
        price = float(normalized_quote.get("price"))
        previous_close = float(normalized_quote.get("previous_close"))
    except (TypeError, ValueError):
        return None

    if previous_close == 0:
        return None
    return (price / previous_close - 1) * 100


def parse_iso_datetime_utc(value: object) -> datetime | None:
    if not isinstance(value, str) or not value:
        return None

    try:
        parsed = datetime.fromisoformat(value)
    except ValueError:
        return None

    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def is_night_futures_operation_window(now_utc: datetime) -> bool:
    now_kst = now_utc.astimezone(KST)
    current = now_kst.hour * 60 + now_kst.minute
    start = NIGHT_FUTURES_OPERATION_START.hour * 60 + NIGHT_FUTURES_OPERATION_START.minute
    end = NIGHT_FUTURES_OPERATION_END.hour * 60 + NIGHT_FUTURES_OPERATION_END.minute
    return current >= start or current <= end


def normalize_night_futures_quote_state(quote: dict, now_utc: datetime | None = None) -> dict:
    current_utc = now_utc or datetime.now(timezone.utc)
    normalized = dict(quote)
    updated_at = parse_iso_datetime_utc(normalized.get("updated_at")) or current_utc
    age_minutes = max(0.0, (current_utc - updated_at).total_seconds() / 60)
    normalized["updated_at"] = updated_at.isoformat()
    normalized["age_minutes"] = round(age_minutes, 1)
    normalized["is_live_night"] = (
        age_minutes <= NIGHT_FUTURES_STALE_MINUTES and is_night_futures_operation_window(current_utc)
    )
    return normalized


def load_night_futures_source_cache() -> dict | None:
    if not NIGHT_FUTURES_SOURCE_CACHE_FILE.exists():
        return None

    try:
        payload = json.loads(NIGHT_FUTURES_SOURCE_CACHE_FILE.read_text(encoding="utf8"))
    except (OSError, ValueError, TypeError):
        return None

    if not isinstance(payload, dict):
        return None

    quote = payload.get("quote")
    fetched_at = parse_iso_datetime_utc(payload.get("fetched_at"))
    if not isinstance(quote, dict) or fetched_at is None:
        return None

    return {"quote": quote, "fetched_at": fetched_at}


def save_night_futures_source_cache(quote: dict) -> None:
    payload = {
        "quote": quote,
        "fetched_at": datetime.now(timezone.utc).isoformat(),
    }
    write_output_json("night_futures_source_cache.json", payload)


def fetch_tradingview_kospi_night_quote(day_close_quote: dict | None = None) -> dict | None:
    now_utc = datetime.now(timezone.utc)
    payload = {
        "symbols": {"tickers": [TV_KOSPI_NIGHT_SYMBOL], "query": {"types": []}},
        "columns": ["close", "change", "change_abs", "update_time", "update_mode", "description", "exchange"],
    }
    req = urllib.request.Request(
        TV_FUTURES_SCAN_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json", "User-Agent": "Mozilla/5.0"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=12) as response:
            body = response.read().decode("utf-8")
    except (urllib.error.URLError, TimeoutError):
        return None

    try:
        data = json.loads(body)
        rows = data.get("data", [])
        if not rows:
            return None
        close, change_pct, change_abs, update_time, update_mode, description, exchange = rows[0]["d"]
    except (ValueError, KeyError, TypeError, IndexError):
        return None

    if close is None:
        return None

    price = float(close)
    if change_abs is not None:
        previous_close = price - float(change_abs)
    elif change_pct is not None:
        previous_close = price / (1 + float(change_pct) / 100)
    else:
        previous_close = price

    if isinstance(update_time, (int, float)) and update_time > 0:
        updated_at = datetime.fromtimestamp(float(update_time), tz=timezone.utc)
    else:
        updated_at = datetime.now(timezone.utc)

    quote = {
        "price": price,
        "previous_close": previous_close,
        "change_pct": float(change_pct) if change_pct is not None else (price / previous_close - 1) * 100,
        "updated_at": updated_at.isoformat(),
        "update_mode": update_mode or "",
        "description": description or "KOSPI 200 Futures",
        "exchange": exchange or "KRX",
        "provider": "tradingview",
        "reference_close": "provider-default",
        "day_close": None,
        "day_close_updated_at": None,
        "day_close_date": None,
    }
    quote = normalize_night_futures_quote_state(quote, now_utc)
    return apply_day_futures_reference(quote, day_close_quote)


def fetch_esignal_kospi_night_quote(day_close_quote: dict | None = None) -> dict | None:
    now_utc = datetime.now(timezone.utc)
    cached_payload = load_night_futures_source_cache()
    if cached_payload:
        cached_quote = cached_payload["quote"]
        cached_fetched_at = cached_payload["fetched_at"]
        cache_age_seconds = max(0.0, (now_utc - cached_fetched_at).total_seconds())
        if cache_age_seconds < NIGHT_FUTURES_SOURCE_MIN_REFRESH_SECONDS:
            normalized_cached = normalize_night_futures_quote_state(cached_quote, now_utc)
            return apply_day_futures_reference(normalized_cached, day_close_quote)

    req = urllib.request.Request(
        ESIGNAL_KOSPI_NIGHT_CACHE_URL,
        headers={
            "User-Agent": ESIGNAL_USER_AGENT,
            "Referer": ESIGNAL_KOSPI_NIGHT_PAGE_URL,
            "Accept": "application/json,text/javascript,*/*;q=0.1",
            "Cache-Control": "no-cache",
        },
        method="GET",
    )

    try:
        with urllib.request.urlopen(req, timeout=ESIGNAL_REQUEST_TIMEOUT) as response:
            body = response.read().decode("utf-8")
    except (urllib.error.URLError, TimeoutError):
        if cached_payload:
            normalized_cached = normalize_night_futures_quote_state(cached_payload["quote"], now_utc)
            return apply_day_futures_reference(normalized_cached, day_close_quote)
        return None

    try:
        payload = json.loads(body)
        ticks = payload.get("data", [])
        if not ticks:
            return None
        latest_tick = ticks[-1]
        ts_ms = int(latest_tick[0])
        price = float(latest_tick[1])
        open_price = payload.get("open")
        if open_price is None:
            open_price = ticks[0][1]
        previous_close = float(open_price)
        if previous_close == 0:
            previous_close = price
    except (ValueError, TypeError, IndexError, KeyError):
        if cached_payload:
            normalized_cached = normalize_night_futures_quote_state(cached_payload["quote"], now_utc)
            return apply_day_futures_reference(normalized_cached, day_close_quote)
        return None

    updated_at = datetime.fromtimestamp(ts_ms / 1000, tz=timezone.utc)
    change_pct = ((price / previous_close - 1) * 100) if previous_close else 0.0

    quote = {
        "price": price,
        "previous_close": previous_close,
        "change_pct": change_pct,
        "updated_at": updated_at.isoformat(),
        "update_mode": "cache-json",
        "description": "KOSPI 200 Night Futures",
        "exchange": "KRX",
        "provider": "esignal",
        "reference_close": "night-open",
        "day_close": None,
        "day_close_updated_at": None,
        "day_close_date": None,
    }
    save_night_futures_source_cache(quote)
    quote = normalize_night_futures_quote_state(quote, now_utc)
    return apply_day_futures_reference(quote, day_close_quote)


def fetch_live_indicators() -> tuple[dict[str, pd.DataFrame], dict[str, dict]]:
    frames: dict[str, pd.DataFrame] = {}
    overrides: dict[str, dict] = {}

    for name, ticker in {**KOREA_TICKERS, **MODEL_TICKERS}.items():
        df = yf.download(
            ticker,
            period="2d",
            interval="1m",
            prepost=True,
            auto_adjust=False,
            progress=False,
            threads=False,
        )
        if df.empty:
            df = yf.download(ticker, period="5d", interval="1d", auto_adjust=False, progress=False, threads=False)
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = df.columns.get_level_values(0)
        frames[name] = df.sort_index()

    day_close_quote = resolve_day_futures_close_quote()
    k200f_quote = fetch_esignal_kospi_night_quote(day_close_quote)
    if k200f_quote is None:
        k200f_quote = fetch_tradingview_kospi_night_quote(day_close_quote)

    if k200f_quote is None:
        fallback_override = {"is_live_night": False}
        if day_close_quote:
            fallback_override.update(
                {
                    "day_close": float(day_close_quote.get("close", 0) or 0),
                    "day_close_updated_at": day_close_quote.get("updated_at"),
                    "day_close_date": day_close_quote.get("session_date"),
                    "reference_close": "day-futures-close",
                }
            )
        overrides["k200f"] = fallback_override
    else:
        overrides["k200f"] = k200f_quote

    if k200f_quote and k200f_quote.get("is_live_night"):
        updated_at = pd.Timestamp(k200f_quote["updated_at"])
        if updated_at.tzinfo is None:
            updated_at = updated_at.tz_localize("UTC")
        else:
            updated_at = updated_at.tz_convert("UTC")
        prev_close = float(k200f_quote["previous_close"])
        current = float(k200f_quote["price"])
        frames["k200f"] = pd.DataFrame(
            {"Close": [prev_close, current], "PrevClose": [prev_close, prev_close]},
            index=pd.DatetimeIndex([updated_at - pd.Timedelta(minutes=1), updated_at]),
        ).sort_index()
    else:
        frames["k200f"] = pd.DataFrame(columns=["Close", "PrevClose"])

    return frames, overrides


def _norm(ts: pd.Timestamp) -> pd.Timestamp:
    value = pd.Timestamp(ts)
    if value.tzinfo is not None:
        value = value.tz_convert(None)
    return value.normalize()


def build_dataset(market: dict[str, pd.DataFrame]) -> pd.DataFrame:
    kospi = market["kospi"][["Open", "Close"]].copy()
    kospi200 = market["kospi200"][["Open", "Close"]].copy()
    kospi.index = kospi.index.map(_norm)
    kospi200.index = kospi200.index.map(_norm)

    dataset = kospi.rename(columns={"Open": "kospi_open", "Close": "kospi_close"}).join(
        kospi200.rename(columns={"Open": "kospi200_open", "Close": "kospi200_close"}),
        how="inner",
    )

    dataset["Open"] = dataset["kospi_open"]
    dataset["Close"] = dataset["kospi_close"]
    dataset["target_return"] = np.log(dataset["kospi_open"] / dataset["kospi_close"].shift(1)) * 100
    dataset["target_k200_return"] = np.log(dataset["kospi200_open"] / dataset["kospi200_close"].shift(1)) * 100
    dataset["prev_close"] = dataset["kospi_close"].shift(1)
    dataset["prev_k200_close"] = dataset["kospi200_close"].shift(1)
    dataset["prev_close_change"] = np.log(dataset["kospi_close"].shift(1) / dataset["kospi_close"].shift(2)) * 100

    features = []
    for name in ALL_FEATURES:
        frame = market[name].copy()
        if "Close" not in frame:
            continue

        feat = pd.DataFrame(index=frame.index)
        if name == "us10y":
            feat[f"{name}_return"] = frame["Close"].diff()
        else:
            feat[f"{name}_return"] = np.log(frame["Close"] / frame["Close"].shift(1)) * 100
        if name == "vix":
            feat["vix_level"] = frame["Close"]

        feat.index = feat.index.map(_norm) + pd.offsets.BDay(1)
        feat = feat.groupby(feat.index).last()
        features.append(feat)

    for feature_frame in features:
        dataset = dataset.join(feature_frame, how="inner")

    return dataset.ffill().dropna()


def fit_ewy_fx_correction(dataset: pd.DataFrame) -> dict[str, float | int]:
    default_payload = {
        "intercept": 0.0,
        "ewy_coef": EWY_FX_CORE_EWY_WEIGHT,
        "krw_coef": EWY_FX_CORE_KRW_WEIGHT,
        "sample_size": 0,
        "r2": 0.0,
        "mae": 0.0,
    }

    required_columns = {"target_k200_return", "ewy_return", "krw_return"}
    if not required_columns.issubset(dataset.columns):
        return default_payload

    sample = dataset[["target_k200_return", "ewy_return", "krw_return"]].dropna()
    if sample.empty:
        return default_payload

    sample = sample.tail(CORE_MODEL_LOOKBACK_DAYS)
    sample_size = int(len(sample))
    if sample_size < EWY_FX_CORRECTION_MIN_SAMPLES:
        default_payload["sample_size"] = sample_size
        return default_payload

    y = sample["target_k200_return"].to_numpy(dtype=np.float64)
    ewy = sample["ewy_return"].to_numpy(dtype=np.float64)
    krw = sample["krw_return"].to_numpy(dtype=np.float64)
    X = np.column_stack([ewy, krw])

    decay_exponents = np.arange(sample_size - 1, -1, -1, dtype=np.float64)
    weights = np.power(EWY_FX_CORRECTION_RECENCY_DECAY, decay_exponents)
    try:
        model = Ridge(alpha=CORE_MODEL_ALPHA)
        model.fit(X, y, sample_weight=weights)
        intercept_raw = float(model.intercept_)
        ewy_coef_raw = float(model.coef_[0])
        krw_coef_raw = float(model.coef_[1])
    except (ValueError, TypeError):
        return default_payload

    intercept = float(
        np.clip(intercept_raw, EWY_FX_CORRECTION_INTERCEPT_MIN, EWY_FX_CORRECTION_INTERCEPT_MAX)
    )
    ewy_coef = float(np.clip(ewy_coef_raw, EWY_FX_CORRECTION_EWY_COEF_MIN, EWY_FX_CORRECTION_EWY_COEF_MAX))
    krw_coef = float(np.clip(krw_coef_raw, EWY_FX_CORRECTION_KRW_COEF_MIN, EWY_FX_CORRECTION_KRW_COEF_MAX))

    fitted = intercept + ewy_coef * ewy + krw_coef * krw
    residual = y - fitted
    mae = float(np.mean(np.abs(residual)))
    var_y = float(np.var(y))
    r2 = 0.0 if var_y <= 0 else float(1 - np.var(residual) / var_y)

    return {
        "intercept": intercept,
        "ewy_coef": ewy_coef,
        "krw_coef": krw_coef,
        "sample_size": sample_size,
        "r2": r2,
        "mae": mae,
    }


def extract_feature_returns_from_row(row: pd.Series) -> dict[str, float]:
    returns: dict[str, float] = {}
    for name in ALL_FEATURES:
        column = f"{name}_return"
        if column not in row.index or pd.isna(row[column]):
            continue
        returns[name] = float(row[column])
    return returns


def weighted_average_from_returns(returns: dict[str, float], weights: dict[str, float]) -> float | None:
    weighted_sum = 0.0
    total_weight = 0.0
    for key, weight in weights.items():
        value = returns.get(key)
        if value is None:
            continue
        weighted_sum += float(value) * weight
        total_weight += weight
    if total_weight <= 0:
        return None
    return weighted_sum / total_weight


def build_recency_weights(length: int, decay: float = EWY_FX_CORRECTION_RECENCY_DECAY) -> np.ndarray:
    decay_exponents = np.arange(length - 1, -1, -1, dtype=np.float64)
    return np.power(decay, decay_exponents)


def weighted_mean(values: np.ndarray, weights: np.ndarray) -> float:
    total_weight = float(np.sum(weights))
    if total_weight <= 0:
        return float(np.mean(values))
    return float(np.sum(values * weights) / total_weight)


def weighted_std(values: np.ndarray, weights: np.ndarray) -> float:
    mean_value = weighted_mean(values, weights)
    total_weight = float(np.sum(weights))
    if total_weight <= 0:
        return max(float(np.std(values)), RESIDUAL_STD_FLOOR)
    variance = float(np.sum(weights * np.square(values - mean_value)) / total_weight)
    return max(float(np.sqrt(max(variance, 0.0))), RESIDUAL_STD_FLOOR)


def transform_signal_to_residual_features(
    signal_values: dict[str, float],
    residual_state: dict[str, object],
) -> dict[str, float]:
    means = residual_state.get("means", {})
    stds = residual_state.get("stds", {})
    if not isinstance(means, dict) or not isinstance(stds, dict):
        return {
            "broad_factor": 0.0,
            "tech_factor": 0.0,
            "semi_factor": 0.0,
            "wti_z": 0.0,
            "gold_z": 0.0,
            "us10y_z": 0.0,
        }

    def zscore(name: str) -> float:
        value = float(signal_values.get(name, 0.0))
        mean_value = float(means.get(name, 0.0))
        std_value = max(float(stds.get(name, 1.0)), RESIDUAL_STD_FLOOR)
        return (value - mean_value) / std_value

    z_spx = zscore("sp500")
    z_ndx = zscore("nasdaq")
    z_dow = zscore("dow")
    z_sox = zscore("sox")
    z_wti = zscore("wti")
    z_gold = zscore("gold")
    z_us10y = zscore("us10y")

    pca_components = residual_state.get("broad_pca_components", [0.0, 0.0, 0.0])
    if not isinstance(pca_components, list) or len(pca_components) != 3:
        pca_components = [0.0, 0.0, 0.0]

    broad_factor = float(np.dot(np.array([z_spx, z_ndx, z_dow], dtype=np.float64), np.array(pca_components)))
    tech_factor = float(z_ndx - z_spx)
    sox_ndx_beta = float(residual_state.get("sox_ndx_beta", 1.0))
    semi_factor = float(z_sox - sox_ndx_beta * z_ndx)

    return {
        "broad_factor": broad_factor,
        "tech_factor": tech_factor,
        "semi_factor": semi_factor,
        "wti_z": float(z_wti),
        "gold_z": float(z_gold),
        "us10y_z": float(z_us10y),
    }


def fit_residual_model_artifact(
    dataset: pd.DataFrame,
    core_params: dict[str, float | int],
) -> dict[str, object]:
    default_payload: dict[str, object] = {
        "intercept": 0.0,
        "coefficients": {
            "broad_factor": 0.0,
            "tech_factor": 0.0,
            "semi_factor": 0.0,
            "wti_z": 0.0,
            "gold_z": 0.0,
            "us10y_z": 0.0,
        },
        "means": {key: 0.0 for key in ("sp500", "nasdaq", "dow", "sox", "wti", "gold", "us10y")},
        "stds": {key: 1.0 for key in ("sp500", "nasdaq", "dow", "sox", "wti", "gold", "us10y")},
        "broad_pca_components": [0.0, 0.0, 0.0],
        "sox_ndx_beta": 1.0,
        "basis_ewma": 0.0,
        "weight": 0.0,
        "sample_size": 0,
        "mae": 0.0,
        "core_mae": 0.0,
        "full_mae": 0.0,
    }

    required_columns = {
        "target_k200_return",
        "ewy_return",
        "krw_return",
        "sp500_return",
        "nasdaq_return",
        "dow_return",
        "sox_return",
        "wti_return",
        "gold_return",
        "us10y_return",
    }
    if not required_columns.issubset(dataset.columns):
        return default_payload

    sample = dataset[list(required_columns)].dropna().tail(RESIDUAL_MODEL_LOOKBACK_DAYS)
    sample_size = int(len(sample))
    if sample_size < EWY_FX_CORRECTION_MIN_SAMPLES:
        default_payload["sample_size"] = sample_size
        return default_payload

    weights = build_recency_weights(sample_size)
    means: dict[str, float] = {}
    stds: dict[str, float] = {}
    for key in ("sp500", "nasdaq", "dow", "sox", "wti", "gold", "us10y"):
        values = sample[f"{key}_return"].to_numpy(dtype=np.float64)
        means[key] = weighted_mean(values, weights)
        stds[key] = weighted_std(values, weights)

    broad_matrix = np.column_stack(
        [
            (sample["sp500_return"].to_numpy(dtype=np.float64) - means["sp500"]) / stds["sp500"],
            (sample["nasdaq_return"].to_numpy(dtype=np.float64) - means["nasdaq"]) / stds["nasdaq"],
            (sample["dow_return"].to_numpy(dtype=np.float64) - means["dow"]) / stds["dow"],
        ]
    )
    pca = PCA(n_components=1)
    pca.fit(broad_matrix)
    pca_components = pca.components_[0].astype(np.float64)

    z_nasdaq = (sample["nasdaq_return"].to_numpy(dtype=np.float64) - means["nasdaq"]) / stds["nasdaq"]
    z_sox = (sample["sox_return"].to_numpy(dtype=np.float64) - means["sox"]) / stds["sox"]
    denom = float(np.dot(weights, np.square(z_nasdaq)))
    if denom <= 0:
        sox_ndx_beta = 1.0
    else:
        sox_ndx_beta = float(np.dot(weights, z_sox * z_nasdaq) / denom)
    sox_ndx_beta = float(np.clip(sox_ndx_beta, -SOX_NDX_BETA_CAP, SOX_NDX_BETA_CAP))

    residual_rows: list[dict[str, float]] = []
    for _, row in sample.iterrows():
        signal_values = {
            "sp500": float(row["sp500_return"]),
            "nasdaq": float(row["nasdaq_return"]),
            "dow": float(row["dow_return"]),
            "sox": float(row["sox_return"]),
            "wti": float(row["wti_return"]),
            "gold": float(row["gold_return"]),
            "us10y": float(row["us10y_return"]),
        }
        residual_rows.append(
            transform_signal_to_residual_features(
                signal_values,
                {
                    "means": means,
                    "stds": stds,
                    "broad_pca_components": pca_components.tolist(),
                    "sox_ndx_beta": sox_ndx_beta,
                },
            )
        )

    residual_features = pd.DataFrame(residual_rows, index=sample.index)
    core_pred = sample.apply(lambda row: compute_ewy_fx_core_change({"ewy": float(row["ewy_return"]), "krw": float(row["krw_return"])}, core_params) or 0.0, axis=1)
    residual_target = sample["target_k200_return"].to_numpy(dtype=np.float64) - core_pred.to_numpy(dtype=np.float64)
    residual_model = Ridge(alpha=RESIDUAL_MODEL_ALPHA)
    residual_model.fit(residual_features.to_numpy(dtype=np.float64), residual_target, sample_weight=weights)
    fitted_residual = residual_model.predict(residual_features.to_numpy(dtype=np.float64))
    core_fitted = core_pred.to_numpy(dtype=np.float64)
    target_values = sample["target_k200_return"].to_numpy(dtype=np.float64)
    core_errors = target_values - core_fitted

    cv_core_errors: list[float] = []
    cv_full_errors: list[float] = []
    if sample_size >= 80:
        cv = TimeSeriesSplit(n_splits=3)
        feature_matrix = residual_features.to_numpy(dtype=np.float64)
        for train_idx, test_idx in cv.split(feature_matrix):
            if len(train_idx) < EWY_FX_CORRECTION_MIN_SAMPLES:
                continue
            fold_model = Ridge(alpha=RESIDUAL_MODEL_ALPHA)
            fold_model.fit(feature_matrix[train_idx], residual_target[train_idx], sample_weight=weights[train_idx])
            fold_residual = fold_model.predict(feature_matrix[test_idx])
            fold_core = core_fitted[test_idx]
            fold_target = target_values[test_idx]
            cv_core_errors.extend((fold_target - fold_core).tolist())
            for local_idx, core_value in enumerate(fold_core):
                cap = compute_residual_cap(float(core_value))
                corrected = float(core_value) + float(np.clip(fold_residual[local_idx], -cap, cap))
                cv_full_errors.append(float(fold_target[local_idx] - corrected))

    if cv_core_errors and cv_full_errors:
        core_mae = float(np.mean(np.abs(np.array(cv_core_errors, dtype=np.float64))))
        full_mae = float(np.mean(np.abs(np.array(cv_full_errors, dtype=np.float64))))
    else:
        full_fitted_raw = core_fitted + fitted_residual
        full_errors_raw = target_values - full_fitted_raw
        core_mae = float(np.mean(np.abs(core_errors)))
        full_mae = float(np.mean(np.abs(full_errors_raw)))

    residual_weight = 1.0 if full_mae + 1e-6 < core_mae else 0.0

    weighted_total_fitted = []
    for idx, core_value in enumerate(core_fitted):
        weighted_raw = float(fitted_residual[idx]) * residual_weight
        cap = compute_residual_cap(float(core_value))
        weighted_total_fitted.append(float(core_value) + float(np.clip(weighted_raw, -cap, cap)))
    weighted_total_fitted_array = np.array(weighted_total_fitted, dtype=np.float64)
    errors = target_values - weighted_total_fitted_array

    basis_ewma = 0.0
    if residual_weight > 0:
        for error in errors:
            basis_ewma = BASIS_EWMA_DECAY * basis_ewma + (1 - BASIS_EWMA_DECAY) * float(error)
        basis_ewma = float(np.clip(basis_ewma, -BASIS_EWMA_CAP_PCT, BASIS_EWMA_CAP_PCT))

    return {
        "intercept": float(residual_model.intercept_),
        "coefficients": {
            "broad_factor": float(residual_model.coef_[0]),
            "tech_factor": float(residual_model.coef_[1]),
            "semi_factor": float(residual_model.coef_[2]),
            "wti_z": float(residual_model.coef_[3]),
            "gold_z": float(residual_model.coef_[4]),
            "us10y_z": float(residual_model.coef_[5]),
        },
        "means": means,
        "stds": stds,
        "broad_pca_components": pca_components.tolist(),
        "sox_ndx_beta": sox_ndx_beta,
        "basis_ewma": basis_ewma,
        "weight": residual_weight,
        "sample_size": sample_size,
        "mae": float(np.mean(np.abs(errors))),
        "core_mae": core_mae,
        "full_mae": float(np.mean(np.abs(errors))),
    }


def compute_residual_adjustment(
    signal_values: dict[str, float],
    residual_artifact: dict[str, object] | None,
) -> float:
    artifact = residual_artifact or {}
    transformed = transform_signal_to_residual_features(signal_values, artifact)
    coefficients = artifact.get("coefficients", {})
    if not isinstance(coefficients, dict):
        coefficients = {}
    adjustment = float(artifact.get("intercept", 0.0))
    for key, value in transformed.items():
        adjustment += float(coefficients.get(key, 0.0)) * float(value)
    adjustment += float(artifact.get("basis_ewma", 0.0))
    return adjustment


def fit_kospi_mapping(
    dataset: pd.DataFrame,
    core_params: dict[str, float | int] | None = None,
    residual_artifact: dict[str, object] | None = None,
) -> dict[str, float | int]:
    default_payload = {"intercept": 0.0, "beta": 1.0, "sample_size": 0}
    required_columns = {"target_return", "ewy_return", "krw_return"}
    if not required_columns.issubset(dataset.columns):
        return default_payload

    sample = dataset.dropna(subset=sorted(required_columns)).tail(KOSPI_MAPPING_LOOKBACK_DAYS).copy()
    synthetic_k200_values: list[float] = []
    target_values: list[float] = []
    for _, row in sample.iterrows():
        returns = extract_feature_returns_from_row(row)
        components = compute_prediction_components(
            returns,
            core_params=core_params,
            residual_artifact=residual_artifact,
            mapping_artifact={"intercept": 0.0, "beta": 1.0},
        )
        predicted_k200_return = components.get("predicted_k200_return")
        if predicted_k200_return is None:
            continue
        synthetic_k200_values.append(float(predicted_k200_return))
        target_values.append(float(row["target_return"]))

    sample_size = int(len(synthetic_k200_values))
    if sample_size < EWY_FX_CORRECTION_MIN_SAMPLES:
        default_payload["sample_size"] = sample_size
        return default_payload

    weights = build_recency_weights(sample_size)
    model = Ridge(alpha=KOSPI_MAPPING_ALPHA)
    X = np.array(synthetic_k200_values, dtype=np.float64).reshape(-1, 1)
    y = np.array(target_values, dtype=np.float64)
    model.fit(X, y, sample_weight=weights)
    return {
        "intercept": float(model.intercept_),
        "beta": float(model.coef_[0]),
        "sample_size": sample_size,
    }


def map_k200_to_kospi_return(k200_return: float, mapping_artifact: dict[str, float | int] | None) -> float:
    artifact = mapping_artifact or {}
    intercept = float(artifact.get("intercept", 0.0))
    beta = float(artifact.get("beta", 1.0))
    return intercept + beta * float(k200_return)


def simple_return_pct_to_log_return_pct(value: float | None) -> float | None:
    if value is None:
        return None
    ratio = 1 + float(value) / 100.0
    if ratio <= 0:
        return None
    return float(np.log(ratio) * 100)


def log_return_pct_to_simple_return_pct(value: float | None) -> float | None:
    if value is None:
        return None
    return float((np.exp(float(value) / 100.0) - 1.0) * 100.0)


def price_from_log_return(prev_close: float, log_return_pct: float) -> float:
    return float(prev_close * np.exp(float(log_return_pct) / 100.0))


def compute_residual_cap(core_k200_return: float | None) -> float:
    magnitude = abs(float(core_k200_return or 0.0))
    return float(
        np.clip(
            max(RESIDUAL_MODEL_CAP_MIN_PCT, magnitude * RESIDUAL_MODEL_CAP_SHARE),
            RESIDUAL_MODEL_CAP_MIN_PCT,
            RESIDUAL_MODEL_CAP_MAX_PCT,
        )
    )


def compute_prediction_components(
    signal_returns: dict[str, float],
    core_params: dict[str, float | int] | None,
    residual_artifact: dict[str, object] | None,
    mapping_artifact: dict[str, float | int] | None,
) -> dict[str, float | bool | dict | None]:
    core_k200_return = compute_ewy_fx_core_change(signal_returns, core_params)
    if core_k200_return is None:
        return {
            "ready": False,
            "core_k200_return": None,
            "residual_raw_k200_return": None,
            "residual_adj_k200_return": None,
            "residual_cap_k200_return": None,
            "predicted_k200_return": None,
            "core_kospi_return": None,
            "predicted_kospi_return_pre_guard": None,
            "predicted_kospi_return": None,
            "predicted_kospi_simple_pct_pre_guard": None,
            "predicted_kospi_simple_pct": None,
            "ewy_simple_pct": None,
            "residual_features": {},
            "residual_weight": None,
        }

    residual_signal_values = {
        key: float(signal_returns[key])
        for key in ("sp500", "nasdaq", "dow", "sox", "wti", "gold", "us10y")
        if key in signal_returns
    }
    residual_features = transform_signal_to_residual_features(residual_signal_values, residual_artifact or {})
    residual_raw_k200_return = float(compute_residual_adjustment(residual_signal_values, residual_artifact))
    residual_weight = float((residual_artifact or {}).get("weight", 1.0))
    residual_cap = compute_residual_cap(core_k200_return)
    residual_adj_k200_return = float(np.clip(residual_raw_k200_return * residual_weight, -residual_cap, residual_cap))
    predicted_k200_return = float(core_k200_return + residual_adj_k200_return)

    core_kospi_return = float(map_k200_to_kospi_return(core_k200_return, mapping_artifact))
    predicted_kospi_return_pre_guard = float(map_k200_to_kospi_return(predicted_k200_return, mapping_artifact))
    predicted_kospi_simple_pct_pre_guard = log_return_pct_to_simple_return_pct(predicted_kospi_return_pre_guard)
    ewy_simple_pct = log_return_pct_to_simple_return_pct(signal_returns.get("ewy"))

    return {
        "ready": True,
        "core_k200_return": float(core_k200_return),
        "residual_raw_k200_return": residual_raw_k200_return,
        "residual_adj_k200_return": residual_adj_k200_return,
        "residual_cap_k200_return": residual_cap,
        "predicted_k200_return": predicted_k200_return,
        "core_kospi_return": core_kospi_return,
        "predicted_kospi_return_pre_guard": predicted_kospi_return_pre_guard,
        "predicted_kospi_return": predicted_kospi_return_pre_guard,
        "predicted_kospi_simple_pct_pre_guard": predicted_kospi_simple_pct_pre_guard,
        "predicted_kospi_simple_pct": predicted_kospi_simple_pct_pre_guard,
        "ewy_simple_pct": ewy_simple_pct,
        "residual_features": residual_features,
        "residual_weight": residual_weight,
    }


def compute_us_equity_factor(returns: dict[str, float]) -> float | None:
    return weighted_average_from_returns(returns, US_EQUITY_FACTOR_WEIGHTS)


def compute_bridge_proxy_change(returns: dict[str, float]) -> float | None:
    futures_change = weighted_average_from_returns(returns, BRIDGE_SIGNAL_WEIGHTS)
    krw_change = returns.get("krw")

    if futures_change is None and krw_change is None:
        return None
    if futures_change is None:
        return float(krw_change)
    if krw_change is None:
        return futures_change

    return futures_change * (1 - BRIDGE_KRW_BLEND) + float(krw_change) * BRIDGE_KRW_BLEND


def is_macro_shock_regime(returns: dict[str, float]) -> bool:
    us10y_change = returns.get("us10y")
    wti_change = returns.get("wti")
    if us10y_change is not None and abs(float(us10y_change)) >= MACRO_SHOCK_US10Y_TRIGGER_PCT:
        return True
    if wti_change is not None and abs(float(wti_change)) >= MACRO_SHOCK_WTI_TRIGGER_PCT:
        return True
    return False


def is_risk_off_regime(returns: dict[str, float]) -> bool:
    gold_change = returns.get("gold")
    vix_change = returns.get("vix")
    us_equity_factor = compute_us_equity_factor(returns)
    if gold_change is None or vix_change is None or us_equity_factor is None:
        return False
    return (
        float(gold_change) >= RISK_OFF_GOLD_TRIGGER_PCT
        and float(vix_change) >= RISK_OFF_VIX_TRIGGER_PCT
        and float(us_equity_factor) <= RISK_OFF_EQUITY_TRIGGER_PCT
    )


def regime_label_from_returns(returns: dict[str, float]) -> str:
    if is_risk_off_regime(returns):
        return "risk_off"
    if is_macro_shock_regime(returns):
        return "macro_shock"
    return "normal"


def compute_regime_adjustment(anchor_change: float | None, returns: dict[str, float]) -> float:
    adjustment = 0.0
    us10y_change = returns.get("us10y")
    wti_change = returns.get("wti")
    gold_change = returns.get("gold")
    vix_change = returns.get("vix")
    us_equity_factor = compute_us_equity_factor(returns)

    if us10y_change is not None and float(us10y_change) > MACRO_SHOCK_US10Y_TRIGGER_PCT:
        adjustment -= min(0.28, float(us10y_change) * REGIME_US10Y_PENALTY_WEIGHT)

    if wti_change is not None and float(wti_change) > MACRO_SHOCK_WTI_TRIGGER_PCT:
        adjustment -= min(0.25, float(wti_change) * REGIME_WTI_PENALTY_WEIGHT)

    if is_risk_off_regime(returns):
        gold_strength = max(float(gold_change or 0.0), 0.0)
        vix_strength = max(float(vix_change or 0.0), 0.0)
        equity_stress = abs(float(us_equity_factor or 0.0))
        adjustment -= min(
            0.40,
            gold_strength * REGIME_RISK_OFF_PENALTY_WEIGHT + vix_strength * 0.03 + equity_stress * 0.08,
        )
    elif us_equity_factor is not None and us_equity_factor > 0:
        if us10y_change is not None and float(us10y_change) < -MACRO_SHOCK_US10Y_TRIGGER_PCT:
            adjustment += min(0.18, abs(float(us10y_change)) * REGIME_POSITIVE_BONUS_WEIGHT)
        if wti_change is not None and float(wti_change) < -MACRO_SHOCK_WTI_TRIGGER_PCT:
            adjustment += min(0.12, abs(float(wti_change)) * (REGIME_POSITIVE_BONUS_WEIGHT * 0.6))

    if anchor_change is not None and float(anchor_change) < 0 and adjustment > 0:
        adjustment *= 0.5

    return float(np.clip(adjustment, -REGIME_ADJUSTMENT_CAP_PCT, REGIME_ADJUSTMENT_CAP_PCT))


def build_modeling_dataset(
    dataset: pd.DataFrame,
    correction_params: dict[str, float | int],
) -> pd.DataFrame:
    model_df = dataset.copy()
    core_values: list[float | None] = []
    auxiliary_values: list[float | None] = []
    bridge_values: list[float | None] = []
    equity_factor_values: list[float | None] = []
    macro_flags: list[float] = []
    risk_off_flags: list[float] = []
    regime_adjustments: list[float] = []
    regime_labels: list[str] = []

    for _, row in model_df.iterrows():
        returns = extract_feature_returns_from_row(row)
        core_anchor = compute_ewy_fx_core_change(returns, correction_params)
        auxiliary_anchor = compute_auxiliary_anchor_change(returns, correction_params)
        bridge_anchor = compute_bridge_proxy_change(returns)
        us_equity_factor = compute_us_equity_factor(returns)
        regime_adjustment = compute_regime_adjustment(core_anchor, returns)

        core_values.append(core_anchor)
        auxiliary_values.append(auxiliary_anchor)
        bridge_values.append(bridge_anchor)
        equity_factor_values.append(us_equity_factor)
        macro_flags.append(1.0 if is_macro_shock_regime(returns) else 0.0)
        risk_off_flags.append(1.0 if is_risk_off_regime(returns) else 0.0)
        regime_adjustments.append(regime_adjustment)
        regime_labels.append(regime_label_from_returns(returns))

    model_df["core_anchor_return"] = core_values
    model_df["auxiliary_anchor_return"] = auxiliary_values
    model_df["bridge_anchor_return"] = bridge_values
    model_df["us_equity_factor"] = equity_factor_values
    model_df["macro_shock_flag"] = macro_flags
    model_df["risk_off_flag"] = risk_off_flags
    model_df["regime_adjustment_hint"] = regime_adjustments
    model_df["regime_label"] = regime_labels
    model_df["aux_core_gap"] = model_df["auxiliary_anchor_return"] - model_df["core_anchor_return"]
    model_df["bridge_core_gap"] = model_df["bridge_anchor_return"] - model_df["core_anchor_return"]
    model_df["residual_target"] = model_df["target_return"] - model_df["core_anchor_return"]

    if "prev_close_change" not in model_df.columns:
        model_df["prev_close_change"] = 0.0

    return model_df.dropna(subset=["core_anchor_return", "residual_target"]).copy()


def train_lgbm(dataset: pd.DataFrame) -> dict:
    required_columns = {"target_return", "target_k200_return", "prev_close", "ewy_return", "krw_return"}
    model_dataset = dataset.dropna(subset=sorted(required_columns)).copy()
    feat_cols = RESIDUAL_FEATURE_COLUMNS.copy()

    rows: list[dict[str, float | str | bool | None]] = []
    if len(model_dataset) >= max(EWY_FX_CORRECTION_MIN_SAMPLES + 10, 80):
        tscv = TimeSeriesSplit(n_splits=5)
        for train_idx, test_idx in tscv.split(model_dataset):
            train_df = model_dataset.iloc[train_idx].copy()
            if len(train_df) < EWY_FX_CORRECTION_MIN_SAMPLES:
                continue

            core_params = fit_ewy_fx_correction(train_df)
            residual_artifact = fit_residual_model_artifact(train_df, core_params)
            mapping_artifact = fit_kospi_mapping(train_df, core_params, residual_artifact)

            for idx in test_idx:
                row = model_dataset.iloc[idx]
                prev_close = row.get("prev_close")
                actual_open = row.get("Open")
                if prev_close is None or actual_open is None or pd.isna(prev_close) or pd.isna(actual_open):
                    continue

                returns = extract_feature_returns_from_row(row)
                components = compute_prediction_components(
                    returns,
                    core_params=core_params,
                    residual_artifact=residual_artifact,
                    mapping_artifact=mapping_artifact,
                )
                if not components.get("ready"):
                    continue

                prev_close_value = float(prev_close)
                actual_open_value = float(actual_open)
                predicted_kospi_return = float(components["predicted_kospi_return"])
                point_open = price_from_log_return(prev_close_value, predicted_kospi_return)

                vix_level = row.get("vix_level", 20.0)
                vix_float = 20.0 if pd.isna(vix_level) else float(vix_level)

                rows.append(
                    {
                        "date": pd.Timestamp(model_dataset.index[idx]).strftime("%Y-%m-%d"),
                        "pred_open": point_open,
                        "night_simple_open": None,
                        "actual_open": actual_open_value,
                        "low": np.nan,
                        "high": np.nan,
                        "error": point_open - actual_open_value,
                        "hit": False,
                        "direction_hit": np.sign(point_open - prev_close_value) == np.sign(actual_open_value - prev_close_value),
                        "prev_close": prev_close_value,
                        "vix_level": vix_float,
                    }
                )

    preds = pd.DataFrame(rows)
    if preds.empty:
        preds = pd.DataFrame(
            columns=[
                "date",
                "pred_open",
                "night_simple_open",
                "actual_open",
                "low",
                "high",
                "error",
                "hit",
                "direction_hit",
                "prev_close",
                "vix_level",
            ]
        )
        rmse = 0.0
        mae = 0.0
        bhr = 0.0
        dhr = 0.0
    else:
        rmse = float(np.sqrt(np.mean(np.square(preds["error"].astype(float)))))
        mae = float(np.mean(np.abs(preds["error"].astype(float))))

        low_values: list[float] = []
        high_values: list[float] = []
        hit_values: list[bool] = []
        for _, pred_row in preds.iterrows():
            prev_close_value = float(pred_row["prev_close"])
            vix_float = 20.0 if pd.isna(pred_row.get("vix_level")) else float(pred_row["vix_level"])
            half_band = max(
                mae * ESTIMATED_BAND_MAE_FACTOR * choose_band_multiplier(vix_float),
                prev_close_value * ESTIMATED_BAND_MIN_PCT * choose_band_multiplier(vix_float),
            )
            low = float(pred_row["pred_open"]) - half_band
            high = float(pred_row["pred_open"]) + half_band
            low_values.append(low)
            high_values.append(high)
            hit_values.append(low <= float(pred_row["actual_open"]) <= high)

        preds["low"] = low_values
        preds["high"] = high_values
        preds["hit"] = hit_values
        bhr = float(np.mean(preds["hit"].astype(float)) * 100)
        dhr = float(np.mean(preds["direction_hit"].astype(float)) * 100)

    final_core_params = fit_ewy_fx_correction(model_dataset)
    final_residual_artifact = fit_residual_model_artifact(model_dataset, final_core_params)
    final_mapping_artifact = fit_kospi_mapping(model_dataset, final_core_params, final_residual_artifact)

    residual_coefficients = final_residual_artifact.get("coefficients", {})
    if not isinstance(residual_coefficients, dict):
        residual_coefficients = {}

    feature_importance = {
        "ewy_core": round(abs(float(final_core_params.get("ewy_coef", 0.0))), 6),
        "krw_core": round(abs(float(final_core_params.get("krw_coef", 0.0))), 6),
        "broad_factor": round(abs(float(residual_coefficients.get("broad_factor", 0.0))), 6),
        "tech_factor": round(abs(float(residual_coefficients.get("tech_factor", 0.0))), 6),
        "semi_factor": round(abs(float(residual_coefficients.get("semi_factor", 0.0))), 6),
        "wti_z": round(abs(float(residual_coefficients.get("wti_z", 0.0))), 6),
        "gold_z": round(abs(float(residual_coefficients.get("gold_z", 0.0))), 6),
        "us10y_z": round(abs(float(residual_coefficients.get("us10y_z", 0.0))), 6),
        "basis_ewma": round(abs(float(final_residual_artifact.get("basis_ewma", 0.0))), 6),
        "k200_to_kospi_beta": round(abs(float(final_mapping_artifact.get("beta", 0.0))), 6),
    }

    return {
        "rmse": rmse,
        "mae": mae,
        "bhr": bhr,
        "dhr": dhr,
        "fi": feature_importance,
        "preds": preds,
        "feat_cols": feat_cols,
        "model_c": None,
        "target_bounds": {},
        "ewy_fx_correction": final_core_params,
        "residual_artifact": final_residual_artifact,
        "kospi_mapping": final_mapping_artifact,
        "model_dataset": model_dataset,
    }


def resolve_previous_close(history_series: pd.Series, latest_ts_utc: datetime) -> float | None:
    series = history_series.dropna()
    if series.empty:
        return None

    index = pd.DatetimeIndex(series.index)
    if index.tz is None:
        index_utc = index.tz_localize("UTC")
    else:
        index_utc = index.tz_convert("UTC")

    # Exclude the live quote date to avoid picking an in-progress daily candle.
    completed = series[index_utc.date < latest_ts_utc.date()]
    if not completed.empty:
        return float(completed.iloc[-1])

    # Fallback when data does not include prior-day timestamps in UTC form.
    if len(series) >= 2:
        return float(series.iloc[-2])
    return float(series.iloc[-1])


def resolve_latest_completed_krx_session(live_series: pd.Series, history_series: pd.Series) -> tuple[float, str | None]:
    history = history_series.dropna()
    fallback = float(history.iloc[-1]) if not history.empty else 2500.0
    fallback_date: str | None = None
    if not history.empty:
        history_idx = pd.DatetimeIndex(history.index)
        if history_idx.tz is None:
            history_kst = history_idx.tz_localize("UTC").tz_convert(KST)
        else:
            history_kst = history_idx.tz_convert(KST)
        fallback_date = history_kst[-1].date().isoformat()

    live = live_series.dropna()
    if live.empty:
        return fallback, fallback_date

    index = pd.DatetimeIndex(live.index)
    if index.tz is None:
        index_utc = index.tz_localize("UTC")
    else:
        index_utc = index.tz_convert("UTC")
    index_kst = index_utc.tz_convert(KST)

    frame = pd.DataFrame({"close": live.values}, index=index_kst)
    session_close_rows = frame.groupby(frame.index.date).tail(1)
    completed = session_close_rows[session_close_rows.index.time >= KRX_SESSION_CLOSE_CUTOFF]
    if completed.empty:
        return fallback, fallback_date

    latest_index = completed.index[-1]
    return float(completed.iloc[-1]["close"]), latest_index.date().isoformat()


def resolve_latest_completed_krx_close(live_series: pd.Series, history_series: pd.Series) -> float:
    close, _ = resolve_latest_completed_krx_session(live_series, history_series)
    return close


def resolve_value_at_krx_sync_baseline(
    live_series: pd.Series,
    baseline_session_date: str | None,
) -> tuple[float | None, datetime | None]:
    series = live_series.dropna()
    if series.empty or not baseline_session_date:
        return None, None

    try:
        baseline_date = date.fromisoformat(baseline_session_date)
    except ValueError:
        return None, None

    baseline_kst = datetime.combine(baseline_date, KRX_SYNC_BASELINE_TIME, tzinfo=KST)
    index = pd.DatetimeIndex(series.index)
    if index.tz is None:
        index_utc = index.tz_localize("UTC")
    else:
        index_utc = index.tz_convert("UTC")
    index_kst = index_utc.tz_convert(KST)

    frame = pd.DataFrame({"value": series.values}, index=index_kst).dropna()
    if frame.empty:
        return None, None

    same_day = frame[frame.index.date == baseline_date]
    if not same_day.empty:
        forward = same_day[same_day.index >= baseline_kst]
        if not forward.empty:
            baseline_ts_kst = forward.index[0]
            delay_hours = (baseline_ts_kst - baseline_kst).total_seconds() / 3600
            if delay_hours > KRX_SYNC_MAX_FORWARD_HOURS:
                return None, None

            baseline_value = float(forward.iloc[0]["value"])
            baseline_ts_utc = baseline_ts_kst.tz_convert("UTC").to_pydatetime()
            return baseline_value, baseline_ts_utc

    matched = frame[frame.index <= baseline_kst]
    if matched.empty:
        return None, None

    baseline_ts_kst = matched.index[-1]
    lookback_hours = (baseline_kst - baseline_ts_kst).total_seconds() / 3600
    if lookback_hours > KRX_SYNC_MAX_LOOKBACK_HOURS:
        return None, None

    baseline_value = float(matched.iloc[-1]["value"])
    baseline_ts_utc = baseline_ts_kst.tz_convert("UTC").to_pydatetime()
    return baseline_value, baseline_ts_utc


def compute_live_return_pct(
    name: str,
    live_market: dict[str, pd.DataFrame],
    history_market: dict[str, pd.DataFrame],
    baseline_session_date: str | None = None,
    live_overrides: dict[str, dict] | None = None,
) -> float | None:
    live_frame = live_market.get(name, pd.DataFrame())
    live_series = live_frame["Close"].dropna() if "Close" in live_frame else pd.Series(dtype=float)
    if live_series.empty:
        return None

    if live_overrides and name in live_overrides:
        override = live_overrides[name]
        if override.get("is_live_night") and override.get("previous_close"):
            prev_close = float(override["previous_close"])
            if prev_close != 0:
                return (float(override["price"]) / prev_close - 1) * 100

    current_value = float(live_series.iloc[-1])
    baseline_value, _ = resolve_value_at_krx_sync_baseline(live_series, baseline_session_date)
    if baseline_value is not None and baseline_value != 0:
        return (current_value / baseline_value - 1) * 100

    if "PrevClose" in live_frame and not live_frame["PrevClose"].dropna().empty:
        prev_close = float(live_frame["PrevClose"].dropna().iloc[-1])
        if prev_close != 0:
            return (current_value / prev_close - 1) * 100

    latest_ts = as_utc_datetime(pd.Timestamp(live_series.index[-1]))

    history_frame = history_market.get(name, pd.DataFrame())
    history_series = history_frame["Close"].dropna() if "Close" in history_frame else pd.Series(dtype=float)
    previous_close = resolve_previous_close(history_series, latest_ts)
    if previous_close is None or previous_close == 0:
        if len(live_series) < 2:
            return None
        previous_close = float(live_series.iloc[0])

    return (current_value / previous_close - 1) * 100


def compute_live_model_feature_change(
    name: str,
    live_market: dict[str, pd.DataFrame],
    history_market: dict[str, pd.DataFrame],
    baseline_session_date: str | None = None,
    live_overrides: dict[str, dict] | None = None,
) -> float | None:
    live_frame = live_market.get(name, pd.DataFrame())
    live_series = live_frame["Close"].dropna() if "Close" in live_frame else pd.Series(dtype=float)
    if live_series.empty:
        return None

    if live_overrides and name in live_overrides:
        override = live_overrides[name]
        if override.get("is_live_night") and override.get("previous_close"):
            current_value = float(override["price"])
            baseline_value = float(override["previous_close"])
            if baseline_value == 0:
                return None
            if name == "us10y":
                return current_value - baseline_value
            return float(np.log(current_value / baseline_value) * 100)

    current_value = float(live_series.iloc[-1])
    baseline_value, _ = resolve_value_at_krx_sync_baseline(live_series, baseline_session_date)

    if baseline_value is None:
        if "PrevClose" in live_frame and not live_frame["PrevClose"].dropna().empty:
            baseline_value = float(live_frame["PrevClose"].dropna().iloc[-1])
        else:
            latest_ts = as_utc_datetime(pd.Timestamp(live_series.index[-1]))
            history_frame = history_market.get(name, pd.DataFrame())
            history_series = history_frame["Close"].dropna() if "Close" in history_frame else pd.Series(dtype=float)
            baseline_value = resolve_previous_close(history_series, latest_ts)
            if baseline_value is None and len(live_series) >= 2:
                baseline_value = float(live_series.iloc[0])

    if baseline_value is None:
        return None

    baseline_float = float(baseline_value)
    if name == "us10y":
        return current_value - baseline_float
    if baseline_float == 0:
        return None
    return float(np.log(current_value / baseline_float) * 100)


def compute_ewy_fx_core_change(
    returns: dict[str, float],
    correction_params: dict[str, float | int] | None = None,
) -> float | None:
    params = correction_params or {}
    intercept = float(params.get("intercept", 0.0))
    ewy_coef = float(params.get("ewy_coef", EWY_FX_CORE_EWY_WEIGHT))
    krw_coef = float(params.get("krw_coef", EWY_FX_CORE_KRW_WEIGHT))
    fit_r2 = float(params.get("r2", 0.0))
    sample_size = int(params.get("sample_size", 0) or 0)

    learned_sum = 0.0
    structural_sum = 0.0
    has_signal = False

    ewy_change = returns.get("ewy")
    if ewy_change is not None:
        ewy_value = float(ewy_change)
        learned_sum += ewy_value * ewy_coef
        structural_sum += ewy_value * EWY_FX_STRUCTURAL_EWY_WEIGHT
        has_signal = True

    # USD/KRW 하락(음수)은 환율 측면에서 코스피 환산 상방을 깎아야 하므로 같은 부호로 반영한다.
    krw_change = returns.get("krw")
    if krw_change is not None:
        krw_value = float(krw_change)
        learned_sum += krw_value * krw_coef
        structural_sum += krw_value * EWY_FX_STRUCTURAL_KRW_WEIGHT
        has_signal = True

    if not has_signal:
        return None

    learned_core = intercept + learned_sum
    blend = EWY_FX_STRUCTURAL_BLEND
    if abs(structural_sum) >= EWY_FX_HIGH_MOVE_TRIGGER_PCT:
        blend = max(blend, EWY_FX_STRUCTURAL_BLEND_HIGH_MOVE)
    if fit_r2 < EWY_FX_LOW_CONFIDENCE_R2 or sample_size < EWY_FX_CORRECTION_MIN_SAMPLES:
        blend = max(blend, EWY_FX_STRUCTURAL_BLEND_HIGH_MOVE)

    return learned_core * (1 - blend) + structural_sum * blend


def compute_auxiliary_anchor_change(
    returns: dict[str, float],
    correction_params: dict[str, float | int] | None = None,
) -> float | None:
    core_change = compute_ewy_fx_core_change(returns, correction_params)

    aux_sum = 0.0
    aux_weight = 0.0
    for key, weight in AUXILIARY_SIGNAL_WEIGHTS.items():
        value = returns.get(key)
        if value is None:
            continue
        aux_sum += float(value) * weight
        aux_weight += weight

    aux_change = (aux_sum / aux_weight) if aux_weight > 0 else None

    if core_change is None:
        return aux_change
    if aux_change is None:
        return core_change

    return core_change * (1 - AUXILIARY_SIGNAL_BLEND) + aux_change * AUXILIARY_SIGNAL_BLEND


def resolve_anchor_for_phase(
    core_anchor_change: float | None,
    auxiliary_anchor_change: float | None,
    bridge_anchor_change: float | None,
    prediction_phase: str,
) -> tuple[float | None, str]:
    normalized_phase = prediction_phase if prediction_phase in {"bridge", "session"} else "session"

    if normalized_phase == "bridge":
        if bridge_anchor_change is not None:
            if core_anchor_change is None:
                return float(bridge_anchor_change), "bridge"
            blended = float(bridge_anchor_change) * 0.8 + float(core_anchor_change) * 0.2
            return blended, "bridge"
        if auxiliary_anchor_change is not None:
            return float(auxiliary_anchor_change), "auxiliary-fallback"
        if core_anchor_change is not None:
            return float(core_anchor_change), "core-fallback"
        return None, "missing"

    if core_anchor_change is not None:
        return float(core_anchor_change), "core"
    if bridge_anchor_change is not None:
        return float(bridge_anchor_change), "bridge-fallback"
    if auxiliary_anchor_change is not None:
        return float(auxiliary_anchor_change), "auxiliary-fallback"
    return None, "missing"


def combine_phase_prediction(
    core_anchor_change: float | None,
    raw_residual_change: float,
    auxiliary_anchor_change: float | None,
    bridge_anchor_change: float | None,
    returns: dict[str, float],
    prediction_phase: str,
) -> tuple[float, dict[str, float | str | None]]:
    anchor_change, anchor_source = resolve_anchor_for_phase(
        core_anchor_change=core_anchor_change,
        auxiliary_anchor_change=auxiliary_anchor_change,
        bridge_anchor_change=bridge_anchor_change,
        prediction_phase=prediction_phase,
    )
    base_anchor = float(anchor_change) if anchor_change is not None else 0.0

    residual_cap = float(
        np.clip(
            max(RESIDUAL_MODEL_CAP_MIN_PCT, abs(base_anchor) * RESIDUAL_MODEL_CAP_SHARE),
            RESIDUAL_MODEL_CAP_MIN_PCT,
            RESIDUAL_MODEL_CAP_MAX_PCT,
        )
    )
    residual_adjust = float(np.clip(raw_residual_change, -residual_cap, residual_cap))

    anchor_bias = 0.0
    if auxiliary_anchor_change is not None and anchor_change is not None:
        aux_gap = float(auxiliary_anchor_change - anchor_change)
        anchor_bias = float(np.clip(aux_gap * ANCHOR_BIAS_BLEND, -ANCHOR_BIAS_CAP_PCT, ANCHOR_BIAS_CAP_PCT))

    regime_adjustment = compute_regime_adjustment(anchor_change, returns)
    provisional = base_anchor + residual_adjust + anchor_bias + regime_adjustment

    guard_band = (
        max(BRIDGE_GUARD_BAND_MIN_PCT, abs(base_anchor) * BRIDGE_GUARD_BAND_SHARE)
        if prediction_phase == "bridge"
        else max(SESSION_GUARD_BAND_MIN_PCT, abs(base_anchor) * SESSION_GUARD_BAND_SHARE)
    )
    guarded = float(np.clip(provisional, base_anchor - guard_band, base_anchor + guard_band))

    return guarded, {
        "anchor": base_anchor,
        "anchor_source": anchor_source,
        "aux_anchor": auxiliary_anchor_change,
        "bridge_anchor": bridge_anchor_change,
        "raw_residual": raw_residual_change,
        "residual_adjust": residual_adjust,
        "anchor_bias": anchor_bias,
        "regime_adjustment": regime_adjustment,
        "guard_band": guard_band,
        "phase": prediction_phase,
    }


def compute_night_centered_change(
    raw_ml_change: float,
    night_futures_change: float | None,
    auxiliary_anchor_change: float | None,
) -> tuple[float, dict[str, float | None]]:
    if night_futures_change is None:
        base_anchor = auxiliary_anchor_change if auxiliary_anchor_change is not None else raw_ml_change
        ml_gap = raw_ml_change - base_anchor
        ml_adjust = ml_gap * FALLBACK_ML_BLEND

        aux_adjust = 0.0
        if auxiliary_anchor_change is not None:
            aux_adjust = (auxiliary_anchor_change - base_anchor) * FALLBACK_AUX_BLEND

        provisional = base_anchor + ml_adjust + aux_adjust
        guard_band = max(FALLBACK_GUARD_BAND_MIN_PCT, abs(base_anchor) * FALLBACK_GUARD_BAND_SHARE)
        guarded = float(np.clip(provisional, base_anchor - guard_band, base_anchor + guard_band))
        return guarded, {
            "anchor": base_anchor,
            "aux_anchor": auxiliary_anchor_change,
            "ml_adjust": ml_adjust,
            "aux_adjust": aux_adjust,
            "guard_band": guard_band,
        }

    anchor = float(night_futures_change) * NIGHT_FUTURES_PRIMARY_SCALE

    ml_gap = raw_ml_change - anchor
    ml_cap = float(
        np.clip(
            max(ML_RESIDUAL_CAP_MIN_PCT, abs(anchor) * ML_RESIDUAL_CAP_SHARE),
            ML_RESIDUAL_CAP_MIN_PCT,
            ML_RESIDUAL_CAP_MAX_PCT,
        )
    )
    ml_adjust = float(np.clip(ml_gap * ML_RESIDUAL_BLEND, -ml_cap, ml_cap))

    aux_adjust = 0.0
    if auxiliary_anchor_change is not None:
        aux_gap = float(auxiliary_anchor_change - anchor)
        aux_cap = float(
            np.clip(
                max(AUX_RESIDUAL_CAP_MIN_PCT, abs(anchor) * AUX_RESIDUAL_CAP_SHARE),
                AUX_RESIDUAL_CAP_MIN_PCT,
                AUX_RESIDUAL_CAP_MAX_PCT,
            )
        )
        aux_adjust = float(np.clip(aux_gap * AUX_RESIDUAL_BLEND, -aux_cap, aux_cap))

    provisional = anchor + ml_adjust + aux_adjust
    guard_band = float(
        np.clip(
            abs(anchor) * ANCHOR_GUARD_BAND_SHARE + ANCHOR_GUARD_BAND_OFFSET_PCT,
            ANCHOR_GUARD_BAND_MIN_PCT,
            ANCHOR_GUARD_BAND_MAX_PCT,
        )
    )
    guarded = float(np.clip(provisional, anchor - guard_band, anchor + guard_band))

    return guarded, {
        "anchor": anchor,
        "aux_anchor": auxiliary_anchor_change,
        "ml_adjust": ml_adjust,
        "aux_adjust": aux_adjust,
        "guard_band": guard_band,
    }


def apply_anchor_guardrail(
    predicted_change: float,
    anchor_change: float | None,
    guard_band: float | None,
) -> float:
    if anchor_change is None or guard_band is None:
        return predicted_change
    return float(np.clip(predicted_change, anchor_change - guard_band, anchor_change + guard_band))


def compute_adaptive_bounds(
    bounds: dict[str, float],
    prev_close_change: float,
    anchor_change: float | None,
) -> tuple[float | None, float | None]:
    lower = bounds.get("p01", bounds.get("p05", bounds.get("p02", bounds.get("min"))))
    upper = bounds.get("p99", bounds.get("p95", bounds.get("p98", bounds.get("max"))))

    regime_cap = max(REGIME_CLIP_MIN_PCT, abs(prev_close_change) * REGIME_CLIP_PREV_CLOSE_SHARE)
    if anchor_change is not None:
        regime_cap = max(regime_cap, abs(anchor_change) + REGIME_CLIP_CORE_BUFFER_PCT)

    if lower is None:
        lower = -regime_cap
    else:
        lower = float(min(lower, -regime_cap))

    if upper is None:
        upper = regime_cap
    else:
        upper = float(max(upper, regime_cap))

    return lower, upper


def apply_mean_reversion_damping(predicted_change: float, prev_close_change: float) -> float:
    if predicted_change == 0:
        return predicted_change
    if np.sign(predicted_change) != np.sign(prev_close_change):
        return predicted_change

    magnitude = abs(prev_close_change)
    if magnitude <= MEAN_REVERSION_THRESHOLD_PCT:
        return predicted_change

    excess = magnitude - MEAN_REVERSION_THRESHOLD_PCT
    damping = max(MEAN_REVERSION_FLOOR, 1 - excess * MEAN_REVERSION_SLOPE)
    return predicted_change * damping


def apply_ewy_alignment_guard(predicted_change: float, ewy_change: float | None) -> float:
    if ewy_change is None:
        return predicted_change

    magnitude = abs(float(ewy_change))
    if magnitude < EWY_ALIGNMENT_TRIGGER_PCT:
        return predicted_change

    min_aligned = magnitude * EWY_ALIGNMENT_MIN_SHARE
    ewy_sign = 1 if ewy_change >= 0 else -1
    predicted_sign = 1 if predicted_change >= 0 else -1

    if predicted_sign != ewy_sign:
        return ewy_sign * min_aligned

    if abs(predicted_change) < min_aligned:
        return ewy_sign * min_aligned

    return predicted_change


def is_us_extended_session_window(now_utc: datetime) -> bool:
    now_et = now_utc.astimezone(US_ET)
    if now_et.weekday() >= 5:
        return False
    return US_PREMARKET_OPEN_ET <= now_et.time() < US_SESSION_END_ET


def resolve_live_prediction_phase(
    now_utc: datetime,
    live_market: dict[str, pd.DataFrame],
) -> str:
    if not is_us_extended_session_window(now_utc):
        return "bridge"

    ewy_frame = live_market.get("ewy", pd.DataFrame())
    ewy_series = ewy_frame["Close"].dropna() if "Close" in ewy_frame else pd.Series(dtype=float)
    if ewy_series.empty:
        return "bridge"

    latest_ewy_ts = as_utc_datetime(pd.Timestamp(ewy_series.index[-1]))
    age_minutes = (now_utc - latest_ewy_ts).total_seconds() / 60
    if age_minutes > EWY_LIVE_STALE_MINUTES:
        return "bridge"
    return "session"


def build_model_feature_row(
    returns: dict[str, float],
    core_anchor_change: float | None,
    auxiliary_anchor_change: float | None,
    bridge_anchor_change: float | None,
) -> dict[str, float]:
    feature_row = {f"{name}_return": float(value) for name, value in returns.items()}
    feature_row["us_equity_factor"] = compute_us_equity_factor(returns) or 0.0
    feature_row["bridge_anchor_return"] = bridge_anchor_change or 0.0
    feature_row["aux_core_gap"] = (
        float(auxiliary_anchor_change - core_anchor_change)
        if auxiliary_anchor_change is not None and core_anchor_change is not None
        else 0.0
    )
    feature_row["bridge_core_gap"] = (
        float(bridge_anchor_change - core_anchor_change)
        if bridge_anchor_change is not None and core_anchor_change is not None
        else 0.0
    )
    feature_row["macro_shock_flag"] = 1.0 if is_macro_shock_regime(returns) else 0.0
    feature_row["risk_off_flag"] = 1.0 if is_risk_off_regime(returns) else 0.0
    feature_row["regime_adjustment_hint"] = compute_regime_adjustment(core_anchor_change, returns)
    return feature_row


def build_latest(
    live_market: dict[str, pd.DataFrame],
    result: dict,
    history_market: dict[str, pd.DataFrame],
    live_overrides: dict[str, dict],
) -> dict:
    now_utc = datetime.now(timezone.utc)
    now_kst = now_utc.astimezone(KST)
    prediction_target_date_iso = next_prediction_date_iso(now_kst)
    display_returns: dict[str, float] = {}
    model_returns: dict[str, float] = {}
    vix = 20.0

    prev_kospi_series = history_market["kospi"]["Close"] if "kospi" in history_market else pd.Series(dtype=float)
    live_kospi_frame = live_market.get("kospi", pd.DataFrame())
    live_kospi_series = live_kospi_frame["Close"] if "Close" in live_kospi_frame else pd.Series(dtype=float)
    prev_close, latest_record_date = resolve_latest_completed_krx_session(live_kospi_series, prev_kospi_series)
    prev_kospi_non_na = prev_kospi_series.dropna()
    prior_close = float(prev_kospi_non_na.iloc[-1]) if not prev_kospi_non_na.empty else prev_close
    prev_close_change = ((prev_close / prior_close - 1) * 100) if prior_close else 0.0

    for name in ALL_FEATURES:
        display_change_pct = compute_live_return_pct(
            name,
            live_market,
            history_market,
            baseline_session_date=latest_record_date,
            live_overrides=live_overrides,
        )
        if display_change_pct is not None:
            display_returns[name] = display_change_pct
        if name == "vix":
            live_series = live_market[name]["Close"].dropna()
            if not live_series.empty:
                vix = float(live_series.iloc[-1])

    for name in MODEL_SIGNAL_KEYS:
        model_change = compute_live_model_feature_change(
            name,
            live_market,
            history_market,
            baseline_session_date=latest_record_date,
            live_overrides=live_overrides,
        )
        if model_change is not None:
            model_returns[name] = model_change

    k200f_override = live_overrides.get("k200f", {})
    night_futures_change = resolve_night_futures_change_for_target(prediction_target_date_iso, k200f_override)
    futures_day_close_raw = k200f_override.get("day_close")
    try:
        futures_day_close = float(futures_day_close_raw) if futures_day_close_raw is not None else None
    except (TypeError, ValueError):
        futures_day_close = None
    if futures_day_close == 0:
        futures_day_close = None
    futures_day_close_date = k200f_override.get("day_close_date")

    ewy_fx_correction = result.get("ewy_fx_correction", {})
    residual_artifact = result.get("residual_artifact", {})
    kospi_mapping = result.get("kospi_mapping", {})
    components = compute_prediction_components(
        model_returns,
        core_params=ewy_fx_correction,
        residual_artifact=residual_artifact,
        mapping_artifact=kospi_mapping,
    )

    predicted_kospi_return = components.get("predicted_kospi_return")
    if predicted_kospi_return is None:
        predicted_kospi_return = 0.0
    point_prediction = price_from_log_return(prev_close, float(predicted_kospi_return))
    predicted_change = log_return_pct_to_simple_return_pct(float(predicted_kospi_return)) or 0.0
    night_futures_simple_point = (
        prev_close * (1 + float(night_futures_change) / 100) if night_futures_change is not None else None
    )
    buffer = result["mae"] * choose_band_multiplier(vix)

    return {
        "point": point_prediction,
        "r_low": point_prediction - buffer,
        "r_high": point_prediction + buffer,
        "pred_c": predicted_change,
        "night_futures_simple_point": night_futures_simple_point,
        "night_futures_change_c": night_futures_change,
        "raw_pred_c": components.get("predicted_kospi_simple_pct_pre_guard"),
        "raw_residual_c": log_return_pct_to_simple_return_pct(
            float(components.get("residual_adj_k200_return") or 0.0) * float(kospi_mapping.get("beta", 1.0))
        ),
        "core_anchor_c": log_return_pct_to_simple_return_pct(components.get("core_kospi_return")),
        "night_anchor_c": None,
        "aux_anchor_c": None,
        "bridge_anchor_c": None,
        "ml_residual_adj_c": log_return_pct_to_simple_return_pct(components.get("residual_adj_k200_return")),
        "aux_residual_adj_c": None,
        "regime_adjustment_c": None,
        "night_guard_band_c": log_return_pct_to_simple_return_pct(components.get("residual_cap_k200_return")),
        "pre_damping_pred_c": components.get("predicted_kospi_simple_pct_pre_guard"),
        "prev_close_change_c": prev_close_change,
        "prediction_phase": "session",
        "anchor_source": "ewy_synthetic_k200",
        "vix": vix,
        "returns": display_returns,
        "model_returns": model_returns,
        "prev_close": prev_close,
        "latest_record_date": latest_record_date,
        "futures_day_close": futures_day_close,
        "futures_day_close_date": futures_day_close_date,
        "ewy_fx_correction": ewy_fx_correction,
        "residual_artifact": residual_artifact,
        "kospi_mapping": kospi_mapping,
        "prediction_components": components,
    }


def _build_signal_summary(returns: dict[str, float]) -> str:
    label_map = {
        "ewy": "EWY",
        "sp500": "S&P 500",
        "vix": "VIX",
        "nasdaq": "NASDAQ 100",
        "krw": "USD/KRW",
    }
    parts: list[str] = []

    for key in ["ewy", "sp500", "vix", "nasdaq", "krw"]:
        value = returns.get(key, 0.0)
        if key == "vix":
            direction = "하락(안정)" if value < -0.3 else "상승(불안)" if value > 0.3 else "보합"
        elif key == "krw":
            direction = "원화 강세" if value < -0.3 else "원화 약세" if value > 0.3 else "보합"
        else:
            direction = "상승" if value > 0.3 else "하락" if value < -0.3 else "보합"
        parts.append(f"{label_map[key]} {direction}")

    return " · ".join(parts)


def next_prediction_date_label(now_kst: datetime) -> str:
    target_date = resolve_prediction_target_timestamp(now_kst)
    return pd.Timestamp(target_date).strftime("%Y년 %m월 %d일")


def next_prediction_date_iso(now_kst: datetime) -> str:
    target_date = resolve_prediction_target_timestamp(now_kst)
    return pd.Timestamp(target_date).date().isoformat()


def write_prediction_json(latest: dict, result: dict, history_df: pd.DataFrame) -> dict:
    now_utc = datetime.now(timezone.utc)
    now_kst = now_utc.astimezone(KST)
    is_active_prediction_window = is_prediction_operation_window(now_kst)
    latest_record_date = latest.get("latest_record_date")
    if not latest_record_date and not history_df.empty:
        latest_record_date = history_df.iloc[0]["date"]
    yesterday_row = history_df.iloc[0] if not history_df.empty else None

    payload = {
        "generatedAt": now_utc.isoformat(),
        "predictionDate": next_prediction_date_label(now_kst),
        "predictionDateIso": next_prediction_date_iso(now_kst),
        "pointPrediction": round(latest["point"], 2) if is_active_prediction_window else None,
        "nightFuturesSimplePoint": (
            round(float(latest["night_futures_simple_point"]), 2)
            if is_active_prediction_window and latest["night_futures_simple_point"] is not None
            else None
        ),
        "nightFuturesSimpleChangePct": (
            round(float(latest["night_futures_change_c"]), 2)
            if is_active_prediction_window and latest["night_futures_change_c"] is not None
            else None
        ),
        "futuresDayClose": (
            round(float(latest["futures_day_close"]), 2) if latest.get("futures_day_close") is not None else None
        ),
        "futuresDayCloseDate": latest.get("futures_day_close_date"),
        "rangeLow": round(latest["r_low"], 2) if is_active_prediction_window else None,
        "rangeHigh": round(latest["r_high"], 2) if is_active_prediction_window else None,
        "predictedChangePct": round(latest["pred_c"], 2) if is_active_prediction_window else None,
        "prevClose": round(latest["prev_close"], 2),
        "signalSummary": (
            _build_signal_summary(latest["returns"])
            if is_active_prediction_window
            else "예측 운영 시간은 18:00~09:00입니다. 다음 운영 구간부터 모델 예측이 갱신됩니다."
        ),
        "lastCalculatedAt": now_utc.isoformat() if is_active_prediction_window else None,
        "latestRecordDate": latest_record_date,
        "mae30d": round(result["mae"], 2),
        "model": {
            "engine": "EWY Synthetic K200 Ridge",
            "vix": round(latest["vix"], 2),
            "lgbmRmse": round(result["rmse"], 2),
            "calculationMode": "EWYCoreSyntheticK200+ResidualRidge+KOSPIMapping(NoNightFutures)",
            "nightFuturesExcluded": True,
            "isOperationWindow": is_active_prediction_window,
            "operationHours": "18:00~09:00",
            "nightFuturesAnchorPct": (
                round(float(latest["night_anchor_c"]), 2) if latest.get("night_anchor_c") is not None else None
            ),
            "auxiliaryAnchorPct": (
                round(float(latest["aux_anchor_c"]), 2) if latest.get("aux_anchor_c") is not None else None
            ),
            "bridgeAnchorPct": (
                round(float(latest["bridge_anchor_c"]), 2) if latest.get("bridge_anchor_c") is not None else None
            ),
            "coreAnchorPct": round(float(latest["core_anchor_c"]), 2) if latest["core_anchor_c"] is not None else None,
            "rawModelPct": round(float(latest["raw_pred_c"]), 2) if latest.get("raw_pred_c") is not None else None,
            "rawResidualPct": (
                round(float(latest["raw_residual_c"]), 2) if latest.get("raw_residual_c") is not None else None
            ),
            "ewyFxIntercept": round(float(latest.get("ewy_fx_correction", {}).get("intercept", 0.0)), 4),
            "ewyFxEwyCoef": round(float(latest.get("ewy_fx_correction", {}).get("ewy_coef", 1.0)), 4),
            "ewyFxKrwCoef": round(float(latest.get("ewy_fx_correction", {}).get("krw_coef", 1.0)), 4),
            "ewyFxSampleSize": int(latest.get("ewy_fx_correction", {}).get("sample_size", 0) or 0),
            "ewyFxFitR2": round(float(latest.get("ewy_fx_correction", {}).get("r2", 0.0)), 4),
            "ewyFxFitMae": round(float(latest.get("ewy_fx_correction", {}).get("mae", 0.0)), 4),
            "mlResidualAdjPct": (
                round(float(latest["ml_residual_adj_c"]), 2) if latest.get("ml_residual_adj_c") is not None else None
            ),
            "auxResidualAdjPct": (
                round(float(latest["aux_residual_adj_c"]), 2) if latest.get("aux_residual_adj_c") is not None else None
            ),
            "regimeAdjustmentPct": None,
            "regimeState": None,
            "prevCloseChangePct": round(float(latest["prev_close_change_c"]), 2),
            "krxBaselineDate": latest_record_date,
            "predictionPhase": latest.get("prediction_phase"),
            "anchorSource": latest.get("anchor_source"),
            "residualModel": {
                "intercept": round(float(latest.get("residual_artifact", {}).get("intercept", 0.0)), 6),
                "coefficients": {
                    key: round(float(value), 6)
                    for key, value in (latest.get("residual_artifact", {}).get("coefficients", {}) or {}).items()
                },
                "means": {
                    key: round(float(value), 6)
                    for key, value in (latest.get("residual_artifact", {}).get("means", {}) or {}).items()
                },
                "stds": {
                    key: round(float(value), 6)
                    for key, value in (latest.get("residual_artifact", {}).get("stds", {}) or {}).items()
                },
                "broadPcaComponents": [
                    round(float(value), 6)
                    for value in (latest.get("residual_artifact", {}).get("broad_pca_components", []) or [])
                ],
                "soxNdxBeta": round(float(latest.get("residual_artifact", {}).get("sox_ndx_beta", 1.0)), 6),
                "basisEwma": round(float(latest.get("residual_artifact", {}).get("basis_ewma", 0.0)), 6),
                "weight": round(float(latest.get("residual_artifact", {}).get("weight", 0.0)), 6),
                "sampleSize": int(latest.get("residual_artifact", {}).get("sample_size", 0) or 0),
                "mae": round(float(latest.get("residual_artifact", {}).get("mae", 0.0)), 6),
                "coreMae": round(float(latest.get("residual_artifact", {}).get("core_mae", 0.0)), 6),
                "fullMae": round(float(latest.get("residual_artifact", {}).get("full_mae", 0.0)), 6),
            },
            "k200Mapping": {
                "intercept": round(float(latest.get("kospi_mapping", {}).get("intercept", 0.0)), 6),
                "beta": round(float(latest.get("kospi_mapping", {}).get("beta", 1.0)), 6),
                "sampleSize": int(latest.get("kospi_mapping", {}).get("sample_size", 0) or 0),
            },
        },
        "yesterday": {
            "predictionLow": round(float(yesterday_row["low"]), 2) if yesterday_row is not None else 0,
            "predictionHigh": round(float(yesterday_row["high"]), 2) if yesterday_row is not None else 0,
            "actualOpen": round(float(yesterday_row["actual_open"]), 2) if yesterday_row is not None else 0,
            "hit": bool(yesterday_row["hit"]) if yesterday_row is not None else False,
        },
    }
    write_output_json("prediction.json", payload)
    return payload


def write_indicators_json(
    live_market: dict[str, pd.DataFrame],
    history_market: dict[str, pd.DataFrame],
    live_overrides: dict[str, dict],
) -> None:
    primary_keys = ["ewy", "krw", "wti", "sp500"]
    secondary_keys = ["nasdaq", "vix", "koru", "k200f", "dow", "gold", "us10y", "sox"]
    now_utc = datetime.now(timezone.utc)
    in_us_premarket_now = is_us_premarket_window(now_utc)

    def build_indicator(name: str) -> dict:
        if name == "k200f":
            k200f_override = live_overrides.get("k200f", {})
            day_close_raw = k200f_override.get("day_close")
            try:
                day_close = float(day_close_raw) if day_close_raw is not None else None
            except (TypeError, ValueError):
                day_close = None
            if day_close == 0:
                day_close = None
            reference_value = format_value(name, day_close) if day_close is not None else ""
            reference_date = k200f_override.get("day_close_date") or ""
            if k200f_override.get("is_live_night"):
                price = float(k200f_override["price"])
                previous_close = day_close if day_close is not None else float(k200f_override["previous_close"])
                change_pct = (price / previous_close - 1) * 100 if previous_close else 0.0
                updated_at = as_utc_datetime(pd.Timestamp(k200f_override["updated_at"]))
                return {
                    "key": name,
                    "label": indicator_label(name),
                    "value": format_value(name, price),
                    "changePct": round(change_pct, 2),
                    "updatedAt": updated_at.isoformat(),
                    "sourceUrl": "",
                    "dataSource": "실시간 수집",
                    "displayTag": "(야간)",
                    "isPremarket": False,
                    "referenceLabel": "주간선물 종가" if reference_value else "",
                    "referenceValue": reference_value,
                    "referenceDate": reference_date,
                }

            return {
                "key": name,
                "label": indicator_label(name),
                "value": "N/A",
                "changePct": 0,
                "updatedAt": "",
                "sourceUrl": "",
                "dataSource": "실시간 수집",
                "displayTag": "(장 시작전)",
                "isPremarket": False,
                "referenceLabel": "주간선물 종가" if reference_value else "",
                "referenceValue": reference_value,
                "referenceDate": reference_date,
            }

        frame = live_market.get(name, pd.DataFrame())
        series = frame["Close"].dropna() if "Close" in frame else pd.Series(dtype=float)
        if series.empty:
            return {
                "key": name,
                "label": indicator_label(name),
                "value": "N/A",
                "changePct": 0,
                "updatedAt": "",
                "sourceUrl": INDICATOR_SOURCE_URLS.get(name, ""),
                "dataSource": "Yahoo Finance",
                "displayTag": "(장 시작전)" if in_us_premarket_now and name in PREMARKET_TRACK_KEYS else "",
                "isPremarket": False,
            }

        current_value = float(series.iloc[-1])
        latest_ts = as_utc_datetime(pd.Timestamp(series.index[-1]))
        history_frame = history_market.get(name, pd.DataFrame())
        history_series = history_frame["Close"].dropna() if "Close" in history_frame else pd.Series(dtype=float)
        previous_close = resolve_previous_close(history_series, latest_ts)
        if (previous_close is None or previous_close == 0) and "PrevClose" in frame:
            prev_close_series = frame["PrevClose"].dropna()
            if not prev_close_series.empty:
                previous_close = float(prev_close_series.iloc[-1])
        if previous_close is None or previous_close == 0:
            previous_close = float(series.iloc[0])
        change_pct = (current_value / previous_close - 1) * 100 if previous_close else 0.0
        age_minutes = (now_utc - latest_ts).total_seconds() / 60
        is_premarket_quote = is_timestamp_in_us_premarket(latest_ts)
        premarket_untracked = (
            in_us_premarket_now
            and name in PREMARKET_TRACK_KEYS
            and (not is_premarket_quote or age_minutes > PREMARKET_STALE_MINUTES)
        )

        return {
            "key": name,
            "label": indicator_label(name),
            "value": format_value(name, current_value),
            "changePct": round(change_pct, 2),
            "updatedAt": latest_ts.isoformat(),
            "sourceUrl": INDICATOR_SOURCE_URLS.get(name, ""),
            "dataSource": "Yahoo Finance",
            "displayTag": "(장 시작전)" if premarket_untracked else "",
            "isPremarket": is_premarket_quote,
        }

    payload = {
        "primary": [build_indicator(name) for name in primary_keys],
        "secondary": [build_indicator(name) for name in secondary_keys],
        "generatedAt": now_utc.isoformat(),
        "isUsPremarketNow": in_us_premarket_now,
    }
    write_output_json("indicators.json", payload)


def write_diagnostics_json(result: dict) -> None:
    payload = {
        "selectedFeatures": result["feat_cols"],
        "rmse": round(result["rmse"], 4),
        "mae": round(result["mae"], 4),
        "featureImportance": result["fi"],
        "ewyFxCorrection": result.get("ewy_fx_correction", {}),
        "residualModel": result.get("residual_artifact", {}),
        "k200Mapping": result.get("kospi_mapping", {}),
        "modelMode": "EWYCoreSyntheticK200+ResidualRidge+KOSPIMapping",
        "generatedAt": datetime.now(timezone.utc).isoformat(),
    }
    write_output_json("backtest_diagnostics.json", payload)


def _extract_kospi_open_by_date(
    history_market: dict[str, pd.DataFrame],
    live_market: dict[str, pd.DataFrame],
) -> dict[date, float]:
    open_by_date: dict[date, float] = {}

    daily_kospi = history_market.get("kospi", pd.DataFrame())
    daily_open_series = daily_kospi["Open"].dropna() if "Open" in daily_kospi else pd.Series(dtype=float)
    if not daily_open_series.empty:
        for ts, value in daily_open_series.items():
            date_key = pd.Timestamp(ts).date()
            open_by_date[date_key] = float(value)

    live_kospi = live_market.get("kospi", pd.DataFrame())
    live_series = live_kospi["Close"].dropna() if "Close" in live_kospi else pd.Series(dtype=float)
    if not live_series.empty:
        index = pd.DatetimeIndex(live_series.index)
        if index.tz is None:
            index_utc = index.tz_localize("UTC")
        else:
            index_utc = index.tz_convert("UTC")
        index_kst = index_utc.tz_convert(KST)
        live_frame = pd.DataFrame({"open": live_series.values}, index=index_kst)
        first_ticks = live_frame.groupby(live_frame.index.date).head(1)
        for ts, row in first_ticks.iterrows():
            date_key = ts.date()
            if date_key not in open_by_date:
                open_by_date[date_key] = float(row["open"])

    return open_by_date


def _extract_kospi_prev_close_by_date(history_market: dict[str, pd.DataFrame]) -> dict[date, float]:
    prev_close_by_date: dict[date, float] = {}
    daily_kospi = history_market.get("kospi", pd.DataFrame())
    close_series = daily_kospi["Close"].dropna() if "Close" in daily_kospi else pd.Series(dtype=float)
    if close_series.empty:
        return prev_close_by_date

    close_series = close_series.sort_index()
    previous_close: float | None = None
    for ts, value in close_series.items():
        target_date = pd.Timestamp(ts).date()
        if previous_close is not None:
            prev_close_by_date[target_date] = previous_close
        previous_close = float(value)
    return prev_close_by_date


def _build_prediction_archive_lookup(prediction_archive: list[dict]) -> dict[date, dict]:
    lookup: dict[date, dict] = {}
    for raw in prediction_archive:
        normalized = normalize_prediction_archive_entry(raw)
        if normalized is None:
            continue
        try:
            date_key = date.fromisoformat(str(normalized["predictionDateIso"]))
        except ValueError:
            continue

        existing = lookup.get(date_key)
        if existing is None or str(normalized["generatedAt"]) >= str(existing["generatedAt"]):
            lookup[date_key] = normalized
    return lookup


def _build_archive_history_row(
    target_date: date,
    archive_entry: dict,
    actual_open: float,
    prev_close: float | None,
) -> dict:
    low = float(archive_entry["rangeLow"])
    high = float(archive_entry["rangeHigh"])
    point = float(archive_entry["pointPrediction"])
    if low > high:
        low, high = high, low

    direction_hit = False
    if prev_close and prev_close != 0:
        predicted_change = point - prev_close
        actual_change = actual_open - prev_close
        direction_hit = np.sign(predicted_change) == np.sign(actual_change)

    night_simple_raw = archive_entry.get("nightFuturesSimplePoint")
    try:
        night_simple_open = float(night_simple_raw) if night_simple_raw is not None else None
    except (TypeError, ValueError):
        night_simple_open = None

    return {
        "date": target_date.isoformat(),
        "pred_open": point,
        "night_simple_open": night_simple_open,
        "actual_open": actual_open,
        "low": low,
        "high": high,
        "error": point - actual_open,
        "hit": low <= actual_open <= high,
        "direction_hit": bool(direction_hit),
        "is_synthetic": False,
    }


def _estimate_history_row_from_dataset(
    target_date: date,
    actual_open: float,
    dataset: pd.DataFrame,
    result: dict,
    prev_close: float | None,
) -> dict | None:
    def build_fallback_row() -> dict:
        prev_close_value = actual_open if prev_close is None or prev_close == 0 else float(prev_close)
        realized_change = ((actual_open / prev_close_value) - 1) * 100 if prev_close_value else 0.0
        damped_change = realized_change * FALLBACK_ESTIMATE_CHANGE_WEIGHT
        point_open = prev_close_value * (1 + damped_change / 100)
        half_band = max(
            float(result.get("mae", 0.0)) * FALLBACK_ESTIMATE_BAND_MAE_FACTOR,
            prev_close_value * ESTIMATED_BAND_MIN_PCT * 1.2,
        )
        low = point_open - half_band
        high = point_open + half_band
        return {
            "date": target_date.isoformat(),
            "pred_open": point_open,
            "night_simple_open": None,
            "actual_open": actual_open,
            "low": low,
            "high": high,
            "error": point_open - actual_open,
            "hit": low <= actual_open <= high,
            "direction_hit": np.sign(point_open - prev_close_value) == np.sign(actual_open - prev_close_value),
            "is_synthetic": True,
        }

    model_dataset = result.get("model_dataset", dataset)
    if not isinstance(model_dataset, pd.DataFrame) or model_dataset.empty:
        return build_fallback_row()

    target_ts = pd.Timestamp(target_date)
    if target_ts not in model_dataset.index:
        return build_fallback_row()

    row = model_dataset.loc[target_ts]
    if isinstance(row, pd.DataFrame):
        row = row.iloc[-1]

    row_prev_close = row.get("prev_close")
    if row_prev_close is None or pd.isna(row_prev_close) or float(row_prev_close) == 0:
        prev_close_value = actual_open if prev_close is None or prev_close == 0 else float(prev_close)
    else:
        prev_close_value = float(row_prev_close)

    returns = extract_feature_returns_from_row(row)
    components = compute_prediction_components(
        returns,
        core_params=result.get("ewy_fx_correction", {}),
        residual_artifact=result.get("residual_artifact", {}),
        mapping_artifact=result.get("kospi_mapping", {}),
    )
    predicted_kospi_return = components.get("predicted_kospi_return")
    if predicted_kospi_return is None:
        return build_fallback_row()
    point_open = price_from_log_return(prev_close_value, float(predicted_kospi_return))

    vix_level = row.get("vix_level", 20.0)
    vix_float = 20.0 if pd.isna(vix_level) else float(vix_level)
    band_multiplier = choose_band_multiplier(vix_float)
    half_band = max(
        float(result.get("mae", 0.0)) * ESTIMATED_BAND_MAE_FACTOR * band_multiplier,
        prev_close_value * ESTIMATED_BAND_MIN_PCT * band_multiplier,
    )
    low = point_open - half_band
    high = point_open + half_band

    return {
        "date": target_date.isoformat(),
        "pred_open": point_open,
        "night_simple_open": None,
        "actual_open": actual_open,
        "low": low,
        "high": high,
        "error": point_open - actual_open,
        "hit": low <= actual_open <= high,
        "direction_hit": np.sign(point_open - prev_close_value) == np.sign(actual_open - prev_close_value),
        "is_synthetic": True,
    }


def _fill_recent_history_gaps(
    history_df: pd.DataFrame,
    result: dict,
    history_market: dict[str, pd.DataFrame],
    live_market: dict[str, pd.DataFrame],
    dataset: pd.DataFrame,
    prediction_archive: list[dict],
) -> pd.DataFrame:
    open_by_date = _extract_kospi_open_by_date(history_market, live_market)
    if not open_by_date:
        return history_df

    prev_close_by_date = _extract_kospi_prev_close_by_date(history_market)
    archive_lookup = _build_prediction_archive_lookup(prediction_archive)
    now_kst_date = datetime.now(timezone.utc).astimezone(KST).date()
    recent_dates = [
        d for d in sorted(open_by_date.keys(), reverse=True) if d <= now_kst_date
    ][:RECENT_HISTORY_FILL_DAYS]

    if history_df.empty:
        base_df = pd.DataFrame(columns=["date", "pred_open", "actual_open", "low", "high", "error", "hit"])
    else:
        base_df = history_df.copy()
    base_df["date"] = base_df["date"].astype(str)
    base_df["__priority"] = 2
    if "is_synthetic" not in base_df.columns:
        base_df["is_synthetic"] = False

    archive_rows: list[dict] = []
    estimated_rows: list[dict] = []
    protected_dates: set[str] = set(base_df["date"].tolist())
    for target_date in recent_dates:
        date_key = target_date.isoformat()
        actual_open = float(open_by_date[target_date])
        archive_entry = archive_lookup.get(target_date)
        if archive_entry is not None:
            archive_rows.append(
                _build_archive_history_row(
                    target_date=target_date,
                    archive_entry=archive_entry,
                    actual_open=actual_open,
                    prev_close=prev_close_by_date.get(target_date),
                )
            )
            protected_dates.add(date_key)
            continue

        if date_key in protected_dates:
            continue

        estimated_row = _estimate_history_row_from_dataset(
            target_date=target_date,
            actual_open=actual_open,
            dataset=dataset,
            result=result,
            prev_close=prev_close_by_date.get(target_date),
        )
        if estimated_row is not None:
            estimated_rows.append(estimated_row)

    frames: list[pd.DataFrame] = [base_df]
    if estimated_rows:
        estimated_df = pd.DataFrame(estimated_rows)
        estimated_df["__priority"] = 1
        frames.append(estimated_df)
    if archive_rows:
        archive_df = pd.DataFrame(archive_rows)
        archive_df["__priority"] = 3
        frames.append(archive_df)

    combined = pd.concat(frames, ignore_index=True, sort=False)
    combined["date"] = combined["date"].astype(str)
    combined = combined.sort_values(["date", "__priority"], ascending=[False, False])
    combined = combined.drop_duplicates(subset=["date"], keep="first")
    combined = combined.drop(columns=["__priority"], errors="ignore")
    return combined


def build_history_df(
    result: dict,
    history_market: dict[str, pd.DataFrame],
    live_market: dict[str, pd.DataFrame],
    dataset: pd.DataFrame,
    prediction_archive: list[dict],
) -> pd.DataFrame:
    df = result["preds"].copy()
    if df.empty:
        df = pd.DataFrame(columns=["date", "low", "high", "actual_open", "hit"])

    for col in ["low", "high", "actual_open"]:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")
    if "night_simple_open" not in df.columns:
        df["night_simple_open"] = np.nan

    df = _fill_recent_history_gaps(
        history_df=df,
        result=result,
        history_market=history_market,
        live_market=live_market,
        dataset=dataset,
        prediction_archive=prediction_archive,
    )

    if "date" in df.columns:
        parsed_dates = pd.to_datetime(df["date"], errors="coerce")
        valid_mask = parsed_dates.notna()
        df = df.loc[valid_mask].copy()
        parsed_dates = parsed_dates.loc[valid_mask]

        start_mask = parsed_dates.dt.date >= HISTORY_ACCUMULATION_START_DATE
        df = df.loc[start_mask].copy()
        parsed_dates = parsed_dates.loc[start_mask]
        df["date"] = parsed_dates.dt.strftime("%Y-%m-%d").to_numpy()

    if {"low", "high", "actual_open"}.issubset(df.columns):
        df[["low", "high", "actual_open"]] = df[["low", "high", "actual_open"]].round(2)
    return df.sort_values("date", ascending=False).head(HISTORY_RECORDS).reset_index(drop=True)


def overlay_prediction_on_history_df(history_df: pd.DataFrame, prediction_payload: dict | None) -> pd.DataFrame:
    if not isinstance(prediction_payload, dict) or history_df.empty:
        return history_df

    prediction_date_iso = parse_prediction_target_date(
        prediction_payload.get("predictionDateIso") or prediction_payload.get("predictionDate")
    )
    if not prediction_date_iso:
        return history_df

    row_mask = history_df["date"].astype(str) == prediction_date_iso
    if not bool(row_mask.any()):
        return history_df

    if "actual_open" in history_df.columns:
        actual_values = pd.to_numeric(history_df.loc[row_mask, "actual_open"], errors="coerce")
        if bool(actual_values.notna().any()):
            return history_df

    patched = history_df.copy()

    def to_float_or_none(value: object) -> float | None:
        try:
            if value is None or pd.isna(value):
                return None
            return float(value)
        except (TypeError, ValueError):
            return None

    point = to_float_or_none(prediction_payload.get("pointPrediction"))
    low = to_float_or_none(prediction_payload.get("rangeLow"))
    high = to_float_or_none(prediction_payload.get("rangeHigh"))
    night_simple = to_float_or_none(prediction_payload.get("nightFuturesSimplePoint"))

    if point is not None:
        patched.loc[row_mask, "pred_open"] = point
    if low is not None:
        patched.loc[row_mask, "low"] = low
    if high is not None:
        patched.loc[row_mask, "high"] = high
    if night_simple is not None:
        patched.loc[row_mask, "night_simple_open"] = night_simple

    if point is not None and "actual_open" in patched.columns:
        actual_open = pd.to_numeric(patched.loc[row_mask, "actual_open"], errors="coerce")
        patched.loc[row_mask, "error"] = point - actual_open
        low_bound = pd.to_numeric(patched.loc[row_mask, "low"], errors="coerce")
        high_bound = pd.to_numeric(patched.loc[row_mask, "high"], errors="coerce")
        patched.loc[row_mask, "hit"] = (low_bound <= actual_open) & (actual_open <= high_bound)

    return patched


def write_history_json(result: dict, history_df: pd.DataFrame) -> None:
    def to_bool_flag(value: object) -> bool:
        if pd.isna(value):
            return False
        return bool(value)

    records = [
        {
            "date": row["date"],
            "modelPrediction": round(float(row["pred_open"]), 2) if not pd.isna(row["pred_open"]) else None,
            "nightFuturesSimpleOpen": (
                round(float(row["night_simple_open"]), 2) if not pd.isna(row.get("night_simple_open")) else None
            ),
            "low": row["low"],
            "high": row["high"],
            "actualOpen": row["actual_open"],
            "hit": bool(row["hit"]),
            "isSynthetic": to_bool_flag(row.get("is_synthetic", False)),
        }
        for _, row in history_df.iterrows()
    ]

    payload = {
        "summary": {"mae30d": round(result["mae"], 2)},
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "records": records,
    }
    write_output_json("history.json", payload)


def choose_band_multiplier(vix: float) -> float:
    if vix < 20:
        return 1.0
    if vix < 25:
        return 1.3
    if vix < 30:
        return 1.5
    return 2.0


def as_utc_datetime(value: pd.Timestamp) -> datetime:
    ts = pd.Timestamp(value)
    if ts.tzinfo is None:
        ts = ts.tz_localize("UTC")
    else:
        ts = ts.tz_convert("UTC")
    return ts.to_pydatetime()


def is_us_premarket_window(now_utc: datetime) -> bool:
    now_et = now_utc.astimezone(US_ET)
    if now_et.weekday() >= 5:
        return False
    return time(4, 0) <= now_et.time() < time(9, 30)


def is_timestamp_in_us_premarket(ts_utc: datetime) -> bool:
    ts_et = ts_utc.astimezone(US_ET)
    if ts_et.weekday() >= 5:
        return False
    return time(4, 0) <= ts_et.time() < time(9, 30)


def indicator_label(name: str) -> str:
    return {
        "ewy": "EWY (Korea ETF)",
        "krw": "USD/KRW",
        "wti": "WTI",
        "sp500": "S&P 500",
        "nasdaq": "NASDAQ 100",
        "vix": "VIX",
        "koru": "KORU 3x",
        "k200f": "KOSPI 200 야간선물",
        "dow": "Dow Jones",
        "gold": "Gold",
        "us10y": "US 10Y",
        "sox": "PHLX Semiconductor",
    }[name]


def format_value(name: str, value: float) -> str:
    if name in {"ewy", "koru", "wti", "gold"}:
        return f"${value:,.2f}"
    if name == "krw":
        return f"{value:,.2f}원"
    if name == "us10y":
        return f"{value:.2f}%"
    return f"{value:,.2f}"


if __name__ == "__main__":
    main()
