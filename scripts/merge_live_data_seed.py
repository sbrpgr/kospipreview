from __future__ import annotations

import argparse
import json
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


def main() -> None:
    parser = argparse.ArgumentParser(description="Merge bucket live JSON seed with bundled fallback archive.")
    parser.add_argument("--fallback", type=Path, required=True)
    parser.add_argument("--bucket", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()

    fallback_payload = read_json(args.fallback)
    bucket_payload = read_json(args.bucket)
    records = merge_archive_records([fallback_payload, bucket_payload])
    if not records:
        return

    generated_at = ""
    for payload in (bucket_payload, fallback_payload):
        if isinstance(payload, dict) and isinstance(payload.get("generatedAt"), str):
            generated_at = payload["generatedAt"]
            break

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps({"generatedAt": generated_at, "records": records}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf8",
    )


if __name__ == "__main__":
    main()
