from __future__ import annotations

import json
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path

from scripts import recover_live_prediction_series as recover


class RecoverLivePredictionSeriesTests(unittest.TestCase):
    def test_rebuilds_series_from_intraday_snapshots(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            snapshot_dir = root / "snapshots"
            snapshot_dir.mkdir()
            (snapshot_dir / "20260605T210000Z.json").write_text(
                json.dumps(
                    {
                        "observedMinute": "2026-06-05T21:00:00+00:00",
                        "predictionDateIso": "2026-06-08",
                        "predictionDate": "2026-06-08",
                        "prediction": {
                            "predictionDateIso": "2026-06-08",
                            "predictionDate": "2026-06-08",
                            "pointPrediction": 7520.123,
                            "nightFuturesSimplePoint": 7500.0,
                            "ewyFxSimplePoint": 7510.0,
                            "predictedChangePct": -7.8,
                            "nightFuturesSimpleChangePct": -8.0,
                            "ewyFxSimpleChangePct": -7.9,
                        },
                    }
                ),
                encoding="utf-8",
            )
            current = root / "live_prediction_series.json"
            current.write_text(json.dumps({"records": []}), encoding="utf-8")

            payload = recover.rebuild_series(snapshot_dir, current, "2026-06-08")

        self.assertEqual(len(payload["records"]), 1)
        row = payload["records"][0]
        self.assertEqual(row["observedAt"], "2026-06-05T21:00:00+00:00")
        self.assertEqual(row["kstTime"], "06:00")
        self.assertEqual(row["pointPrediction"], 7520.12)

    def test_refuses_to_write_below_requested_minimum(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            snapshot_dir = root / "snapshots"
            snapshot_dir.mkdir()
            current = root / "live_prediction_series.json"
            current.write_text(
                json.dumps(
                    {
                        "records": [
                            {"predictionDateIso": "2026-06-08", "observedAt": "2026-06-05T21:00:00+00:00"},
                            {"predictionDateIso": "2026-06-08", "observedAt": "2026-06-05T21:01:00+00:00"},
                        ]
                    }
                ),
                encoding="utf-8",
            )
            output = root / "out.json"

            with self.assertRaises(SystemExit):
                recover.write_recovered_series(
                    snapshot_dir=snapshot_dir,
                    current_series=current,
                    output=output,
                    prediction_date="2026-06-08",
                    min_records=3,
                )

    def test_keeps_full_overnight_trend_window(self):
        start = datetime(2026, 6, 5, 8, 0, tzinfo=timezone.utc)
        records = [
            {
                "predictionDateIso": "2026-06-08",
                "observedAt": (start + timedelta(minutes=minute)).isoformat(),
                "pointPrediction": 7500.0 + minute,
            }
            for minute in range(960)
        ]

        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            snapshot_dir = root / "snapshots"
            snapshot_dir.mkdir()
            current = root / "live_prediction_series.json"
            current.write_text(json.dumps({"records": records}), encoding="utf-8")

            payload = recover.rebuild_series(snapshot_dir, current, "2026-06-08")

        self.assertEqual(len(payload["records"]), 960)
        self.assertEqual(payload["records"][0]["observedAt"], "2026-06-05T08:00:00+00:00")
        self.assertEqual(payload["records"][-1]["observedAt"], "2026-06-05T23:59:00+00:00")


if __name__ == "__main__":
    unittest.main()
