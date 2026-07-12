from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any


MODEL2_MODE = "model2_no_night_futures_composite"
MODEL2_ENGINE = "EWYFXHybridCompositeNoNightFutures"
FORBIDDEN_MODEL2_BASELINE_SOURCES = {"one_time_night_futures_simple_point"}


class GuardFailure(RuntimeError):
    pass


def read_json_object(path: Path) -> dict[str, Any]:
    if not path.exists():
        raise GuardFailure(f"{path}: missing JSON file")

    try:
        payload = json.loads(path.read_text(encoding="utf8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise GuardFailure(f"{path}: invalid JSON ({exc})") from exc

    if not isinstance(payload, dict):
        raise GuardFailure(f"{path}: expected a JSON object")
    return payload


def is_number(value: Any) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def live_series_record_count(payload: dict[str, Any]) -> tuple[str | None, int]:
    prediction_date = payload.get("predictionDateIso")
    records = payload.get("records")
    if not isinstance(prediction_date, str) or not isinstance(records, list):
        return None, 0

    count = sum(
        1
        for row in records
        if isinstance(row, dict)
        and row.get("predictionDateIso") == prediction_date
        and isinstance(row.get("observedAt"), str)
    )
    return prediction_date, count


def guard_live_prediction_series(data_dir: Path, seed_dir: Path) -> None:
    output_path = data_dir / "live_prediction_series.json"
    seed_path = seed_dir / "live_prediction_series.json"

    output_date, output_count = live_series_record_count(read_json_object(output_path))
    seed_date, seed_count = live_series_record_count(read_json_object(seed_path))

    if output_date is None:
        raise GuardFailure(f"{output_path}: missing predictionDateIso or records")
    if seed_date is None:
        raise GuardFailure(f"{seed_path}: missing predictionDateIso or records")

    if output_date == seed_date and output_count < seed_count:
        raise GuardFailure(
            "live_prediction_series.json would shrink current trend: "
            f"date={output_date} output={output_count} seed={seed_count}"
        )

    print(
        "live_prediction_series guard ok: "
        f"output_date={output_date} output_records={output_count} "
        f"seed_date={seed_date} seed_records={seed_count}"
    )


def require_field(payload: dict[str, Any], key: str, expected: Any) -> None:
    actual = payload.get(key)
    if actual != expected:
        raise GuardFailure(f"holiday_prediction.json: {key} must be {expected!r}, got {actual!r}")


def guard_model2_payload(data_dir: Path) -> dict[str, Any] | None:
    path = data_dir / "holiday_prediction.json"
    if not path.exists():
        print("model2 guard skipped: holiday_prediction.json is not being published")
        return None

    payload = read_json_object(path)
    require_field(payload, "calculationMode", MODEL2_MODE)
    require_field(payload, "independentModel", True)
    require_field(payload, "usesOtherModelPrediction", False)
    require_field(payload, "nightFuturesUsed", False)
    require_field(payload, "nightFuturesReadThisRun", False)

    if payload.get("oneTimeNightFuturesBootstrapUsed", False) is not False:
        raise GuardFailure(
            "holiday_prediction.json: oneTimeNightFuturesBootstrapUsed must be False, "
            f"got {payload.get('oneTimeNightFuturesBootstrapUsed')!r}"
        )

    if payload.get("status") == "cleared":
        for key in ("pointPrediction", "predictedChangePct", "rangeLow", "rangeHigh", "predictionDateIso"):
            if payload.get(key) is not None:
                raise GuardFailure(f"holiday_prediction.json: cleared payload must keep {key} null")
        print("model2 guard ok: cleared stale Model2 payload")
        return payload

    if not is_number(payload.get("pointPrediction")):
        raise GuardFailure("holiday_prediction.json: pointPrediction must be numeric")

    baseline_source = payload.get("baselineSource")
    if baseline_source in FORBIDDEN_MODEL2_BASELINE_SOURCES:
        raise GuardFailure(
            "holiday_prediction.json: baselineSource must not come from night futures "
            f"({baseline_source!r})"
        )

    model = payload.get("model")
    if not isinstance(model, dict):
        raise GuardFailure("holiday_prediction.json: model must be an object")
    if model.get("engine") != MODEL2_ENGINE:
        raise GuardFailure(
            "holiday_prediction.json: model.engine must be "
            f"{MODEL2_ENGINE!r}, got {model.get('engine')!r}"
        )

    print("model2 guard ok: independent EWY/FX composite, no night-futures input")
    return payload


def guard_model2_companion_payloads(data_dir: Path, prediction: dict[str, Any]) -> None:
    series = read_json_object(data_dir / "holiday_prediction_series.json")
    history = read_json_object(data_dir / "holiday_history.json")

    if prediction.get("status") == "cleared":
        for name, payload in (("holiday_prediction_series.json", series), ("holiday_history.json", history)):
            if payload.get("status") != "cleared" or payload.get("records") != []:
                raise GuardFailure(f"{name}: cleared Model2 publish must contain status='cleared' and no records")
        return

    target = prediction.get("predictionDateIso")
    point = prediction.get("pointPrediction")
    if not isinstance(target, str) or not target:
        raise GuardFailure("holiday_prediction.json: predictionDateIso must be present")

    if series.get("predictionDateIso") != target:
        raise GuardFailure("holiday_prediction_series.json: top-level predictionDateIso must match Model2 prediction")
    series_records = series.get("records")
    if not isinstance(series_records, list):
        raise GuardFailure("holiday_prediction_series.json: records must be an array")
    target_rows = [
        row
        for row in series_records
        if isinstance(row, dict)
        and row.get("predictionDateIso") == target
        and isinstance(row.get("observedAt"), str)
        and is_number(row.get("pointPrediction"))
    ]
    if not target_rows:
        raise GuardFailure("holiday_prediction_series.json: active target must have a numeric record")
    latest_row = sorted(target_rows, key=lambda row: str(row.get("observedAt") or ""))[-1]
    if abs(float(latest_row["pointPrediction"]) - float(point)) > 0.05:
        raise GuardFailure("holiday_prediction_series.json: latest active target point must match Model2 prediction")

    history_records = history.get("records")
    if not isinstance(history_records, list):
        raise GuardFailure("holiday_history.json: records must be an array")
    history_row = next(
        (
            row
            for row in history_records
            if isinstance(row, dict) and row.get("date") == target and is_number(row.get("model2Prediction"))
        ),
        None,
    )
    if history_row is None or abs(float(history_row["model2Prediction"]) - float(point)) > 0.05:
        raise GuardFailure("holiday_history.json: active target point must match Model2 prediction")


def guard_publish(data_dir: Path, seed_dir: Path | None, scope: str = "all") -> None:
    if scope in {"all", "primary"}:
        if seed_dir is None:
            raise GuardFailure("--seed-dir is required for primary publish validation")
        guard_live_prediction_series(data_dir, seed_dir)

    if scope in {"all", "model2"}:
        prediction = guard_model2_payload(data_dir)
        if prediction is not None:
            guard_model2_companion_payloads(data_dir, prediction)


def main() -> None:
    parser = argparse.ArgumentParser(description="Fail before publishing unsafe live JSON artifacts.")
    parser.add_argument("--data-dir", type=Path, required=True)
    parser.add_argument("--seed-dir", type=Path)
    parser.add_argument("--scope", choices=("all", "primary", "model2"), default="all")
    args = parser.parse_args()

    try:
        guard_publish(args.data_dir, args.seed_dir, args.scope)
    except GuardFailure as exc:
        raise SystemExit(f"::error::{exc}") from exc


if __name__ == "__main__":
    main()
