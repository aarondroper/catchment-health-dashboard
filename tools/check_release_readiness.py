#!/usr/bin/env python3
"""Run deterministic checks before a local or public dashboard release."""

from __future__ import annotations

import argparse
from datetime import datetime, timezone
import json
from pathlib import Path
import subprocess
import sys

REPOSITORY_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_ASSET = REPOSITORY_ROOT / "web/public/data/ashburton/dashboard.json"
LOCAL_GATE = "local_processing_only_release_gate"
PUBLIC_GATE = "public_cc_by_attribution_freshness"
ATTRIBUTION = "This work uses material sourced from Water Quality Data, which is licensed under a Creative Commons Attribution 4.0 International licence by Environment Canterbury."
EVIDENCE_PATH = REPOSITORY_ROOT / "docs/release/ecan-source-licence-evidence.json"


def _read_asset(path: Path) -> dict[str, object]:
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        raise ValueError(f"cannot read runtime asset {path}: {error}") from error
    if not isinstance(payload, dict):
        raise ValueError("runtime asset root must be an object")
    return payload


def _tracked_release_outputs() -> list[str]:
    result = subprocess.run(
        ["git", "ls-files", "reports/generated", "web/public/data"],
        cwd=REPOSITORY_ROOT,
        check=True,
        capture_output=True,
        text=True,
    )
    return [line for line in result.stdout.splitlines() if line]


def _read_release_evidence() -> dict[str, object]:
    try:
        evidence = json.loads(EVIDENCE_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        raise ValueError(f"cannot read release evidence {EVIDENCE_PATH}: {error}") from error
    if not isinstance(evidence, dict):
        raise ValueError("release evidence root must be an object")
    if evidence.get("releaseDecision") != "permitted_with_attribution_freshness_safeguards":
        raise ValueError("release evidence does not record an approved release position")
    terms = evidence.get("waterQualityTerms")
    if not isinstance(terms, dict) or terms.get("licence") != "Creative Commons Attribution 4.0 International (CC BY 4.0)":
        raise ValueError("release evidence does not record the dataset-specific CC BY 4.0 terms")
    if terms.get("attributionText") not in ATTRIBUTION:
        raise ValueError("release evidence attribution does not match the application attribution")
    pdf = REPOSITORY_ROOT / "docs/release/evidence/TermsOfUseWaterQualityDataPublicWebsite-3957205.pdf"
    if not pdf.is_file():
        raise ValueError(f"preserved terms document is missing: {pdf}")
    import hashlib
    digest = hashlib.sha256(pdf.read_bytes()).hexdigest()
    if digest != terms.get("sha256"):
        raise ValueError(f"preserved terms hash mismatch: {digest}")
    return evidence


def check_local_readiness(asset_path: Path, *, max_age_days: int) -> tuple[list[str], bool]:
    asset_path = asset_path.resolve()
    messages: list[str] = []
    asset = _read_asset(asset_path)
    terms_status = asset.get("sourceTermsStatus")
    retrieved = asset.get("sourceRetrievedAt")
    build_id = asset.get("buildId")
    if not isinstance(retrieved, str) or not retrieved:
        raise ValueError("runtime asset has no sourceRetrievedAt freshness marker")
    if not isinstance(build_id, str) or not build_id:
        raise ValueError("runtime asset has no buildId")
    retrieved_at = datetime.fromisoformat(retrieved.replace("Z", "+00:00"))
    age_days = (datetime.now(timezone.utc) - retrieved_at).total_seconds() / 86400
    if age_days > max_age_days:
        raise ValueError(f"runtime asset source retrieval is {age_days:.1f} days old; refresh or remove it")
    if terms_status not in {LOCAL_GATE, PUBLIC_GATE}:
        raise ValueError(f"unexpected sourceTermsStatus: {terms_status!r}")
    if ATTRIBUTION not in (REPOSITORY_ROOT / "web/src/App.tsx").read_text(encoding="utf-8"):
        raise ValueError("approved ECan attribution statement is absent from the application")
    evidence = _read_release_evidence()
    tracked = _tracked_release_outputs()
    if tracked:
        raise ValueError(f"generated/raw release outputs are tracked: {', '.join(tracked)}")
    messages.extend([
        f"LOCAL_ASSET=present ({asset_path.relative_to(REPOSITORY_ROOT)})",
        f"SOURCE_RETRIEVED_AT={retrieved} ({age_days:.1f} days old)",
        f"BUILD_ID={build_id}",
        "ATTRIBUTION=present",
        "TRACKED_OBSERVATION_OUTPUTS=none",
        f"RELEASE_TERMS=verified ({evidence['waterQualityTerms']['licence']})",
        "PUBLIC_RELEASE=ready-with-safeguards" if terms_status == PUBLIC_GATE else "PUBLIC_RELEASE=blocked (asset still carries local-processing status)",
    ])
    return messages, terms_status == PUBLIC_GATE


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--asset", type=Path, default=DEFAULT_ASSET, help="prepared local runtime shell")
    parser.add_argument("--max-age-days", type=int, default=120)
    parser.add_argument("--require-public-release", action="store_true", help="fail unless source terms are explicitly released")
    args = parser.parse_args()
    asset_path = args.asset if args.asset.is_absolute() else REPOSITORY_ROOT / args.asset
    try:
        messages, public_ready = check_local_readiness(asset_path, max_age_days=args.max_age_days)
    except (OSError, ValueError, subprocess.CalledProcessError) as error:
        print(f"RELEASE_READINESS=failed: {error}", file=sys.stderr)
        return 1
    for message in messages:
        print(message)
    if args.require_public_release:
        if not public_ready:
            print("RELEASE_READINESS=failed: asset still carries local-processing status", file=sys.stderr)
            return 1
        print("RELEASE_READINESS=public-ready-with-safeguards")
        return 0
    print("RELEASE_READINESS=public-ready-with-safeguards" if public_ready else "RELEASE_READINESS=local-safe-but-not-public")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
