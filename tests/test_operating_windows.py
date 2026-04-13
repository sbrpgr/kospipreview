from __future__ import annotations

import unittest
from datetime import datetime, timezone

from scripts import backtest_and_generate
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
            "ewyFxSimplePoint": 5902.5,
            "predictedChangePct": 0.4,
            "nightFuturesSimpleChangePct": 0.5,
            "ewyFxSimpleChangePct": 0.7,
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
            trend_records = refresh_night_futures.update_live_prediction_series(payload, trend_open)["records"]
            self.assertEqual(len(trend_records), 1)
            self.assertEqual(trend_records[0]["ewyFxSimplePoint"], 5902.5)
            self.assertEqual(trend_records[0]["ewyFxSimpleChangePct"], 0.7)
            self.assertEqual(len(refresh_night_futures.update_live_prediction_series(payload, inside_window)["records"]), 1)
        finally:
            refresh_night_futures.load_live_prediction_series = original_loader

    def test_day_close_session_date_rolls_at_1530(self):
        before_close = datetime(2026, 4, 13, 15, 29, tzinfo=KST)
        at_close = datetime(2026, 4, 13, 15, 30, tzinfo=KST)

        self.assertEqual(refresh_night_futures.latest_closed_day_futures_session_date(before_close), "2026-04-10")
        self.assertEqual(refresh_night_futures.latest_closed_day_futures_session_date(at_close), "2026-04-13")

    def test_yahoo_quote_payload_prefers_overnight_ewy_snapshot(self):
        payload = {
            "regularMarketPrice": {"raw": 138.73},
            "regularMarketTime": {"raw": 1775851200},
            "regularMarketChangePercent": {"raw": -0.64},
            "overnightMarketPrice": {"raw": 135.74},
            "overnightMarketTime": {"raw": 1776059593},
            "overnightMarketChangePercent": {"raw": -2.1552587},
        }

        snapshot = refresh_night_futures.yahoo_quote_payload_snapshot(payload)

        self.assertIsNotNone(snapshot)
        self.assertEqual(snapshot["market_session"], "overnight")
        self.assertEqual(snapshot["value"], 135.74)
        self.assertAlmostEqual(snapshot["change_pct"], -2.1552587)

    def test_market_display_snapshot_uses_latest_quote_for_any_symbol(self):
        original_chart = refresh_night_futures.fetch_yahoo_chart_market_display_snapshot
        original_quote = refresh_night_futures.fetch_yahoo_quote_page_snapshot
        try:
            refresh_night_futures.fetch_yahoo_chart_market_display_snapshot = lambda symbol: {
                "value": 100.0,
                "change_pct": 0.1,
                "updated_at": "2026-04-13T05:00:00+00:00",
            }
            refresh_night_futures.fetch_yahoo_quote_page_snapshot = lambda symbol: {
                "value": 101.0,
                "change_pct": 1.1,
                "updated_at": "2026-04-13T05:02:00+00:00",
                "market_session": "post",
            }

            snapshot = refresh_night_futures.fetch_yahoo_market_display_snapshot("^GSPC")
        finally:
            refresh_night_futures.fetch_yahoo_chart_market_display_snapshot = original_chart
            refresh_night_futures.fetch_yahoo_quote_page_snapshot = original_quote

        self.assertIsNotNone(snapshot)
        self.assertEqual(snapshot["value"], 101.0)
        self.assertEqual(snapshot["market_session"], "post")

    def test_market_display_snapshot_prefers_session_metadata_on_tie(self):
        chart = {
            "value": 100.0,
            "change_pct": 0.1,
            "updated_at": "2026-04-13T05:00:00+00:00",
        }
        quote = {
            "value": 100.0,
            "change_pct": 0.1,
            "updated_at": "2026-04-13T05:00:00+00:00",
            "market_session": "regular",
        }

        snapshot = refresh_night_futures.select_latest_market_snapshot(chart, quote)

        self.assertIsNotNone(snapshot)
        self.assertEqual(snapshot["market_session"], "regular")

    def test_quote_page_latest_point_merges_for_non_ewy_symbol(self):
        original_fetch = refresh_night_futures.fetch_yahoo_quote_page_snapshot
        try:
            refresh_night_futures.fetch_yahoo_quote_page_snapshot = lambda symbol: {
                "value": 6020.0,
                "change_pct": 0.4,
                "updated_at": "2026-04-13T05:02:00+00:00",
                "market_session": "pre",
            }
            points = [
                (datetime(2026, 4, 13, 5, 0, tzinfo=timezone.utc), 6000.0),
            ]

            merged = refresh_night_futures.merge_yahoo_quote_page_latest_point("^GSPC", points)
        finally:
            refresh_night_futures.fetch_yahoo_quote_page_snapshot = original_fetch

        self.assertEqual(len(merged), 2)
        self.assertEqual(merged[-1][1], 6020.0)
        self.assertEqual(merged[-1][0], datetime(2026, 4, 13, 5, 2, tzinfo=timezone.utc))

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
        original_fetch_close_quote = refresh_night_futures.fetch_kospi_actual_close_quote
        try:
            refresh_night_futures.fetch_live_prediction_inputs = lambda baseline, params: (
                {"krw": 0.2},
                {"krw": 0.2},
            )
            refresh_night_futures.fetch_kospi_actual_close_quote = lambda target_date: {
                "close": 5806.62,
                "updated_at": "2026-04-13T06:30:00+00:00",
                "session_date": "2026-04-13",
                "provider": "test",
            }
            updated = refresh_night_futures.update_prediction_night_fields(
                payload,
                None,
                day_close_quote,
                now_utc,
            )
        finally:
            refresh_night_futures.fetch_live_prediction_inputs = original_fetch_inputs
            refresh_night_futures.fetch_kospi_actual_close_quote = original_fetch_close_quote

        self.assertTrue(updated["model"]["isOperationWindow"])
        self.assertEqual(updated["model"]["operationHours"], "15:30~09:00")
        self.assertEqual(updated["model"]["nightFuturesExcluded"], True)
        self.assertEqual(updated["model"]["krxBaselineDate"], "2026-04-13")
        self.assertEqual(updated["prevClose"], 5806.62)
        self.assertEqual(updated["latestRecordDate"], "2026-04-13")
        self.assertIsNotNone(updated["pointPrediction"])
        self.assertIsNotNone(updated["lastCalculatedAt"])
        self.assertIsNone(updated["nightFuturesSimplePoint"])
        self.assertIsNone(updated["nightFuturesSimpleChangePct"])

    def test_night_futures_simple_uses_current_kospi_close_after_domestic_close(self):
        payload = {
            "generatedAt": "2026-04-13T09:56:00+00:00",
            "predictionDateIso": "2026-04-14",
            "predictionDate": "2026-04-14",
            "pointPrediction": None,
            "rangeLow": None,
            "rangeHigh": None,
            "predictedChangePct": None,
            "prevClose": 5858.87,
            "latestRecordDate": "2026-04-10",
            "mae30d": 20.0,
            "model": {},
        }
        now_utc = datetime(2026, 4, 13, 9, 57, tzinfo=timezone.utc)  # 18:57 KST
        day_close_quote = {
            "close": 872.0,
            "updated_at": "2026-04-13T06:45:00+00:00",
            "session_date": "2026-04-13",
        }
        quote = {
            "price": 871.75,
            "previous_close": 872.0,
            "change_pct": (871.75 / 872.0 - 1) * 100,
            "updated_at": "2026-04-13T09:57:00+00:00",
            "day_close_date": "2026-04-13",
            "is_live_night": True,
        }

        original_fetch_inputs = refresh_night_futures.fetch_live_prediction_inputs
        original_fetch_close_quote = refresh_night_futures.fetch_kospi_actual_close_quote
        try:
            refresh_night_futures.fetch_live_prediction_inputs = lambda baseline, params: ({}, {})
            refresh_night_futures.fetch_kospi_actual_close_quote = lambda target_date: {
                "close": 5806.62,
                "updated_at": "2026-04-13T06:30:00+00:00",
                "session_date": "2026-04-13",
                "provider": "test",
            }
            updated = refresh_night_futures.update_prediction_night_fields(
                payload,
                quote,
                day_close_quote,
                now_utc,
            )
        finally:
            refresh_night_futures.fetch_live_prediction_inputs = original_fetch_inputs
            refresh_night_futures.fetch_kospi_actual_close_quote = original_fetch_close_quote

        expected_simple = 5806.62 * (871.75 / 872.0)
        self.assertEqual(updated["prevClose"], 5806.62)
        self.assertEqual(updated["latestRecordDate"], "2026-04-13")
        self.assertAlmostEqual(updated["nightFuturesSimplePoint"], round(expected_simple, 2))
        self.assertLess(updated["nightFuturesSimplePoint"], 5806.62)
        self.assertEqual(updated["futuresDayClose"], 872.0)
        self.assertEqual(updated["nightFuturesClose"], 871.75)

    def test_ewy_fx_simple_conversion_uses_ewy_and_krw_without_mapping(self):
        payload = {
            "generatedAt": "2026-04-13T09:56:00+00:00",
            "predictionDateIso": "2026-04-14",
            "predictionDate": "2026-04-14",
            "pointPrediction": None,
            "rangeLow": None,
            "rangeHigh": None,
            "predictedChangePct": None,
            "prevClose": 5858.87,
            "latestRecordDate": "2026-04-10",
            "mae30d": 20.0,
            "model": {
                "ewyFxIntercept": 0.0,
                "ewyFxEwyCoef": 0.36,
                "ewyFxKrwCoef": 0.2,
                "ewyFxSampleSize": 180,
                "ewyFxFitR2": 0.3,
                "residualModel": {"weight": 0.0},
                "k200Mapping": {"intercept": 0.16, "beta": 0.34, "sampleSize": 240},
            },
        }
        now_utc = datetime(2026, 4, 13, 9, 57, tzinfo=timezone.utc)  # 18:57 KST
        day_close_quote = {
            "close": 872.0,
            "updated_at": "2026-04-13T06:45:00+00:00",
            "session_date": "2026-04-13",
        }
        ewy_log = backtest_and_generate.simple_return_pct_to_log_return_pct(3.0)
        krw_log = backtest_and_generate.simple_return_pct_to_log_return_pct(-0.4)
        self.assertIsNotNone(ewy_log)
        self.assertIsNotNone(krw_log)

        original_fetch_inputs = refresh_night_futures.fetch_live_prediction_inputs
        original_fetch_close_quote = refresh_night_futures.fetch_kospi_actual_close_quote
        try:
            refresh_night_futures.fetch_live_prediction_inputs = lambda baseline, params: (
                {"ewy": 3.0, "krw": -0.4},
                {"ewy": ewy_log, "krw": krw_log},
            )
            refresh_night_futures.fetch_kospi_actual_close_quote = lambda target_date: {
                "close": 5806.62,
                "updated_at": "2026-04-13T06:30:00+00:00",
                "session_date": "2026-04-13",
                "provider": "test",
            }
            updated = refresh_night_futures.update_prediction_night_fields(
                payload,
                None,
                day_close_quote,
                now_utc,
            )
        finally:
            refresh_night_futures.fetch_live_prediction_inputs = original_fetch_inputs
            refresh_night_futures.fetch_kospi_actual_close_quote = original_fetch_close_quote

        expected_return = float(ewy_log) + float(krw_log)
        expected_change = backtest_and_generate.log_return_pct_to_simple_return_pct(expected_return)
        expected_point = backtest_and_generate.price_from_log_return(5806.62, expected_return)

        self.assertAlmostEqual(updated["ewyFxSimpleChangePct"], round(expected_change, 2))
        self.assertAlmostEqual(updated["ewyFxSimplePoint"], round(expected_point, 2))
        self.assertNotEqual(updated["ewyFxSimplePoint"], updated["pointPrediction"])
        self.assertTrue(updated["model"]["nightFuturesExcluded"])

    def test_provisional_day_futures_close_cache_is_refetched_after_settlement(self):
        cached = {
            "close": 874.05,
            "updated_at": "2026-04-13T06:30:03+00:00",
            "session_date": "2026-04-13",
            "provider": "esignal-socket",
            "selection": "session-close-socket",
        }
        final_quote = {
            "close": 872.0,
            "updated_at": "2026-04-13T06:45:00+00:00",
            "session_date": "2026-04-13",
            "provider": "esignal-socket",
            "selection": "session-close-socket",
        }
        saved = {}

        original_load = refresh_night_futures.load_day_futures_close_cache
        original_fetch = refresh_night_futures.fetch_esignal_kospi_day_close_quote
        original_save = refresh_night_futures.save_day_futures_close_cache
        try:
            refresh_night_futures.load_day_futures_close_cache = lambda: cached
            refresh_night_futures.fetch_esignal_kospi_day_close_quote = lambda: final_quote
            refresh_night_futures.save_day_futures_close_cache = lambda quote: saved.update(quote)

            resolved = refresh_night_futures.resolve_day_futures_close_quote()
        finally:
            refresh_night_futures.load_day_futures_close_cache = original_load
            refresh_night_futures.fetch_esignal_kospi_day_close_quote = original_fetch
            refresh_night_futures.save_day_futures_close_cache = original_save

        self.assertEqual(resolved["close"], 872.0)
        self.assertEqual(saved["close"], 872.0)

    def test_backtest_provisional_day_futures_close_cache_is_refetched_after_settlement(self):
        cached = {
            "close": 874.05,
            "updated_at": "2026-04-13T06:30:03+00:00",
            "session_date": "2026-04-13",
            "provider": "esignal-socket",
            "selection": "session-close-socket",
        }
        final_quote = {
            "close": 872.0,
            "updated_at": "2026-04-13T06:45:00+00:00",
            "session_date": "2026-04-13",
            "provider": "esignal-socket",
            "selection": "session-close-socket",
        }
        saved = {}

        original_load = backtest_and_generate.load_day_futures_close_cache
        original_fetch = backtest_and_generate.fetch_esignal_kospi_day_close_quote
        original_save = backtest_and_generate.save_day_futures_close_cache
        try:
            backtest_and_generate.load_day_futures_close_cache = lambda: cached
            backtest_and_generate.fetch_esignal_kospi_day_close_quote = lambda: final_quote
            backtest_and_generate.save_day_futures_close_cache = lambda quote: saved.update(quote)

            resolved = backtest_and_generate.resolve_day_futures_close_quote()
        finally:
            backtest_and_generate.load_day_futures_close_cache = original_load
            backtest_and_generate.fetch_esignal_kospi_day_close_quote = original_fetch
            backtest_and_generate.save_day_futures_close_cache = original_save

        self.assertEqual(resolved["close"], 872.0)
        self.assertEqual(saved["close"], 872.0)

    def test_live_prediction_inputs_prefer_kospi_close_baseline_over_snapshot(self):
        original_snapshot = refresh_night_futures.fetch_yahoo_market_display_snapshot
        original_display = refresh_night_futures.fetch_yahoo_intraday_return_pct
        original_model = refresh_night_futures.fetch_yahoo_intraday_model_change
        try:
            refresh_night_futures.fetch_yahoo_market_display_snapshot = (
                lambda symbol: {
                    "value": 135.7,
                    "change_pct": -2.21,
                    "updated_at": "2026-04-13T10:43:00+00:00",
                    "market_session": "pre",
                }
                if symbol == "EWY"
                else None
            )
            refresh_night_futures.fetch_yahoo_intraday_return_pct = (
                lambda symbol, baseline: 0.31 if symbol == "EWY" else None
            )
            refresh_night_futures.fetch_yahoo_intraday_model_change = (
                lambda symbol, baseline, diff_mode=False: 0.309 if symbol == "EWY" else None
            )

            display_returns, model_returns = refresh_night_futures.fetch_live_prediction_inputs("2026-04-13")
        finally:
            refresh_night_futures.fetch_yahoo_market_display_snapshot = original_snapshot
            refresh_night_futures.fetch_yahoo_intraday_return_pct = original_display
            refresh_night_futures.fetch_yahoo_intraday_model_change = original_model

        self.assertEqual(display_returns["ewy"], 0.31)
        self.assertEqual(model_returns["ewy"], 0.309)

    def test_live_prediction_inputs_use_session_snapshot_as_fallback(self):
        original_snapshot = refresh_night_futures.fetch_yahoo_market_display_snapshot
        original_display = refresh_night_futures.fetch_yahoo_intraday_return_pct
        original_model = refresh_night_futures.fetch_yahoo_intraday_model_change
        try:
            refresh_night_futures.fetch_yahoo_market_display_snapshot = (
                lambda symbol: {
                    "value": 135.7,
                    "change_pct": -2.21,
                    "updated_at": "2026-04-13T10:43:00+00:00",
                    "market_session": "pre",
                }
                if symbol == "EWY"
                else None
            )
            refresh_night_futures.fetch_yahoo_intraday_return_pct = lambda symbol, baseline: None
            refresh_night_futures.fetch_yahoo_intraday_model_change = (
                lambda symbol, baseline, diff_mode=False: None
            )

            display_returns, model_returns = refresh_night_futures.fetch_live_prediction_inputs("2026-04-13")
        finally:
            refresh_night_futures.fetch_yahoo_market_display_snapshot = original_snapshot
            refresh_night_futures.fetch_yahoo_intraday_return_pct = original_display
            refresh_night_futures.fetch_yahoo_intraday_model_change = original_model

        self.assertEqual(display_returns["ewy"], -2.21)
        self.assertLess(model_returns["ewy"], 0)

    def test_mapping_intercept_can_flip_small_core_signal_without_forcing_direction(self):
        components = backtest_and_generate.compute_prediction_components(
            {
                "ewy": -0.2773787804659043,
                "krw": 0.020817385404211766,
            },
            core_params={
                "intercept": 0.1706,
                "ewy_coef": 0.3618,
                "krw_coef": 0.2,
                "sample_size": 180,
                "r2": 0.2341,
            },
            residual_artifact={"weight": 0.0},
            mapping_artifact={
                "intercept": 0.161147,
                "beta": 0.344188,
                "sample_size": 240,
            },
        )

        self.assertTrue(components["mapping_direction_flip"])
        self.assertGreater(components["mapping_intercept_return"], 0)
        self.assertLess(components["mapping_beta_return"], 0)
        self.assertGreater(components["predicted_kospi_simple_pct_pre_guard"], 0)
        self.assertEqual(
            components["predicted_kospi_simple_pct_pre_guard"],
            components["predicted_kospi_simple_pct"],
        )

    def test_history_leaves_legacy_futures_close_fields_blank_before_tracking_start(self):
        now_utc = datetime(2026, 4, 13, 4, 0, tzinfo=timezone.utc)  # 13:00 KST
        history = {
            "summary": {"mae30d": 21.0},
            "records": [
                {
                    "date": "2026-04-13",
                    "dayFuturesClose": 872.0,
                    "nightFuturesClose": 871.75,
                }
            ],
        }
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
                    "nightFuturesClose": 871.75,
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
        original_fetch_close = refresh_night_futures.fetch_kospi_actual_close
        try:
            refresh_night_futures.fetch_kospi_actual_open = lambda target_date: 5876.12
            refresh_night_futures.fetch_kospi_actual_close = lambda target_date: 5806.62
            updated = refresh_night_futures.update_history_with_actual_open(
                history,
                archive,
                now_utc,
                series,
                day_close_quote={
                    "close": 872.0,
                    "updated_at": "2026-04-13T06:45:00+00:00",
                    "session_date": "2026-04-13",
                },
            )
        finally:
            refresh_night_futures.fetch_kospi_actual_open = original_fetch_open
            refresh_night_futures.fetch_kospi_actual_close = original_fetch_close

        self.assertEqual(updated["records"][0]["date"], "2026-04-13")
        self.assertEqual(updated["records"][0]["modelPrediction"], 5884.0)
        self.assertEqual(updated["records"][0]["actualOpen"], 5876.12)
        self.assertEqual(updated["records"][0]["actualClose"], 5806.62)
        self.assertIsNone(updated["records"][0]["dayFuturesClose"])
        self.assertIsNone(updated["records"][0]["nightFuturesClose"])

    def test_history_tracks_futures_close_fields_from_tracking_start(self):
        now_utc = datetime(2026, 4, 14, 4, 0, tzinfo=timezone.utc)  # 13:00 KST
        history = {"summary": {"mae30d": 21.0}, "records": []}
        archive = [
            {
                "predictionDateIso": "2026-04-14",
                "predictionDate": "2026-04-14",
                "generatedAt": "2026-04-14T03:30:00+00:00",
                "pointPrediction": 5999.0,
                "rangeLow": 5980.0,
                "rangeHigh": 6020.0,
            }
        ]
        series = {
            "records": [
                {
                    "predictionDateIso": "2026-04-14",
                    "predictionDate": "2026-04-14",
                    "observedAt": "2026-04-13T23:59:00+00:00",
                    "pointPrediction": 5884.0,
                    "nightFuturesSimplePoint": 5891.0,
                    "ewyFxSimplePoint": 5902.5,
                    "nightFuturesClose": 874.75,
                },
            ]
        }

        original_fetch_open = refresh_night_futures.fetch_kospi_actual_open
        original_fetch_close = refresh_night_futures.fetch_kospi_actual_close
        try:
            refresh_night_futures.fetch_kospi_actual_open = lambda target_date: 5876.12
            refresh_night_futures.fetch_kospi_actual_close = lambda target_date: 5806.62
            updated = refresh_night_futures.update_history_with_actual_open(
                history,
                archive,
                now_utc,
                series,
                day_close_quote={
                    "close": 875.0,
                    "updated_at": "2026-04-14T06:45:00+00:00",
                    "session_date": "2026-04-14",
                },
            )
        finally:
            refresh_night_futures.fetch_kospi_actual_open = original_fetch_open
            refresh_night_futures.fetch_kospi_actual_close = original_fetch_close

        self.assertEqual(updated["records"][0]["date"], "2026-04-14")
        self.assertEqual(updated["records"][0]["actualOpen"], 5876.12)
        self.assertEqual(updated["records"][0]["actualClose"], 5806.62)
        self.assertEqual(updated["records"][0]["dayFuturesClose"], 875.0)
        self.assertEqual(updated["records"][0]["nightFuturesClose"], 874.75)
        self.assertEqual(updated["records"][0]["ewyFxSimpleOpen"], 5902.5)


if __name__ == "__main__":
    unittest.main()
