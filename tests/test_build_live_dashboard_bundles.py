from __future__ import annotations

import json
import tempfile
import unittest
from datetime import datetime, timezone
from pathlib import Path

from scripts import build_live_dashboard_bundles as bundles


class BuildLiveDashboardBundlesTests(unittest.TestCase):
    def write_components(self, data_dir: Path, file_names: dict[str, str]) -> None:
        for key, file_name in file_names.items():
            (data_dir / file_name).write_text(
                json.dumps({"component": key, "generatedAt": "2026-07-12T00:00:00+00:00"}),
                encoding="utf-8",
            )

    def test_primary_bundle_contains_one_snapshot_id_and_all_components(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            data_dir = Path(temp_dir)
            self.write_components(data_dir, bundles.PRIMARY_BUNDLE_FILES)

            first = bundles.build_bundle_payload(
                data_dir,
                bundles.PRIMARY_BUNDLE_FILES,
                kind="primary-dashboard",
                generated_at=datetime(2026, 7, 12, tzinfo=timezone.utc),
            )
            second = bundles.build_bundle_payload(
                data_dir,
                bundles.PRIMARY_BUNDLE_FILES,
                kind="primary-dashboard",
                generated_at=datetime(2026, 7, 13, tzinfo=timezone.utc),
            )

        self.assertEqual(first["snapshot"]["id"], second["snapshot"]["id"])
        self.assertEqual(set(bundles.PRIMARY_BUNDLE_FILES), set(first["sources"]))
        self.assertTrue(all(value == "snapshot" for value in first["sources"].values()))

    def test_model2_scope_writes_only_holiday_bundle(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            data_dir = Path(temp_dir)
            self.write_components(data_dir, bundles.MODEL2_BUNDLE_FILES)

            outputs = bundles.build_scope(data_dir, "model2")

            self.assertEqual(outputs, [data_dir / bundles.MODEL2_BUNDLE_FILE_NAME])
            self.assertFalse((data_dir / bundles.PRIMARY_BUNDLE_FILE_NAME).exists())
            payload = json.loads(outputs[0].read_text(encoding="utf-8"))
            self.assertEqual(payload["snapshot"]["kind"], "model2-dashboard")

    def test_missing_component_fails_before_snapshot_write(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            data_dir = Path(temp_dir)
            self.write_components(data_dir, bundles.PRIMARY_BUNDLE_FILES)
            (data_dir / "history.json").unlink()

            with self.assertRaises(bundles.BundleBuildError):
                bundles.build_scope(data_dir, "primary")

            self.assertFalse((data_dir / bundles.PRIMARY_BUNDLE_FILE_NAME).exists())


if __name__ == "__main__":
    unittest.main()
