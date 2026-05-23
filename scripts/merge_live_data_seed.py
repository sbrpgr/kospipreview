from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Any


def read_json(path: Path) -> dict[str, Any] | None:
    if not path.exists():
        return None

    try:
        payload = json.loads(path.read_text(encoding="utf8"))
    except (OSError, json.JSONDecodeError):
        return None

    return payload if isinstance(payload, dict) else None


def is_present(value: Any) -> bool:
    return value is not None and value != ""


def is_number(value: Any) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def prediction_date_iso(payload: dict[str, Any] | None) -> str | None:
    if not isinstance(payload, dict):
        return None

    value = payload.get("predictionDateIso")
    if isinstance(value, str) and re.fullmatch(r"\d{4}-\d{2}-\d{2}", value):
        return value

    return None


def latest_series_row(series_payload: dict[str, Any] | None, target_iso: str | None) -> dict[str, Any] | None:
    if not isinstance(series_payload, dict) or not isinstance(target_iso, str):
        return None

    records = series_payload.get("records")
    if not isinstance(records, list):
        return None

    candidates = [
        row
        for row in records
        if isinstance(row, dict)
        and row.get("predictionDateIso") == target_iso
        and isinstance(row.get("observedAt"), str)
        and is_number(row.get("pointPrediction"))
    ]
    if not candidates:
        return None

    return sorted(candidates, key=lambda row: str(row.get("observedAt") or ""))[-1]


def merge_prediction_payload(
    primary: dict[str, Any] | None,
    fallback: dict[str, Any] | None,
    series_payload: dict[str, Any] | None = None,
) -> dict[str, Any] | None:
    if not isinstance(primary, dict):
        return None

    target_iso = prediction_date_iso(primary)
    merged = dict(primary)

    if prediction_date_iso(fallback) == target_iso:
        for key, value in fallback.items():
            if not is_present(merged.get(key)) and is_present(value):
                merged[key] = value

        primary_model = merged.get("model")
        fallback_model = fallback.get("model") if isinstance(fallback, dict) else None
        if isinstance(primary_model, dict) and isinstance(fallback_model, dict):
            model = dict(primary_model)
            for key, value in fallback_model.items():
                if not is_present(model.get(key)) and is_present(value):
                    model[key] = value
            merged["model"] = model

    row = latest_series_row(series_payload, target_iso)
    if row is not None:
        series_field_map = {
            "pointPrediction": "pointPrediction",
            "nightFuturesSimplePoint": "nightFuturesSimplePoint",
            "nightFuturesSimpleChangePct": "nightFuturesSimpleChangePct",
            "ewyFxSimplePoint": "ewyFxSimplePoint",
            "ewyFxSimpleChangePct": "ewyFxSimpleChangePct",
            "nightFuturesClose": "nightFuturesClose",
            "predictedChangePct": "predictedChangePct",
        }
        for target_key, source_key in series_field_map.items():
            value = row.get(source_key)
            if not is_present(merged.get(target_key)) and is_present(value):
                merged[target_key] = value

        if not is_present(merged.get("lastCalculatedAt")) and isinstance(row.get("observedAt"), str):
            merged["lastCalculatedAt"] = row["observedAt"]

        point = row.get("pointPrediction")
        if (
            is_number(point)
            and (not is_present(merged.get("rangeLow")) or not is_present(merged.get("rangeHigh")))
        ):
            half_band = 20.0
            for candidate in (fallback, primary):
                low = candidate.get("rangeLow") if isinstance(candidate, dict) else None
                high = candidate.get("rangeHigh") if isinstance(candidate, dict) else None
                if is_number(low) and is_number(high) and high >= low:
                    half_band = max(1.0, (float(high) - float(low)) / 2)
                    break

            if not is_present(merged.get("rangeLow")):
                merged["rangeLow"] = round(float(point) - half_band, 2)
            if not is_present(merged.get("rangeHigh")):
                merged["rangeHigh"] = round(float(point) + half_band, 2)

    return merged


def merge_archive_records(payloads: list[dict[str, Any] | None]) -> list[dict[str, Any]]:
    by_date: dict[str, dict[str, Any]] = {}

    for payload in payloads:
        records = payload.get("records") if isinstance(payload, dict) else None
        if not isinstance(records, list):
            continue

        for raw in records:
            if not isinstance(raw, dict):
                continue

            date_key = raw.get("predictionDateIso")
            if not isinstance(date_key, str) or not date_key:
                continue

            incoming = dict(raw)
            existing = by_date.get(date_key)
            if existing is None:
                by_date[date_key] = incoming
                continue

            if str(incoming.get("generatedAt") or "") >= str(existing.get("generatedAt") or ""):
                base, fallback = incoming, existing
            else:
                base, fallback = existing, incoming

            for key, value in fallback.items():
                if not is_present(base.get(key)) and is_present(value):
                    base[key] = value

            by_date[date_key] = base

    return sorted(by_date.values(), key=lambda row: str(row.get("predictionDateIso") or ""), reverse=True)


def merge_history_payload(primary: dict[str, Any] | None, fallback: dict[str, Any] | None) -> dict[str, Any] | None:
    if not isinstance(primary, dict):
        return None

    primary_records = primary.get("records")
    fallback_records = fallback.get("records") if isinstance(fallback, dict) else None
    if not isinstance(primary_records, list) or not isinstance(fallback_records, list):
        return primary

    fallback_by_date = {
        row.get("date"): row
        for row in fallback_records
        if isinstance(row, dict) and isinstance(row.get("date"), str)
    }

    merged_records: list[Any] = []
    seen_dates: set[str] = set()
    for row in primary_records:
        if not isinstance(row, dict):
            merged_records.append(row)
            continue

        date_key = row.get("date")
        if isinstance(date_key, str):
            seen_dates.add(date_key)

        fallback_row = fallback_by_date.get(date_key)
        if not isinstance(fallback_row, dict):
            merged_records.append(row)
            continue

        merged_row = dict(row)
        for key, value in fallback_row.items():
            if not is_present(merged_row.get(key)) and is_present(value):
                merged_row[key] = value
        merged_records.append(merged_row)

    for row in fallback_records:
        if isinstance(row, dict) and isinstance(row.get("date"), str) and row["date"] not in seen_dates:
            merged_records.append(row)

    merged = dict(primary)
    merged["records"] = merged_records
    return merged


def main() -> None:
    parser = argparse.ArgumentParser(description="Merge bucket live JSON seed with bundled fallback archive.")
    parser.add_argument("--archive-fallback", type=Path)
    parser.add_argument("--archive-bucket", type=Path)
    parser.add_argument("--archive-output", type=Path)
    parser.add_argument("--history-fallback", type=Path)
    parser.add_argument("--history-output", type=Path)
    parser.add_argument("--prediction-fallback", type=Path)
    parser.add_argument("--prediction-output", type=Path)
    parser.add_argument("--prediction-series", type=Path)
    args = parser.parse_args()

    archive_args = (args.archive_fallback, args.archive_bucket, args.archive_output)
    if any(archive_args):
        if not all(archive_args):
            parser.error("--archive-fallback, --archive-bucket, and --archive-output must be provided together")

        fallback_payload = read_json(args.archive_fallback)
        bucket_payload = read_json(args.archive_bucket)
        records = merge_archive_records([fallback_payload, bucket_payload])
        if records:
            generated_at = ""
            for payload in (bucket_payload, fallback_payload):
                if isinstance(payload, dict) and isinstance(payload.get("generatedAt"), str):
                    generated_at = payload["generatedAt"]
                    break

            args.archive_output.parent.mkdir(parents=True, exist_ok=True)
            args.archive_output.write_text(
                json.dumps({"generatedAt": generated_at, "records": records}, ensure_ascii=False, indent=2) + "\n",
                encoding="utf8",
            )

    if args.history_fallback or args.history_output:
        if not (args.history_fallback and args.history_output):
            parser.error("--history-fallback and --history-output must be provided together")

        merged_history = merge_history_payload(read_json(args.history_output), read_json(args.history_fallback))
        if merged_history is not None:
            args.history_output.parent.mkdir(parents=True, exist_ok=True)
            args.history_output.write_text(
                json.dumps(merged_history, ensure_ascii=False, indent=2) + "\n",
                encoding="utf8",
            )

    if args.prediction_fallback or args.prediction_output or args.prediction_series:
        if not (args.prediction_fallback and args.prediction_output):
            parser.error("--prediction-fallback and --prediction-output must be provided together")

        merged_prediction = merge_prediction_payload(
            read_json(args.prediction_output),
            read_json(args.prediction_fallback),
            read_json(args.prediction_series) if args.prediction_series else None,
        )
        if merged_prediction is not None:
            args.prediction_output.parent.mkdir(parents=True, exist_ok=True)
            args.prediction_output.write_text(
                json.dumps(merged_prediction, ensure_ascii=False, indent=2) + "\n",
                encoding="utf8",
            )


if __name__ == "__main__":
    main()
