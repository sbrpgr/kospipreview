from __future__ import annotations

import json
import tempfile
import unittest
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import patch

from google.api_core.exceptions import NotFound, PreconditionFailed

from cloudrun import live_data_service
from scripts.guard_live_json_publish import GuardFailure


class LiveDataServiceSecurityTests(unittest.TestCase):
    def setUp(self):
        self.original_token = live_data_service.REFRESH_BEARER_TOKEN
        self.original_allow_unauthenticated = live_data_service.ALLOW_UNAUTHENTICATED_REFRESH
        self.original_cache_seconds = live_data_service.LIVE_JSON_CACHE_SECONDS
        self.original_refresh_min_interval_seconds = live_data_service.REFRESH_MIN_INTERVAL_SECONDS
        self.original_download = live_data_service.download_bucket_file
        self.original_get_storage_bucket = live_data_service.get_storage_bucket
        self.original_bucket_name = live_data_service.BUCKET_NAME
        self.original_model2_interval = live_data_service.MODEL2_REFRESH_MIN_INTERVAL_SECONDS
        self.original_model2_max_step = live_data_service.MODEL2_MAX_SAME_TARGET_STEP_PCT
        live_data_service.clear_live_json_cache()

    def tearDown(self):
        live_data_service.REFRESH_BEARER_TOKEN = self.original_token
        live_data_service.ALLOW_UNAUTHENTICATED_REFRESH = self.original_allow_unauthenticated
        live_data_service.LIVE_JSON_CACHE_SECONDS = self.original_cache_seconds
        live_data_service.REFRESH_MIN_INTERVAL_SECONDS = self.original_refresh_min_interval_seconds
        live_data_service.download_bucket_file = self.original_download
        live_data_service.get_storage_bucket = self.original_get_storage_bucket
        live_data_service.BUCKET_NAME = self.original_bucket_name
        live_data_service.MODEL2_REFRESH_MIN_INTERVAL_SECONDS = self.original_model2_interval
        live_data_service.MODEL2_MAX_SAME_TARGET_STEP_PCT = self.original_model2_max_step
        live_data_service.clear_live_json_cache()

    def test_refresh_auth_fails_closed_when_token_is_missing(self):
        live_data_service.REFRESH_BEARER_TOKEN = ""
        live_data_service.ALLOW_UNAUTHENTICATED_REFRESH = False

        with live_data_service.app.test_request_context("/api/tasks/refresh", method="POST"):
            self.assertFalse(live_data_service.is_refresh_request_authorized())

    def test_refresh_auth_allows_explicit_local_override(self):
        live_data_service.REFRESH_BEARER_TOKEN = ""
        live_data_service.ALLOW_UNAUTHENTICATED_REFRESH = True

        with live_data_service.app.test_request_context("/api/tasks/refresh", method="POST"):
            self.assertTrue(live_data_service.is_refresh_request_authorized())

    def test_refresh_auth_requires_exact_bearer_token(self):
        live_data_service.REFRESH_BEARER_TOKEN = "expected-token"
        live_data_service.ALLOW_UNAUTHENTICATED_REFRESH = False

        with live_data_service.app.test_request_context(
            "/api/tasks/refresh",
            method="POST",
            headers={"Authorization": "Bearer expected-token"},
        ):
            self.assertTrue(live_data_service.is_refresh_request_authorized())

        with live_data_service.app.test_request_context(
            "/api/tasks/refresh",
            method="POST",
            headers={"Authorization": "Bearer wrong-token"},
        ):
            self.assertFalse(live_data_service.is_refresh_request_authorized())

    def test_live_json_reads_are_cached_per_instance(self):
        calls = {"count": 0}

        def fake_download(file_name, target_path):
            calls["count"] += 1
            target_path.write_bytes(b'{"ok":true}')
            return True

        live_data_service.LIVE_JSON_CACHE_SECONDS = 60
        live_data_service.download_bucket_file = fake_download

        first_payload, first_source = live_data_service.load_live_json_bytes("prediction.json")
        second_payload, second_source = live_data_service.load_live_json_bytes("prediction.json")

        self.assertEqual(first_payload, b'{"ok":true}')
        self.assertEqual(first_source, "bucket")
        self.assertEqual(second_payload, first_payload)
        self.assertEqual(second_source, first_source)
        self.assertEqual(calls["count"], 1)

    def test_dashboard_endpoint_combines_live_json_files(self):
        def fake_download(file_name, target_path):
            target_path.write_bytes(json.dumps({"fileName": file_name}).encode("utf8"))
            return True

        live_data_service.LIVE_JSON_CACHE_SECONDS = 0
        live_data_service.download_bucket_file = fake_download

        response = live_data_service.app.test_client().get("/api/live/dashboard.json")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers["X-Kospi-Live-Source"], "bucket")
        self.assertIn("public", response.headers["Cache-Control"])

        payload = response.get_json()
        self.assertEqual(payload["prediction"]["fileName"], "prediction.json")
        self.assertEqual(payload["indicators"]["fileName"], "indicators.json")
        self.assertEqual(payload["history"]["fileName"], "history.json")
        self.assertEqual(payload["livePredictionSeries"]["fileName"], "live_prediction_series.json")
        self.assertEqual(
            payload["sources"],
            {
                "prediction": "bucket",
                "indicators": "bucket",
                "history": "bucket",
                "livePredictionSeries": "bucket",
            },
        )

    def test_dashboard_endpoint_prefers_atomic_bucket_snapshot(self):
        calls = []
        snapshot = {
            key: {"fileName": file_name}
            for key, file_name in live_data_service.DASHBOARD_FILE_NAMES.items()
        }
        snapshot["sources"] = {key: "snapshot" for key in live_data_service.DASHBOARD_FILE_NAMES}
        snapshot["snapshot"] = {"id": "snapshot-1"}

        def fake_download(file_name, target_path):
            calls.append(file_name)
            if file_name != live_data_service.PRIMARY_BUNDLE_FILE_NAME:
                return False
            target_path.write_text(json.dumps(snapshot), encoding="utf-8")
            return True

        live_data_service.LIVE_JSON_CACHE_SECONDS = 0
        live_data_service.download_bucket_file = fake_download

        response = live_data_service.app.test_client().get("/api/live/dashboard.json")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers["X-Kospi-Live-Source"], "bucket-snapshot")
        self.assertEqual(response.get_json()["snapshot"]["id"], "snapshot-1")
        self.assertEqual(calls, [live_data_service.PRIMARY_BUNDLE_FILE_NAME])

    def test_holiday_dashboard_endpoint_combines_model2_files(self):
        def fake_download(file_name, target_path):
            target_path.write_bytes(json.dumps({"fileName": file_name}).encode("utf8"))
            return True

        live_data_service.LIVE_JSON_CACHE_SECONDS = 0
        live_data_service.download_bucket_file = fake_download

        response = live_data_service.app.test_client().get("/api/live/holiday-dashboard.json")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers["X-Kospi-Live-Source"], "bucket")
        self.assertIn("public", response.headers["Cache-Control"])

        payload = response.get_json()
        self.assertEqual(payload["holidayPrediction"]["fileName"], "holiday_prediction.json")
        self.assertEqual(payload["holidayPredictionSeries"]["fileName"], "holiday_prediction_series.json")
        self.assertEqual(payload["holidayHistory"]["fileName"], "holiday_history.json")
        self.assertEqual(
            payload["sources"],
            {
                "holidayPrediction": "bucket",
                "holidayPredictionSeries": "bucket",
                "holidayHistory": "bucket",
            },
        )

    def test_live_json_error_responses_are_not_publicly_cached(self):
        response = live_data_service.app.test_client().get("/api/live/not-found.json")

        self.assertEqual(response.status_code, 404)
        self.assertIn("no-store", response.headers["Cache-Control"])

    def test_livez_is_available_under_api_rewrite(self):
        response = live_data_service.app.test_client().get("/api/livez")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json(), {"ok": True})

    def test_live_health_reports_aligned_independent_model2(self):
        dashboard = {
            "prediction": {
                "predictionDateIso": "2026-07-14",
                "generatedAt": "2026-07-13T10:00:00+00:00",
            },
            "livePredictionSeries": {"predictionDateIso": "2026-07-14"},
            "snapshot": {"id": "primary-1"},
        }
        holiday = {
            "holidayPrediction": {
                "predictionDateIso": "2026-07-14",
                "generatedAt": "2026-07-13T10:00:00+00:00",
                "pointPrediction": 7510.0,
                "independentModel": True,
                "usesOtherModelPrediction": False,
                "nightFuturesUsed": False,
                "nightFuturesReadThisRun": False,
                "clockSyncUsed": True,
            },
            "snapshot": {"id": "model2-1"},
        }

        with patch.object(
            live_data_service,
            "load_dashboard_json_bytes",
            return_value=(json.dumps(dashboard).encode("utf-8"), "bucket-snapshot"),
        ), patch.object(
            live_data_service,
            "load_holiday_dashboard_json_bytes",
            return_value=(json.dumps(holiday).encode("utf-8"), "bucket-snapshot"),
        ):
            response = live_data_service.app.test_client().get("/api/healthz")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["status"], "ok")
        self.assertEqual(response.get_json()["snapshotIds"]["holidayDashboard"], "model2-1")
        self.assertIn("no-store", response.headers["Cache-Control"])

    def test_refresh_upload_excludes_independent_model2_files(self):
        self.assertTrue(live_data_service.MODEL2_FILE_NAMES <= live_data_service.SEED_FILE_NAMES)
        self.assertTrue(live_data_service.MODEL2_FILE_NAMES <= live_data_service.SERVE_FILE_NAMES)
        self.assertTrue(live_data_service.MODEL2_FILE_NAMES.isdisjoint(live_data_service.REFRESH_UPLOAD_FILE_NAMES))
        self.assertEqual(live_data_service.MODEL2_FILE_NAMES, live_data_service.MODEL2_RUNTIME_UPLOAD_FILE_NAMES)

    def test_model2_refresh_decision_uses_rollover_and_interval(self):
        live_data_service.MODEL2_REFRESH_MIN_INTERVAL_SECONDS = 300
        now = datetime(2026, 7, 13, 10, 0, tzinfo=timezone.utc).timestamp()

        with tempfile.TemporaryDirectory() as temp_dir:
            data_dir = Path(temp_dir)
            (data_dir / "prediction.json").write_text(
                json.dumps({"predictionDateIso": "2026-07-14"}),
                encoding="utf-8",
            )
            (data_dir / "holiday_prediction.json").write_text(
                json.dumps(
                    {
                        "predictionDateIso": "2026-07-14",
                        "generatedAt": datetime.fromtimestamp(now - 120, timezone.utc).isoformat(),
                    }
                ),
                encoding="utf-8",
            )

            self.assertEqual(
                live_data_service.model2_refresh_decision(data_dir, now),
                (False, "recent_payload"),
            )

            payload = json.loads((data_dir / "holiday_prediction.json").read_text(encoding="utf-8"))
            payload["generatedAt"] = datetime.fromtimestamp(now - 301, timezone.utc).isoformat()
            (data_dir / "holiday_prediction.json").write_text(json.dumps(payload), encoding="utf-8")
            self.assertEqual(
                live_data_service.model2_refresh_decision(data_dir, now),
                (True, "interval_elapsed"),
            )

            payload["predictionDateIso"] = "2026-07-13"
            payload["generatedAt"] = datetime.fromtimestamp(now - 30, timezone.utc).isoformat()
            (data_dir / "holiday_prediction.json").write_text(json.dumps(payload), encoding="utf-8")
            self.assertEqual(
                live_data_service.model2_refresh_decision(data_dir, now),
                (True, "target_rollover"),
            )

    def test_model2_same_target_clock_sync_rejects_extreme_step(self):
        live_data_service.MODEL2_MAX_SAME_TARGET_STEP_PCT = 2.5
        previous = {
            "predictionDateIso": "2026-07-14",
            "clockSyncUsed": True,
            "pointPrediction": 7500.0,
        }

        live_data_service.guard_model2_same_target_step(
            previous,
            {**previous, "pointPrediction": 7560.0},
        )
        with self.assertRaises(GuardFailure):
            live_data_service.guard_model2_same_target_step(
                previous,
                {**previous, "pointPrediction": 7700.0},
            )

    def test_model2_refresh_publishes_atomic_snapshot_last(self):
        now = datetime(2026, 7, 13, 10, 0, tzinfo=timezone.utc).timestamp()
        uploads = []

        def model2_payload(point):
            return {
                "generatedAt": datetime.fromtimestamp(now - 600, timezone.utc).isoformat(),
                "calculationMode": "model2_no_night_futures_composite",
                "independentModel": True,
                "usesOtherModelPrediction": False,
                "nightFuturesUsed": False,
                "nightFuturesReadThisRun": False,
                "oneTimeNightFuturesBootstrapUsed": False,
                "baselineSource": "primary_model_prediction_clock_sync",
                "clockSyncUsed": True,
                "predictionDateIso": "2026-07-14",
                "pointPrediction": point,
                "model": {"engine": "EWYFXHybridCompositeNoNightFutures"},
            }

        with tempfile.TemporaryDirectory() as temp_dir:
            data_dir = Path(temp_dir)
            (data_dir / "prediction.json").write_text(
                json.dumps({"predictionDateIso": "2026-07-14"}),
                encoding="utf-8",
            )
            (data_dir / "holiday_prediction.json").write_text(json.dumps(model2_payload(7500.0)), encoding="utf-8")

            def fake_run(*args, **kwargs):
                current = model2_payload(7510.0)
                current["generatedAt"] = datetime.fromtimestamp(now, timezone.utc).isoformat()
                (data_dir / "holiday_prediction.json").write_text(json.dumps(current), encoding="utf-8")
                (data_dir / "holiday_prediction_series.json").write_text(
                    json.dumps(
                        {
                            "predictionDateIso": "2026-07-14",
                            "records": [
                                {
                                    "predictionDateIso": "2026-07-14",
                                    "observedAt": datetime.fromtimestamp(now, timezone.utc).isoformat(),
                                    "pointPrediction": 7510.0,
                                }
                            ],
                        }
                    ),
                    encoding="utf-8",
                )
                (data_dir / "holiday_history.json").write_text(
                    json.dumps({"records": [{"date": "2026-07-14", "model2Prediction": 7510.0}]}),
                    encoding="utf-8",
                )
                return type("Result", (), {"returncode": 0, "stdout": "wrote Model 2 independent prediction", "stderr": ""})()

            def fake_upload(file_name, source_path):
                self.assertTrue(source_path.exists())
                uploads.append(file_name)
                return True

            with patch.object(live_data_service.subprocess, "run", side_effect=fake_run), patch.object(
                live_data_service,
                "upload_bucket_file",
                side_effect=fake_upload,
            ):
                result = live_data_service.run_model2_refresh(data_dir, {}, now)

        self.assertEqual(result["status"], "updated")
        self.assertEqual(uploads[-1], live_data_service.MODEL2_BUNDLE_FILE_NAME)

    def test_distributed_refresh_lease_blocks_overlap_and_releases_by_generation(self):
        state = {"payload": None, "generation": 0, "updated": None}

        class FakeBlob:
            def __init__(self, name):
                self.name = name
                self.cache_control = None
                self.generation = None
                self.updated = None

            def upload_from_string(self, payload, content_type=None, if_generation_match=None):
                if if_generation_match == 0 and state["payload"] is not None:
                    raise PreconditionFailed("exists")
                state["generation"] += 1
                state["payload"] = payload.encode("utf-8")
                state["updated"] = datetime.now(timezone.utc)
                self.generation = state["generation"]

            def reload(self):
                if state["payload"] is None:
                    raise NotFound("missing")
                self.generation = state["generation"]
                self.updated = state["updated"]

            def download_as_bytes(self):
                if state["payload"] is None:
                    raise NotFound("missing")
                return state["payload"]

            def delete(self, if_generation_match=None):
                if state["payload"] is None:
                    raise NotFound("missing")
                if if_generation_match != state["generation"]:
                    raise PreconditionFailed("replaced")
                state["payload"] = None

        class FakeBucket:
            def blob(self, name):
                return FakeBlob(name)

        live_data_service.BUCKET_NAME = "test-bucket"
        live_data_service.get_storage_bucket = lambda bucket_name: FakeBucket()

        first = live_data_service.acquire_refresh_lease(now=1000, lease_id="first")
        second = live_data_service.acquire_refresh_lease(now=1001, lease_id="second")
        self.assertIsNotNone(first)
        self.assertIsNone(second)

        live_data_service.release_refresh_lease(first)
        third = live_data_service.acquire_refresh_lease(now=1002, lease_id="third")
        self.assertIsNotNone(third)
        self.assertNotEqual(first["generation"], third["generation"])

        fourth = live_data_service.acquire_refresh_lease(now=1500, lease_id="fourth")
        self.assertIsNotNone(fourth)
        self.assertNotEqual(third["generation"], fourth["generation"])

    def test_live_prediction_series_upload_skips_shorter_same_target_series(self):
        def series_payload(count):
            return {
                "predictionDateIso": "2026-06-08",
                "records": [
                    {
                        "predictionDateIso": "2026-06-08",
                        "observedAt": f"2026-06-05T15:{minute:02d}:00+00:00",
                    }
                    for minute in range(count)
                ],
            }

        def fake_download(file_name, target_path):
            self.assertEqual(file_name, "live_prediction_series.json")
            target_path.write_text(json.dumps(series_payload(3)), encoding="utf8")
            return True

        live_data_service.download_bucket_file = fake_download

        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            local_series_path = temp_path / "live_prediction_series.json"
            local_series_path.write_text(json.dumps(series_payload(1)), encoding="utf8")

            self.assertFalse(
                live_data_service.should_upload_live_prediction_series(
                    local_series_path,
                    temp_path,
                )
            )

    def test_live_prediction_series_upload_allows_longer_same_target_series(self):
        def series_payload(count):
            return {
                "predictionDateIso": "2026-06-08",
                "records": [
                    {
                        "predictionDateIso": "2026-06-08",
                        "observedAt": f"2026-06-05T15:{minute:02d}:00+00:00",
                    }
                    for minute in range(count)
                ],
            }

        def fake_download(file_name, target_path):
            self.assertEqual(file_name, "live_prediction_series.json")
            target_path.write_text(json.dumps(series_payload(1)), encoding="utf8")
            return True

        live_data_service.download_bucket_file = fake_download

        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            local_series_path = temp_path / "live_prediction_series.json"
            local_series_path.write_text(json.dumps(series_payload(3)), encoding="utf8")

            self.assertTrue(
                live_data_service.should_upload_live_prediction_series(
                    local_series_path,
                    temp_path,
                )
            )

    def test_refresh_request_body_size_is_limited(self):
        with live_data_service.app.test_request_context(
            "/api/tasks/refresh",
            method="POST",
            data=b"x" * (live_data_service.MAX_REFRESH_BODY_BYTES + 1),
        ):
            response, status = live_data_service.reject_oversized_refresh_request()

        self.assertEqual(status, 413)
        self.assertEqual(response.get_json()["error"], "request_too_large")

    def test_refresh_throttle_skips_non_window_calls(self):
        live_data_service.REFRESH_MIN_INTERVAL_SECONDS = 120

        with live_data_service.app.test_request_context("/api/tasks/refresh", method="POST"):
            self.assertIsNone(live_data_service.refresh_throttle_status(now=120))
            payload = live_data_service.refresh_throttle_status(now=190)

        self.assertIsNotNone(payload)
        self.assertEqual(payload["status"], "throttled")
        self.assertEqual(payload["nextWindowSeconds"], 50)

    def test_refresh_throttle_allows_force_request(self):
        live_data_service.REFRESH_MIN_INTERVAL_SECONDS = 120

        with live_data_service.app.test_request_context("/api/tasks/refresh?force=1", method="POST"):
            self.assertIsNone(live_data_service.refresh_throttle_status(now=190))

    def test_intraday_archive_upload_uses_create_only_objects(self):
        uploads = []

        class FakeBlob:
            def __init__(self, name):
                self.name = name
                self.cache_control = None

            def upload_from_filename(self, filename, content_type=None, if_generation_match=None):
                uploads.append(
                    {
                        "name": self.name,
                        "filename": Path(filename).name,
                        "content_type": content_type,
                        "if_generation_match": if_generation_match,
                        "cache_control": self.cache_control,
                    }
                )

        class FakeBucket:
            def blob(self, name):
                return FakeBlob(name)

        live_data_service.get_storage_bucket = lambda bucket_name: FakeBucket()

        with tempfile.TemporaryDirectory() as temp_dir:
            data_dir = Path(temp_dir)
            archive_file = (
                data_dir
                / "intraday_indicator_series"
                / "kst_date=2026-05-23"
                / "prediction_date=2026-05-25"
                / "20260522T235912Z.json"
            )
            archive_file.parent.mkdir(parents=True)
            archive_file.write_text('{"ok":true}', encoding="utf8")

            result = live_data_service.upload_intraday_archive_files(data_dir)

        self.assertEqual(
            result["uploaded"],
            [
                "intraday_indicator_series/kst_date=2026-05-23/"
                "prediction_date=2026-05-25/20260522T235912Z.json"
            ],
        )
        self.assertEqual(result["skipped"], [])
        self.assertEqual(uploads[0]["if_generation_match"], 0)
        self.assertEqual(uploads[0]["content_type"], "application/json; charset=utf-8")


if __name__ == "__main__":
    unittest.main()
