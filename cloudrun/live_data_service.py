from __future__ import annotations

import hmac
import json
import logging
import os
import re
import shutil
import subprocess
import sys
import tempfile
import threading
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path

from flask import Flask, Response, jsonify, request
from google.api_core.exceptions import NotFound, PreconditionFailed
from google.cloud import storage
from scripts.build_live_dashboard_bundles import (
    MODEL2_BUNDLE_FILE_NAME,
    MODEL2_BUNDLE_FILES,
    PRIMARY_BUNDLE_FILE_NAME,
    PRIMARY_BUNDLE_FILES,
    write_bundle,
)
from scripts.guard_live_json_publish import GuardFailure, guard_publish

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
    "holiday_prediction.json",
    "holiday_prediction_series.json",
    "holiday_history.json",
}
MODEL2_FILE_NAMES = {
    "holiday_prediction.json",
    "holiday_prediction_series.json",
    "holiday_history.json",
}
DASHBOARD_FILE_NAMES = dict(PRIMARY_BUNDLE_FILES)
HOLIDAY_DASHBOARD_FILE_NAMES = dict(MODEL2_BUNDLE_FILES)
SEED_FILE_NAMES = SERVE_FILE_NAMES | {
    "day_futures_close_cache.json",
    "night_futures_source_cache.json",
    "prediction_archive.json",
}
REFRESH_UPLOAD_FILE_NAMES = (SERVE_FILE_NAMES - MODEL2_FILE_NAMES) | {
    "day_futures_close_cache.json",
    "night_futures_source_cache.json",
    "prediction_archive.json",
}
MODEL2_RUNTIME_UPLOAD_FILE_NAMES = set(MODEL2_FILE_NAMES)
INTRADAY_INDICATOR_SERIES_DIR_NAME = "intraday_indicator_series"
REFRESH_LEASE_FILE_NAME = "_locks/live-refresh.json"

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
REFRESH_MIN_INTERVAL_SECONDS = max(0, int(os.environ.get("REFRESH_MIN_INTERVAL_SECONDS", "120")))
MODEL2_REFRESH_MIN_INTERVAL_SECONDS = max(
    60,
    int(os.environ.get("MODEL2_REFRESH_MIN_INTERVAL_SECONDS", "300")),
)
MODEL2_REFRESH_TIMEOUT_SECONDS = max(30, int(os.environ.get("MODEL2_REFRESH_TIMEOUT_SECONDS", "120")))
REFRESH_LEASE_TTL_SECONDS = max(
    REFRESH_TIMEOUT_SECONDS + MODEL2_REFRESH_TIMEOUT_SECONDS + 30,
    int(os.environ.get("REFRESH_LEASE_TTL_SECONDS", "420")),
)
MODEL2_MAX_SAME_TARGET_STEP_PCT = max(
    0.1,
    float(os.environ.get("MODEL2_MAX_SAME_TARGET_STEP_PCT", "2.5")),
)
LIVE_JSON_CACHE_SECONDS = max(0.0, float(os.environ.get("LIVE_JSON_CACHE_SECONDS", "10")))
NEWS_CACHE_SECONDS = max(0.0, float(os.environ.get("NEWS_CACHE_SECONDS", "15")))
MAX_REFRESH_BODY_BYTES = int(os.environ.get("MAX_REFRESH_BODY_BYTES", "1024"))
DEFAULT_LIVE_RESPONSE_CACHE_CONTROL = "public, max-age=45, s-maxage=60, stale-while-revalidate=120"
DEFAULT_NEWS_RESPONSE_CACHE_CONTROL = "public, max-age=300, s-maxage=600, stale-while-revalidate=1800"
LIVE_RESPONSE_CACHE_CONTROL = os.environ.get(
    "LIVE_RESPONSE_CACHE_CONTROL",
    DEFAULT_LIVE_RESPONSE_CACHE_CONTROL,
).strip() or DEFAULT_LIVE_RESPONSE_CACHE_CONTROL
NEWS_RESPONSE_CACHE_CONTROL = os.environ.get(
    "NEWS_RESPONSE_CACHE_CONTROL",
    DEFAULT_NEWS_RESPONSE_CACHE_CONTROL,
).strip() or DEFAULT_NEWS_RESPONSE_CACHE_CONTROL
ERROR_RESPONSE_CACHE_CONTROL = "no-store, no-cache, must-revalidate, max-age=0"

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
    if response.status_code >= 400 and (request.path.startswith("/api/live/") or request.path.startswith("/api/news/")):
        response.headers.setdefault("Cache-Control", ERROR_RESPONSE_CACHE_CONTROL)
    elif request.path.startswith("/api/live/"):
        response.headers.setdefault("Cache-Control", LIVE_RESPONSE_CACHE_CONTROL)
    elif request.path.startswith("/api/news/"):
        response.headers.setdefault("Cache-Control", NEWS_RESPONSE_CACHE_CONTROL)
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


def _parse_iso_timestamp(value: object) -> float | None:
    if not isinstance(value, str) or not value.strip():
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00")).timestamp()
    except ValueError:
        return None


def acquire_refresh_lease(now: float | None = None, lease_id: str | None = None) -> dict | None:
    current_time = float(now if now is not None else time.time())
    current_lease_id = lease_id or uuid.uuid4().hex
    bucket = get_storage_bucket(BUCKET_NAME)
    if bucket is None:
        return {"distributed": False, "leaseId": current_lease_id, "generation": None}

    blob_name = live_blob_name(REFRESH_LEASE_FILE_NAME)

    def upload_new_lease():
        lease_blob = bucket.blob(blob_name)
        lease_blob.cache_control = "no-store"
        payload = {
            "schemaVersion": 1,
            "leaseId": current_lease_id,
            "createdAt": datetime.fromtimestamp(current_time, timezone.utc).isoformat(),
            "expiresAt": datetime.fromtimestamp(
                current_time + REFRESH_LEASE_TTL_SECONDS,
                timezone.utc,
            ).isoformat(),
        }
        lease_blob.upload_from_string(
            json.dumps(payload, separators=(",", ":")),
            content_type="application/json; charset=utf-8",
            if_generation_match=0,
        )
        if getattr(lease_blob, "generation", None) is None:
            lease_blob.reload()
        return {
            "distributed": True,
            "leaseId": current_lease_id,
            "generation": getattr(lease_blob, "generation", None),
        }

    try:
        return upload_new_lease()
    except PreconditionFailed:
        pass

    existing_blob = bucket.blob(blob_name)
    try:
        existing_blob.reload()
        existing_payload = json.loads(existing_blob.download_as_bytes().decode("utf-8"))
    except (NotFound, UnicodeDecodeError, json.JSONDecodeError):
        return None

    expires_at = _parse_iso_timestamp(existing_payload.get("expiresAt")) if isinstance(existing_payload, dict) else None
    if expires_at is None:
        updated_at = getattr(existing_blob, "updated", None)
        if isinstance(updated_at, datetime):
            expires_at = updated_at.timestamp() + REFRESH_LEASE_TTL_SECONDS
    if expires_at is None or expires_at > current_time:
        return None

    generation = getattr(existing_blob, "generation", None)
    if generation is None:
        return None
    try:
        existing_blob.delete(if_generation_match=generation)
    except (NotFound, PreconditionFailed):
        return None

    try:
        return upload_new_lease()
    except PreconditionFailed:
        return None


def release_refresh_lease(lease: dict | None) -> None:
    if not lease or not lease.get("distributed"):
        return

    bucket = get_storage_bucket(BUCKET_NAME)
    generation = lease.get("generation")
    if bucket is None or generation is None:
        return

    blob = bucket.blob(live_blob_name(REFRESH_LEASE_FILE_NAME))
    try:
        blob.delete(if_generation_match=generation)
    except (NotFound, PreconditionFailed):
        logging.warning("refresh lease was already released or replaced")
    except Exception:
        logging.exception("refresh lease release failed; TTL recovery remains available")


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

    for file_name in SEED_FILE_NAMES:
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


def live_series_record_count(path: Path) -> tuple[str | None, int]:
    try:
        payload = json.loads(path.read_text(encoding="utf8"))
    except (OSError, json.JSONDecodeError):
        return None, 0

    if not isinstance(payload, dict):
        return None, 0

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


def should_upload_live_prediction_series(source_path: Path, compare_dir: Path) -> bool:
    if not source_path.exists():
        return False

    bucket_path = compare_dir / "bucket-live_prediction_series.json"
    if not download_bucket_file("live_prediction_series.json", bucket_path):
        return True

    local_date, local_count = live_series_record_count(source_path)
    bucket_date, bucket_count = live_series_record_count(bucket_path)
    if local_date and bucket_date and local_date == bucket_date and local_count < bucket_count:
        logging.warning(
            "skip live_prediction_series upload because local series is shorter than bucket: "
            "date=%s local=%s bucket=%s",
            local_date,
            local_count,
            bucket_count,
        )
        return False
    return True


def iter_intraday_archive_files(data_dir: Path) -> list[Path]:
    archive_root = data_dir / INTRADAY_INDICATOR_SERIES_DIR_NAME
    if not archive_root.exists():
        return []

    return sorted(path for path in archive_root.rglob("*.json") if path.is_file())


def upload_bucket_file_once(file_name: str, source_path: Path) -> str:
    if not source_path.exists():
        return "missing"

    bucket = get_storage_bucket(BUCKET_NAME)
    if bucket is None:
        return "disabled"

    blob = bucket.blob(live_blob_name(file_name))
    blob.cache_control = "no-store"
    try:
        blob.upload_from_filename(
            str(source_path),
            content_type="application/json; charset=utf-8",
            if_generation_match=0,
        )
    except PreconditionFailed:
        return "skipped_exists"
    return "uploaded"


def upload_intraday_archive_files(data_dir: Path) -> dict[str, list[str]]:
    uploaded: list[str] = []
    skipped: list[str] = []
    missing_or_disabled: list[str] = []

    for source_path in iter_intraday_archive_files(data_dir):
        relative_name = source_path.relative_to(data_dir).as_posix()
        result = upload_bucket_file_once(relative_name, source_path)
        if result == "uploaded":
            uploaded.append(relative_name)
        elif result == "skipped_exists":
            skipped.append(relative_name)
        else:
            missing_or_disabled.append(relative_name)

    return {
        "uploaded": uploaded,
        "skipped": skipped,
        "missingOrDisabled": missing_or_disabled,
    }


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


def load_prebuilt_bundle_bytes(
    file_name: str,
    required_keys: set[str],
) -> tuple[bytes, str] | tuple[None, None]:
    cache_key = f"snapshot:{file_name}"
    now = time.monotonic()
    if LIVE_JSON_CACHE_SECONDS > 0:
        with _live_json_cache_lock:
            cached = _live_json_cache.get(cache_key)
            if cached is not None:
                cached_at, payload, source = cached
                if now - cached_at <= LIVE_JSON_CACHE_SECONDS:
                    return payload, source

    with tempfile.TemporaryDirectory(prefix="kospi-live-bundle-read-") as temp_dir:
        temp_path = Path(temp_dir) / file_name
        if not download_bucket_file(file_name, temp_path):
            return None, None
        payload = temp_path.read_bytes()

    try:
        parsed = json.loads(payload.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError):
        logging.exception("invalid prebuilt dashboard snapshot", extra={"file_name": file_name})
        return None, None

    if not isinstance(parsed, dict) or not required_keys.issubset(parsed):
        logging.warning("incomplete prebuilt dashboard snapshot: %s", file_name)
        return None, None

    source = "bucket-snapshot"
    if LIVE_JSON_CACHE_SECONDS > 0:
        with _live_json_cache_lock:
            _live_json_cache[cache_key] = (now, payload, source)
    return payload, source


def load_json_bundle_bytes(file_names: dict[str, str]) -> tuple[bytes, str] | tuple[None, None]:
    payload = {}
    sources = {}

    for payload_key, file_name in file_names.items():
        content, source = load_live_json_bytes(file_name)
        if content is None or source is None:
            return None, None

        try:
            payload[payload_key] = json.loads(content.decode("utf8"))
        except (json.JSONDecodeError, UnicodeDecodeError):
            logging.exception("invalid live json payload", extra={"file_name": file_name})
            return None, None

        sources[payload_key] = source

    payload["sources"] = sources
    source_values = set(sources.values())
    response_source = source_values.pop() if len(source_values) == 1 else "mixed"
    response_bytes = f"{json.dumps(payload, ensure_ascii=False, separators=(',', ':'))}\n".encode("utf8")
    return response_bytes, response_source


def load_dashboard_json_bytes() -> tuple[bytes, str] | tuple[None, None]:
    payload, source = load_prebuilt_bundle_bytes(PRIMARY_BUNDLE_FILE_NAME, set(DASHBOARD_FILE_NAMES))
    if payload is not None and source is not None:
        return payload, source
    return load_json_bundle_bytes(DASHBOARD_FILE_NAMES)


def load_holiday_dashboard_json_bytes() -> tuple[bytes, str] | tuple[None, None]:
    payload, source = load_prebuilt_bundle_bytes(MODEL2_BUNDLE_FILE_NAME, set(HOLIDAY_DASHBOARD_FILE_NAMES))
    if payload is not None and source is not None:
        return payload, source
    return load_json_bundle_bytes(HOLIDAY_DASHBOARD_FILE_NAMES)


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

    bucket_payload = download_news_blob_bytes(NEWS_INDEX_FILE_NAME)
    bundled_payload = None

    if BUNDLED_NEWS_INDEX_PATH.exists():
        bundled_payload = BUNDLED_NEWS_INDEX_PATH.read_bytes()

    if bundled_payload is None:
        bundled_payload = build_bundled_news_index_payload()

    selected_payload, selected_source = select_news_index_payload(bucket_payload, bundled_payload)
    if selected_payload is None or selected_source is None:
        return None, None

    if NEWS_CACHE_SECONDS > 0:
        with _news_cache_lock:
            _news_cache[cache_key] = (now, selected_payload, selected_source)

    return selected_payload, selected_source


def select_news_index_payload(
    bucket_payload: bytes | None,
    bundled_payload: bytes | None,
) -> tuple[bytes | None, str | None]:
    if bucket_payload is None:
        if bundled_payload is None:
            return None, None
        return bundled_payload, "bundled"

    if bundled_payload is None:
        return bucket_payload, "bucket"

    bucket_latest_items_count = extract_news_index_latest_items_count(bucket_payload)
    bundled_latest_items_count = extract_news_index_latest_items_count(bundled_payload)

    if bucket_latest_items_count > 0:
        return bucket_payload, "bucket"

    if bucket_latest_items_count == 0 and bundled_latest_items_count > 0:
        return bundled_payload, "bundled"

    if bundled_latest_items_count == 0 and bucket_latest_items_count > 0:
        return bucket_payload, "bucket"

    bucket_generated_at = extract_news_index_generated_at(bucket_payload)
    bundled_generated_at = extract_news_index_generated_at(bundled_payload)

    if bucket_generated_at > bundled_generated_at and bucket_latest_items_count != 0:
        return bucket_payload, "bucket"

    if bundled_generated_at > bucket_generated_at and bundled_latest_items_count != 0:
        return bundled_payload, "bundled"

    if bucket_latest_items_count >= bundled_latest_items_count:
        return bucket_payload, "bucket"

    return bundled_payload, "bundled"


def extract_news_index_latest_items_count(payload: bytes | None) -> int:
    if payload is None:
        return -1

    try:
        data = json.loads(payload.decode("utf8"))
        latest_items = data.get("latestItems")
        if isinstance(latest_items, list):
            return len(latest_items)
        return -1
    except (json.JSONDecodeError, UnicodeDecodeError):
        return -1


def extract_news_index_generated_at(payload: bytes | None) -> float:
    if payload is None:
        return 0.0

    try:
        data = json.loads(payload.decode("utf8"))
    except (json.JSONDecodeError, UnicodeDecodeError):
        return 0.0

    return parse_timestamp(data.get("generatedAt") if isinstance(data.get("generatedAt"), str) else None)


def parse_timestamp(value: str | None) -> float:
    if not value:
        return 0.0

    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00")).timestamp()
    except ValueError:
        return 0.0


def to_display_date(date_text: str) -> str:
    match = re.fullmatch(r"(\d{4})-(\d{2})-(\d{2})", date_text)
    if not match:
        return date_text
    return f"{match.group(1)}년 {match.group(2)}월 {match.group(3)}일"


def to_summary_lead(summary: str) -> str:
    if not summary:
        return ""

    for line in summary.splitlines():
        trimmed = line.strip()
        if trimmed and not trimmed.startswith("[") and not trimmed.startswith("- "):
            return trimmed

    return ""


def normalize_news_dedupe_text(value: object) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip().casefold()


def news_item_dedupe_key(item: dict) -> str:
    original_title = normalize_news_dedupe_text(item.get("originalTitle"))
    if original_title:
        return f"original:{original_title}"

    source_url = normalize_news_dedupe_text(item.get("sourceUrl"))
    if source_url:
        return f"source:{source_url}"

    headline = normalize_news_dedupe_text(item.get("headline"))
    if headline:
        youtuber = normalize_news_dedupe_text(item.get("youtuber"))
        return f"headline:{youtuber}|{headline}"

    return f"id:{item.get('reportId') or ''}|{item.get('id') or ''}"


def dedupe_news_items(items: list[dict]) -> list[dict]:
    seen = set()
    unique_items = []

    sorted_items = sorted(
        items,
        key=lambda item: (
            parse_timestamp(str(item.get("videoPublishedAt") or "")),
            parse_timestamp(str(item.get("reportGeneratedAt") or "")),
            str(item.get("id") or ""),
        ),
        reverse=True,
    )

    for item in sorted_items:
        dedupe_key = news_item_dedupe_key(item)
        if dedupe_key in seen:
            continue

        seen.add(dedupe_key)
        unique_items.append(item)

    return unique_items


def build_bundled_news_index_payload() -> bytes | None:
    if not BUNDLED_NEWS_DIR.exists():
        return None

    reports = []

    for date_dir in sorted(BUNDLED_NEWS_DIR.iterdir()):
        if not date_dir.is_dir() or not re.fullmatch(r"\d{4}-\d{2}-\d{2}", date_dir.name):
            continue

        for run_dir in sorted(date_dir.iterdir()):
            if not run_dir.is_dir():
                continue

            digest_path = run_dir / "digest_db.json"
            if not digest_path.exists():
                continue

            try:
                digest = json.loads(digest_path.read_text(encoding="utf8"))
            except (OSError, json.JSONDecodeError):
                continue

            report_date = str(digest.get("report_date") or date_dir.name)
            run_name = run_dir.name
            report_id = f"{report_date}-{run_name}"
            report_href = "/youtube-news"
            report_generated_at = str(digest.get("generated_at") or "")
            item_payloads = []

            for index, item in enumerate(digest.get("items") or []):
                item_id = f"{report_id}-{item.get('id') or index + 1}"
                item_payloads.append(
                    {
                        "id": item_id,
                        "reportId": report_id,
                        "reportDate": report_date,
                        "reportDateDisplay": to_display_date(report_date),
                        "reportGeneratedAt": report_generated_at,
                        "reportHref": f"/youtube-news/post?item={item_id}",
                        "youtuber": item.get("youtuber") or "유튜버",
                        "headline": item.get("headline") or item.get("original_title") or "제목 없음",
                        "videoPublishedAt": item.get("video_published_at") or "",
                        "videoPublishedDisplay": item.get("video_published_display") or "",
                        "sourceUrl": item.get("source_url") or "",
                        "originalTitle": item.get("original_title") or "",
                        "summaryLead": to_summary_lead(item.get("summary") or ""),
                        "summary": item.get("summary") or "",
                    }
                )

            reports.append(
                {
                    "id": report_id,
                    "date": report_date,
                    "dateDisplay": to_display_date(report_date),
                    "generatedAt": report_generated_at,
                    "period": str(digest.get("period") or ""),
                    "count": int(digest.get("count") or len(item_payloads)),
                    "href": report_href,
                    "title": f"경제 유튜버 일일 요약 - {to_display_date(report_date)}",
                    "items": item_payloads,
                }
            )

    reports.sort(
        key=lambda report: (
            parse_timestamp(str(report.get("generatedAt") or "")),
            str(report.get("id") or ""),
        ),
        reverse=True,
    )

    latest_items = []
    for report in reports:
        latest_items.extend(report.get("items") or [])

    latest_items = dedupe_news_items(latest_items)

    payload = {
        "generatedAt": str(reports[0].get("generatedAt") or "") if reports else "",
        "latestItems": latest_items,
        "reports": reports,
    }

    return f"{json.dumps(payload, ensure_ascii=False, indent=2)}\n".encode("utf8")


def is_refresh_request_authorized() -> bool:
    if not REFRESH_BEARER_TOKEN:
        return ALLOW_UNAUTHENTICATED_REFRESH

    auth_header = request.headers.get("Authorization", "").strip()
    expected = f"Bearer {REFRESH_BEARER_TOKEN}"
    return hmac.compare_digest(auth_header, expected)


def is_force_refresh_request() -> bool:
    force_arg = request.args.get("force", "").strip().lower()
    force_header = request.headers.get("X-Kospi-Force-Refresh", "").strip().lower()
    return force_arg in {"1", "true", "yes", "on"} or force_header in {"1", "true", "yes", "on"}


def refresh_throttle_status(now: float | None = None) -> dict | None:
    if REFRESH_MIN_INTERVAL_SECONDS <= 60 or is_force_refresh_request():
        return None

    current_time = int(now if now is not None else time.time())
    elapsed = current_time % REFRESH_MIN_INTERVAL_SECONDS
    if elapsed < 60:
        return None

    return {
        "ok": True,
        "status": "throttled",
        "minIntervalSeconds": REFRESH_MIN_INTERVAL_SECONDS,
        "nextWindowSeconds": REFRESH_MIN_INTERVAL_SECONDS - elapsed,
    }


def read_json_file(path: Path) -> dict:
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}
    return payload if isinstance(payload, dict) else {}


def publish_atomic_bundle(
    data_dir: Path,
    output_name: str,
    file_names: dict[str, str],
    *,
    kind: str,
) -> bool:
    output_path = write_bundle(data_dir, output_name, file_names, kind=kind)
    return upload_bucket_file(output_name, output_path)


def is_model2_refresh_window(now_utc: datetime) -> bool:
    if now_utc.weekday() >= 5:
        return False
    minutes = now_utc.hour * 60 + now_utc.minute
    return 9 * 60 <= minutes <= 22 * 60


def model2_refresh_decision(data_dir: Path, now: float | None = None) -> tuple[bool, str]:
    current_time = float(now if now is not None else time.time())
    now_utc = datetime.fromtimestamp(current_time, timezone.utc)
    if not is_model2_refresh_window(now_utc):
        return False, "outside_window"

    primary_payload = read_json_file(data_dir / "prediction.json")
    model2_payload = read_json_file(data_dir / "holiday_prediction.json")
    primary_target = primary_payload.get("predictionDateIso")
    model2_target = model2_payload.get("predictionDateIso")
    if isinstance(primary_target, str) and primary_target and primary_target != model2_target:
        return True, "target_rollover"

    generated_at = _parse_iso_timestamp(model2_payload.get("generatedAt"))
    if generated_at is None:
        return True, "missing_generated_at"
    if current_time - generated_at >= MODEL2_REFRESH_MIN_INTERVAL_SECONDS:
        return True, "interval_elapsed"
    return False, "recent_payload"


def guard_model2_same_target_step(previous: dict, current: dict) -> None:
    if previous.get("predictionDateIso") != current.get("predictionDateIso"):
        return
    if previous.get("clockSyncUsed") is not True or current.get("clockSyncUsed") is not True:
        return

    previous_point = previous.get("pointPrediction")
    current_point = current.get("pointPrediction")
    if not isinstance(previous_point, (int, float)) or isinstance(previous_point, bool) or previous_point <= 0:
        return
    if not isinstance(current_point, (int, float)) or isinstance(current_point, bool):
        return

    step_pct = abs(float(current_point) - float(previous_point)) / float(previous_point) * 100.0
    if step_pct > MODEL2_MAX_SAME_TARGET_STEP_PCT:
        raise GuardFailure(
            "holiday_prediction.json: same-target clock-synced Model2 step "
            f"{step_pct:.3f}% exceeds {MODEL2_MAX_SAME_TARGET_STEP_PCT:.3f}%"
        )


def run_model2_refresh(data_dir: Path, env: dict[str, str], now: float | None = None) -> dict:
    should_run, reason = model2_refresh_decision(data_dir, now)
    if not should_run:
        return {"status": "skipped", "reason": reason, "uploadedFiles": []}

    previous_payload = read_json_file(data_dir / "holiday_prediction.json")
    try:
        process = subprocess.run(
            [sys.executable, str(ROOT / "scripts" / "refresh_holiday_prediction.py")],
            cwd=str(ROOT),
            env=env,
            capture_output=True,
            text=True,
            timeout=MODEL2_REFRESH_TIMEOUT_SECONDS,
            check=False,
        )
    except subprocess.TimeoutExpired:
        logging.exception("Model2 refresh timed out")
        return {"status": "failed", "reason": "timeout", "uploadedFiles": []}

    if process.returncode != 0:
        logging.error(
            "Model2 refresh failed: returncode=%s stdout=%s stderr=%s",
            process.returncode,
            process.stdout[-2000:],
            process.stderr[-2000:],
        )
        return {"status": "failed", "reason": "process_error", "uploadedFiles": []}
    if "wrote Model 2 independent prediction" not in process.stdout:
        return {"status": "skipped", "reason": "producer_skipped", "uploadedFiles": []}

    current_payload = read_json_file(data_dir / "holiday_prediction.json")
    try:
        guard_publish(data_dir, None, "model2")
        guard_model2_same_target_step(previous_payload, current_payload)
    except GuardFailure as exc:
        logging.error("Model2 publish guard rejected refresh: %s", exc)
        return {"status": "rejected", "reason": str(exc), "uploadedFiles": []}

    uploaded_files: list[str] = []
    for file_name in sorted(MODEL2_RUNTIME_UPLOAD_FILE_NAMES):
        if upload_bucket_file(file_name, data_dir / file_name):
            uploaded_files.append(file_name)

    if set(uploaded_files) != MODEL2_RUNTIME_UPLOAD_FILE_NAMES:
        logging.error("Model2 component upload incomplete: %s", uploaded_files)
        return {"status": "failed", "reason": "component_upload_incomplete", "uploadedFiles": uploaded_files}

    if not publish_atomic_bundle(
        data_dir,
        MODEL2_BUNDLE_FILE_NAME,
        HOLIDAY_DASHBOARD_FILE_NAMES,
        kind="model2-dashboard",
    ):
        logging.error("Model2 atomic dashboard snapshot upload failed")
        return {"status": "failed", "reason": "bundle_upload_failed", "uploadedFiles": uploaded_files}

    uploaded_files.append(MODEL2_BUNDLE_FILE_NAME)
    clear_live_json_cache()
    return {
        "status": "updated",
        "reason": reason,
        "uploadedFiles": uploaded_files,
        "predictionDateIso": current_payload.get("predictionDateIso"),
        "pointPrediction": current_payload.get("pointPrediction"),
    }


def run_refresh_job() -> dict:
    with tempfile.TemporaryDirectory(prefix="kospi-live-refresh-") as temp_dir:
        temp_root = Path(temp_dir)
        data_dir = temp_root / "data"
        seed_dir = temp_root / "seed"
        out_data_dir = temp_root / "out"

        seed_work_dir(data_dir)
        seed_dir.mkdir(parents=True, exist_ok=True)
        for file_name in SEED_FILE_NAMES:
            source_path = data_dir / file_name
            if source_path.exists():
                shutil.copy2(source_path, seed_dir / file_name)
        out_data_dir.mkdir(parents=True, exist_ok=True)

        env = os.environ.copy()
        env["KOSPI_PREVIEW_DATA_DIR"] = str(data_dir)
        env["KOSPI_PREVIEW_OUT_DATA_DIR"] = str(out_data_dir)

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

        guard_publish(data_dir, seed_dir, "primary")

        uploaded_files: list[str] = []
        for file_name in sorted(REFRESH_UPLOAD_FILE_NAMES):
            if file_name == "live_prediction_series.json" and not should_upload_live_prediction_series(
                data_dir / file_name,
                temp_root,
            ):
                continue
            if upload_bucket_file(file_name, data_dir / file_name):
                uploaded_files.append(file_name)

        required_dashboard_components = set(DASHBOARD_FILE_NAMES.values())
        if not required_dashboard_components.issubset(uploaded_files):
            raise RuntimeError(
                "primary dashboard component upload incomplete",
                {"uploadedFiles": uploaded_files},
            )
        if not publish_atomic_bundle(
            data_dir,
            PRIMARY_BUNDLE_FILE_NAME,
            DASHBOARD_FILE_NAMES,
            kind="primary-dashboard",
        ):
            raise RuntimeError("primary atomic dashboard snapshot upload failed")
        uploaded_files.append(PRIMARY_BUNDLE_FILE_NAME)

        uploaded_intraday_archive_files = upload_intraday_archive_files(data_dir)
        if uploaded_files:
            clear_live_json_cache()

        try:
            model2_result = run_model2_refresh(data_dir, env)
        except Exception:
            logging.exception("Model2 refresh failed after primary snapshot publish")
            model2_result = {
                "status": "failed",
                "reason": "unexpected_error",
                "uploadedFiles": [],
            }

        prediction_payload = json.loads((data_dir / "prediction.json").read_text(encoding="utf8"))
        indicators_payload = json.loads((data_dir / "indicators.json").read_text(encoding="utf8"))

        return {
            "ok": True,
            "message": process.stdout.strip() or "refresh completed",
            "uploadedFiles": uploaded_files,
            "uploadedIntradayArchiveFiles": uploaded_intraday_archive_files["uploaded"],
            "skippedIntradayArchiveFiles": uploaded_intraday_archive_files["skipped"],
            "model2": model2_result,
            "predictionGeneratedAt": prediction_payload.get("generatedAt"),
            "liveCalculatedAt": prediction_payload.get("lastCalculatedAt"),
            "indicatorGeneratedAt": indicators_payload.get("generatedAt"),
            "storageBucket": BUCKET_NAME or None,
        }


def decode_json_object(payload: bytes | None) -> dict:
    if payload is None:
        return {}
    try:
        parsed = json.loads(payload.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError):
        return {}
    return parsed if isinstance(parsed, dict) else {}


def build_live_health_payload() -> tuple[dict, int]:
    dashboard_bytes, dashboard_source = load_dashboard_json_bytes()
    holiday_bytes, holiday_source = load_holiday_dashboard_json_bytes()
    dashboard = decode_json_object(dashboard_bytes)
    holiday_dashboard = decode_json_object(holiday_bytes)

    prediction = dashboard.get("prediction") if isinstance(dashboard.get("prediction"), dict) else {}
    series = (
        dashboard.get("livePredictionSeries")
        if isinstance(dashboard.get("livePredictionSeries"), dict)
        else {}
    )
    model2 = (
        holiday_dashboard.get("holidayPrediction")
        if isinstance(holiday_dashboard.get("holidayPrediction"), dict)
        else {}
    )

    primary_target = prediction.get("predictionDateIso")
    model2_target = model2.get("predictionDateIso")
    point_prediction = model2.get("pointPrediction")
    checks = {
        "primarySnapshotReadable": bool(dashboard and prediction),
        "holidaySnapshotReadable": bool(holiday_dashboard and model2),
        "primaryTargetPresent": isinstance(primary_target, str) and bool(primary_target),
        "primarySeriesAligned": series.get("predictionDateIso") == primary_target,
        "model2Present": isinstance(point_prediction, (int, float)) and not isinstance(point_prediction, bool),
        "model2TargetAligned": model2_target == primary_target,
        "model2Independent": (
            model2.get("independentModel") is True
            and model2.get("usesOtherModelPrediction") is False
            and model2.get("nightFuturesUsed") is False
            and model2.get("nightFuturesReadThisRun") is False
        ),
    }

    generated_values = [
        prediction.get("lastCalculatedAt"),
        prediction.get("generatedAt"),
        model2.get("generatedAt"),
    ]
    generated_timestamps = [timestamp for value in generated_values if (timestamp := _parse_iso_timestamp(value))]
    newest_timestamp = max(generated_timestamps) if generated_timestamps else None
    age_minutes = round(max(0.0, time.time() - newest_timestamp) / 60.0, 1) if newest_timestamp else None

    critical_ok = checks["primarySnapshotReadable"] and checks["primaryTargetPresent"]
    all_checks_ok = all(checks.values())
    payload = {
        "ok": critical_ok,
        "status": "ok" if all_checks_ok else ("degraded" if critical_ok else "unavailable"),
        "checkedAt": datetime.now(timezone.utc).isoformat(),
        "targetDate": primary_target,
        "sources": {
            "dashboard": dashboard_source,
            "holidayDashboard": holiday_source,
        },
        "snapshotIds": {
            "dashboard": (dashboard.get("snapshot") or {}).get("id")
            if isinstance(dashboard.get("snapshot"), dict)
            else None,
            "holidayDashboard": (holiday_dashboard.get("snapshot") or {}).get("id")
            if isinstance(holiday_dashboard.get("snapshot"), dict)
            else None,
        },
        "freshness": {
            "newestGeneratedAt": datetime.fromtimestamp(newest_timestamp, timezone.utc).isoformat()
            if newest_timestamp
            else None,
            "ageMinutes": age_minutes,
        },
        "model2": {
            "predictionDateIso": model2_target,
            "pointPrediction": point_prediction,
            "clockSyncUsed": model2.get("clockSyncUsed"),
        },
        "checks": checks,
    }
    return payload, 200 if critical_ok else 503


@app.get("/")
def root() -> Response:
    return jsonify(
        {
            "service": "kospi-live-data",
            "routes": {
                "health": "/api/livez",
                "liveHealth": "/api/healthz",
                "prediction": "/api/live/prediction.json",
                "indicators": "/api/live/indicators.json",
                "history": "/api/live/history.json",
                "livePredictionSeries": "/api/live/live_prediction_series.json",
                "dashboard": "/api/live/dashboard.json",
                "holidayDashboard": "/api/live/holiday-dashboard.json",
                "newsIndex": "/api/news/youtube-news.json",
            },
        }
    )


@app.get("/api/livez")
def livez() -> Response:
    return jsonify({"ok": True})


@app.get("/api/healthz")
def live_healthz() -> Response:
    payload, status = build_live_health_payload()
    response = jsonify(payload)
    response.status_code = status
    response.headers["Cache-Control"] = ERROR_RESPONSE_CACHE_CONTROL
    return response


@app.get("/api/live/dashboard.json")
def get_live_dashboard_data() -> Response:
    payload, source = load_dashboard_json_bytes()
    if payload is None or source is None:
        return jsonify({"ok": False, "error": "not_found"}), 404

    return Response(
        payload,
        mimetype="application/json",
        headers={
            "Cache-Control": LIVE_RESPONSE_CACHE_CONTROL,
            "X-Kospi-Live-Source": source,
        },
    )


@app.get("/api/live/holiday-dashboard.json")
def get_live_holiday_dashboard_data() -> Response:
    payload, source = load_holiday_dashboard_json_bytes()
    if payload is None or source is None:
        return jsonify({"ok": False, "error": "not_found"}), 404

    return Response(
        payload,
        mimetype="application/json",
        headers={
            "Cache-Control": LIVE_RESPONSE_CACHE_CONTROL,
            "X-Kospi-Live-Source": source,
        },
    )


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
            "Cache-Control": LIVE_RESPONSE_CACHE_CONTROL,
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
            "Cache-Control": NEWS_RESPONSE_CACHE_CONTROL,
            "X-Kospi-News-Source": source,
        },
    )


@app.get("/api/news/reports")
@app.get("/api/news/reports/<path:report_path>")
def get_legacy_news_report(report_path: str | None = None) -> Response:
    return jsonify({"ok": False, "error": "not_found"}), 404


@app.post("/api/tasks/refresh")
def refresh_live_data() -> Response:
    if not is_refresh_request_authorized():
        return jsonify({"ok": False, "error": "unauthorized"}), 401

    throttled_payload = refresh_throttle_status()
    if throttled_payload is not None:
        return jsonify(throttled_payload), 202

    if not _refresh_lock.acquire(blocking=False):
        return jsonify({"ok": True, "status": "already_running"}), 202

    lease = None
    try:
        lease = acquire_refresh_lease()
        if lease is None:
            return jsonify({"ok": True, "status": "already_running", "lock": "distributed"}), 202
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
        release_refresh_lease(lease)
        _refresh_lock.release()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", "8080")))
