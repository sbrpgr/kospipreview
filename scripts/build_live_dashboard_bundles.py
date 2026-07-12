"""Build atomic dashboard snapshots from validated live JSON artifacts."""

from __future__ import annotations

import argparse
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


PRIMARY_BUNDLE_FILE_NAME = "dashboard.json"
MODEL2_BUNDLE_FILE_NAME = "holiday-dashboard.json"

PRIMARY_BUNDLE_FILES = {
    "prediction": "prediction.json",
    "indicators": "indicators.json",
    "history": "history.json",
    "livePredictionSeries": "live_prediction_series.json",
}
MODEL2_BUNDLE_FILES = {
    "holidayPrediction": "holiday_prediction.json",
    "holidayPredictionSeries": "holiday_prediction_series.json",
    "holidayHistory": "holiday_history.json",
}


class BundleBuildError(ValueError):
    pass


def read_json_object(path: Path) -> dict[str, Any]:
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except OSError as exc:
        raise BundleBuildError(f"missing bundle component: {path.name}") from exc
    except json.JSONDecodeError as exc:
        raise BundleBuildError(f"invalid bundle component JSON: {path.name}") from exc

    if not isinstance(payload, dict):
        raise BundleBuildError(f"bundle component must be an object: {path.name}")
    return payload


def build_bundle_payload(
    data_dir: Path,
    file_names: dict[str, str],
    *,
    kind: str,
    generated_at: datetime | None = None,
) -> dict[str, Any]:
    components = {key: read_json_object(data_dir / file_name) for key, file_name in file_names.items()}
    canonical = json.dumps(components, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")
    snapshot_id = hashlib.sha256(canonical).hexdigest()[:20]
    created_at = (generated_at or datetime.now(timezone.utc)).astimezone(timezone.utc).isoformat()

    payload: dict[str, Any] = dict(components)
    payload["sources"] = {key: "snapshot" for key in file_names}
    payload["snapshot"] = {
        "schemaVersion": 1,
        "kind": kind,
        "id": snapshot_id,
        "generatedAt": created_at,
        "components": dict(file_names),
    }
    return payload


def write_bundle(
    data_dir: Path,
    output_name: str,
    file_names: dict[str, str],
    *,
    kind: str,
    generated_at: datetime | None = None,
) -> Path:
    payload = build_bundle_payload(data_dir, file_names, kind=kind, generated_at=generated_at)
    output_path = data_dir / output_name
    output_path.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    return output_path


def build_scope(data_dir: Path, scope: str) -> list[Path]:
    outputs: list[Path] = []
    if scope in {"all", "primary"}:
        outputs.append(
            write_bundle(
                data_dir,
                PRIMARY_BUNDLE_FILE_NAME,
                PRIMARY_BUNDLE_FILES,
                kind="primary-dashboard",
            )
        )
    if scope in {"all", "model2"}:
        outputs.append(
            write_bundle(
                data_dir,
                MODEL2_BUNDLE_FILE_NAME,
                MODEL2_BUNDLE_FILES,
                kind="model2-dashboard",
            )
        )
    return outputs


def main() -> None:
    parser = argparse.ArgumentParser(description="Build atomic live dashboard JSON snapshots.")
    parser.add_argument("--data-dir", type=Path, required=True)
    parser.add_argument("--scope", choices=("all", "primary", "model2"), default="all")
    args = parser.parse_args()

    try:
        outputs = build_scope(args.data_dir, args.scope)
    except BundleBuildError as exc:
        raise SystemExit(f"::error::{exc}") from exc

    for output in outputs:
        print(f"built atomic dashboard snapshot: {output}")


if __name__ == "__main__":
    main()
