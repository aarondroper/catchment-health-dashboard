#!/usr/bin/env python3
"""Fail closed when a static dashboard artifact is incomplete or fixture-only."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import sys
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
EXPECTED_CONTRACT = "2.0.0"
PUBLIC_TERMS_STATUS = "public_cc_by_attribution_freshness"
RUNTIME_RELATIVE_PATH = Path("data/ashburton/dashboard.json")


def _read_json(path: Path) -> dict[str, Any]:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        raise ValueError(f"cannot read JSON artifact {path}: {error}") from error
    if not isinstance(value, dict):
        raise ValueError(f"JSON artifact must be an object: {path}")
    return value


def _sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def _safe_artifact_path(dist: Path, declared_path: str) -> Path:
    relative = Path(declared_path.lstrip("/"))
    if relative.is_absolute() or ".." in relative.parts:
        raise ValueError(f"runtime partition path escapes the deployable directory: {declared_path}")
    path = (dist / relative).resolve()
    try:
        path.relative_to(dist.resolve())
    except ValueError as error:
        raise ValueError(f"runtime partition path escapes the deployable directory: {declared_path}") from error
    return path


def validate_artifact(dist: Path) -> dict[str, Any]:
    dist = dist.resolve()
    if not dist.is_dir():
        raise ValueError(f"deployable directory is missing: {dist}")
    index = dist / "index.html"
    headers = dist / "_headers"
    runtime_path = dist / RUNTIME_RELATIVE_PATH
    if not index.is_file():
        raise ValueError("deployable directory has no index.html")
    if not headers.is_file():
        raise ValueError("deployable directory has no Cloudflare _headers policy")
    if not runtime_path.is_file():
        raise ValueError("deployable directory has no real analytical runtime shell")

    runtime = _read_json(runtime_path)
    if runtime.get("contractVersion") != EXPECTED_CONTRACT:
        raise ValueError("runtime shell does not use contract 2.0.0")
    if runtime.get("sourceTermsStatus") != PUBLIC_TERMS_STATUS:
        raise ValueError("deployable runtime asset is not public-release eligible")
    if runtime.get("sourceRetrievedAt") in {None, "", "fixture"}:
        raise ValueError("deployable runtime asset has no real source retrieval date")
    if runtime.get("buildId") in {None, "", "fixture"}:
        raise ValueError("deployable runtime asset has no real build identifier")
    if runtime.get("studyAreaId") != "ashburton_hakatere":
        raise ValueError("deployable runtime asset is not the Ashburton–Hakatere study")
    if len(runtime.get("stations", [])) != 19:
        raise ValueError("deployable runtime asset does not contain the reconciled 19-site inventory")

    partitions = runtime.get("observationPartitions")
    if not isinstance(partitions, dict) or len(partitions) < 6:
        raise ValueError("deployable runtime asset has too few observation partitions")
    checked_partitions = 0
    for parameter_id, manifest in sorted(partitions.items()):
        if not isinstance(manifest, dict):
            raise ValueError(f"partition manifest is not an object: {parameter_id}")
        declared_path = manifest.get("path")
        if not isinstance(declared_path, str):
            raise ValueError(f"partition manifest has no path: {parameter_id}")
        partition_path = _safe_artifact_path(dist, declared_path)
        if not partition_path.is_file():
            raise ValueError(f"runtime partition is missing: {declared_path}")
        partition = _read_json(partition_path)
        if partition.get("contractVersion") != EXPECTED_CONTRACT or partition.get("parameterId") != parameter_id:
            raise ValueError(f"runtime partition contract mismatch: {parameter_id}")
        if manifest.get("sha256") != _sha256(partition_path):
            raise ValueError(f"runtime partition checksum mismatch: {parameter_id}")
        if manifest.get("rowCount") != len(partition.get("rows", [])):
            raise ValueError(f"runtime partition row count mismatch: {parameter_id}")
        checked_partitions += 1

    if any(path.suffix == ".map" for path in dist.rglob("*")):
        raise ValueError("source maps are not permitted in the deployable artifact")
    for path in dist.rglob("*"):
        if path.is_file() and path.suffix in {".html", ".js", ".css", ".json", ".txt"}:
            text = path.read_text(encoding="utf-8", errors="replace")
            if "/home/" in text or "C:\\Users\\" in text:
                raise ValueError(f"machine-specific path found in deployable file: {path.relative_to(dist)}")

    return {
        "dist": str(dist),
        "runtime": str(runtime_path.relative_to(dist)),
        "buildId": runtime["buildId"],
        "sourceRetrievedAt": runtime["sourceRetrievedAt"],
        "partitions": checked_partitions,
        "bytes": sum(path.stat().st_size for path in dist.rglob("*") if path.is_file()),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dist", type=Path, default=ROOT / "web/dist")
    args = parser.parse_args()
    dist = args.dist if args.dist.is_absolute() else ROOT / args.dist
    try:
        print(json.dumps(validate_artifact(dist), sort_keys=True))
    except (OSError, ValueError) as error:
        print(f"CLOUDFLARE_ARTIFACT=failed: {error}", file=sys.stderr)
        return 1
    print("CLOUDFLARE_ARTIFACT=ready")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
