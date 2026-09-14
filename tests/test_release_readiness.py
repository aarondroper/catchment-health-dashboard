import unittest
from pathlib import Path
import tempfile

from tools.check_release_readiness import ATTRIBUTION, EVIDENCE_PATH, LOCAL_GATE, PUBLIC_GATE, _read_release_evidence, check_local_readiness


class ReleaseReadinessTests(unittest.TestCase):
    def test_prepared_local_shell_reports_its_release_status(self) -> None:
        asset = Path("web/public/data/ashburton/dashboard.json")
        if not asset.exists():
            self.skipTest("ignored local dashboard asset is not prepared")
        messages, public_ready = check_local_readiness(asset, max_age_days=120)
        self.assertEqual(public_ready, any(message.startswith("PUBLIC_RELEASE=ready") for message in messages))

    def test_terms_and_attribution_markers_are_distinct(self) -> None:
        self.assertEqual(LOCAL_GATE, "local_processing_only_release_gate")
        self.assertEqual(PUBLIC_GATE, "public_cc_by_attribution_freshness")
        self.assertIn("Environment Canterbury", ATTRIBUTION)

    def test_preserved_terms_evidence_is_hash_checked(self) -> None:
        self.assertTrue(EVIDENCE_PATH.is_file())
        evidence = _read_release_evidence()
        self.assertEqual(evidence["releaseDecision"], "permitted_with_attribution_freshness_safeguards")

    def test_missing_asset_fails(self) -> None:
        with self.assertRaises((OSError, ValueError)):
            check_local_readiness(Path(tempfile.gettempdir()) / "missing-dashboard.json", max_age_days=120)
