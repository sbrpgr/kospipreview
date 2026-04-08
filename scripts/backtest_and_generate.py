from __future__ import annotations

import json
import sys
import warnings
from datetime import datetime, timedelta, timezone
from pathlib import Path

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
DOCS_DIR = ROOT / "docs"
CACHE_DIR = ROOT / ".cache" / "yfinance"

KST = timezone(timedelta(hours=9))
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

INDICATOR_SOURCE_URLS = {
    key: f"https://finance.yahoo.com/quote/{ticker.replace('=', '%3D').replace('^', '%5E')}"
    for key, ticker in FEATURE_TICKERS.items()
}

LOOKBACK_DAYS = 3 * 365
ALL_FEATURES = list(FEATURE_TICKERS.keys())
HISTORY_RECORDS = 30

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
    live_market = fetch_live_indicators()
    print("Building training dataset...")
    dataset = build_dataset(market)
    print("Training LightGBM models...")
    result = train_lgbm(dataset)
    print("Writing output JSON files...")
    history_df = build_history_df(result)
    latest = build_latest(live_market, result, market)

    write_prediction_json(latest, result, history_df)
    write_history_json(result, history_df)
    write_indicators_json(live_market)
    write_diagnostics_json(result)
    print(f"Done. Output directory: {DATA_DIR}")


def fetch_market_data() -> dict[str, pd.DataFrame]:
    period = f"{LOOKBACK_DAYS}d"
    frames: dict[str, pd.DataFrame] = {}
    all_tickers = {**KOREA_TICKERS, **FEATURE_TICKERS}

    for name, ticker in all_tickers.items():
      print(f"  - downloading {name} ({ticker})")
      df = yf.download(ticker, period=period, interval="1d", auto_adjust=False, progress=False, threads=False)
      if df.empty:
          continue
      if isinstance(df.columns, pd.MultiIndex):
          df.columns = df.columns.get_level_values(0)
      frames[name] = df.rename_axis("date").sort_index()

    return frames


def fetch_live_indicators() -> dict[str, pd.DataFrame]:
    frames: dict[str, pd.DataFrame] = {}

    for name, ticker in {**KOREA_TICKERS, **FEATURE_TICKERS}.items():
        df = yf.download(ticker, period="1d", interval="1m", auto_adjust=False, progress=False, threads=False)
        if df.empty:
            df = yf.download(ticker, period="5d", interval="1d", auto_adjust=False, progress=False, threads=False)
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = df.columns.get_level_values(0)
        frames[name] = df.sort_index()

    return frames


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

    return {
        "rmse": rmse,
        "mae": mae,
        "bhr": float(preds["hit"].mean() * 100),
        "dhr": float(preds["direction_hit"].mean() * 100),
        "fi": feature_importance,
        "preds": preds,
        "feat_cols": feat_cols,
        "model_c": final_center,
    }


def build_latest(live_market: dict[str, pd.DataFrame], result: dict, history_market: dict[str, pd.DataFrame]) -> dict:
    returns: dict[str, float] = {}
    vix = 20.0

    for name in ALL_FEATURES:
        live_series = live_market[name]["Close"].dropna()
        history_series = history_market[name]["Close"].dropna()
        if live_series.empty or history_series.empty:
            continue

        current_value = float(live_series.iloc[-1])
        previous_close = float(history_series.iloc[-1])
        returns[name] = (current_value / previous_close - 1) * 100
        if name == "vix":
            vix = current_value

    prev_kospi_series = history_market["kospi"]["Close"].dropna()
    prev_close = float(prev_kospi_series.iloc[-1]) if not prev_kospi_series.empty else 2500.0

    feature_vector = np.array(
        [[returns.get(column.replace("_return", ""), 0.0) for column in result["feat_cols"]]],
        dtype=np.float64,
    )
    predicted_change = float(result["model_c"].predict(feature_vector)[0])
    point_prediction = prev_close * (1 + predicted_change / 100)
    buffer = result["mae"] * choose_band_multiplier(vix)

    return {
        "point": point_prediction,
        "r_low": point_prediction - buffer,
        "r_high": point_prediction + buffer,
        "pred_c": predicted_change,
        "vix": vix,
        "returns": returns,
        "prev_close": prev_close,
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
    latest_record_date = history_df.iloc[0]["date"] if not history_df.empty else None
    yesterday_row = history_df.iloc[0] if not history_df.empty else None

    payload = {
        "generatedAt": now_utc.isoformat(),
        "predictionDate": next_prediction_date_label(now_kst),
        "pointPrediction": round(latest["point"], 2),
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
        },
        "yesterday": {
            "predictionLow": round(float(yesterday_row["low"]), 2) if yesterday_row is not None else 0,
            "predictionHigh": round(float(yesterday_row["high"]), 2) if yesterday_row is not None else 0,
            "actualOpen": round(float(yesterday_row["actual_open"]), 2) if yesterday_row is not None else 0,
            "hit": bool(yesterday_row["hit"]) if yesterday_row is not None else False,
        },
    }
    (DATA_DIR / "prediction.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf8")


def write_indicators_json(live_market: dict[str, pd.DataFrame]) -> None:
    primary_keys = ["ewy", "krw", "wti", "sp500"]
    secondary_keys = ["nasdaq", "vix", "koru", "dow", "gold", "us10y", "sox"]

    def build_indicator(name: str) -> dict:
        series = live_market[name]["Close"].dropna()
        if series.empty:
            return {"key": name, "label": indicator_label(name), "value": "N/A", "changePct": 0, "updatedAt": ""}

        current_value = float(series.iloc[-1])
        start_value = float(series.iloc[0])
        return {
            "key": name,
            "label": indicator_label(name),
            "value": format_value(name, current_value),
            "changePct": round((current_value / start_value - 1) * 100, 2),
            "updatedAt": pd.Timestamp(series.index[-1]).isoformat(),
            "sourceUrl": INDICATOR_SOURCE_URLS.get(name, ""),
            "dataSource": "Yahoo Finance",
        }

    payload = {
        "primary": [build_indicator(name) for name in primary_keys],
        "secondary": [build_indicator(name) for name in secondary_keys],
        "generatedAt": datetime.now(timezone.utc).isoformat(),
    }
    (DATA_DIR / "indicators.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf8")


def write_diagnostics_json(result: dict) -> None:
    payload = {
        "selectedFeatures": result["feat_cols"],
        "rmse": round(result["rmse"], 4),
        "mae": round(result["mae"], 4),
        "featureImportance": result["fi"],
        "generatedAt": datetime.now(timezone.utc).isoformat(),
    }
    (DATA_DIR / "backtest_diagnostics.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf8")


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
    (DATA_DIR / "history.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf8")


def choose_band_multiplier(vix: float) -> float:
    if vix < 20:
        return 1.0
    if vix < 25:
        return 1.3
    if vix < 30:
        return 1.5
    return 2.0


def indicator_label(name: str) -> str:
    return {
        "ewy": "EWY (Korea ETF)",
        "krw": "USD/KRW",
        "wti": "WTI",
        "sp500": "S&P 500",
        "nasdaq": "NASDAQ 100",
        "vix": "VIX",
        "koru": "KORU 3x",
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
