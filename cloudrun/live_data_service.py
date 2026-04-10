from __future__ import annotations

import hmac
import json
import os
import shutil
import subprocess
import sys
import tempfile
import threading
from pathlib import Path

from flask import Flask, Response, jsonify, request
from google.cloud import storage

ROOT = Path(__file__).resolve().parents[1]
BUNDLED_DATA_DIR = ROOT / "frontend" / "public" / "data"

SERVE_FILE_NAMES = {
    "prediction.json",
    "indicators.json",
    "history.json",
    "backtest_diagnostics.json",
}
SYNC_FILE_NAMES = SERVE_FILE_NAMES | {
    "day_futures_close_cache.json",
    "night_futures_source_cache.json",
    "prediction_archive.json",
}

BUCKET_NAME = os.environ.get("LIVE_DATA_BUCKET", "").strip()
BUCKET_PREFIX = os.environ.get("LIVE_DATA_PREFIX", "").strip().strip("/")
REFRESH_BEARER_TOKEN = os.environ.get("REFRESH_BEARER_TOKEN", "").strip()
REFRESH_TIMEOUT_SECONDS = int(os.environ.get("REFRESH_TIMEOUT_SECONDS", "240"))

app = Flask(__name__)

_storage_client: storage.Client | None = None
_refresh_lock = threading.Lock()


def get_storage_bucket():
    global _storage_client

    if not BUCKET_NAME:
        return None

    if _storage_client is None:
        _storage_client = storage.Client()

    return _storage_client.bucket(BUCKET_NAME)


def blob_name(file_name: str) -> str:
    return f"{BUCKET_PREFIX}/{file_name}" if BUCKET_PREFIX else file_name


def bundled_file_path(file_name: str) -> Path:
    return BUNDLED_DATA_DIR / file_name


def download_bucket_file(file_name: str, target_path: Path) -> bool:
    bucket = get_storage_bucket()
    if bucket is None:
        return False

    blob = bucket.blob(blob_name(file_name))
    if not blob.exists():
        return False

    target_path.parent.mkdir(parents=True, exist_ok=True)
    blob.download_to_filename(str(target_path))
    return True


def seed_work_dir(target_dir: Path) -> None:
    target_dir.mkdir(parents=True, exist_ok=True)

    for file_name in SYNC_FILE_NAMES:
        source_path = bundled_file_path(file_name)
        target_path = target_dir / file_name
        if source_path.exists():
            shutil.copy2(source_path, target_path)
        download_bucket_file(file_name, target_path)


def upload_bucket_file(file_name: str, source_path: Path) -> bool:
    if not source_path.exists():
        return False

    bucket = get_storage_bucket()
    if bucket is None:
        return False

    blob = bucket.blob(blob_name(file_name))
    blob.cache_control = "no-store"
    blob.upload_from_filename(str(source_path), content_type="application/json; charset=utf-8")
    return True


def load_live_json_bytes(file_name: str) -> tuple[bytes, str] | tuple[None, None]:
    if file_name not in SERVE_FILE_NAMES:
        return None, None

    with tempfile.TemporaryDirectory(prefix="kospi-live-read-") as temp_dir:
        temp_path = Path(temp_dir) / file_name
        if download_bucket_file(file_name, temp_path):
            return temp_path.read_bytes(), "bucket"

    bundled_path = bundled_file_path(file_name)
    if bundled_path.exists():
        return bundled_path.read_bytes(), "bundled"

    return None, None


def is_refresh_request_authorized() -> bool:
    if not REFRESH_BEARER_TOKEN:
        return True

    auth_header = request.headers.get("Authorization", "").strip()
    expected = f"Bearer {REFRESH_BEARER_TOKEN}"
    return hmac.compare_digest(auth_header, expected)


def run_refresh_job() -> dict:
    with tempfile.TemporaryDirectory(prefix="kospi-live-refresh-") as temp_dir:
        temp_root = Path(temp_dir)
        data_dir = temp_root / "data"
        out_data_dir = temp_root / "out"

        seed_work_dir(data_dir)
        out_data_dir.mkdir(parents=True, exist_ok=True)

        env = os.environ.copy()
        env["KOSPI_DAWN_DATA_DIR"] = str(data_dir)
        env["KOSPI_DAWN_OUT_DATA_DIR"] = str(out_data_dir)

        process = subprocess.run(
            [sys.executable, str(ROOT / "scripts" / "refresh_night_futures.py")],
            cwd=str(ROOT),
            env=env,
            capture_output=True,
            text=True,
            timeout=REFRESH_TIMEOUT_SECONDS,
            check=False,
        )

        if process.returncode != 0:
            raise RuntimeError(
                "refresh_night_futures.py failed",
                {
                    "returncode": process.returncode,
                    "stdout": process.stdout[-4000:],
                    "stderr": process.stderr[-4000:],
                },
            )

        uploaded_files = []
        for file_name in SYNC_FILE_NAMES:
            if upload_bucket_file(file_name, data_dir / file_name):
                uploaded_files.append(file_name)

        prediction_payload = json.loads((data_dir / "prediction.json").read_text(encoding="utf8"))
        indicators_payload = json.loads((data_dir / "indicators.json").read_text(encoding="utf8"))

        return {
            "ok": True,
            "message": process.stdout.strip() or "refresh completed",
            "uploadedFiles": uploaded_files,
            "predictionGeneratedAt": prediction_payload.get("generatedAt"),
            "liveCalculatedAt": prediction_payload.get("lastCalculatedAt"),
            "indicatorGeneratedAt": indicators_payload.get("generatedAt"),
            "storageBucket": BUCKET_NAME or None,
        }


@app.get("/")
def root() -> Response:
    return jsonify(
        {
            "service": "kospi-live-data",
            "bucket": BUCKET_NAME or None,
            "routes": {
                "health": "/healthz",
                "prediction": "/api/live/prediction.json",
                "indicators": "/api/live/indicators.json",
                "history": "/api/live/history.json",
            },
        }
    )


@app.get("/healthz")
def healthz() -> Response:
    return jsonify({"ok": True, "bucket": BUCKET_NAME or None})


@app.get("/api/live/<path:file_name>")
def get_live_data(file_name: str) -> Response:
    if "/" in file_name or file_name not in SERVE_FILE_NAMES:
        return jsonify({"ok": False, "error": "not_found"}), 404

    payload, source = load_live_json_bytes(file_name)
    if payload is None or source is None:
        return jsonify({"ok": False, "error": "not_found"}), 404

    return Response(
        payload,
        mimetype="application/json",
        headers={
            "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
            "X-Kospi-Live-Source": source,
        },
    )


@app.post("/api/tasks/refresh")
def refresh_live_data() -> Response:
    if not is_refresh_request_authorized():
        return jsonify({"ok": False, "error": "unauthorized"}), 401

    if not _refresh_lock.acquire(blocking=False):
        return jsonify({"ok": False, "error": "refresh_in_progress"}), 409

    try:
        payload = run_refresh_job()
        return jsonify(payload)
    except Exception as exc:  # pragma: no cover - exercised in Cloud Run
        details = exc.args[1] if len(exc.args) > 1 and isinstance(exc.args[1], dict) else {}
        return (
            jsonify(
                {
                    "ok": False,
                    "error": "refresh_failed",
                    "message": str(exc),
                    **details,
                }
            ),
            500,
        )
    finally:
        _refresh_lock.release()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", "8080")))
