from __future__ import annotations

import json
import math
import tempfile
import unittest
from datetime import datetime, timezone
from pathlib import Path

from scripts import refresh_holiday_prediction as model2


CURRENT_PRICES = {
    "ewy": 101.0,
    "krw": 1320.0,
    "sp500": 5200.0,
    "nasdaq": 18500.0,
    "dow": 39500.0,
    "sox": 5100.0,
    "vix": 14.0,
    "gold": 2350.0,
    "wti": 78.0,
    "us10y": 4.25,
}


class Model2IndependenceTests(unittest.TestCase):
    def test_one_time_bootstrap_then_reuses_baseline_even_if_night_changes(self):
        last_session = {"date": "2026-06-04", "close": 8508.35}
        now_utc = datetime(2026, 6, 4, 15, 40, tzinfo=timezone.utc)

        first = model2.resolve_model2_baseline(
            existing_payload={},
            last_session=last_session,
            current_prices=CURRENT_PRICES,
            primary_snapshot={
                "pointPrediction": 1.0,
                "nightFuturesSimplePoint": 8548.1,
            },
            now_utc=now_utc,
        )

        self.assertEqual(first["baselineSource"], model2.BOOTSTRAP_SOURCE)
        self.assertEqual(first["baselinePoint"], 8548.1)
        self.assertTrue(first["nightFuturesReadThisRun"])

        existing_model2_payload = {
            "calculationMode": model2.MODEL2_MODE,
            "baselineDate": first["baselineDate"],
            "baselinePoint": first["baselinePoint"],
            "baselineSource": first["baselineSource"],
            "baselinePrices": first["baselinePrices"],
            "oneTimeNightFuturesBootstrapUsed": True,
            "oneTimeNightFuturesBootstrapAt": first["oneTimeNightFuturesBootstrapAt"],
        }
        changed_prices = {**CURRENT_PRICES, "ewy": 102.5, "krw": 1314.0}

        second = model2.resolve_model2_baseline(
            existing_payload=existing_model2_payload,
            last_session=last_session,
            current_prices=changed_prices,
            primary_snapshot={
                "pointPrediction": 9999.0,
                "nightFuturesSimplePoint": 9999.0,
            },
            now_utc=now_utc,
        )

        self.assertEqual(second["baselinePoint"], 8548.1)
        self.assertEqual(second["baselineSource"], model2.BOOTSTRAP_SOURCE)
        self.assertFalse(second["nightFuturesReadThisRun"])
        self.assertEqual(second["resetReason"], "reuse_existing_baseline")

    def test_new_krx_session_resets_to_kospi_close_not_night(self):
        last_session = {"date": "2026-06-05", "close": 8600.0}
        existing_model2_payload = {
            "calculationMode": model2.MODEL2_MODE,
            "baselineDate": "2026-06-04",
            "baselinePoint": 8548.1,
            "baselineSource": model2.BOOTSTRAP_SOURCE,
            "baselinePrices": {"ewy": 101.0, "krw": 1320.0},
            "oneTimeNightFuturesBootstrapUsed": True,
        }
        original_get_session_close_prices = model2.get_session_close_prices

        try:
            model2.get_session_close_prices = lambda session_date: {
                "ewy": 103.0,
                "krw": 1310.0,
            }
            baseline = model2.resolve_model2_baseline(
                existing_payload=existing_model2_payload,
                last_session=last_session,
                current_prices=CURRENT_PRICES,
                primary_snapshot={"nightFuturesSimplePoint": 7000.0},
                now_utc=datetime(2026, 6, 5, 8, 0, tzinfo=timezone.utc),
            )
        finally:
            model2.get_session_close_prices = original_get_session_close_prices

        self.assertEqual(baseline["baselinePoint"], 8600.0)
        self.assertEqual(baseline["baselineSource"], model2.KOSPI_CLOSE_SOURCE)
        self.assertFalse(baseline["nightFuturesReadThisRun"])
        self.assertEqual(baseline["resetReason"], "new_krx_session_close")

    def test_stale_yahoo_bootstrap_date_migrates_without_new_night_read(self):
        existing_model2_payload = {
            "calculationMode": model2.MODEL2_MODE,
            "prevCloseDate": "2026-06-02",
            "prevCloseSource": "yahoo_ks11",
            "baselineDate": "2026-06-02",
            "baselinePoint": 8620.02,
            "baselineSource": model2.BOOTSTRAP_SOURCE,
            "baselinePrices": {"ewy": 203.39, "krw": 1531.83},
            "oneTimeNightFuturesBootstrapUsed": True,
            "oneTimeNightFuturesBootstrapAt": "2026-06-04T16:31:24+00:00",
        }

        migrated = model2.resolve_model2_baseline(
            existing_payload=existing_model2_payload,
            last_session={"date": "2026-06-04", "close": 8639.41},
            current_prices=CURRENT_PRICES,
            primary_snapshot={"nightFuturesSimplePoint": 1.0},
            now_utc=datetime(2026, 6, 4, 16, 35, tzinfo=timezone.utc),
        )

        self.assertEqual(migrated["baselinePoint"], 8620.02)
        self.assertEqual(migrated["baselineDate"], "2026-06-04")
        self.assertEqual(migrated["baselineSource"], model2.BOOTSTRAP_SOURCE)
        self.assertFalse(migrated["nightFuturesReadThisRun"])
        self.assertEqual(migrated["resetReason"], "migrate_bootstrap_baseline_to_shared_kospi_session")

    def test_preopen_kospi_reset_can_be_repaired_to_bootstrap_baseline(self):
        existing_model2_payload = {
            "calculationMode": model2.MODEL2_MODE,
            "prevCloseDate": "2026-06-04",
            "prevCloseSource": "primary_kospi_close_snapshot",
            "baselineDate": "2026-06-04",
            "baselinePoint": 8639.41,
            "baselineSource": model2.KOSPI_CLOSE_SOURCE,
            "baselinePrices": {"ewy": 203.18, "krw": 1531.69},
            "oneTimeNightFuturesBootstrapUsed": True,
            "oneTimeNightFuturesBootstrapAt": "2026-06-04T16:31:24+00:00",
        }

        repaired = model2.resolve_model2_baseline(
            existing_payload=existing_model2_payload,
            last_session={"date": "2026-06-04", "close": 8639.41},
            current_prices=CURRENT_PRICES,
            primary_snapshot={"nightFuturesSimplePoint": 8595.01},
            now_utc=datetime(2026, 6, 4, 16, 38, tzinfo=timezone.utc),
        )

        self.assertEqual(repaired["baselinePoint"], 8595.01)
        self.assertEqual(repaired["baselineDate"], "2026-06-04")
        self.assertEqual(repaired["baselineSource"], model2.BOOTSTRAP_SOURCE)
        self.assertTrue(repaired["nightFuturesReadThisRun"])
        self.assertEqual(repaired["resetReason"], "repair_preopen_bootstrap_after_kospi_reset")

    def test_primary_kospi_session_snapshot_beats_stale_yahoo_session(self):
        original_get_last_krx_session = model2.get_last_krx_session

        try:
            model2.get_last_krx_session = lambda: {
                "date": "2026-06-02",
                "close": 8801.49,
                "source": "yahoo_ks11",
            }
            session = model2.resolve_last_krx_session(
                {
                    "prevCloseDate": "2026-06-04",
                    "latestRecordDate": "2026-06-04",
                    "prevClose": 8639.41,
                    "pointPrediction": 1.0,
                    "nightFuturesSimplePoint": 9999.0,
                }
            )
        finally:
            model2.get_last_krx_session = original_get_last_krx_session

        self.assertEqual(session["date"], "2026-06-04")
        self.assertEqual(session["close"], 8639.41)
        self.assertEqual(session["source"], "primary_kospi_close_snapshot")

    def test_public_primary_snapshot_repairs_stale_local_prediction_snapshot(self):
        original_primary_path = model2.PRIMARY_PREDICTION_PATH
        original_fetch_json = model2._fetch_json

        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir) / "prediction.json"
            temp_path.write_text(
                json.dumps({"prevCloseDate": "2026-06-02", "prevClose": 8801.49}),
                encoding="utf-8",
            )
            try:
                model2.PRIMARY_PREDICTION_PATH = temp_path
                model2._fetch_json = lambda url: {
                    "prevCloseDate": "2026-06-04",
                    "latestRecordDate": "2026-06-04",
                    "prevClose": 8639.41,
                    "pointPrediction": 1.0,
                    "nightFuturesSimplePoint": 9999.0,
                }

                snapshot = model2.load_primary_prediction_snapshot(
                    datetime(2026, 6, 5, 1, 45, tzinfo=timezone.utc)
                )
            finally:
                model2.PRIMARY_PREDICTION_PATH = original_primary_path
                model2._fetch_json = original_fetch_json

        self.assertEqual(snapshot["prevCloseDate"], "2026-06-04")
        self.assertEqual(snapshot["prevClose"], 8639.41)

    def test_diagnostics_loader_falls_back_to_public_artifact(self):
        original_diagnostics_path = model2.DIAGNOSTICS_PATH
        original_fetch_json = model2._fetch_json

        public_artifact = {
            "residualModel": {
                "coefficients": {"broad_factor": -0.2},
                "mae": 1.25,
            },
            "k200Mapping": {"beta": 0.35},
        }

        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir) / "backtest_diagnostics.json"
            temp_path.write_text("{}", encoding="utf-8")
            try:
                model2.DIAGNOSTICS_PATH = temp_path
                model2._fetch_json = lambda url: public_artifact

                diagnostics = model2.load_diagnostics_artifact()
            finally:
                model2.DIAGNOSTICS_PATH = original_diagnostics_path
                model2._fetch_json = original_fetch_json

        self.assertEqual(diagnostics, public_artifact)
        self.assertTrue(model2.is_valid_diagnostics(diagnostics))

    def test_existing_model2_prev_close_guards_against_stale_yahoo_session(self):
        guarded = model2.guard_last_session_with_existing_model2(
            {"date": "2026-06-02", "close": 8801.49, "source": "yahoo_ks11"},
            {
                "calculationMode": model2.MODEL2_MODE,
                "prevCloseDate": "2026-06-04",
                "prevClose": 8639.41,
                "prevCloseSource": "primary_kospi_close_snapshot",
                "baselineDate": "2026-06-04",
                "baselinePoint": 8601.26,
                "baselineSource": model2.BOOTSTRAP_SOURCE,
            },
        )

        self.assertEqual(guarded["date"], "2026-06-04")
        self.assertEqual(guarded["close"], 8639.41)
        self.assertEqual(guarded["source"], "existing_model2_prev_close_guard")

    def test_session_baseline_prefers_krx_sync_intraday_price(self):
        original_fetch_points = model2.fetch_yahoo_chart_points
        original_prev_close = model2._get_prev_session_close

        try:
            model2.fetch_yahoo_chart_points = lambda symbol: [
                (datetime(2026, 6, 5, 8, 0, tzinfo=timezone.utc), 192.49),
                (datetime(2026, 6, 5, 12, 8, tzinfo=timezone.utc), 193.79),
            ] if symbol == "EWY" else []
            model2._get_prev_session_close = lambda symbol, session_date: 203.97 if symbol == "EWY" else None

            prices = model2.get_session_close_prices("2026-06-05")
        finally:
            model2.fetch_yahoo_chart_points = original_fetch_points
            model2._get_prev_session_close = original_prev_close

        self.assertEqual(prices["ewy"], 192.49)

    def test_reused_kospi_baseline_repairs_bad_daily_ewy_price(self):
        original_get_session_close_prices = model2.get_session_close_prices

        try:
            model2.get_session_close_prices = lambda session_date: {
                "ewy": 192.49,
                "krw": 1540.0,
            }
            baseline = model2.resolve_model2_baseline(
                existing_payload={
                    "calculationMode": model2.MODEL2_MODE,
                    "baselineDate": "2026-06-05",
                    "baselinePoint": 8160.59,
                    "baselineSource": model2.KOSPI_CLOSE_SOURCE,
                    "baselinePrices": {"ewy": 203.97, "krw": 1540.98},
                    "oneTimeNightFuturesBootstrapUsed": True,
                },
                last_session={"date": "2026-06-05", "close": 8160.59},
                current_prices={"ewy": 193.79, "krw": 1541.0},
                primary_snapshot={"nightFuturesSimplePoint": 1.0},
                now_utc=datetime(2026, 6, 5, 12, 10, tzinfo=timezone.utc),
            )
        finally:
            model2.get_session_close_prices = original_get_session_close_prices

        self.assertEqual(baseline["baselinePrices"]["ewy"], 192.49)
        self.assertEqual(baseline["resetReason"], "repair_krx_sync_baseline_prices")

    def test_calculation_uses_composite_residual_features(self):
        diagnostics = {
            "ewyFxCorrection": {
                "intercept": 0.0,
                "ewyCoef": 0.4,
                "krwCoef": 0.2,
                "r2": 0.25,
                "sampleSize": 180,
            },
            "residualModel": {
                "intercept": 0.0,
                "weight": 1.0,
                "means": {},
                "stds": {},
                "broadPcaComponents": [1.0, 0.0, 0.0],
                "soxNdxBeta": 1.0,
                "coefficients": {
                    "broad_factor": 0.3,
                    "semi_factor": 0.2,
                    "wti_z": 0.1,
                },
            },
            "k200Mapping": {
                "intercept": 0.0,
                "beta": 1.0,
                "sampleSize": 240,
            },
            "maePct": 0.8,
        }
        base_returns = {
            "ewy": -1.0,
            "krw": -0.2,
            "sp500": 0.0,
            "nasdaq": 0.0,
            "dow": 0.0,
            "sox": 0.0,
            "wti": 0.0,
            "gold": 0.0,
            "us10y": 0.0,
        }
        composite_move_returns = {
            **base_returns,
            "sp500": 2.0,
            "sox": 2.0,
            "wti": 1.0,
        }

        base = model2.calculate_model2(base_returns, diagnostics, 8548.1)
        moved = model2.calculate_model2(composite_move_returns, diagnostics, 8548.1)

        self.assertIsNotNone(base)
        self.assertIsNotNone(moved)
        self.assertNotEqual(base["pointPrediction"], moved["pointPrediction"])
        self.assertGreater(moved["residualPct"], base["residualPct"])
        self.assertEqual(moved["k200MappedPct"], None)
        self.assertEqual(moved["coreCoefficients"]["source"], "direct_ewy_fx_axis")

    def test_confidence_band_ignores_top_level_point_mae_as_pct(self):
        diagnostics = {
            "mae": 33.0,
            "residualModel": {
                "mae": 1.2,
                "weight": 0.0,
                "coefficients": {},
            },
        }
        result = model2.calculate_model2(
            {
                "ewy": 0.0,
                "krw": 0.0,
                "sp500": 0.0,
                "nasdaq": 0.0,
                "dow": 0.0,
                "sox": 0.0,
                "wti": 0.0,
                "gold": 0.0,
                "us10y": 0.0,
            },
            diagnostics,
            8160.59,
        )

        self.assertIsNotNone(result)
        self.assertAlmostEqual(result["bandHalfWidth"], 8160.59 * 0.012 * model2.BAND_MAE_MULTIPLIER)

    def test_model2_stays_near_ewy_fx_direct_axis(self):
        diagnostics = {
            "residualModel": {
                "intercept": 3.0,
                "weight": 1.0,
                "coefficients": {
                    "broad_factor": 3.0,
                    "semi_factor": -3.0,
                },
            },
        }
        returns = {
            "ewy": -0.72,
            "krw": -0.07,
            "sp500": 4.0,
            "nasdaq": 5.0,
            "dow": 3.5,
            "sox": 8.0,
            "wti": -2.0,
            "gold": 1.0,
            "us10y": 0.05,
        }
        baseline = 8639.41
        result = model2.calculate_model2(returns, diagnostics, baseline)

        self.assertIsNotNone(result)
        direct_point = baseline * math.exp((returns["ewy"] + returns["krw"]) / 100.0)
        max_gap = baseline * (
            math.exp(model2.COMPOSITE_ADJUSTMENT_CAP_PCT / 100.0) - 1.0
        ) + 1e-9

        self.assertAlmostEqual(result["ewyFxDirectPoint"], direct_point)
        self.assertLessEqual(abs(result["pointPrediction"] - direct_point), max_gap)

    def test_series_and_history_keep_frontend_records_contract(self):
        original_series_path = model2.HOLIDAY_SERIES_PATH
        original_history_path = model2.HOLIDAY_HISTORY_PATH

        with tempfile.TemporaryDirectory() as temp_dir:
            try:
                temp_path = Path(temp_dir)
                model2.HOLIDAY_SERIES_PATH = temp_path / "holiday_prediction_series.json"
                model2.HOLIDAY_HISTORY_PATH = temp_path / "holiday_history.json"

                payload = {
                    "generatedAt": "2026-06-04T16:01:00+00:00",
                    "generatedAtKst": "2026-06-05T01:01:00+09:00",
                    "predictionDateIso": "2026-06-05",
                    "predictionDate": "2026-06-05",
                    "pointPrediction": 8540.0,
                    "predictedChangePct": -1.15,
                    "rangeLow": 8500.0,
                    "rangeHigh": 8580.0,
                    "prevClose": 8639.41,
                    "ewyLogPct": 0.12,
                    "krwLogPct": -0.03,
                    "corePct": 0.1,
                    "residualPct": -0.02,
                    "baselineDate": "2026-06-04",
                    "baselineSource": model2.BOOTSTRAP_SOURCE,
                }

                model2.update_series(
                    payload,
                    datetime(2026, 6, 4, 16, 1, tzinfo=timezone.utc),
                    "2026-06-05",
                )
                model2.update_history(payload, "2026-06-05")

                series = json.loads(model2.HOLIDAY_SERIES_PATH.read_text(encoding="utf-8"))
                history = json.loads(model2.HOLIDAY_HISTORY_PATH.read_text(encoding="utf-8"))
            finally:
                model2.HOLIDAY_SERIES_PATH = original_series_path
                model2.HOLIDAY_HISTORY_PATH = original_history_path

        self.assertIn("records", series)
        self.assertNotIn("rows", series)
        self.assertEqual(series["records"][0]["predictionDateIso"], "2026-06-05")
        self.assertEqual(series["records"][0]["observedAt"], "2026-06-04T16:01:00+00:00")
        self.assertEqual(series["records"][0]["ewyLogReturnPct"], 0.12)

        self.assertIn("records", history)
        self.assertNotIn("rows", history)
        self.assertEqual(history["records"][0]["date"], "2026-06-05")
        self.assertEqual(history["records"][0]["model2Prediction"], 8540.0)


if __name__ == "__main__":
    unittest.main()
