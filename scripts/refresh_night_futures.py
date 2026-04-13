from __future__ import annotations

import html
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import date, datetime, time, timedelta, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from backtest_and_generate import (  # noqa: E402
    compute_prediction_components as compute_model_prediction_components,
    log_return_pct_to_simple_return_pct,
    parse_prediction_target_date,
    price_from_log_return,
    resolve_night_futures_change_for_target,
    resolve_night_futures_target_date_iso,
    simple_return_pct_to_log_return_pct,
)

DATA_DIR = Path(os.environ.get("KOSPI_DAWN_DATA_DIR", ROOT / "frontend" / "public" / "data"))
OUT_DATA_DIR = Path(os.environ.get("KOSPI_DAWN_OUT_DATA_DIR", ROOT / "frontend" / "out" / "data"))
INDICATORS_FILE = DATA_DIR / "indicators.json"
PREDICTION_FILE = DATA_DIR / "prediction.json"
HISTORY_FILE = DATA_DIR / "history.json"
LIVE_PREDICTION_SERIES_FILE = DATA_DIR / "live_prediction_series.json"
PREDICTION_ARCHIVE_FILE = DATA_DIR / "prediction_archive.json"
DAY_FUTURES_CLOSE_CACHE_FILE = DATA_DIR / "day_futures_close_cache.json"
NIGHT_FUTURES_SOURCE_CACHE_FILE = DATA_DIR / "night_futures_source_cache.json"

KST = timezone(timedelta(hours=9))
US_ET = ZoneInfo("America/New_York")

ESIGNAL_KOSPI_NIGHT_PAGE_URL = "https://esignal.co.kr/kospi200-futures-night/"
ESIGNAL_KOSPI_NIGHT_CACHE_URL = "https://esignal.co.kr/data/cache/kospif_ngt.js"
ESIGNAL_KOSPI_DAY_PAGE_URL = "https://esignal.co.kr/kospi200-futures/"
ESIGNAL_KOSPI_DAY_CACHE_URL = "https://esignal.co.kr/data/cache/kospif_day.js"
ESIGNAL_SOCKET_IO_URL = "https://esignal.co.kr/proxy/8889/socket.io/"
ESIGNAL_ORIGIN_URL = "https://esignal.co.kr"
NAVER_KOSPI_INDEX_URL = "https://polling.finance.naver.com/api/realtime/domestic/index/KOSPI"
NAVER_FINANCE_REFERER = "https://finance.naver.com/"
ESIGNAL_DAY_SYMBOL = "A0166"
ESIGNAL_REQUEST_TIMEOUT = 10
ESIGNAL_USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36"
)

KOSPI_DAY_FUTURES_SESSION_OPEN = time(8, 45)
KOSPI_DAY_FUTURES_SESSION_CLOSE = time(15, 30)
KOSPI_DAY_FUTURES_FINAL_CLOSE_TIME = time(15, 45)
KOSPI_OPEN_FIX_TIME = time(9, 0)
PREDICTION_TARGET_ROLLOVER_TIME = time(9, 0)
PREDICTION_OPERATION_START = time(15, 30)
PREDICTION_OPERATION_END = time(9, 0)
PREDICTION_OPERATION_HOURS_LABEL = "15:30~09:00"
PREDICTION_TREND_OPERATION_START = time(18, 0)
PREDICTION_TREND_OPERATION_END = time(9, 0)
PREDICTION_TREND_OPERATION_HOURS_LABEL = "18:00~09:00"
NIGHT_OPERATION_START = time(18, 0)
NIGHT_OPERATION_END = time(6, 30)
NIGHT_FUTURES_STALE_MINUTES = 180
NIGHT_FUTURES_SOURCE_MIN_REFRESH_SECONDS = 30
US_REGULAR_OPEN_ET = time(9, 30)
PREMARKET_TRACK_KEYS = {"ewy", "koru", "sp500", "nasdaq", "dow", "sox"}
PREMARKET_STALE_MINUTES = 45

DISPLAY_TICKER_BY_KEY = {
    "ewy": "EWY",
    "krw": "KRW=X",
    "wti": "CL=F",
    "sp500": "^GSPC",
    "nasdaq": "^NDX",
    "vix": "^VIX",
    "koru": "KORU",
    "dow": "^DJI",
    "gold": "GC=F",
    "us10y": "^TNX",
    "sox": "^SOX",
}

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
FALLBACK_ML_BLEND = 0.18
FALLBACK_AUX_BLEND = 0.72
FALLBACK_GUARD_BAND_MIN_PCT = 0.55
FALLBACK_GUARD_BAND_SHARE = 0.50
EWY_ALIGNMENT_TRIGGER_PCT = 1.0
EWY_ALIGNMENT_MIN_SHARE = 0.80
LIVE_REFRESH_KEEP_PREV_WEIGHT = 0.05
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
YAHOO_CHART_URL_TEMPLATE = (
    "https://query1.finance.yahoo.com/v8/finance/chart/{symbol}"
    "?interval=1m&range=2d&includePrePost=true"
)
YAHOO_QUOTE_PAGE_URL_TEMPLATE = "https://finance.yahoo.com/quote/{symbol}/"
YAHOO_QUOTE_PAGE_CACHE_SECONDS = 20
YAHOO_CHART_POINTS_CACHE_SECONDS = 20
YAHOO_QUOTE_PAGE_SNAPSHOT_CACHE: dict[str, tuple[datetime, dict | None]] = {}
YAHOO_CHART_POINTS_CACHE: dict[str, tuple[datetime, list[tuple[datetime, float]]]] = {}
KRX_SYNC_BASELINE_TIME = time(15, 30)
KRX_SYNC_MAX_LOOKBACK_HOURS = 36
KRX_SYNC_MAX_FORWARD_HOURS = 12
LIVE_PREDICTION_SERIES_MAX_RECORDS = 1080
PREDICTION_ARCHIVE_MAX_RECORDS = 200
HISTORY_RECORDS_MAX = 30
HISTORY_FUTURES_CLOSE_TRACKING_START_DATE = date(2026, 4, 14)


def read_json(path: Path) -> dict | None:
    if not path.exists():
        return None

    try:
        payload = json.loads(path.read_text(encoding="utf8"))
    except (OSError, ValueError, TypeError):
        return None

    return payload if isinstance(payload, dict) else None


def write_output_json(file_name: str, payload: dict) -> None:
    encoded = json.dumps(payload, ensure_ascii=False, indent=2)
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    OUT_DATA_DIR.mkdir(parents=True, exist_ok=True)
    (DATA_DIR / file_name).write_text(encoded, encoding="utf8")
    (OUT_DATA_DIR / file_name).write_text(encoded, encoding="utf8")


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


def is_night_operation_window(now_utc: datetime) -> bool:
    now_kst = now_utc.astimezone(KST)
    current = now_kst.hour * 60 + now_kst.minute
    start = NIGHT_OPERATION_START.hour * 60 + NIGHT_OPERATION_START.minute
    end = NIGHT_OPERATION_END.hour * 60 + NIGHT_OPERATION_END.minute
    return current >= start or current <= end


def is_us_premarket_window(now_utc: datetime) -> bool:
    now_et = now_utc.astimezone(US_ET)
    if now_et.weekday() >= 5:
        return False
    return US_PREMARKET_OPEN_ET <= now_et.time() < US_REGULAR_OPEN_ET


def is_timestamp_in_us_premarket(ts_utc: datetime) -> bool:
    ts_et = ts_utc.astimezone(US_ET)
    if ts_et.weekday() >= 5:
        return False
    return US_PREMARKET_OPEN_ET <= ts_et.time() < US_REGULAR_OPEN_ET


def clamp(value: float, minimum: float, maximum: float) -> float:
    return max(minimum, min(maximum, value))


def to_float(value: object) -> float | None:
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def parse_number_text(value: object) -> float | None:
    if isinstance(value, str):
        value = value.replace(",", "").strip()
    return to_float(value)


def rollforward_business_day(base: date) -> date:
    candidate = base
    while candidate.weekday() >= 5:
        candidate += timedelta(days=1)
    return candidate


def next_business_day(base: date) -> date:
    return rollforward_business_day(base + timedelta(days=1))


def resolve_prediction_target_date(now_kst: datetime) -> date:
    today = now_kst.date()
    today_business = rollforward_business_day(today)
    if today_business != today:
        return today_business
    if now_kst.time() >= PREDICTION_TARGET_ROLLOVER_TIME:
        return next_business_day(today)
    return today


def format_prediction_date_label(target_date: date) -> str:
    return target_date.strftime("%Y년 %m월 %d일")


def is_prediction_operation_window(now_utc: datetime) -> bool:
    current = now_utc.astimezone(KST).time()
    return current >= PREDICTION_OPERATION_START or current < PREDICTION_OPERATION_END


def is_prediction_trend_operation_window(now_utc: datetime) -> bool:
    current = now_utc.astimezone(KST).time()
    return current >= PREDICTION_TREND_OPERATION_START or current < PREDICTION_TREND_OPERATION_END


def load_live_prediction_series() -> dict:
    payload = read_json(LIVE_PREDICTION_SERIES_FILE)
    if not isinstance(payload, dict):
        return {"records": []}

    records = payload.get("records")
    if not isinstance(records, list):
        payload["records"] = []
    return payload


def build_live_prediction_series_entry(payload: dict, now_utc: datetime) -> dict | None:
    prediction_date_iso = parse_prediction_target_date(
        payload.get("predictionDateIso") or payload.get("predictionDate")
    )
    if not prediction_date_iso:
        return None

    point_prediction = to_float(payload.get("pointPrediction"))
    if point_prediction is None:
        return None

    observed_at = now_utc.replace(second=0, microsecond=0)
    observed_at_kst = observed_at.astimezone(KST)
    night_simple = to_float(payload.get("nightFuturesSimplePoint"))
    ewy_fx_simple = to_float(payload.get("ewyFxSimplePoint"))
    night_close = to_float(payload.get("nightFuturesClose"))
    predicted_change = to_float(payload.get("predictedChangePct"))
    night_change = to_float(payload.get("nightFuturesSimpleChangePct"))
    ewy_fx_change = to_float(payload.get("ewyFxSimpleChangePct"))

    return {
        "predictionDateIso": prediction_date_iso,
        "predictionDate": payload.get("predictionDate"),
        "observedAt": observed_at.isoformat(),
        "kstTime": observed_at_kst.strftime("%H:%M"),
        "pointPrediction": round(point_prediction, 2),
        "nightFuturesSimplePoint": round(night_simple, 2) if night_simple is not None else None,
        "ewyFxSimplePoint": round(ewy_fx_simple, 2) if ewy_fx_simple is not None else None,
        "nightFuturesClose": round(night_close, 2) if night_close is not None else None,
        "predictedChangePct": round(predicted_change, 2) if predicted_change is not None else None,
        "nightFuturesSimpleChangePct": round(night_change, 2) if night_change is not None else None,
        "ewyFxSimpleChangePct": round(ewy_fx_change, 2) if ewy_fx_change is not None else None,
    }


def update_live_prediction_series(payload: dict, now_utc: datetime) -> dict:
    if not is_prediction_trend_operation_window(now_utc):
        return load_live_prediction_series()

    entry = build_live_prediction_series_entry(payload, now_utc)
    if entry is None:
        return load_live_prediction_series()

    series_payload = load_live_prediction_series()
    target_date = entry["predictionDateIso"]
    records = [
        row
        for row in series_payload.get("records", [])
        if isinstance(row, dict)
        and row.get("predictionDateIso") == target_date
        and isinstance(row.get("observedAt"), str)
    ]

    by_observed_at: dict[str, dict] = {}
    for row in records:
        by_observed_at[str(row["observedAt"])] = row
    by_observed_at[entry["observedAt"]] = entry

    next_records = sorted(by_observed_at.values(), key=lambda row: str(row.get("observedAt", "")))
    if len(next_records) > LIVE_PREDICTION_SERIES_MAX_RECORDS:
        next_records = next_records[-LIVE_PREDICTION_SERIES_MAX_RECORDS:]

    return {
        "generatedAt": now_utc.isoformat(),
        "predictionDateIso": target_date,
        "predictionDate": entry.get("predictionDate"),
        "records": next_records,
    }


def fetch_yahoo_chart_points(symbol: str) -> list[tuple[datetime, float]]:
    now_utc = datetime.now(timezone.utc)
    cached = YAHOO_CHART_POINTS_CACHE.get(symbol)
    if cached is not None:
        cached_at, cached_points = cached
        if (now_utc - cached_at).total_seconds() <= YAHOO_CHART_POINTS_CACHE_SECONDS:
            return list(cached_points)

    points = fetch_yahoo_chart_points_uncached(symbol)
    YAHOO_CHART_POINTS_CACHE[symbol] = (now_utc, list(points))
    return points


def fetch_yahoo_chart_points_uncached(symbol: str) -> list[tuple[datetime, float]]:
    encoded_symbol = urllib.parse.quote(symbol, safe="")
    url = YAHOO_CHART_URL_TEMPLATE.format(symbol=encoded_symbol)
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": ESIGNAL_USER_AGENT,
            "Accept": "application/json,text/javascript,*/*;q=0.1",
            "Cache-Control": "no-cache",
        },
        method="GET",
    )
    try:
        with urllib.request.urlopen(req, timeout=ESIGNAL_REQUEST_TIMEOUT) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except (urllib.error.URLError, TimeoutError, ValueError, TypeError):
        return []

    if not isinstance(payload, dict):
        return []
    chart = payload.get("chart")
    if not isinstance(chart, dict):
        return []
    results = chart.get("result")
    if not isinstance(results, list) or not results:
        return []
    first = results[0]
    if not isinstance(first, dict):
        return []

    indicators = first.get("indicators")
    if not isinstance(indicators, dict):
        return []
    quotes = indicators.get("quote")
    if not isinstance(quotes, list) or not quotes:
        return []
    quote0 = quotes[0]
    if not isinstance(quote0, dict):
        return []
    closes = quote0.get("close")
    timestamps = first.get("timestamp")
    if not isinstance(closes, list) or not isinstance(timestamps, list):
        return []

    points: list[tuple[datetime, float]] = []
    for raw_ts, raw_close in zip(timestamps, closes):
        try:
            ts_utc = datetime.fromtimestamp(int(raw_ts), tz=timezone.utc)
        except (TypeError, ValueError):
            continue
        close_value = to_float(raw_close)
        if close_value is None:
            continue
        points.append((ts_utc, close_value))
    return points


def raw_yahoo_field(payload: dict, key: str) -> float | None:
    value = payload.get(key)
    if isinstance(value, dict):
        return to_float(value.get("raw"))
    return to_float(value)


def raw_yahoo_time(payload: dict, key: str) -> datetime | None:
    value = payload.get(key)
    if isinstance(value, dict):
        value = value.get("raw")
    try:
        return datetime.fromtimestamp(int(value), tz=timezone.utc)
    except (TypeError, ValueError, OSError):
        return None


def yahoo_quote_payload_snapshot(payload: dict) -> dict | None:
    candidates: list[dict] = []
    field_groups = [
        ("overnight", "overnightMarketTime", "overnightMarketPrice", "overnightMarketChangePercent"),
        ("pre", "preMarketTime", "preMarketPrice", "preMarketChangePercent"),
        ("post", "postMarketTime", "postMarketPrice", "postMarketChangePercent"),
        ("regular", "regularMarketTime", "regularMarketPrice", "regularMarketChangePercent"),
    ]
    regular_price = raw_yahoo_field(payload, "regularMarketPrice")

    for session, time_key, price_key, change_key in field_groups:
        price = raw_yahoo_field(payload, price_key)
        updated_at = raw_yahoo_time(payload, time_key)
        if price is None or updated_at is None:
            continue

        change_pct = raw_yahoo_field(payload, change_key)
        if change_pct is None and regular_price not in (None, 0):
            change_pct = (price / float(regular_price) - 1) * 100

        candidates.append(
            {
                "value": price,
                "change_pct": change_pct if change_pct is not None else 0.0,
                "updated_at": updated_at.isoformat(),
                "market_session": session,
            }
        )

    if not candidates:
        return None

    return max(candidates, key=lambda item: str(item.get("updated_at", "")))


def fetch_yahoo_quote_page_snapshot(symbol: str) -> dict | None:
    now_utc = datetime.now(timezone.utc)
    cached = YAHOO_QUOTE_PAGE_SNAPSHOT_CACHE.get(symbol)
    if cached is not None:
        cached_at, cached_snapshot = cached
        if (now_utc - cached_at).total_seconds() <= YAHOO_QUOTE_PAGE_CACHE_SECONDS:
            return dict(cached_snapshot) if cached_snapshot is not None else None

    snapshot = fetch_yahoo_quote_page_snapshot_uncached(symbol)
    YAHOO_QUOTE_PAGE_SNAPSHOT_CACHE[symbol] = (
        now_utc,
        dict(snapshot) if snapshot is not None else None,
    )
    return snapshot


def fetch_yahoo_quote_page_snapshot_uncached(symbol: str) -> dict | None:
    encoded_symbol = urllib.parse.quote(symbol, safe="")
    url = YAHOO_QUOTE_PAGE_URL_TEMPLATE.format(symbol=encoded_symbol)
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": ESIGNAL_USER_AGENT,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Cache-Control": "no-cache",
        },
        method="GET",
    )
    try:
        with urllib.request.urlopen(req, timeout=ESIGNAL_REQUEST_TIMEOUT) as response:
            body = response.read().decode("utf-8", "replace")
    except (urllib.error.URLError, TimeoutError):
        return None

    for match in re.finditer(r"<script[^>]*data-sveltekit-fetched[^>]*>(.*?)</script>", body, re.S):
        tag = body[match.start() : body.find(">", match.start()) + 1]
        data_url_match = re.search(r'data-url="([^"]+)"', tag)
        if data_url_match is None:
            continue
        data_url = html.unescape(data_url_match.group(1))
        if "/v7/finance/quote" not in data_url or "overnightPrice=true" not in data_url:
            continue

        parsed = urllib.parse.urlparse(data_url)
        query = urllib.parse.parse_qs(parsed.query)
        symbols = ",".join(query.get("symbols", []))
        if symbol not in {part.strip() for part in symbols.split(",") if part.strip()}:
            continue

        try:
            outer = json.loads(match.group(1))
            inner = json.loads(outer.get("body", "{}"))
        except (TypeError, ValueError):
            continue

        result = ((inner.get("quoteResponse") or {}).get("result") or [])
        if not isinstance(result, list) or not result or not isinstance(result[0], dict):
            continue

        snapshot = yahoo_quote_payload_snapshot(result[0])
        if snapshot is not None:
            return snapshot

    return None


def merge_yahoo_quote_page_latest_point(
    symbol: str,
    points: list[tuple[datetime, float]],
) -> list[tuple[datetime, float]]:
    snapshot = fetch_yahoo_quote_page_snapshot(symbol)
    if not snapshot:
        return points

    updated_at = parse_iso_datetime_utc(snapshot.get("updated_at"))
    value = to_float(snapshot.get("value"))
    if updated_at is None or value is None:
        return points

    merged = list(points)
    if not merged or updated_at > merged[-1][0]:
        merged.append((updated_at, value))
    return sorted(merged, key=lambda item: item[0])


def normalize_prediction_archive_entry(payload: dict) -> dict | None:
    prediction_date_iso = parse_prediction_target_date(
        payload.get("predictionDateIso") or payload.get("predictionDate")
    )
    generated_at = payload.get("generatedAt") or payload.get("lastCalculatedAt")
    if not prediction_date_iso or not isinstance(generated_at, str):
        return None

    point = to_float(payload.get("pointPrediction"))
    low = to_float(payload.get("rangeLow"))
    high = to_float(payload.get("rangeHigh"))
    if point is None or low is None or high is None:
        return None

    if low > high:
        low, high = high, low

    night_simple = to_float(payload.get("nightFuturesSimplePoint"))
    ewy_fx_simple = to_float(payload.get("ewyFxSimplePoint"))
    night_close = to_float(payload.get("nightFuturesClose"))
    day_close = to_float(payload.get("futuresDayClose"))
    entry = {
        "predictionDateIso": prediction_date_iso,
        "predictionDate": payload.get("predictionDate") or format_prediction_date_label(date.fromisoformat(prediction_date_iso)),
        "generatedAt": generated_at,
        "rangeLow": round(low, 2),
        "rangeHigh": round(high, 2),
        "pointPrediction": round(point, 2),
        "nightFuturesSimplePoint": round(night_simple, 2) if night_simple is not None else None,
        "ewyFxSimplePoint": round(ewy_fx_simple, 2) if ewy_fx_simple is not None else None,
    }
    if night_close is not None:
        entry["nightFuturesClose"] = round(night_close, 2)
    if day_close is not None:
        entry["futuresDayClose"] = round(day_close, 2)
        futures_day_close_date = payload.get("futuresDayCloseDate")
        if isinstance(futures_day_close_date, str) and futures_day_close_date:
            entry["futuresDayCloseDate"] = futures_day_close_date
    return entry


def load_prediction_archive() -> list[dict]:
    payload = read_json(PREDICTION_ARCHIVE_FILE)
    if not isinstance(payload, dict):
        return []
    records = payload.get("records")
    if not isinstance(records, list):
        return []
    return [row for row in records if isinstance(row, dict)]


def merge_prediction_into_archive(archive: list[dict], payload: dict | None) -> list[dict]:
    if payload is None:
        return archive

    entry = normalize_prediction_archive_entry(payload)
    if entry is None:
        return archive

    by_date: dict[str, dict] = {}
    for raw in archive:
        normalized = normalize_prediction_archive_entry(raw)
        if normalized is None:
            continue
        date_key = str(normalized["predictionDateIso"])
        existing = by_date.get(date_key)
        if existing is None or str(normalized["generatedAt"]) >= str(existing["generatedAt"]):
            by_date[date_key] = normalized

    date_key = str(entry["predictionDateIso"])
    existing = by_date.get(date_key)
    if existing is None or str(entry["generatedAt"]) >= str(existing["generatedAt"]):
        by_date[date_key] = entry

    return sorted(
        by_date.values(),
        key=lambda row: str(row.get("predictionDateIso", "")),
        reverse=True,
    )[:PREDICTION_ARCHIVE_MAX_RECORDS]


def write_prediction_archive_json(archive: list[dict], now_utc: datetime) -> None:
    write_output_json(
        "prediction_archive.json",
        {
            "generatedAt": now_utc.isoformat(),
            "records": archive,
        },
    )


def prediction_archive_lookup(archive: list[dict]) -> dict[str, dict]:
    lookup: dict[str, dict] = {}
    for raw in archive:
        normalized = normalize_prediction_archive_entry(raw)
        if normalized is None:
            continue
        date_key = str(normalized["predictionDateIso"])
        existing = lookup.get(date_key)
        if existing is None or str(normalized["generatedAt"]) >= str(existing["generatedAt"]):
            lookup[date_key] = normalized
    return lookup


def should_archive_prediction_snapshot(payload: dict, now_utc: datetime) -> bool:
    prediction_date_iso = parse_prediction_target_date(payload.get("predictionDateIso") or payload.get("predictionDate"))
    if not prediction_date_iso:
        return False

    now_kst = now_utc.astimezone(KST)
    if prediction_date_iso != now_kst.date().isoformat() or now_kst.time() < KOSPI_OPEN_FIX_TIME:
        return True

    generated_at = parse_iso_datetime_utc(payload.get("lastCalculatedAt")) or parse_iso_datetime_utc(
        payload.get("generatedAt")
    )
    if generated_at is None:
        return False

    generated_at_kst = generated_at.astimezone(KST)
    return generated_at_kst.date() == now_kst.date() and generated_at_kst.time() < KOSPI_OPEN_FIX_TIME


def latest_preopen_series_row(series_payload: dict | None, target_date: date) -> dict | None:
    if not isinstance(series_payload, dict):
        return None

    records = series_payload.get("records")
    if not isinstance(records, list):
        return None

    target_iso = target_date.isoformat()
    target_open_kst = datetime.combine(target_date, KOSPI_OPEN_FIX_TIME, tzinfo=KST)
    candidates: list[tuple[datetime, dict]] = []
    for row in records:
        if not isinstance(row, dict) or row.get("predictionDateIso") != target_iso:
            continue
        observed_at = parse_iso_datetime_utc(row.get("observedAt"))
        if observed_at is None:
            continue
        observed_at_kst = observed_at.astimezone(KST)
        if observed_at_kst >= target_open_kst:
            continue
        if to_float(row.get("pointPrediction")) is None:
            continue
        candidates.append((observed_at, row))

    if not candidates:
        return None
    return sorted(candidates, key=lambda item: item[0])[-1][1]


def resolve_fixed_prediction_entry(
    target_date: date,
    archive: list[dict],
    series_payload: dict | None,
    fallback_prediction: dict | None,
) -> dict | None:
    target_iso = target_date.isoformat()
    archive_entry = prediction_archive_lookup(archive).get(target_iso)
    fallback_entry = normalize_prediction_archive_entry(fallback_prediction) if isinstance(fallback_prediction, dict) else None
    base_entry = archive_entry or fallback_entry

    series_row = latest_preopen_series_row(series_payload, target_date)
    if series_row is None:
        return base_entry

    point = to_float(series_row.get("pointPrediction"))
    if point is None:
        return base_entry

    low = to_float(base_entry.get("rangeLow")) if base_entry else None
    high = to_float(base_entry.get("rangeHigh")) if base_entry else None
    center = to_float(base_entry.get("pointPrediction")) if base_entry else None
    if low is not None and high is not None and center is not None:
        half_band = max(1.0, (high - low) / 2)
    else:
        half_band = 20.0

    night_simple = to_float(series_row.get("nightFuturesSimplePoint"))
    ewy_fx_simple = to_float(series_row.get("ewyFxSimplePoint"))
    night_close = to_float(series_row.get("nightFuturesClose"))
    day_close = to_float((base_entry or {}).get("futuresDayClose"))
    entry = {
        "predictionDateIso": target_iso,
        "predictionDate": series_row.get("predictionDate") or format_prediction_date_label(target_date),
        "generatedAt": series_row.get("observedAt") or (base_entry or {}).get("generatedAt") or "",
        "rangeLow": round(point - half_band, 2),
        "rangeHigh": round(point + half_band, 2),
        "pointPrediction": round(point, 2),
        "nightFuturesSimplePoint": round(night_simple, 2) if night_simple is not None else None,
        "ewyFxSimplePoint": round(ewy_fx_simple, 2) if ewy_fx_simple is not None else None,
    }
    if night_close is not None:
        entry["nightFuturesClose"] = round(night_close, 2)
    if day_close is not None:
        entry["futuresDayClose"] = round(day_close, 2)
        futures_day_close_date = (base_entry or {}).get("futuresDayCloseDate")
        if isinstance(futures_day_close_date, str) and futures_day_close_date:
            entry["futuresDayCloseDate"] = futures_day_close_date
    return entry


def fetch_kospi_actual_open(target_date: date) -> float | None:
    naver_snapshot = fetch_naver_kospi_index_snapshot()
    if isinstance(naver_snapshot, dict) and naver_snapshot.get("session_date") == target_date.isoformat():
        open_value = to_float(naver_snapshot.get("open"))
        if open_value is not None:
            return open_value

    points = fetch_yahoo_chart_points("^KS11")
    if not points:
        return None

    kst_points = [
        (ts_utc.astimezone(KST), value)
        for ts_utc, value in points
        if ts_utc.astimezone(KST).date() == target_date
    ]
    if not kst_points:
        return None

    after_open = [(ts_kst, value) for ts_kst, value in kst_points if ts_kst.time() >= KOSPI_OPEN_FIX_TIME]
    selected = after_open[0] if after_open else kst_points[0]
    return float(selected[1])


def fetch_naver_kospi_index_snapshot() -> dict | None:
    req = urllib.request.Request(
        NAVER_KOSPI_INDEX_URL,
        headers={
            "User-Agent": ESIGNAL_USER_AGENT,
            "Accept": "application/json,text/javascript,*/*;q=0.1",
            "Referer": NAVER_FINANCE_REFERER,
            "Cache-Control": "no-cache",
        },
        method="GET",
    )
    try:
        with urllib.request.urlopen(req, timeout=ESIGNAL_REQUEST_TIMEOUT) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except (urllib.error.URLError, TimeoutError, ValueError, TypeError):
        return None

    if not isinstance(payload, dict):
        return None

    rows = payload.get("datas")
    row = rows[0] if isinstance(rows, list) and rows and isinstance(rows[0], dict) else payload
    if not isinstance(row, dict):
        return None

    close_value = parse_number_text(row.get("closePriceRaw") or row.get("closePrice"))
    open_value = parse_number_text(row.get("openPriceRaw") or row.get("openPrice"))
    change_pct = parse_number_text(row.get("fluctuationsRatioRaw") or row.get("fluctuationsRatio"))
    if close_value is None:
        return None

    traded_at_raw = row.get("localTradedAt")
    traded_at: datetime | None = None
    if isinstance(traded_at_raw, str) and traded_at_raw:
        try:
            parsed = datetime.fromisoformat(traded_at_raw)
        except ValueError:
            parsed = None
        if parsed is not None:
            traded_at = parsed.replace(tzinfo=KST) if parsed.tzinfo is None else parsed.astimezone(KST)

    if traded_at is None:
        traded_at = datetime.now(timezone.utc).astimezone(KST)

    return {
        "close": close_value,
        "open": open_value,
        "change_pct": change_pct,
        "updated_at": traded_at.astimezone(timezone.utc).isoformat(),
        "session_date": traded_at.date().isoformat(),
        "market_status": row.get("marketStatus"),
        "provider": "naver-index",
    }


def fetch_kospi_actual_close_quote(target_date: date) -> dict | None:
    target_iso = target_date.isoformat()

    naver_snapshot = fetch_naver_kospi_index_snapshot()
    if isinstance(naver_snapshot, dict) and naver_snapshot.get("session_date") == target_iso:
        updated_at = parse_iso_datetime_utc(naver_snapshot.get("updated_at"))
        updated_kst = updated_at.astimezone(KST) if updated_at is not None else None
        market_status = str(naver_snapshot.get("market_status") or "").upper()
        if market_status == "CLOSE" or (
            updated_kst is not None and updated_kst.time() >= KOSPI_DAY_FUTURES_SESSION_CLOSE
        ):
            return naver_snapshot

    points = fetch_yahoo_chart_points("^KS11")
    kst_points = [
        (ts_utc.astimezone(KST), ts_utc, value)
        for ts_utc, value in points
        if ts_utc.astimezone(KST).date() == target_date
    ]
    after_close = [
        (ts_kst, ts_utc, value)
        for ts_kst, ts_utc, value in kst_points
        if ts_kst.time() >= KOSPI_DAY_FUTURES_SESSION_CLOSE
    ]
    if not after_close:
        return None

    ts_kst, ts_utc, value = after_close[-1]
    return {
        "close": float(value),
        "open": None,
        "change_pct": None,
        "updated_at": ts_utc.isoformat(),
        "session_date": ts_kst.date().isoformat(),
        "market_status": "CLOSE",
        "provider": "yahoo-chart",
    }


def fetch_kospi_actual_close(target_date: date) -> float | None:
    quote = fetch_kospi_actual_close_quote(target_date)
    if not quote:
        return None
    return to_float(quote.get("close"))


def compare_date_desc(left: str, right: str) -> int:
    try:
        left_date = date.fromisoformat(left)
        right_date = date.fromisoformat(right)
    except ValueError:
        return -1 if left > right else 1 if left < right else 0
    if left_date == right_date:
        return 0
    return -1 if left_date > right_date else 1


def update_history_with_actual_open(
    history_payload: dict,
    archive: list[dict],
    now_utc: datetime,
    series_payload: dict | None = None,
    fallback_prediction: dict | None = None,
    day_close_quote: dict | None = None,
    night_quote: dict | None = None,
) -> dict:
    now_kst = now_utc.astimezone(KST)
    if now_kst.weekday() >= 5 or now_kst.time() < KOSPI_OPEN_FIX_TIME:
        return history_payload

    target_date = now_kst.date()
    target_iso = target_date.isoformat()
    fixed_prediction = resolve_fixed_prediction_entry(target_date, archive, series_payload, fallback_prediction)
    if fixed_prediction is None:
        return history_payload

    actual_open = fetch_kospi_actual_open(target_date)
    if actual_open is None:
        return history_payload

    records = history_payload.get("records")
    if not isinstance(records, list):
        records = []

    existing_record = next(
        (row for row in records if isinstance(row, dict) and row.get("date") == target_iso),
        None,
    )
    existing_actual_close = to_float(existing_record.get("actualClose")) if isinstance(existing_record, dict) else None
    existing_ewy_fx_simple_open = (
        to_float(existing_record.get("ewyFxSimpleOpen")) if isinstance(existing_record, dict) else None
    )
    existing_day_futures_close = (
        to_float(existing_record.get("dayFuturesClose")) if isinstance(existing_record, dict) else None
    )
    existing_night_futures_close = (
        to_float(existing_record.get("nightFuturesClose")) if isinstance(existing_record, dict) else None
    )
    actual_close = fetch_kospi_actual_close(target_date)
    if actual_close is None:
        actual_close = existing_actual_close

    track_futures_closes = target_date >= HISTORY_FUTURES_CLOSE_TRACKING_START_DATE

    day_futures_close = existing_day_futures_close if track_futures_closes else None
    if track_futures_closes and isinstance(day_close_quote, dict) and day_close_quote.get("session_date") == target_iso:
        quoted_day_close = to_float(day_close_quote.get("close"))
        if quoted_day_close is not None:
            day_futures_close = quoted_day_close

    night_futures_close = None
    if track_futures_closes:
        if isinstance(night_quote, dict) and night_quote.get("day_close_date") == target_iso:
            night_futures_close = to_float(night_quote.get("price"))
        if night_futures_close is None:
            night_futures_close = to_float(fixed_prediction.get("nightFuturesClose"))
        if night_futures_close is None:
            night_target_iso = resolve_night_futures_target_date_iso(night_quote, day_close_quote)
            if night_target_iso == target_iso and isinstance(night_quote, dict):
                night_futures_close = to_float(night_quote.get("price"))
        if night_futures_close is None:
            night_futures_close = existing_night_futures_close

    low = to_float(fixed_prediction.get("rangeLow"))
    high = to_float(fixed_prediction.get("rangeHigh"))
    point = to_float(fixed_prediction.get("pointPrediction"))
    if low is None or high is None or point is None:
        return history_payload
    if low > high:
        low, high = high, low

    night_simple = to_float(fixed_prediction.get("nightFuturesSimplePoint"))
    ewy_fx_simple = to_float(fixed_prediction.get("ewyFxSimplePoint"))
    if ewy_fx_simple is None:
        ewy_fx_simple = existing_ewy_fx_simple_open
    record = {
        "date": target_iso,
        "modelPrediction": round(point, 2),
        "nightFuturesSimpleOpen": round(night_simple, 2) if night_simple is not None else None,
        "ewyFxSimpleOpen": round(ewy_fx_simple, 2) if ewy_fx_simple is not None else None,
        "low": round(low, 2),
        "high": round(high, 2),
        "actualOpen": round(actual_open, 2),
        "actualClose": round(actual_close, 2) if actual_close is not None else None,
        "dayFuturesClose": round(day_futures_close, 2) if day_futures_close is not None else None,
        "nightFuturesClose": round(night_futures_close, 2) if night_futures_close is not None else None,
        "hit": bool(low <= actual_open <= high),
        "isSynthetic": False,
    }

    next_records = [row for row in records if not (isinstance(row, dict) and row.get("date") == target_iso)]
    next_records.append(record)
    next_records = [
        row
        for row in next_records
        if isinstance(row, dict) and isinstance(row.get("date"), str)
    ]
    next_records.sort(key=lambda row: str(row.get("date", "")), reverse=True)
    history_payload["records"] = next_records[:HISTORY_RECORDS_MAX]
    history_payload["generatedAt"] = now_utc.isoformat()
    if not isinstance(history_payload.get("summary"), dict):
        history_payload["summary"] = {}
    return history_payload


def fetch_yahoo_chart_market_display_snapshot(symbol: str) -> dict | None:
    encoded_symbol = urllib.parse.quote(symbol, safe="")
    url = YAHOO_CHART_URL_TEMPLATE.format(symbol=encoded_symbol)
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": ESIGNAL_USER_AGENT,
            "Accept": "application/json,text/javascript,*/*;q=0.1",
            "Cache-Control": "no-cache",
        },
        method="GET",
    )
    try:
        with urllib.request.urlopen(req, timeout=ESIGNAL_REQUEST_TIMEOUT) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except (urllib.error.URLError, TimeoutError, ValueError, TypeError):
        return None

    if not isinstance(payload, dict):
        return None
    chart = payload.get("chart")
    if not isinstance(chart, dict):
        return None
    results = chart.get("result")
    if not isinstance(results, list) or not results:
        return None
    first = results[0]
    if not isinstance(first, dict):
        return None

    timestamps = first.get("timestamp")
    indicators = first.get("indicators")
    if not isinstance(timestamps, list) or not isinstance(indicators, dict):
        return None
    quotes = indicators.get("quote")
    if not isinstance(quotes, list) or not quotes:
        return None
    quote0 = quotes[0]
    if not isinstance(quote0, dict):
        return None
    closes = quote0.get("close")
    if not isinstance(closes, list):
        return None

    latest_ts_utc = None
    latest_value = None
    for raw_ts, raw_close in zip(timestamps, closes):
        close_value = to_float(raw_close)
        if close_value is None:
            continue
        try:
            ts_utc = datetime.fromtimestamp(int(raw_ts), tz=timezone.utc)
        except (TypeError, ValueError):
            continue
        latest_ts_utc = ts_utc
        latest_value = close_value

    meta = first.get("meta")
    if not isinstance(meta, dict):
        return None
    previous_close = to_float(meta.get("previousClose"))
    if previous_close == 0:
        return None

    if previous_close is None:
        previous_close = to_float(meta.get("chartPreviousClose"))
    if previous_close is None:
        return None

    freshest_ts_utc = latest_ts_utc
    freshest_value = latest_value

    def consider_meta_price(time_key: str, price_key: str) -> None:
        nonlocal freshest_ts_utc, freshest_value

        raw_ts = meta.get(time_key)
        raw_price = meta.get(price_key)
        price_value = to_float(raw_price)
        if price_value is None:
            return

        try:
            ts_utc = datetime.fromtimestamp(int(raw_ts), tz=timezone.utc)
        except (TypeError, ValueError):
            return

        if freshest_ts_utc is None or ts_utc > freshest_ts_utc:
            freshest_ts_utc = ts_utc
            freshest_value = price_value

    consider_meta_price("regularMarketTime", "regularMarketPrice")
    consider_meta_price("preMarketTime", "preMarketPrice")
    consider_meta_price("postMarketTime", "postMarketPrice")

    if freshest_ts_utc is None or freshest_value is None:
        return None

    return {
        "value": freshest_value,
        "change_pct": (freshest_value / previous_close - 1) * 100,
        "updated_at": freshest_ts_utc.isoformat(),
    }


def select_latest_market_snapshot(*snapshots: dict | None) -> dict | None:
    candidates: list[tuple[datetime, int, int, dict]] = []
    for snapshot in snapshots:
        if not isinstance(snapshot, dict):
            continue
        if to_float(snapshot.get("value")) is None or to_float(snapshot.get("change_pct")) is None:
            continue
        updated_at = parse_iso_datetime_utc(snapshot.get("updated_at"))
        if updated_at is None:
            continue
        has_market_session = 1 if snapshot.get("market_session") else 0
        candidates.append((updated_at, has_market_session, len(candidates), snapshot))

    if not candidates:
        return None

    _, _, _, snapshot = max(candidates, key=lambda item: (item[0], item[1], item[2]))
    return dict(snapshot)


def fetch_yahoo_market_display_snapshot(symbol: str) -> dict | None:
    chart_snapshot = fetch_yahoo_chart_market_display_snapshot(symbol)
    quote_page_snapshot = fetch_yahoo_quote_page_snapshot(symbol)
    return select_latest_market_snapshot(chart_snapshot, quote_page_snapshot)


def format_indicator_value(key: str, value: float) -> str:
    if key in {"ewy", "koru", "wti", "gold"}:
        return f"${value:,.2f}"
    if key == "krw":
        return f"{value:,.2f}원"
    if key == "us10y":
        return f"{value:,.2f}%"
    return f"{value:,.2f}"


def fetch_yahoo_intraday_return_pct(symbol: str, baseline_session_date: str | None) -> float | None:
    if not baseline_session_date:
        return None
    try:
        baseline_date = date.fromisoformat(baseline_session_date)
    except ValueError:
        return None

    points = fetch_yahoo_chart_points(symbol)
    points = merge_yahoo_quote_page_latest_point(symbol, points)
    if not points:
        return None

    baseline_kst = datetime.combine(baseline_date, KRX_SYNC_BASELINE_TIME, tzinfo=KST)
    latest_ts_utc, latest_close = points[-1]

    points_kst = [(ts_utc.astimezone(KST), ts_utc, close) for ts_utc, close in points]
    same_day_points = [row for row in points_kst if row[0].date() == baseline_date]

    baseline_point: tuple[datetime, float] | None = None
    if same_day_points:
        forward_points = [row for row in same_day_points if row[0] >= baseline_kst]
        if forward_points:
            ts_kst, ts_utc, close = forward_points[0]
            delay_hours = (ts_kst - baseline_kst).total_seconds() / 3600
            if delay_hours <= KRX_SYNC_MAX_FORWARD_HOURS:
                baseline_point = (ts_utc, close)

    if baseline_point is None:
        backward_points = [row for row in points_kst if row[0] <= baseline_kst]
        if backward_points:
            ts_kst, ts_utc, close = backward_points[-1]
            lookback_hours = (baseline_kst - ts_kst).total_seconds() / 3600
            if lookback_hours <= KRX_SYNC_MAX_LOOKBACK_HOURS:
                baseline_point = (ts_utc, close)

    if baseline_point is None:
        return None

    baseline_ts_utc, baseline_close = baseline_point
    if baseline_close == 0:
        return None

    return (latest_close / baseline_close - 1) * 100


def fetch_yahoo_intraday_model_change(
    symbol: str,
    baseline_session_date: str | None,
    *,
    diff_mode: bool = False,
) -> float | None:
    if not baseline_session_date:
        return None
    try:
        baseline_date = date.fromisoformat(baseline_session_date)
    except ValueError:
        return None

    points = fetch_yahoo_chart_points(symbol)
    points = merge_yahoo_quote_page_latest_point(symbol, points)
    if not points:
        return None

    baseline_kst = datetime.combine(baseline_date, KRX_SYNC_BASELINE_TIME, tzinfo=KST)
    latest_ts_utc, latest_close = points[-1]

    points_kst = [(ts_utc.astimezone(KST), ts_utc, close) for ts_utc, close in points]
    same_day_points = [row for row in points_kst if row[0].date() == baseline_date]

    baseline_point: tuple[datetime, float] | None = None
    if same_day_points:
        forward_points = [row for row in same_day_points if row[0] >= baseline_kst]
        if forward_points:
            ts_kst, ts_utc, close = forward_points[0]
            delay_hours = (ts_kst - baseline_kst).total_seconds() / 3600
            if delay_hours <= KRX_SYNC_MAX_FORWARD_HOURS:
                baseline_point = (ts_utc, close)

    if baseline_point is None:
        backward_points = [row for row in points_kst if row[0] <= baseline_kst]
        if backward_points:
            ts_kst, ts_utc, close = backward_points[-1]
            lookback_hours = (baseline_kst - ts_kst).total_seconds() / 3600
            if lookback_hours <= KRX_SYNC_MAX_LOOKBACK_HOURS:
                baseline_point = (ts_utc, close)

    if baseline_point is None:
        return None

    _, baseline_close = baseline_point
    if diff_mode:
        return latest_close - baseline_close
    if baseline_close == 0:
        return None
    ratio = latest_close / baseline_close
    if ratio <= 0:
        return None
    return float(np.log(ratio) * 100)


def market_snapshot_change_for_model(snapshot: dict | None, *, diff_mode: bool = False) -> float | None:
    if not isinstance(snapshot, dict):
        return None

    change_pct = to_float(snapshot.get("change_pct"))
    if change_pct is None:
        return None

    if diff_mode:
        value = to_float(snapshot.get("value"))
        if value is None:
            return None
        divisor = 1 + change_pct / 100
        if divisor == 0:
            return None
        previous_value = value / divisor
        return value - previous_value

    return simple_return_pct_to_log_return_pct(change_pct)


def resolve_ewy_fx_correction_params(model_payload: dict | None) -> dict[str, float]:
    if not isinstance(model_payload, dict):
        return {
            "intercept": 0.0,
            "ewy_coef": EWY_FX_CORE_EWY_WEIGHT,
            "krw_coef": EWY_FX_CORE_KRW_WEIGHT,
            "sample_size": 0.0,
            "r2": 0.0,
        }

    intercept = to_float(model_payload.get("ewyFxIntercept"))
    ewy_coef = to_float(model_payload.get("ewyFxEwyCoef"))
    krw_coef = to_float(model_payload.get("ewyFxKrwCoef"))
    sample_size = to_float(model_payload.get("ewyFxSampleSize"))
    fit_r2 = to_float(model_payload.get("ewyFxFitR2"))

    if intercept is None:
        intercept = 0.0
    if ewy_coef is None:
        ewy_coef = EWY_FX_CORE_EWY_WEIGHT
    if krw_coef is None:
        krw_coef = EWY_FX_CORE_KRW_WEIGHT

    return {
        "intercept": clamp(intercept, EWY_FX_CORRECTION_INTERCEPT_MIN, EWY_FX_CORRECTION_INTERCEPT_MAX),
        "ewy_coef": clamp(ewy_coef, EWY_FX_CORRECTION_EWY_COEF_MIN, EWY_FX_CORRECTION_EWY_COEF_MAX),
        "krw_coef": clamp(krw_coef, EWY_FX_CORRECTION_KRW_COEF_MIN, EWY_FX_CORRECTION_KRW_COEF_MAX),
        "sample_size": sample_size if sample_size is not None else 0.0,
        "r2": fit_r2 if fit_r2 is not None else 0.0,
    }


def resolve_residual_model_artifact(model_payload: dict | None) -> dict[str, object]:
    if not isinstance(model_payload, dict):
        return {}

    artifact = model_payload.get("residualModel")
    if not isinstance(artifact, dict):
        return {}

    coefficients = artifact.get("coefficients")
    means = artifact.get("means")
    stds = artifact.get("stds")
    broad_pca_components = artifact.get("broadPcaComponents")

    return {
        "intercept": to_float(artifact.get("intercept")) or 0.0,
        "coefficients": coefficients if isinstance(coefficients, dict) else {},
        "means": means if isinstance(means, dict) else {},
        "stds": stds if isinstance(stds, dict) else {},
        "broad_pca_components": broad_pca_components if isinstance(broad_pca_components, list) else [],
        "sox_ndx_beta": to_float(artifact.get("soxNdxBeta")) or 1.0,
        "basis_ewma": to_float(artifact.get("basisEwma")) or 0.0,
        "weight": to_float(artifact.get("weight")) or 0.0,
        "sample_size": to_float(artifact.get("sampleSize")) or 0.0,
        "mae": to_float(artifact.get("mae")) or 0.0,
    }


def resolve_k200_mapping_artifact(model_payload: dict | None) -> dict[str, float]:
    if not isinstance(model_payload, dict):
        return {"intercept": 0.0, "beta": 1.0, "sample_size": 0.0}

    artifact = model_payload.get("k200Mapping")
    if not isinstance(artifact, dict):
        return {"intercept": 0.0, "beta": 1.0, "sample_size": 0.0}

    return {
        "intercept": to_float(artifact.get("intercept")) or 0.0,
        "beta": to_float(artifact.get("beta")) or 1.0,
        "sample_size": to_float(artifact.get("sampleSize")) or 0.0,
    }


def compute_ewy_fx_core_change(
    returns: dict[str, float],
    correction_params: dict[str, float] | None = None,
) -> float | None:
    params = correction_params or {}
    intercept = float(params.get("intercept", 0.0))
    ewy_coef = float(params.get("ewy_coef", EWY_FX_CORE_EWY_WEIGHT))
    krw_coef = float(params.get("krw_coef", EWY_FX_CORE_KRW_WEIGHT))
    fit_r2 = float(params.get("r2", 0.0))
    sample_size = int(float(params.get("sample_size", 0.0)))

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
    if fit_r2 < EWY_FX_LOW_CONFIDENCE_R2 or sample_size < 40:
        blend = max(blend, EWY_FX_STRUCTURAL_BLEND_HIGH_MOVE)

    return learned_core * (1 - blend) + structural_sum * blend


def compute_ewy_fx_simple_log_return(returns: dict[str, float]) -> float | None:
    ewy_change = returns.get("ewy")
    krw_change = returns.get("krw")
    if ewy_change is None or krw_change is None:
        return None
    return float(ewy_change) + float(krw_change)


def compute_ewy_fx_simple_change_pct(returns: dict[str, float]) -> float | None:
    return log_return_pct_to_simple_return_pct(compute_ewy_fx_simple_log_return(returns))


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

    return clamp(adjustment, -REGIME_ADJUSTMENT_CAP_PCT, REGIME_ADJUSTMENT_CAP_PCT)


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
            return float(bridge_anchor_change) * 0.8 + float(core_anchor_change) * 0.2, "bridge"
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
    residual_cap = max(RESIDUAL_MODEL_CAP_MIN_PCT, min(RESIDUAL_MODEL_CAP_MAX_PCT, abs(base_anchor) * RESIDUAL_MODEL_CAP_SHARE))
    residual_adjust = clamp(raw_residual_change, -residual_cap, residual_cap)

    anchor_bias = 0.0
    if auxiliary_anchor_change is not None and anchor_change is not None:
        anchor_bias = clamp(
            (float(auxiliary_anchor_change) - float(anchor_change)) * ANCHOR_BIAS_BLEND,
            -ANCHOR_BIAS_CAP_PCT,
            ANCHOR_BIAS_CAP_PCT,
        )

    regime_adjustment = compute_regime_adjustment(anchor_change, returns)
    provisional = base_anchor + residual_adjust + anchor_bias + regime_adjustment
    if prediction_phase == "bridge":
        guard_band = max(BRIDGE_GUARD_BAND_MIN_PCT, abs(base_anchor) * BRIDGE_GUARD_BAND_SHARE)
    else:
        guard_band = max(SESSION_GUARD_BAND_MIN_PCT, abs(base_anchor) * SESSION_GUARD_BAND_SHARE)
    guarded = clamp(provisional, base_anchor - guard_band, base_anchor + guard_band)

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


def resolve_live_prediction_phase(now_utc: datetime, live_returns: dict[str, float]) -> str:
    now_et = now_utc.astimezone(US_ET)
    if now_et.weekday() >= 5:
        return "bridge"
    if now_et.time() < US_PREMARKET_OPEN_ET or now_et.time() >= US_SESSION_END_ET:
        return "bridge"
    return "session" if live_returns.get("ewy") is not None else "bridge"


def fetch_live_prediction_inputs(
    baseline_session_date: str | None,
    correction_params: dict[str, float] | None = None,
) -> tuple[dict[str, float], dict[str, float]]:
    ticker_map = {
        "ewy": "EWY",
        "krw": "KRW=X",
        "sp500": "^GSPC",
        "nasdaq": "^NDX",
        "dow": "^DJI",
        "sox": "^SOX",
        "vix": "^VIX",
        "gold": "GC=F",
        "wti": "CL=F",
        "us10y": "^TNX",
    }
    display_returns: dict[str, float] = {}
    model_returns: dict[str, float] = {}
    for key, ticker in ticker_map.items():
        snapshot = fetch_yahoo_market_display_snapshot(ticker)

        # Live model inputs are anchored to the KOSPI close sync point.
        # Yahoo's displayed pre/after-market change is versus the prior US close,
        # so use it only when the intraday KRX-baseline series is unavailable.
        display_value = fetch_yahoo_intraday_return_pct(ticker, baseline_session_date)
        if display_value is None:
            display_value = to_float(snapshot.get("change_pct")) if isinstance(snapshot, dict) else None
        if display_value is not None:
            display_returns[key] = display_value

        model_value = fetch_yahoo_intraday_model_change(
            ticker,
            baseline_session_date,
            diff_mode=(key == "us10y"),
        )
        if model_value is None:
            model_value = market_snapshot_change_for_model(snapshot, diff_mode=(key == "us10y"))
        if model_value is not None:
            model_returns[key] = model_value

    return display_returns, model_returns


def resolve_prediction_baseline_session_date(payload: dict, day_close_quote: dict | None) -> str | None:
    candidates: list[str] = []

    latest_record_date = payload.get("latestRecordDate")
    if isinstance(latest_record_date, str) and latest_record_date:
        candidates.append(latest_record_date)

    if isinstance(day_close_quote, dict):
        day_close_date = day_close_quote.get("session_date")
        if isinstance(day_close_date, str) and day_close_date:
            candidates.append(day_close_date)

    valid_dates: list[date] = []
    for candidate in candidates:
        try:
            valid_dates.append(date.fromisoformat(candidate))
        except ValueError:
            continue

    if not valid_dates:
        return None
    return max(valid_dates).isoformat()


def resolve_kospi_close_for_prediction_baseline(baseline_session_date: str | None) -> dict | None:
    if not baseline_session_date:
        return None
    try:
        target_date = date.fromisoformat(baseline_session_date)
    except ValueError:
        return None
    return fetch_kospi_actual_close_quote(target_date)


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


def previous_business_day(base: date) -> date:
    candidate = base
    while candidate.weekday() >= 5:
        candidate -= timedelta(days=1)
    return candidate


def latest_closed_day_futures_session_date(now_kst: datetime) -> str:
    today = now_kst.date()
    if now_kst.weekday() < 5 and now_kst.time() >= KOSPI_DAY_FUTURES_SESSION_CLOSE:
        target = today
    else:
        target = previous_business_day(today - timedelta(days=1))
    return target.isoformat()


def load_day_futures_close_cache() -> dict | None:
    payload = read_json(DAY_FUTURES_CLOSE_CACHE_FILE)
    if payload is None:
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


def is_final_day_futures_close_quote(quote: dict | None) -> bool:
    if not isinstance(quote, dict):
        return False

    session_date = quote.get("session_date")
    if not isinstance(session_date, str) or not session_date:
        return False

    provider = str(quote.get("provider") or "")
    selection = str(quote.get("selection") or "")
    if provider != "esignal-socket" and selection != "session-close-socket":
        return False

    updated_at = parse_iso_datetime_utc(quote.get("updated_at"))
    if updated_at is None:
        return False

    updated_kst = updated_at.astimezone(KST)
    return updated_kst.date().isoformat() == session_date and updated_kst.time() >= KOSPI_DAY_FUTURES_FINAL_CLOSE_TIME


def fetch_esignal_json(url: str, referer: str) -> dict | None:
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": ESIGNAL_USER_AGENT,
            "Referer": referer,
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
    except (ValueError, TypeError):
        return None

    return payload if isinstance(payload, dict) else None


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
    payload = fetch_esignal_json(ESIGNAL_KOSPI_DAY_CACHE_URL, ESIGNAL_KOSPI_DAY_PAGE_URL)
    if payload is None:
        return None

    ticks = payload.get("data", [])
    if not isinstance(ticks, list) or not ticks:
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
        existing = latest_by_date.get(date_key)
        if existing is None or ts_utc > existing[0]:
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
        if cached_session_date >= target_session_date and is_final_day_futures_close_quote(cached):
            return cached

    fetched = fetch_esignal_kospi_day_close_quote()
    if fetched:
        fetched_session_date = str(fetched.get("session_date", ""))
        if fetched_session_date and (is_final_day_futures_close_quote(fetched) or cached is None):
            save_day_futures_close_cache(fetched)
        if cached and fetched_session_date and str(cached.get("session_date", "")) > fetched_session_date:
            return cached
        return fetched

    return cached


def apply_day_futures_reference(quote: dict, day_close_quote: dict | None) -> dict:
    if not day_close_quote:
        return quote

    try:
        day_close = float(day_close_quote.get("close"))
    except (TypeError, ValueError):
        return quote

    if day_close == 0:
        return quote

    merged = dict(quote)
    merged["previous_close"] = day_close
    merged["day_close"] = day_close
    merged["day_close_updated_at"] = day_close_quote.get("updated_at")
    merged["day_close_date"] = day_close_quote.get("session_date")
    merged["reference_close"] = "day-futures-close"

    try:
        price = float(merged.get("price", day_close))
    except (TypeError, ValueError):
        price = day_close
    merged["change_pct"] = (price / day_close - 1) * 100
    return merged


def load_night_futures_source_cache() -> dict | None:
    payload = read_json(NIGHT_FUTURES_SOURCE_CACHE_FILE)
    if payload is None:
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


def normalize_night_quote_state(quote: dict, now_utc: datetime) -> dict:
    normalized = dict(quote)
    updated_at = parse_iso_datetime_utc(normalized.get("updated_at")) or now_utc
    age_minutes = max(0.0, (now_utc - updated_at).total_seconds() / 60)
    normalized["updated_at"] = updated_at.isoformat()
    normalized["age_minutes"] = round(age_minutes, 1)
    normalized["is_live_night"] = age_minutes <= NIGHT_FUTURES_STALE_MINUTES and is_night_operation_window(now_utc)
    return normalized


def fetch_esignal_kospi_night_quote(day_close_quote: dict | None = None) -> dict | None:
    now_utc = datetime.now(timezone.utc)
    cached_payload = load_night_futures_source_cache()
    if cached_payload:
        age_seconds = max(0.0, (now_utc - cached_payload["fetched_at"]).total_seconds())
        if age_seconds < NIGHT_FUTURES_SOURCE_MIN_REFRESH_SECONDS:
            cached_quote = normalize_night_quote_state(cached_payload["quote"], now_utc)
            return apply_day_futures_reference(cached_quote, day_close_quote)

    payload = fetch_esignal_json(ESIGNAL_KOSPI_NIGHT_CACHE_URL, ESIGNAL_KOSPI_NIGHT_PAGE_URL)
    if payload is None:
        if cached_payload:
            cached_quote = normalize_night_quote_state(cached_payload["quote"], now_utc)
            return apply_day_futures_reference(cached_quote, day_close_quote)
        return None

    ticks = payload.get("data", [])
    if not isinstance(ticks, list) or not ticks:
        if cached_payload:
            cached_quote = normalize_night_quote_state(cached_payload["quote"], now_utc)
            return apply_day_futures_reference(cached_quote, day_close_quote)
        return None

    try:
        latest_tick = ticks[-1]
        ts_ms = int(latest_tick[0])
        price = float(latest_tick[1])
        open_price = payload.get("open")
        if open_price is None:
            open_price = ticks[0][1]
        previous_close = float(open_price)
        if previous_close == 0:
            previous_close = price
    except (TypeError, ValueError, IndexError, KeyError):
        if cached_payload:
            cached_quote = normalize_night_quote_state(cached_payload["quote"], now_utc)
            return apply_day_futures_reference(cached_quote, day_close_quote)
        return None

    updated_at = datetime.fromtimestamp(ts_ms / 1000, tz=timezone.utc)
    quote = {
        "price": price,
        "previous_close": previous_close,
        "change_pct": ((price / previous_close - 1) * 100) if previous_close else 0.0,
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
    normalized = normalize_night_quote_state(quote, now_utc)
    return apply_day_futures_reference(normalized, day_close_quote)


def build_k200f_indicator(quote: dict | None, day_close_quote: dict | None) -> dict:
    day_close = None
    day_close_date = ""
    if quote is not None and quote.get("day_close") is not None:
        try:
            day_close = float(quote.get("day_close"))
            day_close_date = str(quote.get("day_close_date") or "")
        except (TypeError, ValueError):
            day_close = None
    if day_close is None and day_close_quote:
        try:
            day_close = float(day_close_quote.get("close"))
            day_close_date = str(day_close_quote.get("session_date") or "")
        except (TypeError, ValueError):
            day_close = None

    reference_label = "주간선물 종가" if day_close is not None else ""
    reference_value = f"{day_close:,.2f}" if day_close is not None else ""

    if quote and quote.get("is_live_night"):
        try:
            price = float(quote.get("price"))
            change_pct = float(quote.get("change_pct", 0.0))
        except (TypeError, ValueError):
            price = 0.0
            change_pct = 0.0

        updated_at = str(quote.get("updated_at") or "")
        return {
            "key": "k200f",
            "label": "KOSPI 200 야간선물",
            "value": f"{price:,.2f}",
            "changePct": round(change_pct, 2),
            "updatedAt": updated_at,
            "sourceUrl": "",
            "dataSource": "실시간 수집",
            "displayTag": "(야간)",
            "isPremarket": False,
            "referenceLabel": reference_label,
            "referenceValue": reference_value,
            "referenceDate": day_close_date,
        }

    return {
        "key": "k200f",
        "label": "KOSPI 200 야간선물",
        "value": "N/A",
        "changePct": 0,
        "updatedAt": "",
        "sourceUrl": "",
        "dataSource": "실시간 수집",
        "displayTag": "(장 시작전)",
        "isPremarket": False,
        "referenceLabel": reference_label,
        "referenceValue": reference_value,
        "referenceDate": day_close_date,
    }


def update_k200f_in_indicators(payload: dict, k200f_indicator: dict, now_utc: datetime) -> dict:
    primary = payload.get("primary")
    if not isinstance(primary, list):
        primary = []
    secondary = payload.get("secondary")
    if not isinstance(secondary, list):
        secondary = []

    replaced = False
    for row in primary:
        if isinstance(row, dict) and row.get("key") == "k200f":
            row.clear()
            row.update(k200f_indicator)
            replaced = True
            break

    if not replaced:
        for row in secondary:
            if isinstance(row, dict) and row.get("key") == "k200f":
                row.clear()
                row.update(k200f_indicator)
                replaced = True
                break

    if not replaced:
        secondary.append(k200f_indicator)

    payload["primary"] = primary
    payload["secondary"] = secondary
    payload["generatedAt"] = now_utc.isoformat()
    if "isUsPremarketNow" not in payload:
        payload["isUsPremarketNow"] = False
    return payload


def update_display_changes_from_market_quote(payload: dict, now_utc: datetime) -> dict:
    primary = payload.get("primary")
    if not isinstance(primary, list):
        primary = []
    secondary = payload.get("secondary")
    if not isinstance(secondary, list):
        secondary = []

    snapshots: dict[str, dict | None] = {}

    def get_snapshot(key: str) -> dict | None:
        ticker = DISPLAY_TICKER_BY_KEY.get(key)
        if not ticker:
            return None
        if key not in snapshots:
            snapshots[key] = fetch_yahoo_market_display_snapshot(ticker)
        return snapshots[key]

    live_cash_index_keys = ("sp500", "nasdaq", "dow", "sox")
    has_fresh_cash_index_quote = False
    for key in live_cash_index_keys:
        snapshot = get_snapshot(key)
        if not snapshot:
            continue
        updated_dt = parse_iso_datetime_utc(snapshot.get("updated_at"))
        if updated_dt is None:
            continue
        age_minutes = (now_utc - updated_dt).total_seconds() / 60
        if age_minutes <= PREMARKET_STALE_MINUTES:
            has_fresh_cash_index_quote = True
            break

    in_us_premarket_now = is_us_premarket_window(now_utc)
    if has_fresh_cash_index_quote:
        in_us_premarket_now = False

    def apply_rows(rows: list) -> None:
        for row in rows:
            if not isinstance(row, dict):
                continue
            key = str(row.get("key") or "")
            if key == "k200f":
                continue

            row["checkedAt"] = now_utc.isoformat()
            row["displayTag"] = "(장 시작전)" if in_us_premarket_now and key in PREMARKET_TRACK_KEYS else ""
            row["isPremarket"] = False

            snapshot = get_snapshot(key)
            if not snapshot:
                continue

            value = to_float(snapshot.get("value"))
            change_pct = to_float(snapshot.get("change_pct"))
            updated_at = snapshot.get("updated_at")
            if value is None or change_pct is None or not isinstance(updated_at, str):
                continue

            market_session = str(snapshot.get("market_session") or "")
            updated_dt = parse_iso_datetime_utc(updated_at)
            is_premarket_quote = (
                not has_fresh_cash_index_quote
                and updated_dt is not None
                and is_timestamp_in_us_premarket(updated_dt)
            )
            age_minutes = (
                (now_utc - updated_dt).total_seconds() / 60 if updated_dt is not None else float("inf")
            )
            premarket_untracked = (
                in_us_premarket_now
                and key in PREMARKET_TRACK_KEYS
                and (not is_premarket_quote or age_minutes > PREMARKET_STALE_MINUTES)
            )

            row["value"] = format_indicator_value(key, value)
            row["changePct"] = round(change_pct, 2)
            row["updatedAt"] = updated_at
            row["dataSource"] = "Yahoo Finance"
            row["marketSession"] = market_session
            if market_session == "overnight":
                row["displayTag"] = "(오버나이트)"
            elif market_session == "post":
                row["displayTag"] = "(장 마감후)"
            elif market_session == "pre" or premarket_untracked:
                row["displayTag"] = "(장 시작전)"
            else:
                row["displayTag"] = ""
            row["isPremarket"] = is_premarket_quote or market_session == "pre"

    apply_rows(primary)
    apply_rows(secondary)

    payload["primary"] = primary
    payload["secondary"] = secondary
    payload["generatedAt"] = now_utc.isoformat()
    payload["isUsPremarketNow"] = in_us_premarket_now
    return payload


def apply_prediction_pending_state(payload: dict, now_utc: datetime) -> dict:
    model_payload = payload.get("model")
    if not isinstance(model_payload, dict):
        model_payload = {}
        payload["model"] = model_payload

    payload["pointPrediction"] = None
    payload["nightFuturesSimplePoint"] = None
    payload["nightFuturesSimpleChangePct"] = None
    payload["ewyFxSimplePoint"] = None
    payload["ewyFxSimpleChangePct"] = None
    payload["nightFuturesClose"] = None
    payload["nightFuturesCloseUpdatedAt"] = None
    payload["rangeLow"] = None
    payload["rangeHigh"] = None
    payload["predictedChangePct"] = None
    payload["signalSummary"] = f"예측 운영 시간은 {PREDICTION_OPERATION_HOURS_LABEL}입니다. 다음 운영 구간부터 모델 예측이 갱신됩니다."
    payload["lastCalculatedAt"] = None
    payload["generatedAt"] = now_utc.isoformat()
    model_payload["isOperationWindow"] = False
    model_payload["operationHours"] = PREDICTION_OPERATION_HOURS_LABEL
    model_payload["predictionPhase"] = "standby"
    model_payload["liveRefreshUpdatedAt"] = now_utc.isoformat()
    return payload


def ensure_prediction_target_rollover(payload: dict, now_utc: datetime) -> dict:
    target_date = resolve_prediction_target_date(now_utc.astimezone(KST))
    target_iso = target_date.isoformat()
    current_iso = parse_prediction_target_date(payload.get("predictionDateIso") or payload.get("predictionDate"))

    if current_iso != target_iso:
        payload["predictionDateIso"] = target_iso
        payload["predictionDate"] = format_prediction_date_label(target_date)
        payload = apply_prediction_pending_state(payload, now_utc)

    return payload


def update_prediction_night_fields(
    payload: dict,
    quote: dict | None,
    day_close_quote: dict | None,
    now_utc: datetime,
) -> dict:
    payload = ensure_prediction_target_rollover(payload, now_utc)
    is_active_prediction_window = is_prediction_operation_window(now_utc)

    prev_close = to_float(payload.get("prevClose"))
    prediction_target_date_iso = parse_prediction_target_date(
        payload.get("predictionDateIso") or payload.get("predictionDate")
    )
    night_futures_change = resolve_night_futures_change_for_target(prediction_target_date_iso, quote, day_close_quote)

    model_payload = payload.get("model")
    if not isinstance(model_payload, dict):
        model_payload = {}
        payload["model"] = model_payload
    model_payload["isOperationWindow"] = is_active_prediction_window
    model_payload["operationHours"] = PREDICTION_OPERATION_HOURS_LABEL

    baseline_session_date = resolve_prediction_baseline_session_date(payload, day_close_quote)
    kospi_close_quote = (
        resolve_kospi_close_for_prediction_baseline(baseline_session_date)
        if is_active_prediction_window
        else None
    )
    if kospi_close_quote is not None:
        resolved_prev_close = to_float(kospi_close_quote.get("close"))
        resolved_close_date = kospi_close_quote.get("session_date")
        if resolved_prev_close is not None and resolved_prev_close != 0:
            prev_close = resolved_prev_close
            payload["prevClose"] = round(prev_close, 2)
            if isinstance(resolved_close_date, str) and resolved_close_date:
                payload["latestRecordDate"] = resolved_close_date
                payload["prevCloseDate"] = resolved_close_date
                baseline_session_date = resolved_close_date
                model_payload["krxBaselineDate"] = resolved_close_date
            model_payload["kospiCloseSource"] = kospi_close_quote.get("provider")
            model_payload["kospiCloseUpdatedAt"] = kospi_close_quote.get("updated_at")
            close_change_pct = to_float(kospi_close_quote.get("change_pct"))
            if close_change_pct is not None:
                model_payload["prevCloseChangePct"] = round(close_change_pct, 2)

    if (
        is_active_prediction_window
        and isinstance(quote, dict)
        and quote.get("is_live_night")
        and night_futures_change is not None
        and prev_close
        and prev_close != 0
    ):
        payload["nightFuturesSimpleChangePct"] = round(float(night_futures_change), 2)
        payload["nightFuturesSimplePoint"] = round(prev_close * (1 + float(night_futures_change) / 100), 2)
        night_futures_close = to_float(quote.get("price"))
        payload["nightFuturesClose"] = round(night_futures_close, 2) if night_futures_close is not None else None
        night_futures_updated_at = quote.get("updated_at")
        payload["nightFuturesCloseUpdatedAt"] = (
            night_futures_updated_at if isinstance(night_futures_updated_at, str) else None
        )
    else:
        payload["nightFuturesSimpleChangePct"] = None
        payload["nightFuturesSimplePoint"] = None
        payload["nightFuturesClose"] = None
        payload["nightFuturesCloseUpdatedAt"] = None

    if not is_active_prediction_window:
        if day_close_quote:
            try:
                payload["futuresDayClose"] = round(float(day_close_quote.get("close")), 2)
            except (TypeError, ValueError):
                pass
            session_date = day_close_quote.get("session_date")
            if isinstance(session_date, str) and session_date:
                payload["futuresDayCloseDate"] = session_date
        return apply_prediction_pending_state(payload, now_utc)

    payload["ewyFxSimpleChangePct"] = None
    payload["ewyFxSimplePoint"] = None

    if prev_close and prev_close != 0:
        correction_params = resolve_ewy_fx_correction_params(model_payload)
        residual_artifact = resolve_residual_model_artifact(model_payload)
        mapping_artifact = resolve_k200_mapping_artifact(model_payload)

        live_display_returns, live_model_returns = fetch_live_prediction_inputs(
            baseline_session_date, correction_params
        )
        ewy_fx_simple_return = compute_ewy_fx_simple_log_return(live_model_returns)
        if ewy_fx_simple_return is not None:
            ewy_fx_simple_change = log_return_pct_to_simple_return_pct(ewy_fx_simple_return)
            payload["ewyFxSimpleChangePct"] = (
                round(ewy_fx_simple_change, 2) if ewy_fx_simple_change is not None else None
            )
            payload["ewyFxSimplePoint"] = round(price_from_log_return(prev_close, ewy_fx_simple_return), 2)
        else:
            payload["ewyFxSimpleChangePct"] = None
            payload["ewyFxSimplePoint"] = None

        prediction_components = compute_model_prediction_components(
            live_model_returns,
            core_params=correction_params,
            residual_artifact=residual_artifact,
            mapping_artifact=mapping_artifact,
        )
        if prediction_components.get("ready"):
            refreshed_change = to_float(prediction_components.get("predicted_kospi_simple_pct"))
            if refreshed_change is None:
                refreshed_change = to_float(payload.get("predictedChangePct")) or 0.0

            previous_change = to_float(payload.get("predictedChangePct"))
            if previous_change is not None:
                refreshed_change = (
                    previous_change * LIVE_REFRESH_KEEP_PREV_WEIGHT
                    + refreshed_change * (1 - LIVE_REFRESH_KEEP_PREV_WEIGHT)
                )

            refreshed_return = simple_return_pct_to_log_return_pct(refreshed_change)
            if refreshed_return is None:
                refreshed_return = to_float(prediction_components.get("predicted_kospi_return")) or 0.0

            point_prediction = price_from_log_return(prev_close, refreshed_return)
            range_low = to_float(payload.get("rangeLow"))
            range_high = to_float(payload.get("rangeHigh"))
            if range_low is not None and range_high is not None and range_high >= range_low:
                half_band = max(1.0, (range_high - range_low) / 2)
            else:
                mae = to_float(payload.get("mae30d")) or 18.0
                half_band = max(12.0, mae)

            payload["pointPrediction"] = round(point_prediction, 2)
            payload["predictedChangePct"] = round(refreshed_change, 2)
            payload["rangeLow"] = round(point_prediction - half_band, 2)
            payload["rangeHigh"] = round(point_prediction + half_band, 2)
            payload["lastCalculatedAt"] = now_utc.isoformat()

            model_payload["engine"] = "EWY Synthetic K200 Ridge"
            model_payload["calculationMode"] = "EWYCoreSyntheticK200+ResidualRidge+KOSPIMapping(NoNightFuturesLiveRefresh)"
            model_payload["nightFuturesExcluded"] = True
            model_payload["nightFuturesAnchorPct"] = None
            model_payload["auxiliaryAnchorPct"] = None
            model_payload["bridgeAnchorPct"] = None
            core_anchor = to_float(prediction_components.get("core_kospi_return"))
            if core_anchor is not None:
                model_payload["coreAnchorPct"] = round(log_return_pct_to_simple_return_pct(core_anchor) or 0.0, 2)
            raw_model_pct = to_float(prediction_components.get("predicted_kospi_simple_pct_pre_guard"))
            if raw_model_pct is not None:
                model_payload["rawModelPct"] = round(raw_model_pct, 2)
            model_payload.pop("mappingDirectionGuardApplied", None)
            model_payload.pop("mappingDirectionGuardPct", None)
            mapping_intercept = to_float(prediction_components.get("mapping_intercept_return"))
            if mapping_intercept is not None:
                model_payload["mappingInterceptPct"] = round(
                    log_return_pct_to_simple_return_pct(mapping_intercept) or 0.0,
                    2,
                )
            mapping_beta_return = to_float(prediction_components.get("mapping_beta_return"))
            if mapping_beta_return is not None:
                model_payload["mappingBetaContributionPct"] = round(
                    log_return_pct_to_simple_return_pct(mapping_beta_return) or 0.0,
                    2,
                )
            model_payload["mappingDirectionFlip"] = bool(prediction_components.get("mapping_direction_flip"))
            residual_adj = to_float(prediction_components.get("residual_adj_k200_return"))
            if residual_adj is not None:
                model_payload["mlResidualAdjPct"] = round(log_return_pct_to_simple_return_pct(residual_adj) or 0.0, 2)
                mapping_beta = to_float(mapping_artifact.get("beta")) or 1.0
                model_payload["rawResidualPct"] = round(
                    log_return_pct_to_simple_return_pct(residual_adj * mapping_beta) or 0.0,
                    2,
                )
            residual_cap = to_float(prediction_components.get("residual_cap_k200_return"))
            if residual_cap is not None:
                model_payload["liveRefreshGuardBandPct"] = round(
                    log_return_pct_to_simple_return_pct(residual_cap) or 0.0,
                    2,
                )
            model_payload["auxResidualAdjPct"] = None
            model_payload["regimeAdjustmentPct"] = None
            model_payload["predictionPhase"] = "session"
            model_payload["anchorSource"] = "ewy_synthetic_k200"
            model_payload["regimeState"] = None
            live_ewy_change = live_display_returns.get("ewy")
            if live_ewy_change is not None:
                model_payload["liveEwyChangePct"] = round(live_ewy_change, 2)
            live_krw_change = live_display_returns.get("krw")
            if live_krw_change is not None:
                model_payload["liveKrwChangePct"] = round(float(live_krw_change), 2)
            model_payload["ewyFxIntercept"] = round(float(correction_params["intercept"]), 4)
            model_payload["ewyFxEwyCoef"] = round(float(correction_params["ewy_coef"]), 4)
            model_payload["ewyFxKrwCoef"] = round(float(correction_params["krw_coef"]), 4)
            model_payload["ewyFxSampleSize"] = int(float(correction_params.get("sample_size", 0.0)))
            model_payload["ewyFxFitR2"] = round(float(correction_params.get("r2", 0.0)), 4)
            if baseline_session_date:
                model_payload["krxBaselineDate"] = baseline_session_date
            model_payload["liveRefreshUpdatedAt"] = now_utc.isoformat()

    if day_close_quote:
        try:
            payload["futuresDayClose"] = round(float(day_close_quote.get("close")), 2)
        except (TypeError, ValueError):
            pass
        session_date = day_close_quote.get("session_date")
        if isinstance(session_date, str) and session_date:
            payload["futuresDayCloseDate"] = session_date

    payload["generatedAt"] = now_utc.isoformat()
    return payload


def main() -> None:
    now_utc = datetime.now(timezone.utc)
    indicators_payload = read_json(INDICATORS_FILE) or {"primary": [], "secondary": []}
    prediction_payload = read_json(PREDICTION_FILE) or {}
    history_payload = read_json(HISTORY_FILE) or {"summary": {}, "records": []}
    live_prediction_series_payload = load_live_prediction_series()
    prediction_archive = load_prediction_archive()

    if prediction_payload and should_archive_prediction_snapshot(prediction_payload, now_utc):
        prediction_archive = merge_prediction_into_archive(prediction_archive, prediction_payload)
        write_prediction_archive_json(prediction_archive, now_utc)

    day_close_quote = resolve_day_futures_close_quote()
    night_quote = fetch_esignal_kospi_night_quote(day_close_quote)

    indicators_payload = update_display_changes_from_market_quote(indicators_payload, now_utc)
    k200f_indicator = build_k200f_indicator(night_quote, day_close_quote)
    indicators_payload = update_k200f_in_indicators(indicators_payload, k200f_indicator, now_utc)
    write_output_json("indicators.json", indicators_payload)

    if prediction_payload:
        history_payload = update_history_with_actual_open(
            history_payload,
            prediction_archive,
            now_utc,
            live_prediction_series_payload,
            prediction_payload,
            day_close_quote,
            night_quote,
        )
        write_output_json("history.json", history_payload)

        prediction_payload = update_prediction_night_fields(prediction_payload, night_quote, day_close_quote, now_utc)
        write_output_json("prediction.json", prediction_payload)
        if should_archive_prediction_snapshot(prediction_payload, now_utc):
            prediction_archive = merge_prediction_into_archive(prediction_archive, prediction_payload)
            write_prediction_archive_json(prediction_archive, now_utc)
        next_live_prediction_series_payload = update_live_prediction_series(prediction_payload, now_utc)
        write_output_json("live_prediction_series.json", next_live_prediction_series_payload)

    status = "live" if night_quote and night_quote.get("is_live_night") else "standby"
    updated_at = night_quote.get("updated_at") if night_quote else "-"
    print(f"Night futures refresh complete: status={status}, updated_at={updated_at}")


if __name__ == "__main__":
    main()

