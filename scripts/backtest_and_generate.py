from __future__ import annotations

import itertools
import json
import math
import sys
import warnings
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import pandas as pd

warnings.filterwarnings("ignore")

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

import yfinance as yf
import lightgbm as lgb
from sklearn.model_selection import TimeSeriesSplit
from sklearn.preprocessing import StandardScaler
import statsmodels.api as sm

from model.predictor import Coefficients, PredictionInput, calculate_prediction

DATA_DIR = ROOT / "data"
DOCS_DIR = ROOT / "docs"
MODEL_DIR = ROOT / "model"
CACHE_DIR = ROOT / ".cache" / "yfinance"

KOREA_TICKERS = {
    "kospi": "^KS11",
}

FEATURE_TICKERS = {
    "ewy": "EWY",        # iShares MSCI South Korea ETF (미국장 한국 대표 ETF)
    "koru": "KORU",      # Direxion 3x Korea ETF
    "sp500": "^GSPC",    # S&P 500
    "nasdaq": "^NDX",    # 나스닥 100
    "dow": "^DJI",       # 다우존스 산업평균
    "vix": "^VIX",       # CBOE 변동성 지수
    "wti": "CL=F",       # WTI 원유 선물
    "gold": "GC=F",      # 금 선물
    "us10y": "^TNX",     # 미국 10년 국채 금리
    "sox": "^SOX",       # 필라델피아 반도체 지수
    "krw": "KRW=X",      # 원/달러 환율 (KRW=X: USD 1 = KRW x원, 상승=원화약세)
}

# 출처 URL (UI에서 연결용)
INDICATOR_SOURCE_URLS = {
    "ewy":    "https://finance.yahoo.com/quote/EWY",
    "koru":   "https://finance.yahoo.com/quote/KORU",
    "sp500":  "https://finance.yahoo.com/quote/%5EGSPC",
    "nasdaq": "https://finance.yahoo.com/quote/%5ENDX",
    "dow":    "https://finance.yahoo.com/quote/%5EDJI",
    "vix":    "https://finance.yahoo.com/quote/%5EVIX",
    "wti":    "https://finance.yahoo.com/quote/CL%3DF",
    "gold":   "https://finance.yahoo.com/quote/GC%3DF",
    "us10y":  "https://finance.yahoo.com/quote/%5ETNX",
    "sox":    "https://finance.yahoo.com/quote/%5ESOX",
    "krw":    "https://finance.yahoo.com/quote/KRW%3DX",
}

PRIMARY_FEATURE_CANDIDATES = ["ewy", "krw", "wti", "sp500", "nasdaq", "sox", "koru"]
SECONDARY_INDICATORS = ["us10y", "dow", "gold", "vix"]
LOOKBACK_DAYS = 5 * 365
ROLLING_WINDOW = 120
MIN_FEATURES = 2
MAX_FEATURES = 5

# LightGBM 하이퍼파라미터 (빠른 실행용)
LGBM_PARAMS = {
    "objective": "regression",
    "metric": "rmse",
    "n_estimators": 200,
    "learning_rate": 0.05,
    "num_leaves": 31,
    "min_child_samples": 10,
    "subsample": 0.8,
    "colsample_bytree": 0.8,
    "reg_alpha": 0.1,
    "reg_lambda": 0.1,
    "verbosity": -1,
    "random_state": 42,
}

# Quantile Regression용 파라미터
LGBM_PARAMS_LOW = {**LGBM_PARAMS, "objective": "quantile", "alpha": 0.1}
LGBM_PARAMS_HIGH = {**LGBM_PARAMS, "objective": "quantile", "alpha": 0.9}


@dataclass
class ModelResult:
    features: list[str]
    rmse: float
    mae: float
    band_hit_rate: float
    direction_hit_rate: float
    avg_p_value: float
    avg_vif: float
    predictions: pd.DataFrame
    coefficients: dict[str, float]


def main() -> None:
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    yf.set_tz_cache_location(str(CACHE_DIR))

    market = fetch_market_data()
    dataset = build_model_dataset(market)

    # ── OLS 기반 선형 모델 (피처 선택 기준용, 빠름) ──
    ols_result, candidate_results = select_best_model(dataset)
    final_ols = fit_final_model(dataset, ols_result.features)

    # ── LightGBM 앙상블로 최종 예측 ──
    lgbm_result = train_lgbm(dataset, ols_result.features)

    latest_payload = build_latest_payload(market, lgbm_result, ols_result.features)
    history_df = build_history(ols_result)

    write_coefficients(final_ols.params, ols_result.features, lgbm_result["rmse"])
    write_history_json(history_df, ols_result)
    write_backtest_diagnostics_json(ols_result, candidate_results)
    write_daily_archive_json(history_df, ols_result)
    write_indicators_json(market)
    write_prediction_json(latest_payload, ols_result, lgbm_result, history_df)
    write_backtest_report(dataset, ols_result, final_ols, candidate_results, lgbm_result)

    # 성능 비교 보고서 별도 출력
    print_performance_comparison(ols_result, lgbm_result)


def print_performance_comparison(ols_result: ModelResult, lgbm_result: dict) -> None:
    """OLS vs LightGBM 성능 비교를 콘솔에 출력"""
    print("\n" + "=" * 60)
    print("   📊 모델 성능 비교 보고서 (OLS vs LightGBM)")
    print("=" * 60)
    print(f"  {'지표':<20} {'OLS':>10} {'LightGBM':>12} {'개선율':>10}")
    print("-" * 60)
    ols_rmse = ols_result.rmse
    lgbm_rmse = lgbm_result["rmse"]
    rmse_improvement = (ols_rmse - lgbm_rmse) / ols_rmse * 100
    print(f"  {'RMSE (낮을수록 좋음)':<20} {ols_rmse:>10.2f} {lgbm_rmse:>12.2f} {rmse_improvement:>+9.1f}%")

    ols_mae = ols_result.mae
    lgbm_mae = lgbm_result["mae"]
    mae_improvement = (ols_mae - lgbm_mae) / ols_mae * 100
    print(f"  {'MAE (낮을수록 좋음)':<20} {ols_mae:>10.2f} {lgbm_mae:>12.2f} {mae_improvement:>+9.1f}%")

    ols_band = ols_result.band_hit_rate
    lgbm_band = lgbm_result["band_hit_rate"]
    print(f"  {'밴드 적중률':<20} {ols_band:>9.1f}% {lgbm_band:>11.1f}% {lgbm_band - ols_band:>+9.1f}%p")

    ols_dir = ols_result.direction_hit_rate
    lgbm_dir = lgbm_result["direction_hit_rate"]
    print(f"  {'방향 적중률':<20} {ols_dir:>9.1f}% {lgbm_dir:>11.1f}% {lgbm_dir - ols_dir:>+9.1f}%p")
    print("=" * 60)
    if lgbm_rmse < ols_rmse:
        print(f"  ✅ LightGBM이 RMSE 기준 {abs(rmse_improvement):.1f}% 더 정확합니다.")
    else:
        print(f"  ⚠️  이번 학습에서는 OLS가 더 낮은 RMSE를 보였습니다.")
    print("=" * 60 + "\n")


def fetch_market_data() -> dict[str, pd.DataFrame]:
    period = f"{LOOKBACK_DAYS}d"
    frames: dict[str, pd.DataFrame] = {}
    for name, ticker in {**KOREA_TICKERS, **FEATURE_TICKERS}.items():
        df = yf.download(
            ticker,
            period=period,
            interval="1d",
            auto_adjust=False,
            progress=False,
            threads=False,
        )
        if df.empty:
            raise RuntimeError(f"Failed to fetch data for {name} ({ticker})")
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = df.columns.get_level_values(0)
        frames[name] = df.rename_axis("date").sort_index()
    return frames


def build_model_dataset(market: dict[str, pd.DataFrame]) -> pd.DataFrame:
    kospi = market["kospi"][["Open", "Close"]].copy()
    kospi["target_return"] = (kospi["Open"] / kospi["Close"].shift(1) - 1) * 100
    kospi["prev_close"] = kospi["Close"].shift(1)
    kospi = kospi.dropna()

    features = []
    for name in FEATURE_TICKERS:
        frame = market[name].copy()
        if "Close" not in frame:
            continue
        col = f"{name}_return"
        feature = pd.DataFrame(index=frame.index)
        feature[col] = frame["Close"].pct_change() * 100
        if name == "vix":
            feature["vix_level"] = frame["Close"]
        feature.index = feature.index.map(_normalize_date)
        feature.index = feature.index + pd.offsets.BDay(1)
        feature = feature.groupby(feature.index).last()
        features.append(feature)

    feature_frame = pd.concat(features, axis=1).ffill()
    dataset = kospi.copy()
    dataset.index = dataset.index.map(_normalize_date)
    dataset = dataset.join(feature_frame, how="inner")
    dataset = dataset.ffill().replace([np.inf, -np.inf], np.nan).dropna()

    expected_columns = [f"{name}_return" for name in FEATURE_TICKERS]
    keep_columns = ["target_return", "prev_close", "Open", "Close", "vix_level", *expected_columns]
    keep_columns = [c for c in keep_columns if c in dataset.columns]
    dataset = dataset[keep_columns]

    # KRW=X 상승은 원/달러 상승 → 원화 약세 → 코스피 하방 압력 (음의 관계)
    if "krw_return" in dataset.columns:
        dataset["krw_return"] = dataset["krw_return"]
    return dataset


def train_lgbm(dataset: pd.DataFrame, features: list[str]) -> dict:
    """LightGBM + Quantile Regression 기반 앙상블 모델 학습 및 백테스트"""
    X = dataset[features].values
    y = dataset["target_return"].values
    dates = dataset.index
    prev_closes = dataset["prev_close"].values
    actual_opens = dataset["Open"].values

    tscv = TimeSeriesSplit(n_splits=5)

    rows = []
    for train_idx, test_idx in tscv.split(X):
        if len(train_idx) < ROLLING_WINDOW:
            continue
        X_train, X_test = X[train_idx], X[test_idx]
        y_train = y[train_idx]

        # 중심값 예측 모델
        model_center = lgb.LGBMRegressor(**LGBM_PARAMS)
        model_center.fit(X_train, y_train)

        # 하단 밴드 모델 (10th percentile)
        model_low = lgb.LGBMRegressor(**LGBM_PARAMS_LOW)
        model_low.fit(X_train, y_train)

        # 상단 밴드 모델 (90th percentile)
        model_high = lgb.LGBMRegressor(**LGBM_PARAMS_HIGH)
        model_high.fit(X_train, y_train)

        pred_center = model_center.predict(X_test)
        pred_low = model_low.predict(X_test)
        pred_high = model_high.predict(X_test)

        for i, idx in enumerate(test_idx):
            if idx >= len(prev_closes):
                continue
            prev_close = prev_closes[idx]
            actual_open = actual_opens[idx]
            pred_open = prev_close * (1 + pred_center[i] / 100)
            band_low = prev_close * (1 + pred_low[i] / 100)
            band_high = prev_close * (1 + pred_high[i] / 100)
            actual_return = y[idx]
            rows.append({
                "date": dates[idx].strftime("%Y-%m-%d"),
                "pred_open": pred_open,
                "actual_open": actual_open,
                "low": band_low,
                "high": band_high,
                "pred_return": pred_center[i],
                "actual_return": actual_return,
                "hit": band_low <= actual_open <= band_high,
                "direction_hit": np.sign(pred_center[i]) == np.sign(actual_return),
            })

    if not rows:
        # fallback: 전체 데이터로 한 번 학습
        model_center = lgb.LGBMRegressor(**LGBM_PARAMS)
        model_center.fit(X, y)
        return {
            "model_center": model_center, "model_low": None, "model_high": None,
            "rmse": 999.0, "mae": 999.0, "band_hit_rate": 0.0, "direction_hit_rate": 0.0,
            "feature_importance": dict(zip(features, model_center.feature_importances_)),
        }

    predictions = pd.DataFrame(rows)
    errors = predictions["pred_open"] - predictions["actual_open"]
    rmse = float(np.sqrt(np.mean(np.square(errors))))
    mae = float(np.mean(np.abs(errors)))
    band_hit_rate = float(predictions["hit"].mean() * 100)
    direction_hit_rate = float(predictions["direction_hit"].mean() * 100)

    # 최종 모델을 전체 데이터로 재학습
    final_center = lgb.LGBMRegressor(**LGBM_PARAMS)
    final_low = lgb.LGBMRegressor(**LGBM_PARAMS_LOW)
    final_high = lgb.LGBMRegressor(**LGBM_PARAMS_HIGH)
    final_center.fit(X, y)
    final_low.fit(X, y)
    final_high.fit(X, y)

    feature_importance = dict(zip(features, final_center.feature_importances_))

    return {
        "model_center": final_center,
        "model_low": final_low,
        "model_high": final_high,
        "rmse": rmse,
        "mae": mae,
        "band_hit_rate": band_hit_rate,
        "direction_hit_rate": direction_hit_rate,
        "feature_importance": feature_importance,
        "predictions": predictions,
    }


def select_best_model(dataset: pd.DataFrame) -> tuple[ModelResult, list[ModelResult]]:
    candidate_names = [f"{name}_return" for name in PRIMARY_FEATURE_CANDIDATES if f"{name}_return" in dataset.columns]
    results: list[ModelResult] = []

    for size in range(MIN_FEATURES, min(MAX_FEATURES, len(candidate_names)) + 1):
        for combo in itertools.combinations(candidate_names, size):
            result = evaluate_feature_set(dataset, list(combo))
            if result is not None:
                results.append(result)

    if not results:
        raise RuntimeError("No valid model candidates were produced.")

    results.sort(
        key=lambda item: (
            round(item.rmse, 6),
            -round(item.band_hit_rate, 6),
            round(item.avg_p_value, 6),
            round(item.avg_vif, 6),
        )
    )
    return results[0], results


def evaluate_feature_set(dataset: pd.DataFrame, features: list[str]) -> ModelResult | None:
    rows: list[dict[str, float | str]] = []
    base_X = sm.add_constant(dataset[features], has_constant="add")
    base_model = sm.OLS(dataset["target_return"], base_X).fit()
    feature_pvals = base_model.pvalues.drop("const", errors="ignore")
    if (feature_pvals > 0.1).any():
        return None

    vifs = compute_vif(dataset[features])
    if any(math.isnan(v) or v > 5 for v in vifs.values()):
        return None

    for end in range(ROLLING_WINDOW, len(dataset)):
        train = dataset.iloc[end - ROLLING_WINDOW:end]
        test = dataset.iloc[end : end + 1]
        X_train = sm.add_constant(train[features], has_constant="add")
        y_train = train["target_return"]
        model = sm.OLS(y_train, X_train).fit()

        X_test = sm.add_constant(test[features], has_constant="add")
        pred_return = float(model.predict(X_test).iloc[0])
        actual_return = float(test["target_return"].iloc[0])
        prev_close = float(test["prev_close"].iloc[0])
        pred_open = prev_close * (1 + pred_return / 100)
        actual_open = float(test["Open"].iloc[0])
        residuals = y_train - model.predict(X_train)
        residual_std_points = float(residuals.std(ddof=1) / 100 * prev_close)
        vix_level = float(test["vix_level"].iloc[0]) if "vix_level" in test else 20.0
        band_multiplier = choose_band_multiplier(vix_level)
        band_width = residual_std_points * band_multiplier
        low = pred_open - band_width
        high = pred_open + band_width

        rows.append(
            {
                "date": test.index[0].strftime("%Y-%m-%d"),
                "pred_return": pred_return,
                "actual_return": actual_return,
                "pred_open": pred_open,
                "actual_open": actual_open,
                "prev_close": prev_close,
                "low": low,
                "high": high,
                "hit": low <= actual_open <= high,
                "direction_hit": np.sign(pred_return) == np.sign(actual_return),
            }
        )
    if len(rows) < 30:
        return None

    predictions = pd.DataFrame(rows)
    errors = predictions["pred_open"] - predictions["actual_open"]
    rmse = float(np.sqrt(np.mean(np.square(errors))))
    mae = float(np.mean(np.abs(errors)))
    band_hit_rate = float(predictions["hit"].mean() * 100)
    direction_hit_rate = float(predictions["direction_hit"].mean() * 100)

    return ModelResult(
        features=features,
        rmse=rmse,
        mae=mae,
        band_hit_rate=band_hit_rate,
        direction_hit_rate=direction_hit_rate,
        avg_p_value=float(feature_pvals.mean()),
        avg_vif=float(np.mean(list(vifs.values()))) if vifs else 0.0,
        predictions=predictions,
        coefficients={name: float(base_model.params.get(name, 0.0)) for name in ["const", *features]},
    )


def compute_vif(df: pd.DataFrame) -> dict[str, float]:
    vif_map: dict[str, float] = {}
    if df.shape[1] <= 1:
        return {col: 1.0 for col in df.columns}
    for column in df.columns:
        y = df[column]
        X = df.drop(columns=[column])
        X = sm.add_constant(X, has_constant="add")
        model = sm.OLS(y, X).fit()
        r_squared = float(model.rsquared)
        if r_squared >= 0.9999:
            vif_map[column] = float("inf")
        else:
            vif_map[column] = 1 / (1 - r_squared)
    return vif_map


def fit_final_model(dataset: pd.DataFrame, features: list[str]):
    final_train = dataset.iloc[-ROLLING_WINDOW:].copy()
    X = sm.add_constant(final_train[features], has_constant="add")
    y = final_train["target_return"]
    return sm.OLS(y, X).fit()


def build_latest_payload(
    dataset_map: dict[str, pd.DataFrame],
    lgbm_result: dict,
    features: list[str],
) -> dict:
    """LightGBM 모델로 최신 시점 예측 계산"""
    latest_returns = {}
    latest_values = {}
    vix_level = 20.0

    for name in FEATURE_TICKERS:
        series = dataset_map[name]["Close"].dropna()
        latest_close = float(series.iloc[-1])
        prev_close_val = float(series.iloc[-2])
        ret = (latest_close / prev_close_val - 1) * 100
        latest_returns[name] = ret
        latest_values[name] = latest_close
        if name == "vix":
            vix_level = latest_close

    prev_kospi_close = float(dataset_map["kospi"]["Close"].dropna().iloc[-1])

    # LightGBM 예측
    feature_vector = np.array([[latest_returns.get(f.replace("_return", ""), 0.0) for f in features]])
    model_center = lgbm_result["model_center"]
    model_low = lgbm_result.get("model_low")
    model_high = lgbm_result.get("model_high")

    pred_return_center = float(model_center.predict(feature_vector)[0])
    pred_return_low = float(model_low.predict(feature_vector)[0]) if model_low else pred_return_center - 0.5
    pred_return_high = float(model_high.predict(feature_vector)[0]) if model_high else pred_return_center + 0.5

    return {
        "returns": latest_returns,
        "values": latest_values,
        "rmse": lgbm_result["rmse"],
        "vix_level": vix_level,
        "prev_kospi_close": prev_kospi_close,
        "pred_return_center": pred_return_center,
        "pred_return_low": pred_return_low,
        "pred_return_high": pred_return_high,
        "feature_importance": lgbm_result.get("feature_importance", {}),
    }


def build_history(model_result: ModelResult) -> pd.DataFrame:
    history = model_result.predictions.copy()
    history["low"] = history["low"].round(2)
    history["high"] = history["high"].round(2)
    history["actual_open"] = history["actual_open"].round(2)
    history = history.sort_values("date", ascending=False).head(20).reset_index(drop=True)
    return history


def write_coefficients(params: pd.Series, features: list[str], rmse: float) -> None:
    coefs: dict[str, float] = {k: round(float(v), 6) for k, v in params.items()}
    payload = {
        "features": features,
        "coefficients": coefs,
        "rmse": round(rmse, 4),
        "generatedAt": datetime.now(timezone.utc).isoformat(),
    }
    (DATA_DIR / "coefficients.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf8")


def write_history_json(history_df: pd.DataFrame, model_result: ModelResult) -> None:
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
        "summary": {
            "bandHitRate30d": round(model_result.band_hit_rate, 1),
            "directionHitRate30d": round(model_result.direction_hit_rate, 1),
            "mae30d": round(model_result.mae, 2),
        },
        "records": records,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
    }
    (DATA_DIR / "history.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf8")


def write_backtest_diagnostics_json(model_result: ModelResult, candidate_results: list[ModelResult]) -> None:
    payload = {
        "selectedFeatures": model_result.features,
        "rmse": round(model_result.rmse, 4),
        "mae": round(model_result.mae, 4),
        "bandHitRate": round(model_result.band_hit_rate, 2),
        "directionHitRate": round(model_result.direction_hit_rate, 2),
        "avgPValue": round(model_result.avg_p_value, 6),
        "avgVIF": round(model_result.avg_vif, 4),
        "topCandidates": [
            {
                "features": c.features,
                "rmse": round(c.rmse, 4),
                "bandHitRate": round(c.band_hit_rate, 2),
                "directionHitRate": round(c.direction_hit_rate, 2),
            }
            for c in candidate_results[:10]
        ],
        "generatedAt": datetime.now(timezone.utc).isoformat(),
    }
    (DATA_DIR / "backtest_diagnostics.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf8")


def write_daily_archive_json(history_df: pd.DataFrame, model_result: ModelResult) -> None:
    daily_dir = DATA_DIR / "daily"
    daily_dir.mkdir(parents=True, exist_ok=True)
    records = [
        {
            "date": row["date"],
            "predReturn": round(float(row["pred_return"]), 4),
            "actualReturnPct": round(float(row["actual_return"]), 2),
            "bandLow": round(float(row["low"]), 2),
            "bandHigh": round(float(row["high"]), 2),
            "hit": bool(row["hit"]),
            "directionHit": bool(row["direction_hit"]),
        }
        for _, row in history_df.iterrows()
    ]
    latest_date = records[0]["date"] if records else datetime.now().strftime("%Y-%m-%d")
    payload = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "selectedFeatures": model_result.features,
        "records": records,
    }
    (daily_dir / f"{latest_date}.json").write_text(
        json.dumps(payload, ensure_ascii=False, indent=2),
        encoding="utf8",
    )


def write_indicators_json(market: dict[str, pd.DataFrame]) -> None:
    primary_keys = ["ewy", "krw", "wti", "sp500"]
    secondary_keys = ["nasdaq", "vix", "koru", "dow", "gold", "us10y", "sox"]

    def build_indicator(name: str) -> dict[str, object]:
        valid_series = market[name]["Close"].dropna()
        close = float(valid_series.iloc[-1])
        prev_close_val = float(valid_series.iloc[-2])
        change_pct = (close / prev_close_val - 1) * 100
        # KRW=X는 USD 기준 → 환율 상승 = 원화 약세 = 코스피 하방
        # 표시는 "환율" 그대로 오르면 ▲ 붉게 (원화 약세 경고 의미)
        return {
            "key": name,
            "label": indicator_label(name),
            "value": format_indicator_value(name, close),
            "changePct": round(change_pct, 2),
            "updatedAt": pd.Timestamp(valid_series.index[-1]).isoformat(),
            "sourceUrl": INDICATOR_SOURCE_URLS.get(name, "https://finance.yahoo.com"),
            "dataSource": "Yahoo Finance (일봉 종가 기준)",
        }

    payload = {
        "primary": [build_indicator(key) for key in primary_keys],
        "secondary": [build_indicator(key) for key in secondary_keys],
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "dataNote": "야후 파이낸스 일봉 종가 기준. 야간 실시간 선물 데이터는 EWY, KORU, KRW=X 프록시로 대체됩니다.",
    }
    (DATA_DIR / "indicators.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf8")


def write_prediction_json(
    latest_payload: dict,
    ols_result: ModelResult,
    lgbm_result: dict,
    history_df: pd.DataFrame,
) -> None:
    prev_close = latest_payload["prev_kospi_close"]
    recent30 = ols_result.predictions.tail(30)
    recent_band_hit = round(float(recent30["hit"].mean() * 100), 1)
    recent_direction_hit = round(float(recent30["direction_hit"].mean() * 100), 1)
    recent_mae = round(float((recent30["pred_open"] - recent30["actual_open"]).abs().mean()), 2)

    # LightGBM 기반 최종 예측값 사용
    pred_return_center = latest_payload["pred_return_center"]
    pred_return_low = latest_payload["pred_return_low"]
    pred_return_high = latest_payload["pred_return_high"]

    point_prediction = prev_close * (1 + pred_return_center / 100)
    range_low = prev_close * (1 + pred_return_low / 100)
    range_high = prev_close * (1 + pred_return_high / 100)
    # 예측 상한/하한 최소 폭 보장
    if range_high - range_low < 20:
        mid_gap = lgbm_result["rmse"] * choose_band_multiplier(latest_payload["vix_level"])
        range_low = point_prediction - mid_gap
        range_high = point_prediction + mid_gap

    vix_level = latest_payload["vix_level"]
    returns = latest_payload["returns"]
    feature_importance = latest_payload.get("feature_importance", {})
    feature_keys = [f.replace("_return", "") for f in ols_result.features]
    direction_values = [returns.get(k, 0.0) for k in feature_keys]
    positive_count = sum(1 for v in direction_values if v > 0)
    negative_count = sum(1 for v in direction_values if v < 0)
    dominant_agreement = max(positive_count, negative_count)

    if dominant_agreement >= 2 and vix_level < 30:
        confidence = 5
    elif dominant_agreement >= 1 and vix_level < 35:
        confidence = 4
    elif vix_level < 40:
        confidence = 3
    else:
        confidence = 2

    yesterday_row = history_df.iloc[0] if not history_df.empty else None

    # next business day
    today = datetime.now()
    bday = pd.Timestamp(today) + pd.offsets.BDay(1)
    prediction_date = bday.strftime("%Y년 %m월 %d일")

    payload = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "predictionDate": prediction_date,
        "modelEngine": "LightGBM (Quantile Regression)",
        "pointPrediction": round(point_prediction, 2),
        "rangeLow": round(range_low, 2),
        "rangeHigh": round(range_high, 2),
        "predictedChangePct": round(pred_return_center, 2),
        "confidence": confidence,
        "confidenceLabel": confidence_label(confidence),
        "bandHitRate30d": recent_band_hit,
        "directionHitRate30d": recent_direction_hit,
        "mae30d": recent_mae,
        "signalSummary": build_signal_summary(returns, ols_result.features),
        "marketStatus": "장 마감 후",
        "lastCalculatedAt": datetime.now(timezone.utc).isoformat(),
        "model": {
            "engine": "LightGBM",
            "selectedFeatures": ols_result.features,
            "featureImportance": {k: round(v, 4) for k, v in feature_importance.items()},
            "vix": round(vix_level, 2),
            "bandMultiplier": choose_band_multiplier(vix_level),
            "lgbmRmse": round(lgbm_result["rmse"], 2),
            "olsRmse": round(ols_result.rmse, 2),
        },
        "yesterday": {
            "predictionLow": round(float(yesterday_row["low"]), 2) if yesterday_row is not None else 0,
            "predictionHigh": round(float(yesterday_row["high"]), 2) if yesterday_row is not None else 0,
            "actualOpen": round(float(yesterday_row["actual_open"]), 2) if yesterday_row is not None else 0,
            "hit": bool(yesterday_row["hit"]) if yesterday_row is not None else False,
        },
    }
    (DATA_DIR / "prediction.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf8")


def write_backtest_report(
    dataset: pd.DataFrame,
    model_result: ModelResult,
    final_model,
    candidate_results: list[ModelResult],
    lgbm_result: dict,
) -> None:
    DOCS_DIR.mkdir(parents=True, exist_ok=True)
    feature_rows = "\n".join(
        f"| {name} | {round(float(value), 6)} | {round(float(final_model.pvalues.get(name, 0.0)), 6)} |"
        for name, value in final_model.params.items()
    )
    ranking_rows = "\n".join(
        f"| {idx + 1} | {', '.join(candidate.features)} | {candidate.rmse:.2f} | {candidate.band_hit_rate:.2f}% | {candidate.direction_hit_rate:.2f}% |"
        for idx, candidate in enumerate(candidate_results[:5])
    )
    fi = lgbm_result.get("feature_importance", {})
    fi_rows = "\n".join(f"| {k} | {v:.0f} |" for k, v in sorted(fi.items(), key=lambda x: -x[1]))

    ols_rmse = model_result.rmse
    lgbm_rmse = lgbm_result["rmse"]
    improvement = (ols_rmse - lgbm_rmse) / ols_rmse * 100

    report = f"""# Backtest Results

## Dataset

- rows: {len(dataset)}
- rolling window: {ROLLING_WINDOW}
- evaluated feature subsets: 2~5 variables

## 모델 엔진 성능 비교

| 지표 | OLS (선형회귀) | LightGBM | 개선율 |
| --- | ---: | ---: | ---: |
| RMSE | {ols_rmse:.2f} | {lgbm_rmse:.2f} | {improvement:+.1f}% |
| MAE | {model_result.mae:.2f} | {lgbm_result['mae']:.2f} | {(model_result.mae - lgbm_result['mae']) / model_result.mae * 100:+.1f}% |
| 밴드 적중률 | {model_result.band_hit_rate:.2f}% | {lgbm_result['band_hit_rate']:.2f}% | {lgbm_result['band_hit_rate'] - model_result.band_hit_rate:+.1f}%p |
| 방향 적중률 | {model_result.direction_hit_rate:.2f}% | {lgbm_result['direction_hit_rate']:.2f}% | {lgbm_result['direction_hit_rate'] - model_result.direction_hit_rate:+.1f}%p |

## Selected Model (OLS 피처 선택 기준)

{feature_rows}

## LightGBM Feature Importance

| Feature | Importance |
| --- | ---: |
{fi_rows}

## Top OLS Candidates

| Rank | Features | RMSE | Band Hit | Dir Hit |
| --- | --- | ---: | ---: | ---: |
{ranking_rows}

## Data Source Notes

- **데이터 출처**: Yahoo Finance 일봉 종가 기준 (yfinance 라이브러리)
- **야간선물 실시간 데이터**: 현재 파이프라인 미연결. EWY, KORU, KRW=X 등 미국장 후행 프록시 사용
- **환율(KRW=X)**: USD 1 = KRW x원 기준. 수치 상승 = 원화 약세 = 코스피 하방 압력
- **밴드 폭(LightGBM)**: Quantile Regression (10th ~ 90th percentile) 기반 동적 산출
"""
    (DOCS_DIR / "BACKTEST_RESULTS.md").write_text(report, encoding="utf8")


def choose_band_multiplier(vix: float) -> float:
    if vix < 20:
        return 1.0
    if vix < 25:
        return 1.3
    if vix < 30:
        return 1.5
    return 2.0


def indicator_label(name: str) -> str:
    labels = {
        "ewy":    "EWY (한국 ETF)",
        "krw":    "원/달러 환율",
        "wti":    "WTI 원유",
        "sp500":  "S&P 500",
        "nasdaq": "나스닥 100",
        "vix":    "VIX 변동성",
        "koru":   "KORU (코리아 3x)",
        "dow":    "다우존스",
        "gold":   "금 시세",
        "us10y":  "미 10년 국채금리",
        "sox":    "필라델피아 반도체",
    }
    return labels[name]


def format_indicator_value(name: str, close: float) -> str:
    if name in {"ewy", "koru", "wti", "gold"}:
        return f"${close:,.2f}"
    if name == "krw":
        return f"{close:,.2f}원"
    if name == "us10y":
        return f"{close:.2f}%"
    return f"{close:,.2f}"


def confidence_label(score: int) -> str:
    return {
        5: "매우 높음",
        4: "높음",
        3: "보통",
        2: "낮음",
        1: "매우 낮음",
    }[score]


def build_signal_summary(returns: dict[str, float], selected_features: list[str]) -> str:
    parts = []
    for feature in selected_features:
        key = feature.replace("_return", "")
        value = returns.get(key, 0)
        label = indicator_label(key)
        if value > 0:
            parts.append(f"{label} 강세")
        elif value < 0:
            parts.append(f"{label} 약세")
        else:
            parts.append(f"{label} 보합")
    return ", ".join(parts)


def _normalize_date(value: pd.Timestamp) -> pd.Timestamp:
    return pd.Timestamp(value).tz_localize(None).normalize()


if __name__ == "__main__":
    main()
