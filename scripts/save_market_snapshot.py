"""
save_market_snapshot.py

Fetches raw yfinance market data and saves a dated CSV snapshot to
Google Cloud Storage (gs://kospipreview-live-data/snapshots/YYYY-MM-DD/).

Run once daily (e.g. after Korean market close) via GitHub Actions.
This ensures reproducibility: if yfinance revises historical data, we
always have our own dated copy.

Saved files per run:
  snapshots/YYYY-MM-DD/kospi.csv
  snapshots/YYYY-MM-DD/ewy.csv
  snapshots/YYYY-MM-DD/krw.csv
  snapshots/YYYY-MM-DD/sp500.csv
  snapshots/YYYY-MM-DD/nasdaq.csv
  snapshots/YYYY-MM-DD/sox.csv
  snapshots/YYYY-MM-DD/vix.csv
  snapshots/YYYY-MM-DD/us10y.csv
  snapshots/YYYY-MM-DD/gold.csv
  snapshots/YYYY-MM-DD/wti.csv
  snapshots/YYYY-MM-DD/manifest.json   <- metadata for this snapshot
"""

from __future__ import annotations

import json
import os
import sys
import warnings
from datetime import date, datetime, timezone
from io import StringIO
from pathlib import Path

import yfinance as yf

warnings.filterwarnings("ignore")

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

BUCKET_NAME = os.environ.get("LIVE_DATA_BUCKET", "kospipreview-live-data").strip()
SNAPSHOT_PREFIX = "snapshots"
LOOKBACK_DAYS = "5y"   # 5년치 — 모델 학습에 필요한 최대 범위

TICKERS: dict[str, str] = {
    "kospi":   "^KS11",
    "ewy":     "EWY",
    "krw":     "KRW=X",
    "sp500":   "^GSPC",
    "nasdaq":  "^NDX",
    "sox":     "^SOX",
    "vix":     "^VIX",
    "us10y":   "^TNX",
    "gold":    "GC=F",
    "wti":     "CL=F",
    "nikkei":  "^N225",
    "dow":     "^DJI",
}


def fetch_and_save_snapshot(today: date) -> None:
    from google.cloud import storage

    client = storage.Client()
    bucket = client.bucket(BUCKET_NAME)
    date_str = today.isoformat()
    prefix = f"{SNAPSHOT_PREFIX}/{date_str}"

    yf.set_tz_cache_location(str(Path.home() / ".cache" / "kospipreview-yfinance"))

    saved: list[str] = []
    failed: list[str] = []

    for name, ticker in TICKERS.items():
        try:
            df = yf.download(ticker, period=LOOKBACK_DAYS, auto_adjust=True, progress=False)
            if df.empty:
                print(f"  [SKIP] {name} ({ticker}): empty dataframe")
                failed.append(name)
                continue
            csv_str = df.to_csv()
            blob_name = f"{prefix}/{name}.csv"
            blob = bucket.blob(blob_name)
            blob.upload_from_string(
                csv_str,
                content_type="text/csv; charset=utf-8",
                timeout=60,
            )
            print(f"  [OK]   {name} ({ticker}): {len(df)} rows → gs://{BUCKET_NAME}/{blob_name}")
            saved.append(name)
        except Exception as exc:
            print(f"  [ERR]  {name} ({ticker}): {exc}")
            failed.append(name)

    manifest = {
        "snapshotDate": date_str,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "lookbackPeriod": LOOKBACK_DAYS,
        "saved": saved,
        "failed": failed,
        "tickerMap": TICKERS,
    }
    manifest_blob = bucket.blob(f"{prefix}/manifest.json")
    manifest_blob.upload_from_string(
        json.dumps(manifest, ensure_ascii=False, indent=2),
        content_type="application/json; charset=utf-8",
        timeout=30,
    )
    print(f"\nManifest saved: gs://{BUCKET_NAME}/{prefix}/manifest.json")
    print(f"Snapshot complete: {len(saved)} saved, {len(failed)} failed")

    if failed:
        print(f"Failed tickers: {', '.join(failed)}", file=sys.stderr)


def main() -> None:
    today = date.today()
    print(f"=== Market snapshot: {today} ===")
    fetch_and_save_snapshot(today)


if __name__ == "__main__":
    main()
