from __future__ import annotations

import unittest

from cloudrun import live_data_service


class LiveDataServiceSecurityTests(unittest.TestCase):
    def setUp(self):
        self.original_token = live_data_service.REFRESH_BEARER_TOKEN
        self.original_allow_unauthenticated = live_data_service.ALLOW_UNAUTHENTICATED_REFRESH
        self.original_cache_seconds = live_data_service.LIVE_JSON_CACHE_SECONDS
        self.original_download = live_data_service.download_bucket_file
        live_data_service.clear_live_json_cache()

    def tearDown(self):
        live_data_service.REFRESH_BEARER_TOKEN = self.original_token
        live_data_service.ALLOW_UNAUTHENTICATED_REFRESH = self.original_allow_unauthenticated
        live_data_service.LIVE_JSON_CACHE_SECONDS = self.original_cache_seconds
        live_data_service.download_bucket_file = self.original_download
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

    def test_refresh_request_body_size_is_limited(self):
        with live_data_service.app.test_request_context(
            "/api/tasks/refresh",
            method="POST",
            data=b"x" * (live_data_service.MAX_REFRESH_BODY_BYTES + 1),
        ):
            response, status = live_data_service.reject_oversized_refresh_request()

        self.assertEqual(status, 413)
        self.assertEqual(response.get_json()["error"], "request_too_large")


if __name__ == "__main__":
    unittest.main()
