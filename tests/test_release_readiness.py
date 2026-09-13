import unittest
from pathlib import Path
import tempfile

from tools.check_release_readiness import ATTRIBUTION, LOCAL_GATE, check_local_readiness


class ReleaseReadinessTests(unittest.TestCase):
    def test_prepared_local_shell_is_explicitly_not_public_release_ready(self) -> None:
        asset = Path("web/public/data/ashburton/dashboard.json")
        if not asset.exists():
            self.skipTest("ignored local dashboard asset is not prepared")
        messages, public_ready = check_local_readiness(asset, max_age_days=120)
        self.assertFalse(public_ready)
        self.assertTrue(any(message.startswith("PUBLIC_RELEASE=blocked") for message in messages))

    def test_terms_and_attribution_markers_are_distinct(self) -> None:
        self.assertEqual(LOCAL_GATE, "local_processing_only_release_gate")
        self.assertIn("Environment Canterbury", ATTRIBUTION)

    def test_missing_asset_fails(self) -> None:
        with self.assertRaises((OSError, ValueError)):
            check_local_readiness(Path(tempfile.gettempdir()) / "missing-dashboard.json", max_age_days=120)

