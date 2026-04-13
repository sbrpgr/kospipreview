from __future__ import annotations

import unittest
from datetime import datetime, timezone

from scripts import refresh_night_futures
from scripts.backtest_and_generate import KST, is_prediction_operation_window, resolve_prediction_target_timestamp


class OperatingWindowTests(unittest.TestCase):
    def test_prediction_target_rolls_after_kospi_open(self):
        before_open = datetime(2026, 4, 13, 8, 59, tzinfo=KST)
        after_open = datetime(2026, 4, 13, 9, 0, tzinfo=KST)

        self.assertEqual(resolve_prediction_target_timestamp(before_open).date().isoformat(), "2026-04-13")
        self.assertEqual(resolve_prediction_target_timestamp(after_open).date().isoformat(), "2026-04-14")

    def test_prediction_window_opens_at_domestic_close(self):
        before_close = datetime(2026, 4, 13, 15, 29, tzinfo=KST)
        at_close = datetime(2026, 4, 13, 15, 30, tzinfo=KST)

        self.assertFalse(is_prediction_operation_window(before_close))
        self.assertTrue(is_prediction_operation_window(at_close))
        self.assertFalse(
            refresh_night_futures.is_prediction_operation_window(
                datetime(2026, 4, 13, 6, 29, tzinfo=timezone.utc)
            )
        )
        self.assertTrue(
            refresh_night_futures.is_prediction_operation_window(
                datetime(2026, 4, 13, 6, 30, tzinfo=timezone.utc)
            )
        )

    def test_live_prediction_series_only_appends_during_operation_window(self):
        payload = {
            "generatedAt": "2026-04-13T08:58:00+09:00",
            "predictionDateIso": "2026-04-13",
            "predictionDate": "2026년 04월 13일",
            "pointPrediction": 5884.0,
            "nightFuturesSimplePoint": 5891.0,
            "predictedChangePct": 0.4,
            "nightFuturesSimpleChangePct": 0.5,
        }

        outside_window = datetime(2026, 4, 13, 4, 0, tzinfo=timezone.utc)  # 13:00 KST
        after_domestic_close = datetime(2026, 4, 13, 6, 30, tzinfo=timezone.utc)  # 15:30 KST
        trend_open = datetime(2026, 4, 13, 9, 0, tzinfo=timezone.utc)  # 18:00 KST
        inside_window = datetime(2026, 4, 12, 23, 0, tzinfo=timezone.utc)  # 08:00 KST

        original_loader = refresh_night_futures.load_live_prediction_series
        try:
            refresh_night_futures.load_live_prediction_series = lambda: {"records": []}
            self.assertEqual(refresh_night_futures.update_live_prediction_series(payload, outside_window)["records"], [])
            self.assertEqual(refresh_night_futures.update_live_prediction_series(payload, after_domestic_close)["records"], [])
            self.assertEqual(len(refresh_night_futures.update_live_prediction_series(payload, trend_open)["records"]), 1)
            self.assertEqual(len(refresh_night_futures.update_live_prediction_series(payload, inside_window)["records"]), 1)
        finally:
            refresh_night_futures.load_live_prediction_series = original_loader

    def test_day_close_session_date_rolls_at_1530(self):
        before_close = datetime(2026, 4, 13, 15, 29, tzinfo=KST)
        at_close = datetime(2026, 4, 13, 15, 30, tzinfo=KST)

        self.assertEqual(refresh_night_futures.latest_closed_day_futures_session_date(before_close), "2026-04-10")
        self.assertEqual(refresh_night_futures.latest_closed_day_futures_session_date(at_close), "2026-04-13")

    def test_refresh_rollover_sets_next_target_to_pending(self):
        payload = {
            "generatedAt": "2026-04-13T08:58:00+09:00",
            "predictionDateIso": "2026-04-13",
            "predictionDate": "2026년 04월 13일",
            "pointPrediction": 5884.0,
            "rangeLow": 5860.0,
            "rangeHigh": 5900.0,
            "predictedChangePct": 0.4,
            "signalSummary": "EWY 상승",
            "model": {},
        }
        after_open_utc = datetime(2026, 4, 13, 0, 0, tzinfo=timezone.utc)  # 09:00 KST

        rolled = refresh_night_futures.ensure_prediction_target_rollover(payload, after_open_utc)

        self.assertEqual(rolled["predictionDateIso"], "2026-04-14")
        self.assertIsNone(rolled["pointPrediction"])
        self.assertIsNone(rolled["lastCalculatedAt"])
        self.assertFalse(rolled["model"]["isOperationWindow"])

    def test_refresh_after_domestic_close_publishes_model_without_night_quote(self):
        payload = {
            "generatedAt": "2026-04-13T06:29:00+00:00",
            "predictionDateIso": "2026-04-14",
            "predictionDate": "2026년 04월 14일",
            "pointPrediction": None,
            "rangeLow": None,
            "rangeHigh": None,
            "predictedChangePct": None,
            "prevClose": 5800.0,
            "latestRecordDate": "2026-04-10",
            "mae30d": 20.0,
            "model": {
                "ewyFxIntercept": 0.0,
                "ewyFxEwyCoef": 1.0,
                "ewyFxKrwCoef": 1.0,
                "ewyFxSampleSize": 180,
                "ewyFxFitR2": 0.3,
                "residualModel": {"weight": 0.0},
                "k200Mapping": {"intercept": 0.0, "beta": 1.0, "sampleSize": 180},
            },
        }
        now_utc = datetime(2026, 4, 13, 6, 30, tzinfo=timezone.utc)  # 15:30 KST
        day_close_quote = {
            "close": 390.0,
            "updated_at": "2026-04-13T06:30:00+00:00",
            "session_date": "2026-04-13",
        }

        original_fetch_inputs = refresh_night_futures.fetch_live_prediction_inputs
        try:
            refresh_night_futures.fetch_live_prediction_inputs = lambda baseline, params: (
                {"krw": 0.2},
                {"krw": 0.2},
            )
            updated = refresh_night_futures.update_prediction_night_fields(
                payload,
                None,
                day_close_quote,
                now_utc,
            )
        finally:
            refresh_night_futures.fetch_live_prediction_inputs = original_fetch_inputs

        self.assertTrue(updated["model"]["isOperationWindow"])
        self.assertEqual(updated["model"]["operationHours"], "15:30~09:00")
        self.assertEqual(updated["model"]["nightFuturesExcluded"], True)
        self.assertEqual(updated["model"]["krxBaselineDate"], "2026-04-13")
        self.assertIsNotNone(updated["pointPrediction"])
        self.assertIsNotNone(updated["lastCalculatedAt"])
        self.assertIsNone(updated["nightFuturesSimplePoint"])
        self.assertIsNone(updated["nightFuturesSimpleChangePct"])

    def test_history_uses_preopen_series_for_fixed_actual_row(self):
        now_utc = datetime(2026, 4, 13, 4, 0, tzinfo=timezone.utc)  # 13:00 KST
        history = {"summary": {"mae30d": 21.0}, "records": []}
        archive = [
            {
                "predictionDateIso": "2026-04-13",
                "predictionDate": "2026년 04월 13일",
                "generatedAt": "2026-04-13T03:30:00+00:00",
                "pointPrediction": 5999.0,
                "rangeLow": 5980.0,
                "rangeHigh": 6020.0,
            }
        ]
        series = {
            "records": [
                {
                    "predictionDateIso": "2026-04-13",
                    "predictionDate": "2026년 04월 13일",
                    "observedAt": "2026-04-12T23:59:00+00:00",
                    "pointPrediction": 5884.0,
                    "nightFuturesSimplePoint": 5891.0,
                },
                {
                    "predictionDateIso": "2026-04-13",
                    "predictionDate": "2026년 04월 13일",
                    "observedAt": "2026-04-13T04:00:00+00:00",
                    "pointPrediction": 5900.0,
                },
            ]
        }

        original_fetch_open = refresh_night_futures.fetch_kospi_actual_open
        try:
            refresh_night_futures.fetch_kospi_actual_open = lambda target_date: 5876.12
            updated = refresh_night_futures.update_history_with_actual_open(history, archive, now_utc, series)
        finally:
            refresh_night_futures.fetch_kospi_actual_open = original_fetch_open

        self.assertEqual(updated["records"][0]["date"], "2026-04-13")
        self.assertEqual(updated["records"][0]["modelPrediction"], 5884.0)
        self.assertEqual(updated["records"][0]["actualOpen"], 5876.12)


if __name__ == "__main__":
    unittest.main()
