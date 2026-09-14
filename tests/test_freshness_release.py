import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from tools.check_release_readiness import check_local_readiness


class FreshnessReleaseTests(unittest.TestCase):
    def test_expired_and_invalid_assets_fail_the_release_gate(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "dashboard.json"
            for retrieved in ("2020-01-01T00:00:00Z", None):
                payload = {"sourceRetrievedAt": retrieved, "buildId": "test", "sourceTermsStatus": "public_cc_by_attribution_freshness"}
                path.write_text(json.dumps(payload), encoding="utf-8")
                with patch("tools.check_release_readiness._read_release_evidence", return_value={"waterQualityTerms": {"licence": "test"}}), patch("tools.check_release_readiness._tracked_release_outputs", return_value=[]):
                    with self.assertRaises(ValueError):
                        check_local_readiness(path, max_age_days=120)


if __name__ == "__main__":
    unittest.main()
