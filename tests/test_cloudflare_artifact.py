import hashlib
import json
from pathlib import Path
import tempfile
import unittest

from tools.check_cloudflare_artifact import validate_artifact


class CloudflareArtifactTests(unittest.TestCase):
    def _write_artifact(self, root: Path) -> Path:
        dist = root / "dist"
        dist.mkdir()
        (dist / "index.html").write_text("<html><script type=module src=/assets/index-test.js></script></html>\n", encoding="utf-8")
        assets = dist / "assets"
        assets.mkdir()
        (assets / "index-test.js").write_text('const worker = "/assets/maplibre-gl-worker-abc12345.js";\n', encoding="utf-8")
        (assets / "maplibre-gl-worker-abc12345.js").write_text("/* MapLibre GL JS worker */\nself.onmessage = () => {};\n", encoding="utf-8")
        (dist / "_headers").write_text("/assets/*\n  Cache-Control: immutable\n", encoding="utf-8")
        partition_dir = dist / "data" / "ashburton" / "observations"
        partition_dir.mkdir(parents=True)
        partitions = {}
        for parameter_id in ["e_coli", "nitrate", "drp", "tn", "turbidity", "do"]:
            content = json.dumps({"contractVersion": "2.0.0", "parameterId": parameter_id, "rows": []}) + "\n"
            path = partition_dir / f"{parameter_id}.json"
            path.write_text(content, encoding="utf-8")
            partitions[parameter_id] = {
                "path": f"/data/ashburton/observations/{parameter_id}.json",
                "sha256": hashlib.sha256(content.encode()).hexdigest(),
                "rowCount": 0,
            }
        shell = {
            "contractVersion": "2.0.0",
            "sourceTermsStatus": "public_cc_by_attribution_freshness",
            "sourceRetrievedAt": "2026-09-14T00:00:00+00:00",
            "buildId": "build-test",
            "studyAreaId": "ashburton_hakatere",
            "stations": [{} for _ in range(19)],
            "observationPartitions": partitions,
        }
        runtime = dist / "data" / "ashburton" / "dashboard.json"
        runtime.parent.mkdir(parents=True, exist_ok=True)
        runtime.write_text(json.dumps(shell) + "\n", encoding="utf-8")
        return dist

    def test_accepts_complete_public_artifact(self):
        with tempfile.TemporaryDirectory() as temporary:
            result = validate_artifact(self._write_artifact(Path(temporary)))
            self.assertEqual(result["partitions"], 6)

    def test_rejects_missing_partition(self):
        with tempfile.TemporaryDirectory() as temporary:
            dist = self._write_artifact(Path(temporary))
            (dist / "data/ashburton/observations/e_coli.json").unlink()
            with self.assertRaisesRegex(ValueError, "partition is missing"):
                validate_artifact(dist)

    def test_rejects_fixture_only_runtime(self):
        with tempfile.TemporaryDirectory() as temporary:
            dist = self._write_artifact(Path(temporary))
            runtime = dist / "data/ashburton/dashboard.json"
            payload = json.loads(runtime.read_text(encoding="utf-8"))
            payload["sourceTermsStatus"] = "local_processing_only_release_gate"
            runtime.write_text(json.dumps(payload) + "\n", encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "not public-release eligible"):
                validate_artifact(dist)

    def test_rejects_missing_maplibre_worker(self):
        with tempfile.TemporaryDirectory() as temporary:
            dist = self._write_artifact(Path(temporary))
            (dist / "assets/maplibre-gl-worker-abc12345.js").unlink()
            with self.assertRaisesRegex(ValueError, "referenced MapLibre worker is missing"):
                validate_artifact(dist)

    def test_rejects_html_maplibre_worker(self):
        with tempfile.TemporaryDirectory() as temporary:
            dist = self._write_artifact(Path(temporary))
            (dist / "assets/maplibre-gl-worker-abc12345.js").write_text("<!doctype html><html></html>\n", encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "HTML rather than JavaScript"):
                validate_artifact(dist)
