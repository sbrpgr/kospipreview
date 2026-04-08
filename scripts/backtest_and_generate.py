from __future__ import annotations

import json
import sys
import urllib.error
import urllib.request
import warnings
from datetime import datetime, time, timedelta, timezone
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
PREMARKET_TRACK_KEYS = {"ewy", "koru", "sp500", "nasdaq", "dow", "sox"}
PREMARKET_STALE_MINUTES = 45
KRX_SESSION_CLOSE_CUTOFF = time(15, 20)

CORE_PRIMARY_WEIGHTS = {
    "ewy": 0.80,
    "krw_strength": 0.20,
}
CORE_PRIMARY_SCALE = 0.56
SECONDARY_CORRECTION_RATIO = 0.18
AUX_CORRECTION_MIN_PCT = 0.45
AUX_CORRECTION_MAX_PCT = 1.40
AUX_CORRECTION_CORE_SHARE = 0.35
MEAN_REVERSION_THRESHOLD_PCT = 5.0
MEAN_REVERSION_SLOPE = 0.04
MEAN_REVERSION_FLOOR = 0.78
CORE_GUARD_BAND_MIN_PCT = 1.2
CORE_GUARD_BAND_SHARE = 0.45
REGIME_CLIP_MIN_PCT = 2.5
REGIME_CLIP_PREV_CLOSE_SHARE = 0.9
REGIME_CLIP_CORE_BUFFER_PCT = 1.25

TV_FUTURES_SCAN_URL = "https://scanner.tradingview.com/futures/scan"
TV_KOSPI_NIGHT_SYMBOL = "KRX:K2I1!"
NIGHT_FUTURES_STALE_MINUTES = 180
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
    print("Writing output JSON files...")
    history_df = build_history_df(result)
    latest = build_latest(live_market, result, market, live_overrides)

    write_prediction_json(latest, result, history_df)
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


def fetch_esignal_kospi_day_close_quote() -> dict | None:
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


def resolve_day_futures_close_quote() -> dict | None:
    now_kst = datetime.now(timezone.utc).astimezone(KST)
    target_session_date = latest_closed_day_futures_session_date(now_kst)
    cached = load_day_futures_close_cache()

    if cached:
        cached_session_date = str(cached.get("session_date", ""))
        if cached_session_date >= target_session_date:
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


def fetch_tradingview_kospi_night_quote(day_close_quote: dict | None = None) -> dict | None:
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

    now_utc = datetime.now(timezone.utc)
    age_minutes = (now_utc - updated_at).total_seconds() / 60
    updated_kst = updated_at.astimezone(KST)
    in_night_window = updated_kst.time() >= time(18, 0) or updated_kst.time() <= time(6, 0)
    is_live_night = age_minutes <= NIGHT_FUTURES_STALE_MINUTES and in_night_window

    quote = {
        "price": price,
        "previous_close": previous_close,
        "change_pct": float(change_pct) if change_pct is not None else (price / previous_close - 1) * 100,
        "updated_at": updated_at.isoformat(),
        "age_minutes": round(age_minutes, 1),
        "is_live_night": is_live_night,
        "update_mode": update_mode or "",
        "description": description or "KOSPI 200 Futures",
        "exchange": exchange or "KRX",
        "provider": "tradingview",
        "reference_close": "provider-default",
        "day_close": None,
        "day_close_updated_at": None,
        "day_close_date": None,
    }
    return apply_day_futures_reference(quote, day_close_quote)


def fetch_esignal_kospi_night_quote(day_close_quote: dict | None = None) -> dict | None:
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
        return None

    updated_at = datetime.fromtimestamp(ts_ms / 1000, tz=timezone.utc)
    now_utc = datetime.now(timezone.utc)
    age_minutes = (now_utc - updated_at).total_seconds() / 60
    updated_kst = updated_at.astimezone(KST)
    in_night_window = updated_kst.time() >= time(18, 0) or updated_kst.time() <= time(6, 0)
    is_live_night = age_minutes <= NIGHT_FUTURES_STALE_MINUTES and in_night_window
    change_pct = ((price / previous_close - 1) * 100) if previous_close else 0.0

    quote = {
        "price": price,
        "previous_close": previous_close,
        "change_pct": change_pct,
        "updated_at": updated_at.isoformat(),
        "age_minutes": round(age_minutes, 1),
        "is_live_night": is_live_night,
        "update_mode": "cache-json",
        "description": "KOSPI 200 Night Futures",
        "exchange": "KRX",
        "provider": "esignal",
        "reference_close": "night-open",
        "day_close": None,
        "day_close_updated_at": None,
        "day_close_date": None,
    }
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


def compute_live_return_pct(
    name: str,
    live_market: dict[str, pd.DataFrame],
    history_market: dict[str, pd.DataFrame],
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

    if "PrevClose" in live_frame and not live_frame["PrevClose"].dropna().empty:
        prev_close = float(live_frame["PrevClose"].dropna().iloc[-1])
        if prev_close != 0:
            return (float(live_series.iloc[-1]) / prev_close - 1) * 100

    current_value = float(live_series.iloc[-1])
    latest_ts = as_utc_datetime(pd.Timestamp(live_series.index[-1]))

    history_frame = history_market.get(name, pd.DataFrame())
    history_series = history_frame["Close"].dropna() if "Close" in history_frame else pd.Series(dtype=float)
    previous_close = resolve_previous_close(history_series, latest_ts)
    if previous_close is None or previous_close == 0:
        if len(live_series) < 2:
            return None
        previous_close = float(live_series.iloc[0])

    return (current_value / previous_close - 1) * 100


def compute_core_anchor_change(core_inputs: dict[str, float | None]) -> float | None:
    weighted_sum = 0.0
    total_weight = 0.0
    for key, weight in CORE_PRIMARY_WEIGHTS.items():
        value = core_inputs.get(key)
        if value is None:
            continue
        weighted_sum += float(value) * weight
        total_weight += weight

    if total_weight == 0:
        return None

    primary_change = weighted_sum / total_weight
    return primary_change * CORE_PRIMARY_SCALE


def apply_auxiliary_correction(core_anchor_change: float, raw_ml_change: float) -> float:
    raw_gap = (raw_ml_change - core_anchor_change) * SECONDARY_CORRECTION_RATIO
    cap = max(AUX_CORRECTION_MIN_PCT, abs(core_anchor_change) * AUX_CORRECTION_CORE_SHARE)
    cap = min(AUX_CORRECTION_MAX_PCT, cap)
    limited_gap = float(np.clip(raw_gap, -cap, cap))
    return core_anchor_change + limited_gap


def apply_core_guardrail(predicted_change: float, core_anchor_change: float | None) -> float:
    if core_anchor_change is None:
        return predicted_change
    guard_band = max(CORE_GUARD_BAND_MIN_PCT, abs(core_anchor_change) * CORE_GUARD_BAND_SHARE)
    return float(np.clip(predicted_change, core_anchor_change - guard_band, core_anchor_change + guard_band))


def compute_adaptive_bounds(
    bounds: dict[str, float],
    prev_close_change: float,
    core_anchor_change: float | None,
) -> tuple[float | None, float | None]:
    lower = bounds.get("p01", bounds.get("p05", bounds.get("p02", bounds.get("min"))))
    upper = bounds.get("p99", bounds.get("p95", bounds.get("p98", bounds.get("max"))))

    regime_cap = max(REGIME_CLIP_MIN_PCT, abs(prev_close_change) * REGIME_CLIP_PREV_CLOSE_SHARE)
    if core_anchor_change is not None:
        regime_cap = max(regime_cap, abs(core_anchor_change) + REGIME_CLIP_CORE_BUFFER_PCT)

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


def build_latest(
    live_market: dict[str, pd.DataFrame],
    result: dict,
    history_market: dict[str, pd.DataFrame],
    live_overrides: dict[str, dict],
) -> dict:
    returns: dict[str, float] = {}
    vix = 20.0

    for name in ALL_FEATURES:
        change_pct = compute_live_return_pct(name, live_market, history_market, live_overrides)
        if change_pct is None:
            continue
        returns[name] = change_pct
        if name == "vix":
            live_series = live_market[name]["Close"].dropna()
            if not live_series.empty:
                vix = float(live_series.iloc[-1])

    prev_kospi_series = history_market["kospi"]["Close"] if "kospi" in history_market else pd.Series(dtype=float)
    live_kospi_frame = live_market.get("kospi", pd.DataFrame())
    live_kospi_series = live_kospi_frame["Close"] if "Close" in live_kospi_frame else pd.Series(dtype=float)
    prev_close, latest_record_date = resolve_latest_completed_krx_session(live_kospi_series, prev_kospi_series)
    prev_kospi_non_na = prev_kospi_series.dropna()
    prior_close = float(prev_kospi_non_na.iloc[-1]) if not prev_kospi_non_na.empty else prev_close
    prev_close_change = ((prev_close / prior_close - 1) * 100) if prior_close else 0.0
    night_futures_change = compute_live_return_pct("k200f", live_market, history_market, live_overrides)
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

    core_inputs = {
        "ewy": returns.get("ewy"),
        "krw_strength": (-returns["krw"]) if "krw" in returns else None,
    }
    core_anchor_change = compute_core_anchor_change(core_inputs)

    blended_change = raw_ml_change
    if core_anchor_change is not None:
        blended_change = apply_auxiliary_correction(core_anchor_change, raw_ml_change)

    damped_change = apply_mean_reversion_damping(blended_change, prev_close_change)
    guarded_change = apply_core_guardrail(damped_change, core_anchor_change)
    bounds = result.get("target_bounds", {})
    lower, upper = compute_adaptive_bounds(bounds, prev_close_change, core_anchor_change)
    if lower is not None and upper is not None:
        predicted_change = float(np.clip(guarded_change, lower, upper))
    else:
        predicted_change = guarded_change

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
        "core_anchor_c": core_anchor_change,
        "prev_close_change_c": prev_close_change,
        "vix": vix,
        "returns": returns,
        "prev_close": prev_close,
        "latest_record_date": latest_record_date,
        "futures_day_close": futures_day_close,
        "futures_day_close_date": futures_day_close_date,
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


def write_prediction_json(latest: dict, result: dict, history_df: pd.DataFrame) -> None:
    now_utc = datetime.now(timezone.utc)
    now_kst = now_utc.astimezone(KST)
    latest_record_date = latest.get("latest_record_date")
    if not latest_record_date and not history_df.empty:
        latest_record_date = history_df.iloc[0]["date"]
    yesterday_row = history_df.iloc[0] if not history_df.empty else None

    payload = {
        "generatedAt": now_utc.isoformat(),
        "predictionDate": next_prediction_date_label(now_kst),
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
            "calculationMode": "EWYFXCore+AuxCorrection",
            "coreAnchorPct": round(float(latest["core_anchor_c"]), 2) if latest["core_anchor_c"] is not None else None,
            "rawModelPct": round(float(latest["raw_pred_c"]), 2),
            "prevCloseChangePct": round(float(latest["prev_close_change_c"]), 2),
        },
        "yesterday": {
            "predictionLow": round(float(yesterday_row["low"]), 2) if yesterday_row is not None else 0,
            "predictionHigh": round(float(yesterday_row["high"]), 2) if yesterday_row is not None else 0,
            "actualOpen": round(float(yesterday_row["actual_open"]), 2) if yesterday_row is not None else 0,
            "hit": bool(yesterday_row["hit"]) if yesterday_row is not None else False,
        },
    }
    write_output_json("prediction.json", payload)


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
                "displayTag": "(미연결)",
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
                "displayTag": "(장전)" if in_us_premarket_now and name in PREMARKET_TRACK_KEYS else "",
                "isPremarket": False,
            }

        current_value = float(series.iloc[-1])
        latest_ts = as_utc_datetime(pd.Timestamp(series.index[-1]))
        history_frame = history_market.get(name, pd.DataFrame())
        history_series = history_frame["Close"].dropna() if "Close" in history_frame else pd.Series(dtype=float)
        previous_close = resolve_previous_close(history_series, latest_ts)
        if previous_close is None or previous_close == 0:
            previous_close = float(series.iloc[0])
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
            "changePct": round((current_value / previous_close - 1) * 100, 2),
            "updatedAt": latest_ts.isoformat(),
            "sourceUrl": INDICATOR_SOURCE_URLS.get(name, ""),
            "dataSource": "Yahoo Finance",
            "displayTag": "(장전)" if premarket_untracked else "",
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
        "generatedAt": datetime.now(timezone.utc).isoformat(),
    }
    write_output_json("backtest_diagnostics.json", payload)


def build_history_df(result: dict) -> pd.DataFrame:
    df = result["preds"].copy()
    if df.empty:
        return df

    df[["low", "high", "actual_open"]] = df[["low", "high", "actual_open"]].round(2)
    return df.sort_values("date", ascending=False).head(HISTORY_RECORDS).reset_index(drop=True)


def write_history_json(result: dict, history_df: pd.DataFrame) -> None:
    records = [
        {
            "date": row["date"],
            "low": row["low"],
            "high": row["high"],
            "actualOpen": row["actual_open"],
            "hit": bool(row["hit"]),
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
