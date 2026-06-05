from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from zoneinfo import ZoneInfo


KST = ZoneInfo("Asia/Seoul")
SERIES_MAX_RECORDS = 720


def read_json(path: Path) -> dict[str, Any] | None:
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None
    return payload if isinstance(payload, dict) else None


def to_float(value: Any) -> float | None:
    if isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str):
        try:
            return float(value.replace(",", "").strip())
        except ValueError:
            return None
    return None


def round_or_none(value: Any) -> float | None:
    numeric = to_float(value)
    return round(numeric, 2) if numeric is not None else None


def parse_datetime(value: Any) -> datetime | None:
    if not isinstance(value, str) or not value:
        return None
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc).replace(second=0, microsecond=0)


def series_record_from_snapshot(snapshot: dict[str, Any]) -> dict[str, Any] | None:
    prediction = snapshot.get("prediction")
    if not isinstance(prediction, dict):
        return None

    prediction_date_iso = prediction.get("predictionDateIso") or snapshot.get("predictionDateIso")
    if not isinstance(prediction_date_iso, str) or not prediction_date_iso:
        return None

    point_prediction = round_or_none(prediction.get("pointPrediction"))
    if point_prediction is None:
        return None

    observed_at = (
        parse_datetime(snapshot.get("observedMinute"))
        or parse_datetime(snapshot.get("observedAt"))
        or parse_datetime(prediction.get("generatedAt"))
    )
    if observed_at is None:
        return None

    return {
        "predictionDateIso": prediction_date_iso,
        "predictionDate": prediction.get("predictionDate") or snapshot.get("predictionDate"),
        "observedAt": observed_at.isoformat(),
        "kstTime": observed_at.astimezone(KST).strftime("%H:%M"),
        "pointPrediction": point_prediction,
        "nightFuturesSimplePoint": round_or_none(prediction.get("nightFuturesSimplePoint")),
        "ewyFxSimplePoint": round_or_none(prediction.get("ewyFxSimplePoint")),
        "nightFuturesClose": round_or_none(prediction.get("nightFuturesClose")),
        "predictedChangePct": round_or_none(prediction.get("predictedChangePct")),
        "nightFuturesSimpleChangePct": round_or_none(prediction.get("nightFuturesSimpleChangePct")),
        "ewyFxSimpleChangePct": round_or_none(prediction.get("ewyFxSimpleChangePct")),
    }


def load_current_records(path: Path, prediction_date_iso: str) -> list[dict[str, Any]]:
    payload = read_json(path)
    records = payload.get("records") if isinstance(payload, dict) else None
    if not isinstance(records, list):
        return []
    return [
        row
        for row in records
        if isinstance(row, dict)
        and row.get("predictionDateIso") == prediction_date_iso
        and isinstance(row.get("observedAt"), str)
    ]


def rebuild_series(
    snapshot_dir: Path,
    current_series_path: Path,
    prediction_date_iso: str,
) -> dict[str, Any]:
    by_observed_at: dict[str, dict[str, Any]] = {}

    for row in load_current_records(current_series_path, prediction_date_iso):
        by_observed_at[str(row["observedAt"])] = row

    for path in sorted(snapshot_dir.rglob("*.json")):
        snapshot = read_json(path)
        if snapshot is None:
            continue
        row = series_record_from_snapshot(snapshot)
        if row is None or row.get("predictionDateIso") != prediction_date_iso:
            continue
        by_observed_at[str(row["observedAt"])] = row

    records = sorted(by_observed_at.values(), key=lambda row: str(row.get("observedAt", "")))
    if len(records) > SERIES_MAX_RECORDS:
        records = records[-SERIES_MAX_RECORDS:]

    return {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "predictionDateIso": prediction_date_iso,
        "predictionDate": records[-1].get("predictionDate") if records else prediction_date_iso,
        "records": records,
    }


def write_recovered_series(
    *,
    snapshot_dir: Path,
    current_series: Path,
    output: Path,
    prediction_date: str,
    min_records: int,
) -> dict[str, Any]:
    current_count = len(load_current_records(current_series, prediction_date))
    payload = rebuild_series(snapshot_dir, current_series, prediction_date)
    recovered_count = len(payload["records"])
    if recovered_count < max(min_records, current_count):
        raise SystemExit(
            "refusing to write shorter recovered series: "
            f"current={current_count}, recovered={recovered_count}, min={min_records}"
        )

    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    first = payload["records"][0]["observedAt"] if payload["records"] else "none"
    last = payload["records"][-1]["observedAt"] if payload["records"] else "none"
    print(f"recovered live_prediction_series records={recovered_count} first={first} last={last}")
    return payload


def main() -> None:
    parser = argparse.ArgumentParser(description="Recover live_prediction_series.json from intraday archive snapshots.")
    parser.add_argument("--snapshot-dir", type=Path, required=True)
    parser.add_argument("--current-series", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--prediction-date", required=True)
    parser.add_argument("--min-records", type=int, default=1)
    args = parser.parse_args()

    write_recovered_series(
        snapshot_dir=args.snapshot_dir,
        current_series=args.current_series,
        output=args.output,
        prediction_date=args.prediction_date,
        min_records=args.min_records,
    )


if __name__ == "__main__":
    main()
