from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

from cloudrun import live_data_service


class LiveDataServiceSecurityTests(unittest.TestCase):
    def setUp(self):
        self.original_token = live_data_service.REFRESH_BEARER_TOKEN
        self.original_allow_unauthenticated = live_data_service.ALLOW_UNAUTHENTICATED_REFRESH
        self.original_cache_seconds = live_data_service.LIVE_JSON_CACHE_SECONDS
        self.original_download = live_data_service.download_bucket_file
        self.original_get_storage_bucket = live_data_service.get_storage_bucket
        live_data_service.clear_live_json_cache()

    def tearDown(self):
        live_data_service.REFRESH_BEARER_TOKEN = self.original_token
        live_data_service.ALLOW_UNAUTHENTICATED_REFRESH = self.original_allow_unauthenticated
        live_data_service.LIVE_JSON_CACHE_SECONDS = self.original_cache_seconds
        live_data_service.download_bucket_file = self.original_download
        live_data_service.get_storage_bucket = self.original_get_storage_bucket
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

    def test_refresh_upload_excludes_independent_model2_files(self):
        self.assertTrue(live_data_service.MODEL2_FILE_NAMES <= live_data_service.SEED_FILE_NAMES)
        self.assertTrue(live_data_service.MODEL2_FILE_NAMES <= live_data_service.SERVE_FILE_NAMES)
        self.assertTrue(live_data_service.MODEL2_FILE_NAMES.isdisjoint(live_data_service.REFRESH_UPLOAD_FILE_NAMES))

    def test_refresh_request_body_size_is_limited(self):
        with live_data_service.app.test_request_context(
            "/api/tasks/refresh",
            method="POST",
            data=b"x" * (live_data_service.MAX_REFRESH_BODY_BYTES + 1),
        ):
            response, status = live_data_service.reject_oversized_refresh_request()

        self.assertEqual(status, 413)
        self.assertEqual(response.get_json()["error"], "request_too_large")

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
