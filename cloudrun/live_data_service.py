from __future__ import annotations

import hmac
import json
import logging
import mimetypes
import os
import shutil
import subprocess
import sys
import tempfile
import threading
import time
from pathlib import Path

from flask import Flask, Response, jsonify, request
from google.cloud import storage

ROOT = Path(__file__).resolve().parents[1]
BUNDLED_DATA_DIR = ROOT / "frontend" / "public" / "data"
BUNDLED_NEWS_INDEX_PATH = BUNDLED_DATA_DIR / "youtube-news.json"
BUNDLED_NEWS_DIR = ROOT / "news"

SERVE_FILE_NAMES = {
    "prediction.json",
    "indicators.json",
    "history.json",
    "live_prediction_series.json",
    "backtest_diagnostics.json",
}
SYNC_FILE_NAMES = SERVE_FILE_NAMES | {
    "day_futures_close_cache.json",
    "night_futures_source_cache.json",
    "prediction_archive.json",
}

BUCKET_NAME = os.environ.get("LIVE_DATA_BUCKET", "").strip()
BUCKET_PREFIX = os.environ.get("LIVE_DATA_PREFIX", "").strip().strip("/")
NEWS_BUCKET_NAME = os.environ.get("NEWS_BUCKET_NAME", "").strip() or BUCKET_NAME
NEWS_STORAGE_PREFIX = os.environ.get("NEWS_STORAGE_PREFIX", "youtube-news").strip().strip("/")
NEWS_INDEX_FILE_NAME = os.environ.get("NEWS_INDEX_FILE_NAME", "youtube-news.json").strip() or "youtube-news.json"
REFRESH_BEARER_TOKEN = os.environ.get("REFRESH_BEARER_TOKEN", "").strip()
ALLOW_UNAUTHENTICATED_REFRESH = os.environ.get("ALLOW_UNAUTHENTICATED_REFRESH", "").strip().lower() in {
    "1",
    "true",
    "yes",
    "on",
}
REFRESH_TIMEOUT_SECONDS = int(os.environ.get("REFRESH_TIMEOUT_SECONDS", "240"))
LIVE_JSON_CACHE_SECONDS = max(0.0, float(os.environ.get("LIVE_JSON_CACHE_SECONDS", "10")))
NEWS_CACHE_SECONDS = max(0.0, float(os.environ.get("NEWS_CACHE_SECONDS", "15")))
MAX_REFRESH_BODY_BYTES = int(os.environ.get("MAX_REFRESH_BODY_BYTES", "1024"))

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = MAX_REFRESH_BODY_BYTES

_storage_client: storage.Client | None = None
_refresh_lock = threading.Lock()
_live_json_cache_lock = threading.Lock()
_live_json_cache: dict[str, tuple[float, bytes, str]] = {}
_news_cache_lock = threading.Lock()
_news_cache: dict[str, tuple[float, bytes, str]] = {}


@app.after_request
def add_security_headers(response: Response) -> Response:
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("X-Frame-Options", "SAMEORIGIN")
    response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
    response.headers.setdefault("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
    response.headers.setdefault("Cross-Origin-Opener-Policy", "same-origin")
    response.headers.setdefault("Cross-Origin-Resource-Policy", "same-origin")
    if request.path.startswith("/api/live/") or request.path.startswith("/api/news/"):
        response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    return response


@app.before_request
def reject_oversized_refresh_request() -> tuple[Response, int] | None:
    if request.path != "/api/tasks/refresh":
        return None

    content_length = request.content_length
    if content_length is not None and content_length > MAX_REFRESH_BODY_BYTES:
        return jsonify({"ok": False, "error": "request_too_large"}), 413

    return None


def get_storage_bucket(bucket_name: str):
    global _storage_client

    if not bucket_name:
        return None

    if _storage_client is None:
        _storage_client = storage.Client()

    return _storage_client.bucket(bucket_name)


def live_blob_name(file_name: str) -> str:
    return f"{BUCKET_PREFIX}/{file_name}" if BUCKET_PREFIX else file_name


def bundled_file_path(file_name: str) -> Path:
    return BUNDLED_DATA_DIR / file_name


def download_bucket_file(file_name: str, target_path: Path) -> bool:
    bucket = get_storage_bucket(BUCKET_NAME)
    if bucket is None:
        return False

    blob = bucket.blob(live_blob_name(file_name))
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

    bucket = get_storage_bucket(BUCKET_NAME)
    if bucket is None:
        return False

    blob = bucket.blob(live_blob_name(file_name))
    blob.cache_control = "no-store"
    blob.upload_from_filename(str(source_path), content_type="application/json; charset=utf-8")
    return True


def news_blob_name(relative_path: str) -> str:
    return f"{NEWS_STORAGE_PREFIX}/{relative_path}" if NEWS_STORAGE_PREFIX else relative_path


def download_news_blob_bytes(relative_path: str) -> bytes | None:
    bucket = get_storage_bucket(NEWS_BUCKET_NAME)
    if bucket is None:
        return None

    blob = bucket.blob(news_blob_name(relative_path))
    if not blob.exists():
        return None

    return blob.download_as_bytes()


def load_live_json_bytes(file_name: str) -> tuple[bytes, str] | tuple[None, None]:
    if file_name not in SERVE_FILE_NAMES:
        return None, None

    now = time.monotonic()
    if LIVE_JSON_CACHE_SECONDS > 0:
        with _live_json_cache_lock:
            cached = _live_json_cache.get(file_name)
            if cached is not None:
                cached_at, payload, source = cached
                if now - cached_at <= LIVE_JSON_CACHE_SECONDS:
                    return payload, source

    payload: bytes | None = None
    source: str | None = None

    with tempfile.TemporaryDirectory(prefix="kospi-live-read-") as temp_dir:
        temp_path = Path(temp_dir) / file_name
        if download_bucket_file(file_name, temp_path):
            payload = temp_path.read_bytes()
            source = "bucket"

    if payload is None:
        bundled_path = bundled_file_path(file_name)
        if bundled_path.exists():
            payload = bundled_path.read_bytes()
            source = "bundled"

    if payload is None or source is None:
        return None, None

    if LIVE_JSON_CACHE_SECONDS > 0:
        with _live_json_cache_lock:
            _live_json_cache[file_name] = (now, payload, source)

    return payload, source


def clear_live_json_cache() -> None:
    with _live_json_cache_lock:
        _live_json_cache.clear()


def load_news_index_bytes() -> tuple[bytes, str] | tuple[None, None]:
    cache_key = "youtube-news-index"
    now = time.monotonic()

    if NEWS_CACHE_SECONDS > 0:
        with _news_cache_lock:
            cached = _news_cache.get(cache_key)
            if cached is not None:
                cached_at, payload, source = cached
                if now - cached_at <= NEWS_CACHE_SECONDS:
                    return payload, source

    payload: bytes | None = None
    source: str | None = None

    payload = download_news_blob_bytes(NEWS_INDEX_FILE_NAME)
    if payload is not None:
        source = "bucket"

    if payload is None and BUNDLED_NEWS_INDEX_PATH.exists():
        payload = BUNDLED_NEWS_INDEX_PATH.read_bytes()
        source = "bundled"

    if payload is None or source is None:
        return None, None

    if NEWS_CACHE_SECONDS > 0:
        with _news_cache_lock:
            _news_cache[cache_key] = (now, payload, source)

    return payload, source


def normalize_report_path(report_path: str) -> str | None:
    normalized = (report_path or "").strip().replace("\\", "/").lstrip("/")
    if not normalized:
        return None

    parts = [part for part in normalized.split("/") if part]
    if any(part == ".." for part in parts):
        return None

    normalized = "/".join(parts)
    if report_path.endswith("/"):
        normalized = f"{normalized}/index.html"
    elif "." not in parts[-1]:
        normalized = f"{normalized}/index.html"

    return normalized


def load_news_report_bytes(report_path: str) -> tuple[bytes, str, str] | tuple[None, None, None]:
    normalized = normalize_report_path(report_path)
    if not normalized:
        return None, None, None

    blob_payload = download_news_blob_bytes(f"reports/{normalized}")
    if blob_payload is not None:
        content_type, _ = mimetypes.guess_type(normalized)
        return blob_payload, "bucket", content_type or "application/octet-stream"

    local_path = BUNDLED_NEWS_DIR / Path(normalized)
    if local_path.exists() and local_path.is_file():
        payload = local_path.read_bytes()
        content_type, _ = mimetypes.guess_type(local_path.name)
        return payload, "bundled", content_type or "application/octet-stream"

    return None, None, None


def is_refresh_request_authorized() -> bool:
    if not REFRESH_BEARER_TOKEN:
        return ALLOW_UNAUTHENTICATED_REFRESH

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
        if uploaded_files:
            clear_live_json_cache()

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
            "routes": {
                "health": "/healthz",
                "prediction": "/api/live/prediction.json",
                "indicators": "/api/live/indicators.json",
                "history": "/api/live/history.json",
                "livePredictionSeries": "/api/live/live_prediction_series.json",
                "newsIndex": "/api/news/youtube-news.json",
            },
        }
    )


@app.get("/healthz")
def healthz() -> Response:
    return jsonify({"ok": True})


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


@app.get("/api/news/youtube-news.json")
def get_news_index() -> Response:
    payload, source = load_news_index_bytes()
    if payload is None or source is None:
        return jsonify({"ok": False, "error": "not_found"}), 404

    return Response(
        payload,
        mimetype="application/json",
        headers={
            "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
            "X-Kospi-News-Source": source,
        },
    )


@app.get("/api/news/reports/<path:report_path>")
def get_news_report(report_path: str) -> Response:
    payload, source, content_type = load_news_report_bytes(report_path)
    if payload is None or source is None or content_type is None:
        return jsonify({"ok": False, "error": "not_found"}), 404

    return Response(
        payload,
        mimetype=content_type,
        headers={
            "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
            "X-Kospi-News-Source": source,
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
        logging.exception("refresh job failed", extra={"details": details})
        return (
            jsonify(
                {
                    "ok": False,
                    "error": "refresh_failed",
                }
            ),
            500,
        )
    finally:
        _refresh_lock.release()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", "8080")))
