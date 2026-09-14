#!/usr/bin/env python3
"""Materialize ignored analytical outputs into a local React dashboard asset."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import sys
from typing import Any

REPOSITORY_ROOT = Path(__file__).resolve().parents[1]
if str(REPOSITORY_ROOT) not in sys.path:
    sys.path.insert(0, str(REPOSITORY_ROOT))

from catchment_dashboard.analytics import PARAMETER_SPECS


def _read(path: Path) -> dict[str, object]:
    return json.loads(path.read_text(encoding="utf-8"))


RUNTIME_CONTRACT_VERSION = "2.0.0"
OBSERVATION_COLUMNS = (
    "observationId",
    "stationIndex",
    "observedAt",
    "value",
    "originalValue",
    "resultText",
    "originalUnit",
    "canonicalUnit",
    "qualityFlag",
    "qualityRepresentation",
    "qualityDisposition",
    "censoring",
    "censorLimit",
    "duplicateDisposition",
    "valueKind",
    "analysisEligible",
    "exclusionReason",
    "sourceRecordId",
    "sourceEndpoint",
    "sourceRetrievedAt",
)
LOOKUP_FIELDS = (
    "originalUnit",
    "canonicalUnit",
    "qualityFlag",
    "qualityRepresentation",
    "qualityDisposition",
    "censoring",
    "duplicateDisposition",
    "valueKind",
    "exclusionReason",
    "sourceEndpoint",
    "sourceRetrievedAt",
)


def _runtime_geometry(boundary_path: Path) -> dict[str, object]:
    boundary = _read(boundary_path)
    features = boundary.get("features")
    if isinstance(features, list) and len(features) == 1:
        feature = features[0]
        if not isinstance(feature, dict) or not isinstance(feature.get("geometry"), dict):
            raise ValueError("runtime boundary feature has no geometry")
        geometry = feature["geometry"]
        properties = feature.get("properties")
        feature_id = feature.get("id")
    else:
        geometry = boundary.get("boundary_geometry")
        metadata = boundary.get("boundary")
        if not isinstance(geometry, dict) or not isinstance(metadata, dict):
            raise ValueError("runtime boundary must contain a GeoJSON feature or audited boundary geometry")
        properties = {
            "OBJECTID": metadata.get("source_object_id"),
            "CatchmentGroup": metadata.get("catchment_group"),
            "CatchmentGroupName": metadata.get("catchment_name"),
            "AREA_HA": metadata.get("area_ha"),
        }
        feature_id = metadata.get("source_object_id")
    if not isinstance(properties, dict):
        raise ValueError("runtime boundary feature has no properties")
    return {
        "type": "Feature",
        "id": feature_id,
        "properties": {
            **properties,
            "sourceEndpoint": (
                "https://gis.ecan.govt.nz/arcgis/rest/services/Public/Hydrology/"
                "MapServer/0/query?where=CatchmentGroup%3D%27688%27&returnGeometry=true"
            ),
            "sourceCrs": "EPSG:2193",
            "coordinateCrs": "EPSG:4326",
            "membershipBasis": "authoritative_ecan_major_catchment_polygon",
        },
        "geometry": geometry,
    }


def _partition_observations(
    records: list[dict[str, Any]],
    station_indexes: dict[str, int],
    parameter_id: str,
) -> dict[str, object]:
    rows = sorted(
        (row for row in records if row["parameter_id"] == parameter_id),
        key=lambda row: (row["station_id"], row["observed_at"], row["observation_id"]),
    )
    lookups: dict[str, list[str | None]] = {field: [] for field in LOOKUP_FIELDS}
    lookup_indexes: dict[str, dict[str | None, int]] = {field: {} for field in LOOKUP_FIELDS}

    def lookup(field: str, value: str | None) -> int:
        indexes = lookup_indexes[field]
        if value not in indexes:
            indexes[value] = len(lookups[field])
            lookups[field].append(value)
        return indexes[value]

    encoded_rows = []
    for row in rows:
        source = row["source"]
        values = {
            "observationId": row["observation_id"],
            "stationIndex": station_indexes[row["station_id"]],
            "observedAt": row["observed_at"],
            "value": row["canonical_value"],
            "originalValue": row["value"],
            "resultText": row["result_text"],
            "originalUnit": row["original_unit"],
            "canonicalUnit": row["canonical_unit"],
            "qualityFlag": row["quality_flag"],
            "qualityRepresentation": row["quality_representation"],
            "qualityDisposition": row["quality_disposition"],
            "censoring": row["censoring"],
            "censorLimit": row["censor_limit"],
            "duplicateDisposition": row["duplicate_disposition"],
            "valueKind": row["value_kind"],
            "analysisEligible": row["analysis_eligible"],
            "exclusionReason": None if row["analysis_eligible"] else row["quality_disposition"],
            "sourceRecordId": source["source_record_id"],
            "sourceEndpoint": source["endpoint"],
            "sourceRetrievedAt": source["retrieved_at"],
        }
        encoded_rows.append([
            lookup(field, values[field]) if field in LOOKUP_FIELDS else values[field]
            for field in OBSERVATION_COLUMNS
        ])
    return {
        "contractVersion": RUNTIME_CONTRACT_VERSION,
        "parameterId": parameter_id,
        "columns": list(OBSERVATION_COLUMNS),
        "lookups": lookups,
        "rows": encoded_rows,
    }


def prepare_assets(
    analytical_dir: Path,
    site_audit: Path,
    output: Path,
    boundary_path: Path,
) -> dict[str, object]:
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
        for parameter_id, spec in PARAMETER_SPECS.items()
        if parameter_id not in {"water_temperature"}
    ]
    normalized_records = normalized.get("records", [])
    if not isinstance(normalized_records, list):
        raise ValueError("normalized observations must contain a records list")
    station_indexes = {station["stationId"]: index for index, station in enumerate(stations)}
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
    geometry = _runtime_geometry(boundary_path)
    payload = {
        "contractVersion": RUNTIME_CONTRACT_VERSION,
        "analyticalVersion": normalized["analytical_version"],
        "studyAreaId": manifest["study_area_id"],
        "studyAreaName": "Ashburton–Hakatere catchment",
        "sourceTermsStatus": "public_cc_by_attribution_freshness",
        "qualityPolicy": manifest.get("quality_policy"),
        "sourceRetrievedAt": manifest.get("source_retrieved_at"),
        "buildId": manifest.get("build_id"),
        "parameters": parameters,
        "stations": stations,
        "catchmentGeometry": geometry,
        "coverage": coverage.get("records", []),
        "summaries": app_summaries,
        "trends": app_trends,
        "counts": manifest.get("counts", {}),
        "warnings": manifest.get("warnings", []),
    }
    partition_dir = output.parent / "observations"
    partition_dir.mkdir(parents=True, exist_ok=True)
    partitions = {}
    for parameter in parameters:
        parameter_id = parameter["parameterId"]
        partition = _partition_observations(normalized_records, station_indexes, parameter_id)
        partition_content = json.dumps(partition, separators=(",", ":"), ensure_ascii=False) + "\n"
        partition_path = partition_dir / f"{parameter_id}.json"
        partition_path.write_text(partition_content, encoding="utf-8")
        partitions[parameter_id] = {
            "path": f"/data/ashburton/observations/{parameter_id}.json",
            "contractVersion": RUNTIME_CONTRACT_VERSION,
            "rowCount": len(partition["rows"]),
            "byteCount": len(partition_content.encode("utf-8")),
            "sha256": hashlib.sha256(partition_content.encode("utf-8")).hexdigest(),
        }
    payload["observationPartitions"] = partitions
    payload["runtimeData"] = {
        "contractVersion": RUNTIME_CONTRACT_VERSION,
        "detailLoading": "parameter_partitioned",
        "observationColumns": list(OBSERVATION_COLUMNS),
        "lookupFields": list(LOOKUP_FIELDS),
        "encoding": "UTF-8 JSON; partition rows use documented column order and lookup indexes",
    }
    content = json.dumps(payload, indent=2, sort_keys=True, ensure_ascii=False) + "\n"
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(content, encoding="utf-8")
    return {"output": str(output), "sha256": hashlib.sha256(content.encode()).hexdigest(), "counts": payload["counts"]}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--analytical-dir", type=Path, default=Path("reports/generated/ashburton-analytical-assets-all-sites"))
    parser.add_argument("--site-audit", type=Path, default=Path("reports/generated/ashburton-catchment-site-coverage.json"))
    parser.add_argument("--output", type=Path, default=Path("web/public/data/ashburton/dashboard.json"))
    parser.add_argument("--boundary", type=Path, default=Path("reports/generated/ashburton-catchment-site-coverage.json"))
    args = parser.parse_args()
    print(json.dumps(prepare_assets(args.analytical_dir, args.site_audit, args.output, args.boundary), sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
