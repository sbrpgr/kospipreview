from __future__ import annotations

import itertools
import json
import math
import sys
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import pandas as pd
import statsmodels.api as sm
ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

import yfinance as yf

from model.predictor import Coefficients, PredictionInput, calculate_prediction

DATA_DIR = ROOT / "data"
DOCS_DIR = ROOT / "docs"
MODEL_DIR = ROOT / "model"
CACHE_DIR = ROOT / ".cache" / "yfinance"

KOREA_TICKERS = {
    "kospi": "^KS11",
}

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

PRIMARY_FEATURE_CANDIDATES = ["ewy", "krw", "wti", "sp500", "nasdaq", "sox", "koru"]
SECONDARY_INDICATORS = ["us10y", "dow", "gold", "vix"]
LOOKBACK_DAYS = 5 * 365
ROLLING_WINDOW = 120
MIN_FEATURES = 2
MAX_FEATURES = 5


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
    model_result, candidate_results = select_best_model(dataset)
    final_model = fit_final_model(dataset, model_result.features)
    latest_payload = build_latest_payload(market, final_model.params, model_result.rmse)
    history_df = build_history(model_result)

    write_coefficients(final_model.params, model_result.features, model_result.rmse)
    write_history_json(history_df, model_result)
    write_backtest_diagnostics_json(model_result, candidate_results)
    write_daily_archive_json(history_df, model_result)
    write_indicators_json(market)
    write_prediction_json(latest_payload, model_result, history_df)
    write_backtest_report(dataset, model_result, final_model, candidate_results)


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

    feature_frame = pd.concat(features, axis=1)
    dataset = kospi.copy()
    dataset.index = dataset.index.map(_normalize_date)
    dataset = dataset.join(feature_frame, how="inner")
    dataset = dataset.replace([np.inf, -np.inf], np.nan).dropna()

    expected_columns = [f"{name}_return" for name in FEATURE_TICKERS]
    keep_columns = ["target_return", "prev_close", "Open", "Close", "vix_level", *expected_columns]
    keep_columns = [c for c in keep_columns if c in dataset.columns]
    dataset = dataset[keep_columns]

    # KRW=X 상승은 원/달러 상승이라 코스피에는 보통 음수 방향이다.
    if "krw_return" in dataset.columns:
        dataset["krw_return"] = dataset["krw_return"]
    return dataset


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


def build_latest_payload(dataset_map: dict[str, pd.DataFrame], params: pd.Series, rmse: float) -> dict[str, float]:
    latest = {}
    for name in FEATURE_TICKERS:
        latest_return = float(dataset_map[name]["Close"].pct_change().dropna().iloc[-1] * 100)
        latest[name] = latest_return
        if name == "vix":
            latest["vix_level"] = float(dataset_map[name]["Close"].iloc[-1])
        latest[f"{name}_value"] = float(dataset_map[name]["Close"].iloc[-1])

    latest["prev_kospi_close"] = float(dataset_map["kospi"]["Close"].iloc[-1])
    return {
        "returns": latest,
        "rmse": rmse,
        "params": params.to_dict(),
    }


def build_history(model_result: ModelResult) -> pd.DataFrame:
    history = model_result.predictions.copy()
    history["low"] = history["low"].round(2)
    history["high"] = history["high"].round(2)
    history["actual_open"] = history["actual_open"].round(2)
    # 최신 날짜가 앞으로 오도록 정렬 후 최근 20건만 유지
    history = history.sort_values("date", ascending=False).head(20).reset_index(drop=True)
    return history


def write_coefficients(params: pd.Series, features: list[str], rmse: float) -> None:
    mapping = {
        "ewy_return": "alpha2",
        "krw_return": "alpha3",
        "wti_return": "alpha4",
        "sp500_return": "alpha5",
    }
    payload = {
        "alpha0": round(float(params.get("const", 0.0)), 6),
        "alpha1": 0.0,
        "alpha2": 0.0,
        "alpha3": 0.0,
        "alpha4": 0.0,
        "alpha5": 0.0,
        "residualStd": round(float(rmse), 6),
        "selectedFeatures": features,
        "coefficientsByFeature": {
            feature: round(float(params.get(feature, 0.0)), 6) for feature in features
        },
        "updatedAt": datetime.now(timezone.utc).isoformat(),
        "source": "rolling-backtest",
    }
    for feature in features:
        if feature in mapping:
            payload[mapping[feature]] = round(float(params.get(feature, 0.0)), 6)
    (MODEL_DIR / "coefficients.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf8")


def write_history_json(history_df: pd.DataFrame, model_result: ModelResult) -> None:
    recent30 = model_result.predictions.tail(30)
    records = [
        {
            "date": row["date"],
            "low": row["low"],
            "high": row["high"],
            "actualOpen": row["actual_open"],
            "hit": bool(row["hit"]),
        }
        for _, row in history_df.iloc[::-1].iterrows()
    ]
    payload = {
        "summary": {
            "bandHitRate30d": round(float(recent30["hit"].mean() * 100), 1),
            "directionHitRate30d": round(float(recent30["direction_hit"].mean() * 100), 1),
            "mae30d": round(float((recent30["pred_open"] - recent30["actual_open"]).abs().mean()), 2),
        },
        "records": records,
    }
    (DATA_DIR / "history.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf8")


def write_backtest_diagnostics_json(model_result: ModelResult, candidate_results: list[ModelResult]) -> None:
    recent30 = model_result.predictions.tail(30).copy()
    recent30["abs_error"] = (recent30["pred_open"] - recent30["actual_open"]).abs()
    candidate_payload = [
        {
            "rank": idx + 1,
            "features": candidate.features,
            "rmse": round(candidate.rmse, 2),
            "mae": round(candidate.mae, 2),
            "bandHitRate": round(candidate.band_hit_rate, 2),
            "directionHitRate": round(candidate.direction_hit_rate, 2),
            "avgPValue": round(candidate.avg_p_value, 6),
            "avgVif": round(candidate.avg_vif, 4),
        }
        for idx, candidate in enumerate(candidate_results[:10])
    ]
    recent_records = [
        {
            "date": row["date"],
            "predOpen": round(float(row["pred_open"]), 2),
            "actualOpen": round(float(row["actual_open"]), 2),
            "error": round(float(row["pred_open"] - row["actual_open"]), 2),
            "absError": round(float(row["abs_error"]), 2),
            "bandLow": round(float(row["low"]), 2),
            "bandHigh": round(float(row["high"]), 2),
            "hit": bool(row["hit"]),
            "directionHit": bool(row["direction_hit"]),
        }
        for _, row in recent30.iloc[::-1].iterrows()
    ]
    payload = {
        "selectedModel": {
            "features": model_result.features,
            "coefficients": {k: round(v, 6) for k, v in model_result.coefficients.items()},
            "rmse": round(model_result.rmse, 2),
            "mae": round(model_result.mae, 2),
            "bandHitRate": round(model_result.band_hit_rate, 2),
            "directionHitRate": round(model_result.direction_hit_rate, 2),
        },
        "candidateRanking": candidate_payload,
        "recent30Diagnostics": recent_records,
    }
    (DATA_DIR / "backtest_diagnostics.json").write_text(
        json.dumps(payload, ensure_ascii=False, indent=2),
        encoding="utf8",
    )


def write_daily_archive_json(history_df: pd.DataFrame, model_result: ModelResult) -> None:
    daily_dir = DATA_DIR / "daily"
    daily_dir.mkdir(parents=True, exist_ok=True)
    records = []
    for _, row in model_result.predictions.iloc[::-1].iterrows():
        records.append(
            {
                "date": row["date"],
                "predictedOpen": round(float(row["pred_open"]), 2),
                "actualOpen": round(float(row["actual_open"]), 2),
                "predictedReturnPct": round(float(row["pred_return"]), 2),
                "actualReturnPct": round(float(row["actual_return"]), 2),
                "bandLow": round(float(row["low"]), 2),
                "bandHigh": round(float(row["high"]), 2),
                "hit": bool(row["hit"]),
                "directionHit": bool(row["direction_hit"]),
            }
        )
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
        frame = market[name]
        close = float(frame["Close"].iloc[-1])
        prev_close = float(frame["Close"].iloc[-2])
        change_pct = (close / prev_close - 1) * 100
        return {
            "key": name,
            "label": indicator_label(name),
            "value": format_indicator_value(name, close),
            "changePct": round(change_pct, 2),
            "updatedAt": pd.Timestamp(frame.index[-1]).isoformat(),
        }

    payload = {
        "primary": [build_indicator(key) for key in primary_keys],
        "secondary": [build_indicator(key) for key in secondary_keys],
    }
    (DATA_DIR / "indicators.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf8")


def write_prediction_json(latest_payload: dict[str, object], model_result: ModelResult, history_df: pd.DataFrame) -> None:
    returns = latest_payload["returns"]
    params = latest_payload["params"]
    prev_close = float(returns["prev_kospi_close"])
    recent30 = model_result.predictions.tail(30)
    recent_band_hit = round(float(recent30["hit"].mean() * 100), 1)
    recent_direction_hit = round(float(recent30["direction_hit"].mean() * 100), 1)
    recent_mae = round(float((recent30["pred_open"] - recent30["actual_open"]).abs().mean()), 2)
    predicted_change = float(params.get("const", 0.0))
    selected_feature_returns: dict[str, float] = {}
    for feature in model_result.features:
        key = feature.replace("_return", "")
        feature_value = float(returns.get(key, 0.0))
        selected_feature_returns[feature] = feature_value
        predicted_change += float(params.get(feature, 0.0)) * feature_value

    point_prediction = prev_close * (1 + predicted_change / 100)
    vix_level = float(returns.get("vix_level", 20.0))
    band_multiplier = choose_band_multiplier(vix_level)
    band_width = float(latest_payload["rmse"]) * band_multiplier
    direction_values = list(selected_feature_returns.values())
    positive_count = sum(1 for value in direction_values if value > 0)
    negative_count = sum(1 for value in direction_values if value < 0)
    dominant_agreement = max(positive_count, negative_count)
    if dominant_agreement >= 2 and vix_level < 30:
        confidence = 5
    elif dominant_agreement >= 1 and vix_level < 35:
        confidence = 4
    elif vix_level < 40:
        confidence = 3
    else:
        confidence = 2

    # Keep the fixed-schema predictor around as a comparable benchmark using common macro inputs.
    benchmark_prediction = calculate_prediction(
        PredictionInput(
            night_futures_change=float(returns.get("koru", 0.0)),
            ewy_change=float(returns.get("ewy", 0.0)),
            ndf_change=float(returns.get("krw", 0.0)),
            wti_change=float(returns.get("wti", 0.0)),
            sp500_change=float(returns.get("sp500", 0.0)),
            vix=vix_level,
            night_futures_price=0.0,
        ),
        Coefficients(
            alpha0=float(params.get("const", 0.0)),
            alpha1=float(params.get("koru_return", 0.0)),
            alpha2=float(params.get("ewy_return", 0.0)),
            alpha3=float(params.get("krw_return", 0.0)),
            alpha4=float(params.get("wti_return", 0.0)),
            alpha5=float(params.get("sp500_return", 0.0)),
            residual_std=float(latest_payload["rmse"]),
        ),
        prev_close,
    )
    recent = history_df.iloc[0]  # 최신 날짜 (build_history에서 내림차순 정렬됨)
    payload = {
        "marketStatus": "한국장 개장 전",
        "currentTimeKst": pd.Timestamp.utcnow().tz_convert("Asia/Seoul").isoformat(),
        "predictionDate": (pd.Timestamp.utcnow().tz_convert("Asia/Seoul") + pd.offsets.BDay(1)).strftime("%Y-%m-%d"),
        "rangeLow": round(point_prediction - band_width),
        "rangeHigh": round(point_prediction + band_width),
        "pointPrediction": round(point_prediction),
        "predictedChangePct": round(predicted_change, 2),
        "confidence": confidence,
        "confidenceLabel": confidence_label(confidence),
        "signalSummary": build_signal_summary(returns, model_result.features),
        "lastCalculatedAt": pd.Timestamp.utcnow().tz_convert("Asia/Seoul").isoformat(),
        "bandHitRate30d": recent_band_hit,
        "directionHitRate30d": recent_direction_hit,
        "mae30d": recent_mae,
        "yesterday": {
            "predictionLow": recent["low"],
            "predictionHigh": recent["high"],
            "actualOpen": recent["actual_open"],
            "hit": bool(recent["hit"]),
        },
        "model": {
            "modelA": round(point_prediction, 2),
            "modelB": benchmark_prediction["point_prediction"],
            "divergencePct": round(abs(point_prediction - float(benchmark_prediction["point_prediction"])) / prev_close * 100, 2),
            "bandMultiplier": band_multiplier,
            "vix": round(vix_level, 2),
            "selectedFeatures": model_result.features,
        }
    }
    (DATA_DIR / "prediction.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf8")


def write_backtest_report(
    dataset: pd.DataFrame,
    model_result: ModelResult,
    final_model,
    candidate_results: list[ModelResult],
) -> None:
    feature_rows = "\n".join(f"- `{feature}`" for feature in model_result.features)
    coef_rows = "\n".join(
        f"| {name} | {round(float(value), 6)} | {round(float(final_model.pvalues.get(name, 0.0)), 6)} |"
        for name, value in final_model.params.items()
    )
    ranking_rows = "\n".join(
        f"| {idx + 1} | {', '.join(candidate.features)} | {candidate.rmse:.2f} | {candidate.band_hit_rate:.2f}% | {candidate.direction_hit_rate:.2f}% |"
        for idx, candidate in enumerate(candidate_results[:5])
    )
    report = f"""# Backtest Results

## Dataset

- rows: {len(dataset)}
- rolling window: {ROLLING_WINDOW}
- evaluated feature subsets: 2~5 variables

## Selected Model

선정 기준은 `rolling RMSE` 최소값입니다. 동률이면 밴드 적중률, 평균 p-value, 평균 VIF 순으로 비교했습니다.

선택된 변수:
{feature_rows}

## Metrics

- RMSE: {model_result.rmse:.2f}
- MAE: {model_result.mae:.2f}
- Band hit rate: {model_result.band_hit_rate:.2f}%
- Direction hit rate: {model_result.direction_hit_rate:.2f}%
- Average p-value: {model_result.avg_p_value:.4f}
- Average VIF: {model_result.avg_vif:.4f}

## Final Window Coefficients

| term | coefficient | p-value |
| --- | ---: | ---: |
{coef_rows}

## Top Candidate Ranking

| rank | features | RMSE | Band hit rate | Direction hit rate |
| --- | --- | ---: | ---: | ---: |
{ranking_rows}

## Notes

- Yahoo Finance 일별 데이터 기준으로 미국장 종가를 다음 한국장 시초가에 정렬했습니다.
- 야간선물 실시간 데이터는 현재 파이프라인에 연결되지 않아 `KORU`, `EWY`, `KRW=X` 등 미국장 후행 프록시를 우선 사용했습니다.
- 밴드 폭은 롤링 RMSE를 포인트 단위 표준오차로 사용하고 VIX 배수로 확장했습니다.
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
        "ewy": "EWY",
        "krw": "USD/KRW",
        "wti": "WTI",
        "sp500": "S&P500",
        "nasdaq": "나스닥",
        "vix": "VIX",
        "koru": "KORU",
        "dow": "다우",
        "gold": "금 시세",
        "us10y": "US10Y",
        "sox": "필라델피아반도체",
    }
    return labels[name]


def format_indicator_value(name: str, close: float) -> str:
    if name in {"ewy", "koru", "wti", "gold"}:
        return f"${close:,.2f}"
    if name == "krw":
        return f"{close:,.2f}"
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
