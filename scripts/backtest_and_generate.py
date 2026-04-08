from __future__ import annotations

import json
import sys
import warnings
from datetime import datetime, timezone, timedelta
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

DATA_DIR = ROOT / "frontend" / "public" / "data"
DOCS_DIR = ROOT / "docs"
CACHE_DIR = ROOT / ".cache" / "yfinance"

KOREA_TICKERS = {"kospi": "^KS11"}
FEATURE_TICKERS = {
    "ewy": "EWY", "koru": "KORU", "sp500": "^GSPC", "nasdaq": "^NDX",
    "dow": "^DJI", "vix": "^VIX", "wti": "CL=F", "gold": "GC=F",
    "us10y": "^TNX", "sox": "^SOX", "krw": "KRW=X"
}

INDICATOR_SOURCE_URLS = {k: f"https://finance.yahoo.com/quote/{v.replace('=','%3D').replace('^','%5E')}" for k,v in FEATURE_TICKERS.items()}

LOOKBACK_DAYS = 3 * 365
ALL_FEATURES = list(FEATURE_TICKERS.keys())
HISTORY_RECORDS = 30  # 최근 30 거래일 기록

LGBM_BASE = dict(n_estimators=300, learning_rate=0.05, num_leaves=31, min_child_samples=15, 
                subsample=0.8, colsample_bytree=0.8, reg_alpha=0.1, reg_lambda=0.1, verbosity=-1, random_state=42)
LGBM_CENTER = dict(**LGBM_BASE, objective="regression", metric="rmse")
LGBM_LOW    = dict(**LGBM_BASE, objective="quantile", alpha=0.1)
LGBM_HIGH   = dict(**LGBM_BASE, objective="quantile", alpha=0.9)


def main() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    DOCS_DIR.mkdir(parents=True, exist_ok=True)
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    yf.set_tz_cache_location(str(CACHE_DIR))

    print("📥 시장 데이터 수집 중...")
    market = fetch_market_data()
    print("⚡ 실시간 지표 수집 중...")
    live_market = fetch_live_indicators()
    print("🔧 학습셋 구성 중...")
    dataset = build_dataset(market)
    print("🤖 LightGBM 모델링 중...")
    result = train_lgbm(dataset)
    print("📝 JSON 출력 생성 중...")
    history_df = build_history_df(result)
    latest = build_latest(live_market, result, market)

    write_prediction_json(latest, result, history_df)
    write_history_json(result, history_df)
    write_indicators_json(live_market)
    write_diagnostics_json(result)
    print(f"✅ 완료! (위치: {DATA_DIR})")


def fetch_market_data() -> dict[str, pd.DataFrame]:
    period = f"{LOOKBACK_DAYS}d"
    frames = {}
    all_tickers = {**KOREA_TICKERS, **FEATURE_TICKERS}
    for name, ticker in all_tickers.items():
        print(f"  - {name} ({ticker}) 다운로드 중...")
        df = yf.download(ticker, period=period, interval="1d", auto_adjust=False, progress=False, threads=False)
        if df.empty: continue
        if isinstance(df.columns, pd.MultiIndex): df.columns = df.columns.get_level_values(0)
        frames[name] = df.rename_axis("date").sort_index()
    return frames


def fetch_live_indicators() -> dict[str, pd.DataFrame]:
    frames = {}
    for name, ticker in {**KOREA_TICKERS, **FEATURE_TICKERS}.items():
        df = yf.download(ticker, period="1d", interval="1m", auto_adjust=False, progress=False, threads=False)
        if df.empty: df = yf.download(ticker, period="5d", interval="1d", auto_adjust=False, progress=False, threads=False)
        if isinstance(df.columns, pd.MultiIndex): df.columns = df.columns.get_level_values(0)
        frames[name] = df.sort_index()
    return frames


def _norm(ts: pd.Timestamp) -> pd.Timestamp:
    return pd.Timestamp(ts).tz_localize(None).normalize()


def build_dataset(market: dict[str, pd.DataFrame]) -> pd.DataFrame:
    kospi = market["kospi"][["Open", "Close"]].copy()
    kospi.index = kospi.index.map(_norm)
    kospi["target_return"] = (kospi["Open"] / kospi["Close"].shift(1) - 1) * 100
    kospi["prev_close"] = kospi["Close"].shift(1)
    
    features = []
    for name in ALL_FEATURES:
        frame = market[name].copy()
        if "Close" not in frame: continue
        feat = pd.DataFrame(index=frame.index)
        feat[f"{name}_return"] = frame["Close"].pct_change() * 100
        if name=="vix": feat["vix_level"] = frame["Close"]
        
        # 선행 지표이므로 날짜를 하루 뒤로 밀어서 코스피 시초가와 정렬
        feat.index = feat.index.map(_norm) + pd.offsets.BDay(1)
        feat = feat.groupby(feat.index).last()
        features.append(feat)
    
    ds = kospi.copy()
    for f in features:
        ds = ds.join(f, how="inner")
        
    return ds.ffill().dropna()


def train_lgbm(dataset: pd.DataFrame) -> dict:
    feat_cols = [f"{n}_return" for n in ALL_FEATURES if f"{n}_return" in dataset.columns]
    X_df = dataset[feat_cols]
    y = dataset["target_return"].values
    dates = dataset.index
    prev_closes, actual_opens = dataset["prev_close"].values, dataset["Open"].values
    vix_levels = dataset["vix_level"].values if "vix_level" in dataset.columns else np.full(len(y), 20.0)
    
    X = X_df.values.astype(np.float64)
    
    rows = []
    tscv = TimeSeriesSplit(n_splits=5)
    for train_idx, test_idx in tscv.split(X):
        if len(train_idx) < 60: continue
        Xtr, ytr = X[train_idx], y[train_idx]
        mc, ml, mh = lgb.LGBMRegressor(**LGBM_CENTER), lgb.LGBMRegressor(**LGBM_LOW), lgb.LGBMRegressor(**LGBM_HIGH)
        mc.fit(Xtr, ytr); ml.fit(Xtr, ytr); mh.fit(Xtr, ytr)
        pred_c, pred_l, pred_h = mc.predict(X[test_idx]), ml.predict(X[test_idx]), mh.predict(X[test_idx])
        for i, idx in enumerate(test_idx):
            pc, ao = prev_closes[idx], actual_opens[idx]
            po, bl, bh = pc*(1+pred_c[i]/100), pc*(1+pred_l[i]/100), pc*(1+pred_h[i]/100)
            min_h = pc*0.003*choose_band_multiplier(vix_levels[idx])
            if bh-bl < min_h*2: bl, bh = po-min_h, po+min_h
            rows.append({"date": dates[idx].strftime("%Y-%m-%d"), "pred_open": po, "actual_open": ao, "low": bl, "high": bh, 
                         "error": po-ao, "hit": bl<=ao<=bh, "direction_hit": np.sign(pred_c[i])==np.sign(y[idx])})
    
    preds = pd.DataFrame(rows)
    rmse, mae = float(np.sqrt(np.mean(np.square(preds["error"])))), float(np.mean(np.abs(preds["error"])))
    final_c = lgb.LGBMRegressor(**LGBM_CENTER); final_c.fit(X, y)
    fi = {k: int(v) for k,v in zip(feat_cols, final_c.feature_importances_)}
    return {"rmse": rmse, "mae": mae, "bhr": float(preds["hit"].mean()*100), "dhr": float(preds["direction_hit"].mean()*100), 
            "fi": fi, "preds": preds, "feat_cols": feat_cols, "model_c": final_c}


def build_latest(live_m, result, hist_m):
    rets, vix = {}, 20.0
    for name in ALL_FEATURES:
        l_s, h_s = live_m[name]["Close"].dropna(), hist_m[name]["Close"].dropna()
        if l_s.empty or h_s.empty: continue
        curr, prev = float(l_s.iloc[-1]), float(h_s.iloc[-1])
        rets[name] = (curr/prev-1)*100
        if name=="vix": vix = curr
    
    prev_kospi_series = hist_m["kospi"]["Close"].dropna()
    if prev_kospi_series.empty: pk = 2500.0
    else: pk = float(prev_kospi_series.iloc[-1])
    
    fv = np.array([[rets.get(c.replace("_return",""), 0.0) for c in result["feat_cols"]]], dtype=np.float64)
    pc_val = float(result["model_c"].predict(fv)[0])
    po = pk*(1+pc_val/100)
    buff = result["mae"] * choose_band_multiplier(vix)
    return {"point": po, "r_low": po-buff, "r_high": po+buff, "pred_c": pc_val, "vix": vix, "returns": rets, "prev_close": pk}


def _build_signal_summary(rets: dict) -> str:
    """핵심 지표 3개의 방향을 요약하는 짧은 한 줄 문구."""
    label_map = {"ewy": "EWY", "sp500": "S&P 500", "vix": "VIX", "nasdaq": "나스닥", "krw": "환율"}
    parts = []
    for key in ["ewy", "sp500", "vix", "nasdaq", "krw"]:
        val = rets.get(key, 0.0)
        if key == "vix":
            direction = "하락(안정)" if val < -0.3 else "상승(불안)" if val > 0.3 else "보합"
        elif key == "krw":
            direction = "원화 강세" if val < -0.3 else "원화 약세" if val > 0.3 else "보합"
        else:
            direction = "상승" if val > 0.3 else "하락" if val < -0.3 else "보합"
        parts.append(f"{label_map[key]} {direction}")
    return " · ".join(parts)


def write_prediction_json(latest, result, history_df):
    now_kst = datetime.now(timezone(timedelta(hours=9)))
    p_date = now_kst.strftime("%Y년 %m월 %d일") if now_kst.hour<9 else (now_kst + pd.offsets.BDay(1)).strftime("%Y년 %m월 %d일")
    y_row = history_df.iloc[0] if not history_df.empty else None
    
    signal = _build_signal_summary(latest["returns"])
    
    p = {
        "generatedAt": datetime.now(timezone.utc).isoformat(), "predictionDate": p_date,
        "pointPrediction": round(latest["point"],2), "rangeLow": round(latest["r_low"],2), "rangeHigh": round(latest["r_high"],2),
        "predictedChangePct": round(latest["pred_c"],2),
        "prevClose": round(latest["prev_close"],2),
        "signalSummary": signal,
        "lastCalculatedAt": datetime.now(timezone.utc).isoformat(),
        "mae30d": round(result["mae"],2),
        "model": {"engine": "LightGBM", "vix": round(latest["vix"],2), "lgbmRmse": round(result["rmse"],2)},
        "yesterday": {"predictionLow": round(float(y_row["low"]),2) if y_row is not None else 0,
                      "predictionHigh": round(float(y_row["high"]),2) if y_row is not None else 0,
                      "actualOpen": round(float(y_row["actual_open"]),2) if y_row is not None else 0,
                      "hit": bool(y_row["hit"]) if y_row is not None else False}
    }
    (DATA_DIR / "prediction.json").write_text(json.dumps(p, ensure_ascii=False, indent=2), encoding="utf8")


def write_indicators_json(live_m):
    p_k, s_k = ["ewy","krw","wti","sp500"], ["nasdaq","vix","koru","dow","gold","us10y","sox"]
    def build_ind(name):
        s = live_m[name]["Close"].dropna()
        if s.empty: return {"key":name, "label":indicator_label(name), "value":"N/A", "changePct":0, "updatedAt":""}
        curr, prev = float(s.iloc[-1]), float(s.iloc[0])
        return {"key": name, "label": indicator_label(name), "value": format_value(name, curr), "changePct": round((curr/prev-1)*100,2),
                "updatedAt": pd.Timestamp(s.index[-1]).isoformat(),
                "sourceUrl": INDICATOR_SOURCE_URLS.get(name, ""),
                "dataSource": "Yahoo Finance (1분 단위)"}
    payload = {"primary": [build_ind(k) for k in p_k], "secondary": [build_ind(k) for k in s_k], "generatedAt": datetime.now(timezone.utc).isoformat()}
    (DATA_DIR / "indicators.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf8")


def write_diagnostics_json(result):
    p = {
        "selectedFeatures": result["feat_cols"], "rmse": round(result["rmse"],4), "mae": round(result["mae"],4),
        "featureImportance": result["fi"],
        "generatedAt": datetime.now(timezone.utc).isoformat()
    }
    (DATA_DIR / "backtest_diagnostics.json").write_text(json.dumps(p, ensure_ascii=False, indent=2), encoding="utf8")


def build_history_df(result):
    df = result["preds"].copy()
    if df.empty: return df
    df[["low","high","actual_open"]] = df[["low","high","actual_open"]].round(2)
    return df.sort_values("date", ascending=False).head(HISTORY_RECORDS).reset_index(drop=True)


def write_history_json(result, history_df):
    records = [{"date": r["date"], "low": r["low"], "high": r["high"], "actualOpen": r["actual_open"], "hit": bool(r["hit"])} for _, r in history_df.iterrows()]
    p = {"summary": {"mae30d": round(result["mae"],2)}, 
         "records": records}
    (DATA_DIR / "history.json").write_text(json.dumps(p, ensure_ascii=False, indent=2), encoding="utf8")


def choose_band_multiplier(vix: float): return 1.0 if vix<20 else 1.3 if vix<25 else 1.5 if vix<30 else 2.0
def indicator_label(n): return {"ewy":"EWY (한국 ETF)", "krw":"원/달러 환율", "wti":"WTI 원유", "sp500":"S&P 500", "nasdaq":"나스닥 100", "vix":"VIX 변동성", "koru":"KORU (코리아 3x)", "dow":"다우존스", "gold":"금 시세", "us10y":"미 10년 국채금리", "sox":"필라델피아 반도체"}[n]
def format_value(n, v):
    if n in {"ewy","koru","wti","gold"}: return f"${v:,.2f}"
    if n=="krw": return f"{v:,.2f}원"
    if n=="us10y": return f"{v:.2f}%"
    return f"{v:,.2f}"

if __name__ == "__main__": main()
