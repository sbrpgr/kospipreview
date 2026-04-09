from __future__ import annotations

import json
import urllib.error
import urllib.parse
import urllib.request
from datetime import date, datetime, time, timedelta, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "frontend" / "public" / "data"
OUT_DATA_DIR = ROOT / "frontend" / "out" / "data"
INDICATORS_FILE = DATA_DIR / "indicators.json"
PREDICTION_FILE = DATA_DIR / "prediction.json"
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
ESIGNAL_DAY_SYMBOL = "A0166"
ESIGNAL_REQUEST_TIMEOUT = 10
ESIGNAL_USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36"
)

KOSPI_DAY_FUTURES_SESSION_OPEN = time(8, 45)
KOSPI_DAY_FUTURES_SESSION_CLOSE = time(15, 45)
NIGHT_OPERATION_START = time(18, 0)
NIGHT_OPERATION_END = time(6, 30)
NIGHT_FUTURES_STALE_MINUTES = 180
NIGHT_FUTURES_SOURCE_MIN_REFRESH_SECONDS = 30

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
    "sp500": 0.55,
    "nasdaq": 0.45,
}
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
YAHOO_CHART_URL_TEMPLATE = (
    "https://query1.finance.yahoo.com/v8/finance/chart/{symbol}"
    "?interval=1m&range=2d&includePrePost=true"
)
KRX_SYNC_BASELINE_TIME = time(15, 30)
KRX_SYNC_MAX_LOOKBACK_HOURS = 36
KRX_SYNC_MAX_FORWARD_HOURS = 12


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


def clamp(value: float, minimum: float, maximum: float) -> float:
    return max(minimum, min(maximum, value))


def to_float(value: object) -> float | None:
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def fetch_yahoo_chart_points(symbol: str) -> list[tuple[datetime, float]]:
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


def fetch_yahoo_market_display_snapshot(symbol: str) -> dict | None:
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

    if latest_ts_utc is None or latest_value is None:
        return None

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

    return {
        "value": latest_value,
        "change_pct": (latest_value / previous_close - 1) * 100,
        "updated_at": latest_ts_utc.isoformat(),
    }


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


def fetch_live_auxiliary_anchor_change(
    baseline_session_date: str | None,
    correction_params: dict[str, float] | None = None,
) -> tuple[float | None, float | None, float | None, dict[str, float]]:
    ticker_map = {
        "ewy": "EWY",
        "krw": "KRW=X",
        "sp500": "^GSPC",
        "nasdaq": "^NDX",
    }
    returns: dict[str, float] = {}
    for key, ticker in ticker_map.items():
        value = fetch_yahoo_intraday_return_pct(ticker, baseline_session_date)
        if value is not None:
            returns[key] = value

    core_change = compute_ewy_fx_core_change(returns, correction_params)
    ewy_change = returns.get("ewy")
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
        anchor = aux_change
    elif aux_change is None:
        anchor = core_change
    else:
        anchor = core_change * (1 - AUXILIARY_SIGNAL_BLEND) + aux_change * AUXILIARY_SIGNAL_BLEND

    return anchor, core_change, ewy_change, returns


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
        cached_is_socket_close = (
            str(cached.get("provider", "")) == "esignal-socket"
            or str(cached.get("selection", "")) == "session-close-socket"
        )
        if cached_session_date >= target_session_date and cached_is_socket_close:
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

    def apply_rows(rows: list) -> None:
        for row in rows:
            if not isinstance(row, dict):
                continue
            key = str(row.get("key") or "")
            if key == "k200f":
                continue

            ticker = DISPLAY_TICKER_BY_KEY.get(key)
            if not ticker:
                continue

            if key not in snapshots:
                snapshots[key] = fetch_yahoo_market_display_snapshot(ticker)
            snapshot = snapshots[key]
            if not snapshot:
                continue

            value = to_float(snapshot.get("value"))
            change_pct = to_float(snapshot.get("change_pct"))
            updated_at = snapshot.get("updated_at")
            if value is None or change_pct is None or not isinstance(updated_at, str):
                continue

            row["value"] = format_indicator_value(key, value)
            row["changePct"] = round(change_pct, 2)
            row["updatedAt"] = updated_at
            row["dataSource"] = "Yahoo Finance"

    apply_rows(primary)
    apply_rows(secondary)

    payload["primary"] = primary
    payload["secondary"] = secondary
    payload["generatedAt"] = now_utc.isoformat()
    return payload


def update_prediction_night_fields(
    payload: dict,
    quote: dict | None,
    day_close_quote: dict | None,
    now_utc: datetime,
) -> dict:
    prev_close = to_float(payload.get("prevClose"))

    if quote and quote.get("is_live_night") and prev_close and prev_close != 0:
        change_pct = float(quote.get("change_pct", 0.0))
        payload["nightFuturesSimpleChangePct"] = round(change_pct, 2)
        payload["nightFuturesSimplePoint"] = round(prev_close * (1 + change_pct / 100), 2)
    else:
        payload["nightFuturesSimpleChangePct"] = None
        payload["nightFuturesSimplePoint"] = None

    if prev_close and prev_close != 0:
        model_payload = payload.get("model")
        if not isinstance(model_payload, dict):
            model_payload = {}
            payload["model"] = model_payload
        correction_params = resolve_ewy_fx_correction_params(model_payload)

        raw_ml_change = to_float(model_payload.get("rawModelPct"))
        if raw_ml_change is None:
            raw_ml_change = to_float(payload.get("predictedChangePct"))

        core_anchor_change = to_float(model_payload.get("coreAnchorPct"))
        auxiliary_anchor_change = to_float(model_payload.get("auxiliaryAnchorPct"))
        if auxiliary_anchor_change is None:
            auxiliary_anchor_change = core_anchor_change

        baseline_session_date: str | None = None
        latest_record_date = payload.get("latestRecordDate")
        if isinstance(latest_record_date, str) and latest_record_date:
            baseline_session_date = latest_record_date
        elif day_close_quote:
            day_close_date = day_close_quote.get("session_date")
            if isinstance(day_close_date, str) and day_close_date:
                baseline_session_date = day_close_date

        live_aux_anchor, live_core_anchor, live_ewy_change, live_returns = fetch_live_auxiliary_anchor_change(
            baseline_session_date, correction_params
        )
        if live_aux_anchor is not None:
            auxiliary_anchor_change = live_aux_anchor
        if live_core_anchor is not None:
            core_anchor_change = live_core_anchor

        if raw_ml_change is None and auxiliary_anchor_change is None:
            raw_ml_change = 0.0
        elif raw_ml_change is None:
            raw_ml_change = auxiliary_anchor_change

        base_anchor = auxiliary_anchor_change if auxiliary_anchor_change is not None else float(raw_ml_change)
        ml_adjust = (float(raw_ml_change) - base_anchor) * FALLBACK_ML_BLEND
        aux_adjust = 0.0
        if auxiliary_anchor_change is not None:
            aux_adjust = (auxiliary_anchor_change - base_anchor) * FALLBACK_AUX_BLEND

        provisional = base_anchor + ml_adjust + aux_adjust
        guard_band = max(FALLBACK_GUARD_BAND_MIN_PCT, abs(base_anchor) * FALLBACK_GUARD_BAND_SHARE)
        refreshed_change = clamp(provisional, base_anchor - guard_band, base_anchor + guard_band)
        refreshed_change = apply_ewy_alignment_guard(refreshed_change, core_anchor_change)

        previous_change = to_float(payload.get("predictedChangePct"))
        if previous_change is not None:
            refreshed_change = (
                previous_change * LIVE_REFRESH_KEEP_PREV_WEIGHT
                + refreshed_change * (1 - LIVE_REFRESH_KEEP_PREV_WEIGHT)
            )

        point_prediction = prev_close * (1 + refreshed_change / 100)
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

        model_payload["calculationMode"] = "EWYCore+AuxSignals+NoNightFutures(KRXCloseSyncLiveRefresh)"
        model_payload["nightFuturesExcluded"] = True
        model_payload["nightFuturesAnchorPct"] = None
        if auxiliary_anchor_change is not None:
            model_payload["auxiliaryAnchorPct"] = round(auxiliary_anchor_change, 2)
        if core_anchor_change is not None:
            model_payload["coreAnchorPct"] = round(core_anchor_change, 2)
        model_payload["mlResidualAdjPct"] = round(ml_adjust, 2)
        model_payload["auxResidualAdjPct"] = round(aux_adjust, 2)
        model_payload["liveRefreshGuardBandPct"] = round(guard_band, 2)
        if live_ewy_change is not None:
            model_payload["liveEwyChangePct"] = round(live_ewy_change, 2)
        live_krw_change = live_returns.get("krw")
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

    day_close_quote = resolve_day_futures_close_quote()
    night_quote = fetch_esignal_kospi_night_quote(day_close_quote)

    indicators_payload = update_display_changes_from_market_quote(indicators_payload, now_utc)
    k200f_indicator = build_k200f_indicator(night_quote, day_close_quote)
    indicators_payload = update_k200f_in_indicators(indicators_payload, k200f_indicator, now_utc)
    write_output_json("indicators.json", indicators_payload)

    if prediction_payload:
        prediction_payload = update_prediction_night_fields(prediction_payload, night_quote, day_close_quote, now_utc)
        write_output_json("prediction.json", prediction_payload)

    status = "live" if night_quote and night_quote.get("is_live_night") else "standby"
    updated_at = night_quote.get("updated_at") if night_quote else "-"
    print(f"Night futures refresh complete: status={status}, updated_at={updated_at}")


if __name__ == "__main__":
    main()

