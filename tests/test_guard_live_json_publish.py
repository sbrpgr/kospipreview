from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

from scripts import guard_live_json_publish as guard


def write_json(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload), encoding="utf-8")


def series_payload(prediction_date: str, count: int) -> dict:
    return {
        "predictionDateIso": prediction_date,
        "records": [
            {
                "predictionDateIso": prediction_date,
                "observedAt": f"2026-06-05T20:{minute:02d}:00+00:00",
            }
            for minute in range(count)
        ],
    }


def valid_model2_payload() -> dict:
    return {
        "calculationMode": "model2_no_night_futures_composite",
        "independentModel": True,
        "usesOtherModelPrediction": False,
        "nightFuturesUsed": False,
        "nightFuturesReadThisRun": False,
        "oneTimeNightFuturesBootstrapUsed": False,
        "baselineSource": "kospi_close",
        "pointPrediction": 7526.1568,
        "model": {"engine": "EWYFXHybridCompositeNoNightFutures"},
    }


def cleared_model2_payload() -> dict:
    return {
        "calculationMode": "model2_no_night_futures_composite",
        "independentModel": True,
        "usesOtherModelPrediction": False,
        "nightFuturesUsed": False,
        "nightFuturesReadThisRun": False,
        "oneTimeNightFuturesBootstrapUsed": False,
        "status": "cleared",
        "clearReason": "manual_stale_model2_clear",
        "predictionDateIso": None,
        "pointPrediction": None,
        "predictedChangePct": None,
        "rangeLow": None,
        "rangeHigh": None,
    }


class GuardLiveJsonPublishTests(unittest.TestCase):
    def test_allows_same_target_series_that_does_not_shrink(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            data_dir = root / "data"
            seed_dir = root / "seed"
            write_json(data_dir / "live_prediction_series.json", series_payload("2026-06-08", 899))
            write_json(seed_dir / "live_prediction_series.json", series_payload("2026-06-08", 899))

            guard.guard_live_prediction_series(data_dir, seed_dir)

    def test_rejects_same_target_series_shrink(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            data_dir = root / "data"
            seed_dir = root / "seed"
            write_json(data_dir / "live_prediction_series.json", series_payload("2026-06-08", 100))
            write_json(seed_dir / "live_prediction_series.json", series_payload("2026-06-08", 899))

            with self.assertRaises(guard.GuardFailure):
                guard.guard_live_prediction_series(data_dir, seed_dir)

    def test_allows_new_target_even_when_current_series_is_empty(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            data_dir = root / "data"
            seed_dir = root / "seed"
            write_json(data_dir / "live_prediction_series.json", series_payload("2026-06-09", 0))
            write_json(seed_dir / "live_prediction_series.json", series_payload("2026-06-08", 899))

            guard.guard_live_prediction_series(data_dir, seed_dir)

    def test_accepts_independent_model2_payload(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            data_dir = Path(temp_dir)
            write_json(data_dir / "holiday_prediction.json", valid_model2_payload())

            guard.guard_model2_payload(data_dir)

    def test_accepts_cleared_model2_payload(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            data_dir = Path(temp_dir)
            write_json(data_dir / "holiday_prediction.json", cleared_model2_payload())

            guard.guard_model2_payload(data_dir)

    def test_rejects_model2_that_read_night_futures(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            data_dir = Path(temp_dir)
            payload = valid_model2_payload()
            payload["nightFuturesReadThisRun"] = True
            write_json(data_dir / "holiday_prediction.json", payload)

            with self.assertRaises(guard.GuardFailure):
                guard.guard_model2_payload(data_dir)

    def test_rejects_model2_bootstrap_baseline(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            data_dir = Path(temp_dir)
            payload = valid_model2_payload()
            payload["baselineSource"] = "one_time_night_futures_simple_point"
            write_json(data_dir / "holiday_prediction.json", payload)

            with self.assertRaises(guard.GuardFailure):
                guard.guard_model2_payload(data_dir)

    def test_rejects_cleared_model2_with_bootstrap_flag(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            data_dir = Path(temp_dir)
            payload = cleared_model2_payload()
            payload["oneTimeNightFuturesBootstrapUsed"] = True
            write_json(data_dir / "holiday_prediction.json", payload)

            with self.assertRaises(guard.GuardFailure):
                guard.guard_model2_payload(data_dir)

    def test_rejects_cleared_model2_with_prediction_value(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            data_dir = Path(temp_dir)
            payload = cleared_model2_payload()
            payload["pointPrediction"] = 8399.01
            write_json(data_dir / "holiday_prediction.json", payload)

            with self.assertRaises(guard.GuardFailure):
                guard.guard_model2_payload(data_dir)


if __name__ == "__main__":
    unittest.main()
