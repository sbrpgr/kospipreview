from __future__ import annotations

import json
import urllib.error
import urllib.request
from datetime import date, datetime, time, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "frontend" / "public" / "data"
OUT_DATA_DIR = ROOT / "frontend" / "out" / "data"
INDICATORS_FILE = DATA_DIR / "indicators.json"
PREDICTION_FILE = DATA_DIR / "prediction.json"
DAY_FUTURES_CLOSE_CACHE_FILE = DATA_DIR / "day_futures_close_cache.json"
NIGHT_FUTURES_SOURCE_CACHE_FILE = DATA_DIR / "night_futures_source_cache.json"

KST = timezone(timedelta(hours=9))

ESIGNAL_KOSPI_NIGHT_PAGE_URL = "https://esignal.co.kr/kospi200-futures-night/"
ESIGNAL_KOSPI_NIGHT_CACHE_URL = "https://esignal.co.kr/data/cache/kospif_ngt.js"
ESIGNAL_KOSPI_DAY_PAGE_URL = "https://esignal.co.kr/kospi200-futures/"
ESIGNAL_KOSPI_DAY_CACHE_URL = "https://esignal.co.kr/data/cache/kospif_day.js"
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


def fetch_esignal_kospi_day_close_quote() -> dict | None:
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


def resolve_day_futures_close_quote() -> dict | None:
    now_kst = datetime.now(timezone.utc).astimezone(KST)
    target_session_date = latest_closed_day_futures_session_date(now_kst)
    cached = load_day_futures_close_cache()

    if cached and str(cached.get("session_date", "")) >= target_session_date:
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


def update_prediction_night_fields(
    payload: dict,
    quote: dict | None,
    day_close_quote: dict | None,
    now_utc: datetime,
) -> dict:
    prev_close = None
    try:
        prev_close = float(payload.get("prevClose"))
    except (TypeError, ValueError):
        prev_close = None

    if quote and quote.get("is_live_night") and prev_close and prev_close != 0:
        change_pct = float(quote.get("change_pct", 0.0))
        payload["nightFuturesSimpleChangePct"] = round(change_pct, 2)
        payload["nightFuturesSimplePoint"] = round(prev_close * (1 + change_pct / 100), 2)
    else:
        payload["nightFuturesSimpleChangePct"] = None
        payload["nightFuturesSimplePoint"] = None

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

