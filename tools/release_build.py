#!/usr/bin/env python3
"""Rebuild and validate the deployable static dashboard from public sources."""

from __future__ import annotations

import argparse
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

SOURCE_PARAMETERS = [
    "E. coli", "Nitrate-N Nitrite-N", "Dissolved Reactive Phosphorus",
    "Total Nitrogen", "Turbidity", "Dissolved Oxygen", "Total Phosphorus",
    "Water Temperature (Field)",
]


def run(command: list[str], *, cwd: Path = ROOT) -> None:
    print("+", " ".join(command))
    subprocess.run(command, cwd=cwd, check=True)


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--work-dir", type=Path, default=Path("reports/generated/release-work"))
    parser.add_argument("--skip-npm-install", action="store_true")
    args = parser.parse_args()
    work = args.work_dir if args.work_dir.is_absolute() else ROOT / args.work_dir
    work.mkdir(parents=True, exist_ok=True)
    profile = work / "profile-2007-2025.json"
    site_audit = work / "site-audit.json"
    analytical = work / "analytical-assets"
    coverage = work / "coverage-reconciliation.json"
    runtime = ROOT / "web/public/data/ashburton/dashboard.json"
    partition_dir = ROOT / "web/public/data/ashburton/observations"
    staged_runtime_root = work / "runtime"
    staged_runtime = staged_runtime_root / "dashboard.json"
    staged_partition_dir = staged_runtime_root / "observations"
    if staged_runtime_root.exists():
        shutil.rmtree(staged_runtime_root)

    acquire = [sys.executable, "tools/acquire_observations.py", "--output", str(profile), "--max-sites", "19", "--all-in-bound-sites", "--include-observations", "--from-date", "2007-01-01", "--to-date", "2025-12-31"]
    for parameter in SOURCE_PARAMETERS:
        acquire.extend(["--parameter", parameter])
    run(acquire)
    run([sys.executable, "tools/audit_catchment_sites.py", "--output", str(site_audit)])
    run([sys.executable, "tools/reconcile_catchment_coverage.py", "--profile", str(profile), "--site-audit", str(site_audit), "--output", str(coverage)])
    run([sys.executable, "tools/build_analytical_assets.py", "--profile", str(profile), "--output-dir", str(analytical)])
    run([sys.executable, "tools/prepare_dashboard_assets.py", "--analytical-dir", str(analytical), "--site-audit", str(site_audit), "--boundary", str(site_audit), "--output", str(staged_runtime)])

    coverage_payload = json.loads(coverage.read_text(encoding="utf-8"))
    if coverage_payload["inventory"]["exactStationIdMatches"] != 19 or coverage_payload["inventory"]["hilltopCoordinateBearingSitesInBoundary"] != 19 or coverage_payload["categories"]["unresolvedMatches"]:
        raise RuntimeError("release stopped: source inventory reconciliation is incomplete or unresolved")
    run([sys.executable, "tools/check_release_readiness.py", "--asset", str(staged_runtime), "--require-public-release"])
    if partition_dir.exists():
        shutil.rmtree(partition_dir)
    partition_dir.parent.mkdir(parents=True, exist_ok=True)
    shutil.copytree(staged_partition_dir, partition_dir)
    runtime.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(staged_runtime, runtime)
    run([sys.executable, "tools/check_release_readiness.py", "--asset", str(runtime), "--require-public-release"])
    if not args.skip_npm_install:
        run(["npm", "ci"], cwd=ROOT / "web")
    run(["npm", "run", "typecheck"], cwd=ROOT / "web")
    run(["npm", "run", "test:unit"], cwd=ROOT / "web")
    run(["npm", "run", "build"], cwd=ROOT / "web")
    run([sys.executable, "tools/check_cloudflare_artifact.py", "--dist", "web/dist"])

    asset_files = sorted(path for path in (ROOT / "web/dist").rglob("*") if path.is_file())
    manifest = {
        "schemaVersion": "ashburton-public-release-manifest-v1",
        "builtAt": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
        "gitRevision": subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip(),
        "studyArea": "ashburton_hakatere",
        "analyticalVersion": json.loads(runtime.read_text(encoding="utf-8"))["analyticalVersion"],
        "sourceIdentities": {
            "waterQualityService": "http://wateruse.ecan.govt.nz/wqlawa.hts",
            "surfaceWaterSites": "https://gis.ecan.govt.nz/arcgis/rest/services/Public/WaterQualityandMonitoring/MapServer/0",
            "majorCatchmentBoundary": "https://gis.ecan.govt.nz/arcgis/rest/services/Public/Hydrology/MapServer/0",
            "waterQualityTermsSha256": "87b0c0408c5e6dce82b0cf036acdcf8ffc78e7d31e45db2a1a60f15255ebe705",
        },
        "runtimeAsset": {"path": "data/ashburton/dashboard.json", "sha256": sha256(runtime), "bytes": runtime.stat().st_size},
        "deployableFiles": [{"path": str(path.relative_to(ROOT / "web/dist")), "sha256": sha256(path), "bytes": path.stat().st_size} for path in asset_files],
        "rawResponses": "excluded",
        "freshnessPolicy": "120-day source retrieval limit; runtime expired/invalid assets are blocked",
        "attribution": "ECan water-quality CC BY 4.0 attribution and terms link are required",
    }
    manifest_path = work / "release-manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps({"runtimeBytes": runtime.stat().st_size, "deployableFiles": len(asset_files), "manifest": str(manifest_path)}, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
