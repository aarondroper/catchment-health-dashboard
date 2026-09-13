#!/usr/bin/env python3
"""Materialize ignored analytical outputs into a local React dashboard asset."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import sys

REPOSITORY_ROOT = Path(__file__).resolve().parents[1]
if str(REPOSITORY_ROOT) not in sys.path:
    sys.path.insert(0, str(REPOSITORY_ROOT))

from catchment_dashboard.analytics import PARAMETER_SPECS


def _read(path: Path) -> dict[str, object]:
    return json.loads(path.read_text(encoding="utf-8"))


def prepare_assets(analytical_dir: Path, site_audit: Path, output: Path) -> dict[str, object]:
    manifest = _read(analytical_dir / "manifest.json")
    normalized = _read(analytical_dir / "normalized_observations.json")
    coverage = _read(analytical_dir / "coverage.json")
    summaries = _read(analytical_dir / "summaries.json")
    trends = _read(analytical_dir / "trends.json")
    sites = _read(site_audit)
    stations = [
        {
            "stationId": row["site_id"],
            "name": row.get("station_name") or row["site_id"],
            "latitude": row["latitude"],
            "longitude": row["longitude"],
            "membershipBasis": row.get("membership_basis"),
        }
        for row in sites.get("in_boundary_sites", [])
    ]
    parameters = [
        {
            "parameterId": parameter_id,
            "displayName": spec["name"],
            "unit": spec["unit"],
            "selectionStatus": spec["selection"],
        }
        for parameter_id, spec in sorted(PARAMETER_SPECS.items())
        if parameter_id not in {"water_temperature"}
    ]
    observations = []
    for row in normalized.get("records", []):
        source = row["source"]
        observations.append({
            "observationId": row["observation_id"],
            "stationId": row["station_id"],
            "parameterId": row["parameter_id"],
            "observedAt": row["observed_at"],
            "value": row["canonical_value"],
            "resultText": row["result_text"],
            "originalUnit": row["original_unit"],
            "canonicalUnit": row["canonical_unit"],
            "qualityFlag": row["quality_flag"],
            "qualityRepresentation": row["quality_representation"],
            "qualityDisposition": row["quality_disposition"],
            "censoring": row["censoring"],
            "censorLimit": row["censor_limit"],
            "valueKind": row["value_kind"],
            "duplicateDisposition": row["duplicate_disposition"],
            "analysisEligible": row["analysis_eligible"],
            "sourceRecordId": source["source_record_id"],
            "sourceEndpoint": source["endpoint"],
            "sourceRetrievedAt": source["retrieved_at"],
        })
    app_summaries = [
        {
            "stationId": row["station_id"], "parameterId": row["parameter_id"], "period": row["period"],
            "value": row["value"], "q1": row["q1"], "q3": row["q3"], "unit": row["unit"],
            "status": row["status"], "indeterminateReason": row["indeterminate_reason"],
            "eligibleNumericCount": row["eligible_numeric_count"], "eligibleCensoredCount": row["eligible_censored_count"],
        }
        for row in summaries.get("records", [])
    ]
    app_trends = [
        {
            "stationId": row["station_id"], "parameterId": row["parameter_id"], "period": row["period"],
            "estimatePerYear": row["estimate_per_year"], "uncertaintyIqrPerYear": row["uncertainty_iqr_per_year"],
            "pValue": row["p_value"], "direction": row["direction"], "status": row["status"],
            "indeterminateReason": row["indeterminate_reason"], "eligibleNumericCount": row["eligible_numeric_count"],
            "eligibleCensoredCount": row["eligible_censored_count"], "calendarYearCount": row["calendar_year_count"],
        }
        for row in trends.get("records", [])
    ]
    payload = {
        "contractVersion": normalized["contract_version"],
        "analyticalVersion": normalized["analytical_version"],
        "studyAreaId": manifest["study_area_id"],
        "studyAreaName": "Ashburton–Hakatere catchment",
        "sourceTermsStatus": "local_processing_only_release_gate",
        "qualityPolicy": manifest.get("quality_policy"),
        "sourceRetrievedAt": manifest.get("source_retrieved_at"),
        "buildId": manifest.get("build_id"),
        "parameters": parameters,
        "stations": stations,
        "observations": observations,
        "coverage": coverage.get("records", []),
        "summaries": app_summaries,
        "trends": app_trends,
        "counts": manifest.get("counts", {}),
        "warnings": manifest.get("warnings", []),
    }
    content = json.dumps(payload, indent=2, sort_keys=True) + "\n"
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(content, encoding="utf-8")
    return {"output": str(output), "sha256": hashlib.sha256(content.encode()).hexdigest(), "counts": payload["counts"]}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--analytical-dir", type=Path, default=Path("reports/generated/ashburton-analytical-assets-all-sites"))
    parser.add_argument("--site-audit", type=Path, default=Path("reports/generated/ashburton-catchment-site-coverage.json"))
    parser.add_argument("--output", type=Path, default=Path("web/public/data/ashburton/dashboard.json"))
    args = parser.parse_args()
    print(json.dumps(prepare_assets(args.analytical_dir, args.site_audit, args.output), sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
