"""Refresh independent Model 2 prediction.

Model 2 is intentionally independent from the night-futures model and from the
primary prediction model. It uses EWY, USD/KRW, and the existing composite
market-factor artifacts.

Operational rule:
- Normal runs never use night futures or another model's prediction.
- A legacy/broken output may be bootstrapped once with nightFuturesSimplePoint
  only to set the initial clock/baseline while KRX is closed.
- After a valid Model 2 payload exists, the stored baseline is reused until a
  new KRX close is available; then the baseline resets to the KOSPI close.
"""

from __future__ import annotations

import json
import math
import sys
import urllib.parse
from urllib.error import URLError
from urllib.request import Request, urlopen
from datetime import date, datetime, time, timedelta, timezone
from pathlib import Path
from typing import Any

import yfinance as yf


OUTPUT_DIR = Path("frontend/public/data")
DIAGNOSTICS_PATH = OUTPUT_DIR / "backtest_diagnostics.json"
DIAGNOSTICS_PUBLIC_URL = "https://kospipreview.com/api/live/backtest_diagnostics.json"
PRIMARY_PREDICTION_PATH = OUTPUT_DIR / "prediction.json"
PRIMARY_PREDICTION_PUBLIC_URL = "https://kospipreview.com/api/live/prediction.json"
YAHOO_CHART_URL_TEMPLATE = (
    "https://query1.finance.yahoo.com/v8/finance/chart/{symbol}"
    "?interval=1m&range=2d&includePrePost=true"
)
YAHOO_USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36"
)
HOLIDAY_PREDICTION_PATH = OUTPUT_DIR / "holiday_prediction.json"
HOLIDAY_SERIES_PATH = OUTPUT_DIR / "holiday_prediction_series.json"
HOLIDAY_HISTORY_PATH = OUTPUT_DIR / "holiday_history.json"

MODEL2_MODE = "model2_no_night_futures_composite"
MODEL2_ENGINE = "EWYFXHybridCompositeNoNightFutures"
MODEL2_VERSION = "model2-independent-ewyfx-hybrid-composite-v4"
BOOTSTRAP_SOURCE = "one_time_night_futures_simple_point"
KOSPI_CLOSE_SOURCE = "kospi_close"

BAND_MAE_MULTIPLIER = 1.5
SERIES_MAX_ROWS = 1080
HISTORY_MAX_ROWS = 60
US_ACTIVE_START_UTC = 9 * 60
US_ACTIVE_END_UTC = 22 * 60
KRX_OPEN_TIME = time(9, 0)
KRX_SYNC_BASELINE_TIME = time(15, 30)
KRX_SYNC_MAX_LOOKBACK_HOURS = 36
KRX_SYNC_MAX_FORWARD_HOURS = 12

MODEL2_SYMBOLS = {
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

REQUIRED_BASELINE_KEYS = ("ewy", "krw")
COMPOSITE_KEYS = ("sp500", "nasdaq", "dow", "sox", "vix", "gold", "wti", "us10y")
RESIDUAL_FEATURE_KEYS = (
    "broad_factor",
    "tech_factor",
    "semi_factor",
    "wti_z",
    "gold_z",
    "us10y_z",
)
COMPOSITE_ADJUSTMENT_CAP_PCT = 0.10
RESIDUAL_FEATURE_CLAMP = 6.0
DIRECT_AXIS_BLEND_WEIGHT = 0.55


def _load_json(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {}
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        return data if isinstance(data, dict) else {}
    except Exception:
        return {}


def _fetch_json(url: str, *, timeout: float = 4.0) -> dict[str, Any]:
    try:
        with urlopen(url, timeout=timeout) as response:
            data = json.loads(response.read().decode("utf-8"))
            return data if isinstance(data, dict) else {}
    except (OSError, TimeoutError, URLError, json.JSONDecodeError) as exc:
        print(f"warning: failed to fetch {url}: {exc}", file=sys.stderr)
        return {}


def _fetch_yahoo_json(url: str, *, timeout: float = 10.0) -> dict[str, Any]:
    request = Request(
        url,
        headers={
            "User-Agent": YAHOO_USER_AGENT,
            "Accept": "application/json,text/javascript,*/*;q=0.1",
            "Cache-Control": "no-cache",
        },
        method="GET",
    )
    try:
        with urlopen(request, timeout=timeout) as response:
            data = json.loads(response.read().decode("utf-8"))
            return data if isinstance(data, dict) else {}
    except (OSError, TimeoutError, URLError, json.JSONDecodeError):
        return {}


def _write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def _to_float(value: Any) -> float | None:
    if value is None:
        return None
    if hasattr(value, "iloc"):
        try:
            if len(value) == 1:
                value = value.iloc[0]
        except TypeError:
            pass
    try:
        parsed = float(value)
    except (TypeError, ValueError):
        return None
    if not math.isfinite(parsed):
        return None
    return parsed


def _positive_float(value: Any) -> float | None:
    parsed = _to_float(value)
    if parsed is None or parsed <= 0:
        return None
    return parsed


def _parse_iso_date(value: Any) -> date | None:
    if not isinstance(value, str):
        return None
    try:
        return date.fromisoformat(value)
    except ValueError:
        return None


def _clamp(value: float, lower: float, upper: float) -> float:
    return max(lower, min(upper, value))


def _round_or_none(value: Any, digits: int = 4) -> float | None:
    parsed = _to_float(value)
    if parsed is None:
        return None
    return round(parsed, digits)


def _camel_or_snake(mapping: dict[str, Any], camel_key: str, snake_key: str, default: Any = None) -> Any:
    if camel_key in mapping:
        return mapping.get(camel_key)
    if snake_key in mapping:
        return mapping.get(snake_key)
    return default


def _normalize_price_map(prices: Any) -> dict[str, float]:
    if not isinstance(prices, dict):
        return {}
    normalized: dict[str, float] = {}
    for key in MODEL2_SYMBOLS:
        price = _positive_float(prices.get(key))
        if price is not None:
            normalized[key] = price
    return normalized


def _has_required_prices(prices: dict[str, float]) -> bool:
    return all(_positive_float(prices.get(key)) is not None for key in REQUIRED_BASELINE_KEYS)


def format_date_label(value: date | str) -> str:
    if isinstance(value, str):
        try:
            parsed = date.fromisoformat(value)
        except ValueError:
            return value
    else:
        parsed = value
    return f"{parsed.year}-{parsed.month:02d}-{parsed.day:02d}"


def next_weekday(value: date) -> date:
    candidate = value + timedelta(days=1)
    while candidate.weekday() >= 5:
        candidate += timedelta(days=1)
    return candidate


def is_krx_holiday(now_kst: datetime) -> bool:
    """Best-effort KRX session check. Weekends and no daily candle mean closed."""

    if now_kst.weekday() >= 5:
        return True

    try:
        start = now_kst.date().isoformat()
        end = (now_kst.date() + timedelta(days=1)).isoformat()
        candles = yf.download(
            "^KS11",
            start=start,
            end=end,
            interval="1m",
            progress=False,
            auto_adjust=False,
        )
        return candles.empty
    except Exception as exc:
        print(f"warning: failed to check KRX holiday status: {exc}", file=sys.stderr)
        return False


def is_us_market_active(now_utc: datetime) -> bool:
    if now_utc.weekday() >= 5:
        return False
    minutes = now_utc.hour * 60 + now_utc.minute
    return US_ACTIVE_START_UTC <= minutes <= US_ACTIVE_END_UTC


def get_last_krx_session() -> dict[str, Any] | None:
    try:
        history = yf.download("^KS11", period="10d", interval="1d", progress=False, auto_adjust=False)
    except Exception as exc:
        print(f"error: failed to fetch KOSPI close: {exc}", file=sys.stderr)
        return None

    if history.empty or "Close" not in history:
        return None

    closes = history["Close"].dropna()
    if closes.empty:
        return None

    last_idx = closes.index[-1]
    last_close = _positive_float(closes.iloc[-1])
    if last_close is None:
        return None

    return {"date": last_idx.date().isoformat(), "close": last_close}


def get_primary_kospi_session_snapshot(primary_snapshot: dict[str, Any]) -> dict[str, Any] | None:
    """Extract only shared KOSPI close fields from prediction.json.

    This deliberately ignores model predictions and night-futures fields.
    """

    session_date = primary_snapshot.get("prevCloseDate") or primary_snapshot.get("latestRecordDate")
    if not isinstance(session_date, str):
        return None

    try:
        date.fromisoformat(session_date)
    except ValueError:
        return None

    session_close = _positive_float(primary_snapshot.get("prevClose"))
    if session_close is None:
        return None

    return {
        "date": session_date,
        "close": session_close,
        "source": "primary_kospi_close_snapshot",
    }


def load_primary_prediction_snapshot(now_kst: datetime) -> dict[str, Any]:
    local_snapshot = _load_json(PRIMARY_PREDICTION_PATH)
    local_session = get_primary_kospi_session_snapshot(local_snapshot)
    local_date = _parse_iso_date(local_session.get("date")) if local_session else None

    should_fetch_public = local_session is None
    if local_date is not None and local_date <= now_kst.date() - timedelta(days=2):
        should_fetch_public = True

    if not should_fetch_public:
        return local_snapshot

    public_snapshot = _fetch_json(PRIMARY_PREDICTION_PUBLIC_URL)
    public_session = get_primary_kospi_session_snapshot(public_snapshot)
    if public_session is None:
        return local_snapshot

    public_date = _parse_iso_date(public_session.get("date"))
    if local_date is None or (public_date is not None and public_date >= local_date):
        return public_snapshot
    return local_snapshot


def is_valid_diagnostics(diagnostics: dict[str, Any]) -> bool:
    if not isinstance(diagnostics, dict):
        return False
    residual = diagnostics.get("residualModel")
    mapping = diagnostics.get("k200Mapping")
    if not isinstance(residual, dict) or not isinstance(mapping, dict):
        return False
    coefficients = residual.get("coefficients")
    return isinstance(coefficients, dict) and any(_to_float(coefficients.get(key)) is not None for key in RESIDUAL_FEATURE_KEYS)


def load_diagnostics_artifact() -> dict[str, Any]:
    local_diagnostics = _load_json(DIAGNOSTICS_PATH)
    if is_valid_diagnostics(local_diagnostics):
        return local_diagnostics

    public_diagnostics = _fetch_json(DIAGNOSTICS_PUBLIC_URL)
    if is_valid_diagnostics(public_diagnostics):
        return public_diagnostics

    return {}


def resolve_last_krx_session(primary_snapshot: dict[str, Any]) -> dict[str, Any] | None:
    primary_session = get_primary_kospi_session_snapshot(primary_snapshot)
    yahoo_session = get_last_krx_session()

    if primary_session is None:
        return yahoo_session
    if yahoo_session is None:
        return primary_session

    try:
        primary_date = date.fromisoformat(str(primary_session["date"]))
        yahoo_date = date.fromisoformat(str(yahoo_session["date"]))
    except ValueError:
        return primary_session

    if primary_date >= yahoo_date:
        return primary_session

    yahoo_session["source"] = "yahoo_ks11"
    return yahoo_session


def guard_last_session_with_existing_model2(
    last_session: dict[str, Any],
    existing_payload: dict[str, Any],
) -> dict[str, Any]:
    """Prevent stale Yahoo KOSPI data from rolling Model 2 backward."""

    if existing_payload.get("calculationMode") != MODEL2_MODE:
        return last_session

    session_date = _parse_iso_date(last_session.get("date"))
    existing_date_raw = existing_payload.get("prevCloseDate") or existing_payload.get("baselineDate")
    existing_date = _parse_iso_date(existing_date_raw)
    existing_close = _positive_float(existing_payload.get("prevClose"))

    if session_date is None or existing_date is None or existing_close is None:
        return last_session

    source = str(last_session.get("source") or "")
    existing_source = str(existing_payload.get("prevCloseSource") or "")
    should_keep_existing = existing_date > session_date or (
        existing_date == session_date
        and source == "yahoo_ks11"
        and existing_source
        and existing_source != "yahoo_ks11"
    )
    if not should_keep_existing:
        return last_session

    return {
        "date": existing_date.isoformat(),
        "close": existing_close,
        "source": "existing_model2_prev_close_guard",
    }


def _get_prev_session_close(ticker_symbol: str, krx_date_iso: str) -> float | None:
    try:
        krx_date = date.fromisoformat(krx_date_iso)
    except ValueError:
        return None

    start = (krx_date - timedelta(days=10)).isoformat()
    end = (krx_date + timedelta(days=1)).isoformat()
    try:
        history = yf.download(
            ticker_symbol,
            start=start,
            end=end,
            interval="1d",
            progress=False,
            auto_adjust=False,
        )
    except Exception:
        return None

    if history.empty or "Close" not in history:
        return None

    closes = history["Close"].dropna()
    if closes.empty:
        return None

    eligible = closes[closes.index.date <= krx_date]
    if eligible.empty:
        eligible = closes
    return _positive_float(eligible.iloc[-1])


def fetch_yahoo_chart_points(ticker_symbol: str) -> list[tuple[datetime, float]]:
    encoded_symbol = urllib.parse.quote(ticker_symbol, safe="")
    payload = _fetch_yahoo_json(YAHOO_CHART_URL_TEMPLATE.format(symbol=encoded_symbol))
    chart = payload.get("chart") if isinstance(payload, dict) else None
    if not isinstance(chart, dict):
        return []

    results = chart.get("result")
    if not isinstance(results, list) or not results or not isinstance(results[0], dict):
        return []

    first = results[0]
    timestamps = first.get("timestamp")
    indicators = first.get("indicators")
    if not isinstance(timestamps, list) or not isinstance(indicators, dict):
        return []

    quotes = indicators.get("quote")
    if not isinstance(quotes, list) or not quotes or not isinstance(quotes[0], dict):
        return []

    closes = quotes[0].get("close")
    if not isinstance(closes, list):
        return []

    points: list[tuple[datetime, float]] = []
    for raw_ts, raw_close in zip(timestamps, closes):
        try:
            ts_utc = datetime.fromtimestamp(int(raw_ts), tz=timezone.utc)
        except (TypeError, ValueError, OSError):
            continue

        close = _positive_float(raw_close)
        if close is not None:
            points.append((ts_utc, close))
    return points


def select_krx_sync_baseline_point(
    points: list[tuple[datetime, float]],
    session_date_iso: str,
) -> tuple[datetime, float] | None:
    session_date = _parse_iso_date(session_date_iso)
    if session_date is None:
        return None

    kst = timezone(timedelta(hours=9))
    baseline_kst = datetime.combine(session_date, KRX_SYNC_BASELINE_TIME, tzinfo=kst)
    points_kst = [(ts_utc.astimezone(kst), ts_utc, close) for ts_utc, close in points]
    same_day_points = [row for row in points_kst if row[0].date() == session_date]

    if same_day_points:
        forward_points = [row for row in same_day_points if row[0] >= baseline_kst]
        if forward_points:
            ts_kst, ts_utc, close = forward_points[0]
            delay_hours = (ts_kst - baseline_kst).total_seconds() / 3600
            if delay_hours <= KRX_SYNC_MAX_FORWARD_HOURS:
                return ts_utc, close

    backward_points = [row for row in points_kst if row[0] <= baseline_kst]
    if backward_points:
        ts_kst, ts_utc, close = backward_points[-1]
        lookback_hours = (baseline_kst - ts_kst).total_seconds() / 3600
        if lookback_hours <= KRX_SYNC_MAX_LOOKBACK_HOURS:
            return ts_utc, close

    return None


def get_krx_sync_price_pair(ticker_symbol: str, session_date_iso: str) -> tuple[float | None, float | None]:
    points = fetch_yahoo_chart_points(ticker_symbol)
    if not points:
        return None, None

    baseline_point = select_krx_sync_baseline_point(points, session_date_iso)
    baseline_price = _positive_float(baseline_point[1]) if baseline_point is not None else None
    current_price = _positive_float(points[-1][1])
    return baseline_price, current_price


def get_current_price(ticker_symbol: str) -> float | None:
    _, yahoo_current = get_krx_sync_price_pair(ticker_symbol, date.today().isoformat())
    if yahoo_current is not None:
        return yahoo_current

    ticker = yf.Ticker(ticker_symbol)
    try:
        intraday = ticker.history(period="1d", interval="1m", prepost=True)
        if not intraday.empty and "Close" in intraday:
            price = _positive_float(intraday["Close"].dropna().iloc[-1])
            if price is not None:
                return price
    except Exception:
        pass

    try:
        fast_info = getattr(ticker, "fast_info", None)
        price = _positive_float(getattr(fast_info, "last_price", None) if fast_info is not None else None)
        if price is not None:
            return price
    except Exception:
        pass

    return None


def get_current_prices() -> dict[str, float]:
    prices: dict[str, float] = {}
    for key, symbol in MODEL2_SYMBOLS.items():
        price = get_current_price(symbol)
        if price is not None:
            prices[key] = price
    return prices


def get_session_close_prices(session_date_iso: str) -> dict[str, float]:
    prices: dict[str, float] = {}
    for key, symbol in MODEL2_SYMBOLS.items():
        sync_price, _ = get_krx_sync_price_pair(symbol, session_date_iso)
        price = sync_price if sync_price is not None else _get_prev_session_close(symbol, session_date_iso)
        if price is not None:
            prices[key] = price
    return prices


def repair_kospi_close_baseline_prices(
    session_date_iso: str,
    baseline_prices: dict[str, float],
    current_prices: dict[str, float],
) -> tuple[dict[str, float], bool]:
    sync_prices = get_session_close_prices(session_date_iso)
    if not _has_required_prices(sync_prices):
        return baseline_prices, False

    repaired = dict(baseline_prices)
    changed = False
    for key, price in sync_prices.items():
        previous = _positive_float(repaired.get(key))
        if previous is None or abs(previous - price) > max(1e-6, abs(price) * 1e-6):
            repaired[key] = price
            changed = True

    for key, price in current_prices.items():
        repaired.setdefault(key, price)

    return repaired, changed


def build_returns(baseline_prices: dict[str, float], current_prices: dict[str, float]) -> dict[str, float]:
    returns: dict[str, float] = {}
    for key in MODEL2_SYMBOLS:
        base = _positive_float(baseline_prices.get(key))
        current = _positive_float(current_prices.get(key))
        if base is None or current is None:
            continue

        if key == "krw":
            returns[key] = math.log(base / current) * 100.0
        else:
            returns[key] = math.log(current / base) * 100.0
    return returns


def _z_score(signal_values: dict[str, float], artifact: dict[str, Any], key: str) -> float:
    means = artifact.get("means") if isinstance(artifact.get("means"), dict) else {}
    stds = artifact.get("stds") if isinstance(artifact.get("stds"), dict) else {}
    value = _to_float(signal_values.get(key)) or 0.0
    mean = _to_float(means.get(key)) or 0.0
    std = _to_float(stds.get(key)) or 1.0
    if abs(std) < 1e-9:
        std = 1.0
    return _clamp((value - mean) / std, -RESIDUAL_FEATURE_CLAMP, RESIDUAL_FEATURE_CLAMP)


def transform_signal_to_residual_features(
    signal_values: dict[str, float],
    residual_artifact: dict[str, Any],
) -> dict[str, float]:
    z_spx = _z_score(signal_values, residual_artifact, "sp500")
    z_ndx = _z_score(signal_values, residual_artifact, "nasdaq")
    z_dow = _z_score(signal_values, residual_artifact, "dow")
    z_sox = _z_score(signal_values, residual_artifact, "sox")
    z_wti = _z_score(signal_values, residual_artifact, "wti")
    z_gold = _z_score(signal_values, residual_artifact, "gold")
    z_us10y = _z_score(signal_values, residual_artifact, "us10y")

    components_raw = _camel_or_snake(residual_artifact, "broadPcaComponents", "broad_pca_components", [])
    if isinstance(components_raw, list) and len(components_raw) >= 3:
        components = [(_to_float(value) or 0.0) for value in components_raw[:3]]
    else:
        components = [1.0 / math.sqrt(3.0)] * 3

    sox_ndx_beta = _to_float(_camel_or_snake(residual_artifact, "soxNdxBeta", "sox_ndx_beta", 1.0)) or 1.0
    return {
        "broad_factor": components[0] * z_spx + components[1] * z_ndx + components[2] * z_dow,
        "tech_factor": z_ndx - z_spx,
        "semi_factor": z_sox - sox_ndx_beta * z_ndx,
        "wti_z": z_wti,
        "gold_z": z_gold,
        "us10y_z": z_us10y,
    }


def resolve_model2_baseline(
    existing_payload: dict[str, Any],
    last_session: dict[str, Any],
    current_prices: dict[str, float],
    primary_snapshot: dict[str, Any] | None = None,
    *,
    now_utc: datetime | None = None,
    allow_one_time_night_bootstrap: bool = True,
) -> dict[str, Any]:
    """Resolve the Model 2 baseline without normal night-futures dependency."""

    session_date = str(last_session.get("date") or "")
    session_close = _positive_float(last_session.get("close"))
    if not session_date or session_close is None:
        raise ValueError("invalid KRX session baseline")

    existing_is_model2 = existing_payload.get("calculationMode") == MODEL2_MODE
    existing_baseline_date = str(existing_payload.get("baselineDate") or "")
    existing_baseline_point = _positive_float(existing_payload.get("baselinePoint"))
    existing_baseline_prices = _normalize_price_map(existing_payload.get("baselinePrices"))
    now_kst = (now_utc or datetime.now(timezone.utc)).astimezone(timezone(timedelta(hours=9)))
    try:
        session_date_obj = date.fromisoformat(session_date)
    except ValueError:
        session_date_obj = None
    is_target_preopen = (
        session_date_obj is not None
        and now_kst.time() < KRX_OPEN_TIME
        and now_kst.date() == next_weekday(session_date_obj)
    )

    if (
        existing_is_model2
        and existing_baseline_date == session_date
        and existing_baseline_point is not None
        and _has_required_prices(existing_baseline_prices)
        and not (
            is_target_preopen
            and bool(existing_payload.get("oneTimeNightFuturesBootstrapUsed"))
            and existing_payload.get("baselineSource") == KOSPI_CLOSE_SOURCE
            and _positive_float((primary_snapshot or {}).get("nightFuturesSimplePoint")) is not None
        )
    ):
        baseline_prices = existing_baseline_prices
        reset_reason = "reuse_existing_baseline"
        if existing_payload.get("baselineSource") == KOSPI_CLOSE_SOURCE:
            baseline_prices, repaired = repair_kospi_close_baseline_prices(
                existing_baseline_date,
                existing_baseline_prices,
                current_prices,
            )
            if repaired:
                reset_reason = "repair_krx_sync_baseline_prices"

        return {
            "baselinePoint": existing_baseline_point,
            "baselineDate": existing_baseline_date,
            "baselineSource": str(existing_payload.get("baselineSource") or KOSPI_CLOSE_SOURCE),
            "baselinePrices": baseline_prices,
            "oneTimeNightFuturesBootstrapUsed": bool(existing_payload.get("oneTimeNightFuturesBootstrapUsed")),
            "oneTimeNightFuturesBootstrapAt": existing_payload.get("oneTimeNightFuturesBootstrapAt"),
            "nightFuturesReadThisRun": False,
            "resetReason": reset_reason,
        }

    if (
        existing_is_model2
        and existing_payload.get("baselineSource") == BOOTSTRAP_SOURCE
        and existing_payload.get("prevCloseSource") == "yahoo_ks11"
        and existing_baseline_point is not None
        and _has_required_prices(existing_baseline_prices)
    ):
        return {
            "baselinePoint": existing_baseline_point,
            "baselineDate": session_date,
            "baselineSource": BOOTSTRAP_SOURCE,
            "baselinePrices": existing_baseline_prices,
            "oneTimeNightFuturesBootstrapUsed": True,
            "oneTimeNightFuturesBootstrapAt": existing_payload.get("oneTimeNightFuturesBootstrapAt"),
            "nightFuturesReadThisRun": False,
            "resetReason": "migrate_bootstrap_baseline_to_shared_kospi_session",
        }

    if (
        existing_is_model2
        and is_target_preopen
        and bool(existing_payload.get("oneTimeNightFuturesBootstrapUsed"))
        and existing_payload.get("baselineSource") == KOSPI_CLOSE_SOURCE
        and _has_required_prices(current_prices)
    ):
        snapshot = primary_snapshot if isinstance(primary_snapshot, dict) else {}
        repair_point = _positive_float(snapshot.get("nightFuturesSimplePoint"))
        if repair_point is not None:
            return {
                "baselinePoint": repair_point,
                "baselineDate": session_date,
                "baselineSource": BOOTSTRAP_SOURCE,
                "baselinePrices": dict(current_prices),
                "oneTimeNightFuturesBootstrapUsed": True,
                "oneTimeNightFuturesBootstrapAt": existing_payload.get("oneTimeNightFuturesBootstrapAt")
                or (now_utc or datetime.now(timezone.utc)).isoformat(),
                "nightFuturesReadThisRun": True,
                "resetReason": "repair_preopen_bootstrap_after_kospi_reset",
            }

    if allow_one_time_night_bootstrap and not existing_is_model2 and _has_required_prices(current_prices):
        snapshot = primary_snapshot if isinstance(primary_snapshot, dict) else {}
        bootstrap_point = _positive_float(snapshot.get("nightFuturesSimplePoint"))
        if bootstrap_point is not None:
            return {
                "baselinePoint": bootstrap_point,
                "baselineDate": session_date,
                "baselineSource": BOOTSTRAP_SOURCE,
                "baselinePrices": dict(current_prices),
                "oneTimeNightFuturesBootstrapUsed": True,
                "oneTimeNightFuturesBootstrapAt": (now_utc or datetime.now(timezone.utc)).isoformat(),
                "nightFuturesReadThisRun": True,
                "resetReason": "legacy_payload_bootstrap",
            }

    session_prices = get_session_close_prices(session_date)
    for key, value in current_prices.items():
        session_prices.setdefault(key, value)

    if not _has_required_prices(session_prices):
        raise ValueError("missing EWY/KRW baseline prices")

    return {
        "baselinePoint": session_close,
        "baselineDate": session_date,
        "baselineSource": KOSPI_CLOSE_SOURCE,
        "baselinePrices": session_prices,
        "oneTimeNightFuturesBootstrapUsed": bool(existing_payload.get("oneTimeNightFuturesBootstrapUsed")),
        "oneTimeNightFuturesBootstrapAt": existing_payload.get("oneTimeNightFuturesBootstrapAt"),
        "nightFuturesReadThisRun": False,
        "resetReason": "new_krx_session_close" if existing_is_model2 else "fresh_kospi_close",
    }


def _core_params(diagnostics: dict[str, Any]) -> dict[str, float]:
    correction = diagnostics.get("ewyFxCorrection")
    if not isinstance(correction, dict):
        correction = {}

    direct_weight = _to_float(correction.get("directBlendWeight"))
    if direct_weight is None:
        direct_weight = _to_float(correction.get("direct_blend_weight"))
    if direct_weight is None:
        direct_weight = DIRECT_AXIS_BLEND_WEIGHT

    return {
        "intercept": _to_float(correction.get("intercept")) or 0.0,
        "ewyCoef": _to_float(correction.get("ewyCoef")) or _to_float(correction.get("ewy_coef")) or 0.35,
        "krwCoef": _to_float(correction.get("krwCoef")) or _to_float(correction.get("krw_coef")) or 0.20,
        "r2": _to_float(correction.get("r2")) or 0.0,
        "sampleSize": _to_float(correction.get("sampleSize")) or _to_float(correction.get("sample_size")) or 0.0,
        "directBlendWeight": _clamp(direct_weight, 0.0, 1.0),
    }


def _mapping_params(diagnostics: dict[str, Any]) -> dict[str, float]:
    mapping = diagnostics.get("k200Mapping")
    if not isinstance(mapping, dict):
        mapping = {}

    return {
        "intercept": _to_float(mapping.get("intercept")) or 0.0,
        "beta": _to_float(mapping.get("beta")) or 1.0,
        "sampleSize": _to_float(mapping.get("sampleSize")) or _to_float(mapping.get("sample_size")) or 0.0,
    }


def calculate_model2(
    signal_returns: dict[str, float],
    diagnostics: dict[str, Any],
    baseline_point: float,
) -> dict[str, Any] | None:
    baseline_point = _positive_float(baseline_point)
    if baseline_point is None:
        return None

    ewy_return = _to_float(signal_returns.get("ewy"))
    krw_return = _to_float(signal_returns.get("krw"))
    if ewy_return is None or krw_return is None:
        return None

    core = _core_params(diagnostics)
    ewy_fx_direct_pct = ewy_return + krw_return
    ewy_fx_learned_pct = core["intercept"] + core["ewyCoef"] * ewy_return + core["krwCoef"] * krw_return
    learned_weight = 1.0 - core["directBlendWeight"]
    ewy_fx_core_pct = (
        core["directBlendWeight"] * ewy_fx_direct_pct
        + learned_weight * ewy_fx_learned_pct
    )

    residual_artifact = diagnostics.get("residualModel")
    if not isinstance(residual_artifact, dict):
        residual_artifact = {}
    residual_features = transform_signal_to_residual_features(signal_returns, residual_artifact)
    residual_coefficients = residual_artifact.get("coefficients")
    if not isinstance(residual_coefficients, dict):
        residual_coefficients = {}

    raw_residual_pct = _to_float(residual_artifact.get("intercept")) or 0.0
    for key in RESIDUAL_FEATURE_KEYS:
        coefficient = _to_float(residual_coefficients.get(key)) or 0.0
        raw_residual_pct += coefficient * residual_features.get(key, 0.0)

    residual_weight = _to_float(residual_artifact.get("weight")) or 0.0
    composite_adjustment_pct = _clamp(
        raw_residual_pct * residual_weight,
        -COMPOSITE_ADJUSTMENT_CAP_PCT,
        COMPOSITE_ADJUSTMENT_CAP_PCT,
    )

    mapping = _mapping_params(diagnostics)
    model2_return_pct = ewy_fx_core_pct + composite_adjustment_pct
    ewy_fx_direct_point = baseline_point * math.exp(ewy_fx_direct_pct / 100.0)
    ewy_fx_learned_point = baseline_point * math.exp(ewy_fx_learned_pct / 100.0)
    ewy_fx_core_point = baseline_point * math.exp(ewy_fx_core_pct / 100.0)
    point_prediction = baseline_point * math.exp(model2_return_pct / 100.0)

    mae_pct = (
        _to_float(diagnostics.get("maePct"))
        or _to_float(residual_artifact.get("mae"))
        or _to_float(residual_artifact.get("full_mae"))
        or _to_float(residual_artifact.get("fullMae"))
        or 0.8
    )
    half_band = abs(baseline_point * (mae_pct / 100.0) * BAND_MAE_MULTIPLIER)

    return {
        "pointPrediction": point_prediction,
        "ewyFxDirectPoint": ewy_fx_direct_point,
        "ewyFxDirectPct": ewy_fx_direct_pct,
        "ewyFxLearnedPoint": ewy_fx_learned_point,
        "ewyFxLearnedPct": ewy_fx_learned_pct,
        "ewyFxCorePoint": ewy_fx_core_point,
        "ewyFxCorePct": ewy_fx_core_pct,
        "baseReturnPct": model2_return_pct,
        "corePct": ewy_fx_core_pct,
        "rawResidualPct": raw_residual_pct,
        "residualPct": composite_adjustment_pct,
        "compositeAdjustmentPct": composite_adjustment_pct,
        "k200MappedPct": None,
        "kospiMappedPct": model2_return_pct,
        "rangeLow": point_prediction - half_band,
        "rangeHigh": point_prediction + half_band,
        "bandHalfWidth": half_band,
        "fitR2": core["r2"],
        "coreSampleSize": core["sampleSize"],
        "mappingSampleSize": mapping["sampleSize"],
        "residualWeight": residual_weight,
        "residualFeatureValues": residual_features,
        "coreCoefficients": {
            "intercept": core["intercept"],
            "ewyCoef": core["ewyCoef"],
            "krwCoef": core["krwCoef"],
            "directBlendWeight": core["directBlendWeight"],
            "learnedBlendWeight": learned_weight,
            "source": "ewy_fx_direct_learned_hybrid",
            "used": True,
        },
        "mapping": {
            "intercept": mapping["intercept"],
            "beta": mapping["beta"],
            "used": False,
        },
    }


def resolve_prediction_target(now_kst: datetime, baseline_date: date) -> date:
    if now_kst.time() < KRX_OPEN_TIME:
        return next_weekday(baseline_date)

    if is_krx_holiday(now_kst):
        return next_weekday(now_kst.date())

    return next_weekday(baseline_date)


def update_series(payload: dict[str, Any], now_utc: datetime, prediction_target: str) -> None:
    series_payload = _load_json(HOLIDAY_SERIES_PATH)
    records = series_payload.get("records")
    if not isinstance(records, list):
        records = series_payload.get("rows") if isinstance(series_payload.get("rows"), list) else []
    records.append(
        {
            "predictionDateIso": prediction_target,
            "predictionDate": payload.get("predictionDate"),
            "observedAt": now_utc.isoformat(),
            "kstTime": payload.get("generatedAtKst"),
            "pointPrediction": payload.get("pointPrediction"),
            "predictedChangePct": payload.get("predictedChangePct"),
            "ewyLogReturnPct": payload.get("ewyLogPct"),
            "krwLogReturnPct": payload.get("krwLogPct"),
            "corePct": payload.get("corePct"),
            "residualPct": payload.get("residualPct"),
            "baselineDate": payload.get("baselineDate"),
            "baselineSource": payload.get("baselineSource"),
        }
    )
    records = records[-SERIES_MAX_ROWS:]
    _write_json(
        HOLIDAY_SERIES_PATH,
        {
            "generatedAt": now_utc.isoformat(),
            "predictionDateIso": prediction_target,
            "model": "model2",
            "calculationMode": MODEL2_MODE,
            "records": records,
        },
    )


def update_history(payload: dict[str, Any], prediction_target: str) -> None:
    history_payload = _load_json(HOLIDAY_HISTORY_PATH)
    records = history_payload.get("records")
    if not isinstance(records, list):
        records = history_payload.get("rows") if isinstance(history_payload.get("rows"), list) else []
    records = [
        record
        for record in records
        if (
            isinstance(record, dict)
            and record.get("predictionDateIso") != payload.get("predictionDateIso")
            and record.get("date") != payload.get("predictionDateIso")
        )
    ]
    records.append(
        {
            "date": payload.get("predictionDateIso"),
            "model2Prediction": payload.get("pointPrediction"),
            "rangeLow": payload.get("rangeLow"),
            "rangeHigh": payload.get("rangeHigh"),
            "prevClose": payload.get("prevClose"),
            "predictedChangePct": payload.get("predictedChangePct"),
            "baselineDate": payload.get("baselineDate"),
            "baselineSource": payload.get("baselineSource"),
            "predictionGeneratedAt": payload.get("generatedAt"),
        }
    )
    records = sorted(records, key=lambda record: str(record.get("date", "")), reverse=True)[:HISTORY_MAX_ROWS]
    _write_json(
        HOLIDAY_HISTORY_PATH,
        {
            "generatedAt": payload.get("generatedAt"),
            "model": "model2",
            "calculationMode": MODEL2_MODE,
            "records": records,
        },
    )


def run() -> int:
    now_utc = datetime.now(timezone.utc)
    now_kst = now_utc.astimezone(timezone(timedelta(hours=9)))

    if not is_us_market_active(now_utc):
        print("skip: outside US live/pre-market window")
        return 0

    diagnostics = load_diagnostics_artifact()
    if not is_valid_diagnostics(diagnostics):
        print("error: missing Model 2 diagnostics artifact", file=sys.stderr)
        return 1

    existing_payload = _load_json(HOLIDAY_PREDICTION_PATH)
    primary_snapshot = load_primary_prediction_snapshot(now_kst)

    last_session = resolve_last_krx_session(primary_snapshot)
    if not last_session:
        print("error: missing KRX close baseline", file=sys.stderr)
        return 1
    last_session = guard_last_session_with_existing_model2(last_session, existing_payload)

    current_prices = get_current_prices()
    if not _has_required_prices(current_prices):
        print("error: missing live EWY/KRW prices", file=sys.stderr)
        return 1

    try:
        baseline = resolve_model2_baseline(
            existing_payload,
            last_session,
            current_prices,
            primary_snapshot,
            now_utc=now_utc,
        )
    except ValueError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1

    returns = build_returns(baseline["baselinePrices"], current_prices)
    result = calculate_model2(returns, diagnostics, baseline["baselinePoint"])
    if result is None:
        print("error: failed to calculate Model 2 prediction", file=sys.stderr)
        return 1

    baseline_date = date.fromisoformat(baseline["baselineDate"])
    target_date = resolve_prediction_target(now_kst, baseline_date)
    target_iso = target_date.isoformat()
    target_label = format_date_label(target_date)

    prev_close = _positive_float(last_session.get("close")) or baseline["baselinePoint"]
    predicted_change_pct = ((result["pointPrediction"] / prev_close) - 1.0) * 100.0

    payload = {
        "generatedAt": now_utc.isoformat(),
        "generatedAtKst": now_kst.isoformat(),
        "schemaVersion": 3,
        "modelVersion": MODEL2_VERSION,
        "modelName": "모델2 예측(test)",
        "calculationMode": MODEL2_MODE,
        "independentModel": True,
        "usesOtherModelPrediction": False,
        "nightFuturesUsed": False,
        "nightFuturesReadThisRun": bool(baseline.get("nightFuturesReadThisRun")),
        "oneTimeNightFuturesBootstrapUsed": bool(baseline.get("oneTimeNightFuturesBootstrapUsed")),
        "oneTimeNightFuturesBootstrapAt": baseline.get("oneTimeNightFuturesBootstrapAt"),
        "predictionDate": target_label,
        "predictionDateIso": target_iso,
        "prevClose": round(prev_close, 4),
        "prevCloseDate": last_session.get("date"),
        "prevCloseSource": last_session.get("source") or "yahoo_ks11",
        "baselinePoint": round(baseline["baselinePoint"], 4),
        "baselineDate": baseline["baselineDate"],
        "baselineSource": baseline["baselineSource"],
        "baselineResetReason": baseline.get("resetReason"),
        "baselinePrices": {key: round(value, 6) for key, value in baseline["baselinePrices"].items()},
        "currentPrices": {key: round(value, 6) for key, value in current_prices.items()},
        "returns": {key: round(value, 6) for key, value in returns.items()},
        "ewyLogPct": _round_or_none(returns.get("ewy"), 6),
        "krwLogPct": _round_or_none(returns.get("krw"), 6),
        "corePct": round(result["corePct"], 6),
        "rawResidualPct": round(result["rawResidualPct"], 6),
        "residualPct": round(result["residualPct"], 6),
        "compositeAdjustmentPct": round(result["compositeAdjustmentPct"], 6),
        "ewyFxDirectPoint": round(result["ewyFxDirectPoint"], 4),
        "ewyFxDirectPct": round(result["ewyFxDirectPct"], 6),
        "ewyFxLearnedPoint": round(result["ewyFxLearnedPoint"], 4),
        "ewyFxLearnedPct": round(result["ewyFxLearnedPct"], 6),
        "ewyFxCorePoint": round(result["ewyFxCorePoint"], 4),
        "ewyFxCorePct": round(result["ewyFxCorePct"], 6),
        "k200MappedPct": _round_or_none(result["k200MappedPct"], 6),
        "kospiMappedPct": round(result["kospiMappedPct"], 6),
        "baseReturnPct": round(result["baseReturnPct"], 6),
        "predictedChangePct": round(predicted_change_pct, 6),
        "pointPrediction": round(result["pointPrediction"], 4),
        "rangeLow": round(result["rangeLow"], 4),
        "rangeHigh": round(result["rangeHigh"], 4),
        "confidenceBand": {
            "low": round(result["rangeLow"], 4),
            "high": round(result["rangeHigh"], 4),
            "halfWidth": round(result["bandHalfWidth"], 4),
        },
        "model": {
            "engine": MODEL2_ENGINE,
            "inputPolicy": "Hybrid EWY/KRW fair-value core plus bounded composite adjustment; no night-futures signal after one-time bootstrap",
            "coreAxis": "direct_blend * raw_ewy_krw_axis + learned_blend * rolling_ewy_fx_correction",
            "rawEwyKrwAxis": "ewy_log_return_pct + krw_adjusted_log_return_pct",
            "compositeAdjustmentCapPct": COMPOSITE_ADJUSTMENT_CAP_PCT,
            "residualFeatureClamp": RESIDUAL_FEATURE_CLAMP,
            "coreCoefficients": result["coreCoefficients"],
            "mapping": result["mapping"],
            "residualWeight": result["residualWeight"],
            "fitR2": result["fitR2"],
            "coreSampleSize": result["coreSampleSize"],
            "mappingSampleSize": result["mappingSampleSize"],
            "residualFeatureValues": {
                key: round(value, 6) for key, value in result["residualFeatureValues"].items()
            },
        },
    }

    _write_json(HOLIDAY_PREDICTION_PATH, payload)
    update_series(payload, now_utc, target_iso)
    update_history(payload, target_label)
    print(
        "wrote Model 2 independent prediction "
        f"{payload['pointPrediction']:.2f} ({payload['predictedChangePct']:.2f}%)"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(run())
