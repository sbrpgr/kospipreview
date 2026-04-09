from __future__ import annotations

import json
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
import warnings
from datetime import date, datetime, time, timedelta, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

import lightgbm as lgb
import numpy as np
import pandas as pd
import yfinance as yf
from sklearn.model_selection import TimeSeriesSplit

warnings.filterwarnings("ignore")

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

DATA_DIR = ROOT / "frontend" / "public" / "data"
OUT_DATA_DIR = ROOT / "frontend" / "out" / "data"
DOCS_DIR = ROOT / "docs"
# Keep yfinance timezone cache outside the repository so CI git state stays clean.
CACHE_DIR = Path.home() / ".cache" / "kospipreview-yfinance"
DAY_FUTURES_CLOSE_CACHE_FILE = DATA_DIR / "day_futures_close_cache.json"
NIGHT_FUTURES_SOURCE_CACHE_FILE = DATA_DIR / "night_futures_source_cache.json"
PREDICTION_ARCHIVE_FILE = DATA_DIR / "prediction_archive.json"

KST = timezone(timedelta(hours=9))
US_ET = ZoneInfo("America/New_York")
KOREA_TICKERS = {"kospi": "^KS11"}
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

INDICATOR_ONLY_TICKERS: dict[str, str] = {}

INDICATOR_TICKERS = {
    **FEATURE_TICKERS,
    **INDICATOR_ONLY_TICKERS,
}

INDICATOR_SOURCE_URLS = {
    key: f"https://finance.yahoo.com/quote/{ticker.replace('=', '%3D').replace('^', '%5E')}"
    for key, ticker in INDICATOR_TICKERS.items()
}
INDICATOR_SOURCE_URLS["k200f"] = ""

LOOKBACK_DAYS = 3 * 365
ALL_FEATURES = list(FEATURE_TICKERS.keys())
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

NIGHT_FUTURES_PRIMARY_SCALE = 1.0
AUXILIARY_SIGNAL_WEIGHTS = {
    "sp500": 0.55,
    "nasdaq": 0.45,
}
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

LGBM_BASE = dict(
    n_estimators=300,
    learning_rate=0.05,
    num_leaves=31,
    min_child_samples=15,
    subsample=0.8,
    colsample_bytree=0.8,
    reg_alpha=0.1,
    reg_lambda=0.1,
    verbosity=-1,
    random_state=42,
)
LGBM_CENTER = dict(**LGBM_BASE, objective="regression", metric="rmse")
LGBM_LOW = dict(**LGBM_BASE, objective="quantile", alpha=0.1)
LGBM_HIGH = dict(**LGBM_BASE, objective="quantile", alpha=0.9)


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
    print("Training LightGBM models...")
    result = train_lgbm(dataset)
    prior_prediction_payload = load_prediction_payload()
    prediction_archive = load_prediction_archive()
    prediction_archive = merge_prediction_into_archive(prediction_archive, prior_prediction_payload)
    print("Writing output JSON files...")
    history_df = build_history_df(result, market, live_market, dataset, prediction_archive)
    latest = build_latest(live_market, result, market, live_overrides)
    prediction_payload = write_prediction_json(latest, result, history_df)
    prediction_archive = merge_prediction_into_archive(prediction_archive, prediction_payload)
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


def write_prediction_archive_json(archive: list[dict]) -> None:
    payload = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "records": archive,
    }
    write_output_json("prediction_archive.json", payload)


def fetch_market_data() -> dict[str, pd.DataFrame]:
    period = f"{LOOKBACK_DAYS}d"
    frames: dict[str, pd.DataFrame] = {}
    all_tickers = {**KOREA_TICKERS, **FEATURE_TICKERS, **INDICATOR_ONLY_TICKERS}

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

    for name, ticker in {**KOREA_TICKERS, **FEATURE_TICKERS}.items():
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
    kospi.index = kospi.index.map(_norm)
    kospi["target_return"] = (kospi["Open"] / kospi["Close"].shift(1) - 1) * 100
    kospi["prev_close"] = kospi["Close"].shift(1)

    features = []
    for name in ALL_FEATURES:
        frame = market[name].copy()
        if "Close" not in frame:
            continue

        feat = pd.DataFrame(index=frame.index)
        feat[f"{name}_return"] = frame["Close"].pct_change() * 100
        if name == "vix":
            feat["vix_level"] = frame["Close"]

        # Overseas indicators are aligned to the next Korea business day open.
        feat.index = feat.index.map(_norm) + pd.offsets.BDay(1)
        feat = feat.groupby(feat.index).last()
        features.append(feat)

    dataset = kospi.copy()
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

    required_columns = {"target_return", "ewy_return", "krw_return"}
    if not required_columns.issubset(dataset.columns):
        return default_payload

    sample = dataset[["target_return", "ewy_return", "krw_return"]].dropna()
    if sample.empty:
        return default_payload

    sample = sample.tail(EWY_FX_CORRECTION_LOOKBACK_DAYS)
    sample_size = int(len(sample))
    if sample_size < EWY_FX_CORRECTION_MIN_SAMPLES:
        default_payload["sample_size"] = sample_size
        return default_payload

    y = sample["target_return"].to_numpy(dtype=np.float64)
    ewy = sample["ewy_return"].to_numpy(dtype=np.float64)
    krw = sample["krw_return"].to_numpy(dtype=np.float64)
    X = np.column_stack([np.ones(sample_size, dtype=np.float64), ewy, krw])

    decay_exponents = np.arange(sample_size - 1, -1, -1, dtype=np.float64)
    weights = np.power(EWY_FX_CORRECTION_RECENCY_DECAY, decay_exponents)
    sqrt_weights = np.sqrt(weights)
    weighted_X = X * sqrt_weights[:, None]
    weighted_y = y * sqrt_weights

    try:
        beta, *_ = np.linalg.lstsq(weighted_X, weighted_y, rcond=None)
        intercept_raw = float(beta[0])
        ewy_coef_raw = float(beta[1])
        krw_coef_raw = float(beta[2])
    except (np.linalg.LinAlgError, ValueError):
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


def train_lgbm(dataset: pd.DataFrame) -> dict:
    feat_cols = [f"{name}_return" for name in ALL_FEATURES if f"{name}_return" in dataset.columns]
    X_df = dataset[feat_cols]
    y = dataset["target_return"].values
    dates = dataset.index
    prev_closes = dataset["prev_close"].values
    actual_opens = dataset["Open"].values
    vix_levels = dataset["vix_level"].values if "vix_level" in dataset.columns else np.full(len(y), 20.0)

    X = X_df.values.astype(np.float64)

    rows: list[dict] = []
    tscv = TimeSeriesSplit(n_splits=5)
    for train_idx, test_idx in tscv.split(X):
        if len(train_idx) < 60:
            continue

        Xtr, ytr = X[train_idx], y[train_idx]
        model_center = lgb.LGBMRegressor(**LGBM_CENTER)
        model_low = lgb.LGBMRegressor(**LGBM_LOW)
        model_high = lgb.LGBMRegressor(**LGBM_HIGH)

        model_center.fit(Xtr, ytr)
        model_low.fit(Xtr, ytr)
        model_high.fit(Xtr, ytr)

        pred_center = model_center.predict(X[test_idx])
        pred_low = model_low.predict(X[test_idx])
        pred_high = model_high.predict(X[test_idx])

        for i, idx in enumerate(test_idx):
            prev_close = prev_closes[idx]
            actual_open = actual_opens[idx]
            point_open = prev_close * (1 + pred_center[i] / 100)
            band_low = prev_close * (1 + pred_low[i] / 100)
            band_high = prev_close * (1 + pred_high[i] / 100)

            min_half_band = prev_close * 0.003 * choose_band_multiplier(vix_levels[idx])
            if band_high - band_low < min_half_band * 2:
                band_low = point_open - min_half_band
                band_high = point_open + min_half_band

            rows.append(
                {
                    "date": dates[idx].strftime("%Y-%m-%d"),
                    "pred_open": point_open,
                    "actual_open": actual_open,
                    "low": band_low,
                    "high": band_high,
                    "error": point_open - actual_open,
                    "hit": band_low <= actual_open <= band_high,
                    "direction_hit": np.sign(pred_center[i]) == np.sign(y[idx]),
                }
            )

    preds = pd.DataFrame(rows)
    rmse = float(np.sqrt(np.mean(np.square(preds["error"]))))
    mae = float(np.mean(np.abs(preds["error"])))

    final_center = lgb.LGBMRegressor(**LGBM_CENTER)
    final_center.fit(X, y)
    feature_importance = {key: int(value) for key, value in zip(feat_cols, final_center.feature_importances_)}
    target_bounds = {
        "p01": float(np.percentile(y, 1)),
        "p99": float(np.percentile(y, 99)),
        "min": float(np.min(y)),
        "max": float(np.max(y)),
    }
    ewy_fx_correction = fit_ewy_fx_correction(dataset)

    return {
        "rmse": rmse,
        "mae": mae,
        "bhr": float(preds["hit"].mean() * 100),
        "dhr": float(preds["direction_hit"].mean() * 100),
        "fi": feature_importance,
        "preds": preds,
        "feat_cols": feat_cols,
        "model_c": final_center,
        "target_bounds": target_bounds,
        "ewy_fx_correction": ewy_fx_correction,
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


def build_latest(
    live_market: dict[str, pd.DataFrame],
    result: dict,
    history_market: dict[str, pd.DataFrame],
    live_overrides: dict[str, dict],
) -> dict:
    returns: dict[str, float] = {}
    vix = 20.0

    prev_kospi_series = history_market["kospi"]["Close"] if "kospi" in history_market else pd.Series(dtype=float)
    live_kospi_frame = live_market.get("kospi", pd.DataFrame())
    live_kospi_series = live_kospi_frame["Close"] if "Close" in live_kospi_frame else pd.Series(dtype=float)
    prev_close, latest_record_date = resolve_latest_completed_krx_session(live_kospi_series, prev_kospi_series)
    prev_kospi_non_na = prev_kospi_series.dropna()
    prior_close = float(prev_kospi_non_na.iloc[-1]) if not prev_kospi_non_na.empty else prev_close
    prev_close_change = ((prev_close / prior_close - 1) * 100) if prior_close else 0.0

    for name in ALL_FEATURES:
        change_pct = compute_live_return_pct(
            name,
            live_market,
            history_market,
            baseline_session_date=latest_record_date,
            live_overrides=live_overrides,
        )
        if change_pct is None:
            continue
        returns[name] = change_pct
        if name == "vix":
            live_series = live_market[name]["Close"].dropna()
            if not live_series.empty:
                vix = float(live_series.iloc[-1])

    night_futures_change = compute_live_return_pct(
        "k200f",
        live_market,
        history_market,
        baseline_session_date=latest_record_date,
        live_overrides=live_overrides,
    )
    k200f_override = live_overrides.get("k200f", {})
    futures_day_close_raw = k200f_override.get("day_close")
    try:
        futures_day_close = float(futures_day_close_raw) if futures_day_close_raw is not None else None
    except (TypeError, ValueError):
        futures_day_close = None
    if futures_day_close == 0:
        futures_day_close = None
    futures_day_close_date = k200f_override.get("day_close_date")

    feature_vector = np.array(
        [[returns.get(column.replace("_return", ""), 0.0) for column in result["feat_cols"]]],
        dtype=np.float64,
    )
    raw_ml_change = float(result["model_c"].predict(feature_vector)[0])
    ewy_fx_correction = result.get("ewy_fx_correction", {})
    ewy_fx_core_change = compute_ewy_fx_core_change(returns, ewy_fx_correction)
    auxiliary_anchor_change = compute_auxiliary_anchor_change(returns, ewy_fx_correction)
    night_centered_change, blend_debug = compute_night_centered_change(
        raw_ml_change=raw_ml_change,
        night_futures_change=None,
        auxiliary_anchor_change=auxiliary_anchor_change,
    )

    damped_change = apply_mean_reversion_damping(night_centered_change, prev_close_change)
    guarded_change = apply_anchor_guardrail(
        predicted_change=damped_change,
        anchor_change=blend_debug.get("anchor"),
        guard_band=blend_debug.get("guard_band"),
    )
    bounds = result.get("target_bounds", {})
    lower, upper = compute_adaptive_bounds(bounds, prev_close_change, blend_debug.get("anchor"))
    if lower is not None and upper is not None:
        predicted_change = float(np.clip(guarded_change, lower, upper))
    else:
        predicted_change = guarded_change
    predicted_change = apply_ewy_alignment_guard(predicted_change, ewy_fx_core_change)

    point_prediction = prev_close * (1 + predicted_change / 100)
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
        "raw_pred_c": raw_ml_change,
        "core_anchor_c": ewy_fx_core_change,
        "night_anchor_c": None,
        "aux_anchor_c": blend_debug.get("aux_anchor"),
        "ml_residual_adj_c": blend_debug.get("ml_adjust"),
        "aux_residual_adj_c": blend_debug.get("aux_adjust"),
        "night_guard_band_c": blend_debug.get("guard_band"),
        "pre_damping_pred_c": night_centered_change,
        "prev_close_change_c": prev_close_change,
        "vix": vix,
        "returns": returns,
        "prev_close": prev_close,
        "latest_record_date": latest_record_date,
        "futures_day_close": futures_day_close,
        "futures_day_close_date": futures_day_close_date,
        "ewy_fx_correction": ewy_fx_correction,
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
    if now_kst.hour < 9:
        target_date = pd.Timestamp(now_kst.date())
    else:
        target_date = pd.Timestamp(now_kst.date()) + pd.offsets.BDay(1)
    return pd.Timestamp(target_date).strftime("%Y년 %m월 %d일")


def next_prediction_date_iso(now_kst: datetime) -> str:
    if now_kst.hour < 9:
        target_date = pd.Timestamp(now_kst.date())
    else:
        target_date = pd.Timestamp(now_kst.date()) + pd.offsets.BDay(1)
    return pd.Timestamp(target_date).date().isoformat()


def write_prediction_json(latest: dict, result: dict, history_df: pd.DataFrame) -> dict:
    now_utc = datetime.now(timezone.utc)
    now_kst = now_utc.astimezone(KST)
    latest_record_date = latest.get("latest_record_date")
    if not latest_record_date and not history_df.empty:
        latest_record_date = history_df.iloc[0]["date"]
    yesterday_row = history_df.iloc[0] if not history_df.empty else None

    payload = {
        "generatedAt": now_utc.isoformat(),
        "predictionDate": next_prediction_date_label(now_kst),
        "predictionDateIso": next_prediction_date_iso(now_kst),
        "pointPrediction": round(latest["point"], 2),
        "nightFuturesSimplePoint": (
            round(float(latest["night_futures_simple_point"]), 2)
            if latest["night_futures_simple_point"] is not None
            else None
        ),
        "nightFuturesSimpleChangePct": (
            round(float(latest["night_futures_change_c"]), 2) if latest["night_futures_change_c"] is not None else None
        ),
        "futuresDayClose": (
            round(float(latest["futures_day_close"]), 2) if latest.get("futures_day_close") is not None else None
        ),
        "futuresDayCloseDate": latest.get("futures_day_close_date"),
        "rangeLow": round(latest["r_low"], 2),
        "rangeHigh": round(latest["r_high"], 2),
        "predictedChangePct": round(latest["pred_c"], 2),
        "prevClose": round(latest["prev_close"], 2),
        "signalSummary": _build_signal_summary(latest["returns"]),
        "lastCalculatedAt": now_utc.isoformat(),
        "latestRecordDate": latest_record_date,
        "mae30d": round(result["mae"], 2),
        "model": {
            "engine": "LightGBM",
            "vix": round(latest["vix"], 2),
            "lgbmRmse": round(result["rmse"], 2),
            "calculationMode": "EWYCore+AuxSignals+NoNightFutures(KRXCloseSync)",
            "nightFuturesExcluded": True,
            "nightFuturesAnchorPct": (
                round(float(latest["night_anchor_c"]), 2) if latest.get("night_anchor_c") is not None else None
            ),
            "auxiliaryAnchorPct": (
                round(float(latest["aux_anchor_c"]), 2) if latest.get("aux_anchor_c") is not None else None
            ),
            "coreAnchorPct": round(float(latest["core_anchor_c"]), 2) if latest["core_anchor_c"] is not None else None,
            "rawModelPct": round(float(latest["raw_pred_c"]), 2),
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
            "prevCloseChangePct": round(float(latest["prev_close_change_c"]), 2),
            "krxBaselineDate": latest_record_date,
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

    if dataset.empty:
        return build_fallback_row()

    target_ts = pd.Timestamp(target_date)
    if target_ts not in dataset.index:
        return build_fallback_row()

    row = dataset.loc[target_ts]
    if isinstance(row, pd.DataFrame):
        row = row.iloc[-1]

    row_prev_close = row.get("prev_close")
    if row_prev_close is None or pd.isna(row_prev_close) or float(row_prev_close) == 0:
        prev_close_value = actual_open if prev_close is None or prev_close == 0 else float(prev_close)
    else:
        prev_close_value = float(row_prev_close)

    feature_values: list[float] = []
    for feature_name in result["feat_cols"]:
        value = row.get(feature_name, 0.0)
        feature_values.append(0.0 if pd.isna(value) else float(value))

    feature_vector = np.array([feature_values], dtype=np.float64)
    predicted_change = float(result["model_c"].predict(feature_vector)[0])
    point_open = prev_close_value * (1 + predicted_change / 100)

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
