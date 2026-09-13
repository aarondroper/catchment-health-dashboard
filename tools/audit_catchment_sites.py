#!/usr/bin/env python3
"""Audit all coordinate-bearing Hilltop sites inside the Ashburton boundary."""

from __future__ import annotations

import argparse
import json
from dataclasses import asdict
from pathlib import Path
import sys

REPOSITORY_ROOT = Path(__file__).resolve().parents[1]
if str(REPOSITORY_ROOT) not in sys.path:
    sys.path.insert(0, str(REPOSITORY_ROOT))

from catchment_dashboard.ecan_geometry import arcgis_catchment_url, filter_sites_to_boundary, parse_catchment_boundary
from catchment_dashboard.ecan_hilltop import (
    AcquisitionError,
    HILLTOP_ENDPOINT,
    ProvisionalSite,
    RecordingFetcher,
    hilltop_url,
    parse_measurement_metadata,
    parse_site_list,
    utc_now,
)


def audit_sites(output: Path) -> dict[str, object]:
    fetcher = RecordingFetcher()
    site_list_endpoint = f"{HILLTOP_ENDPOINT}?Service=Hilltop&Request=SiteList&Location=LatLong"
    site_rows = parse_site_list(fetcher(site_list_endpoint, timeout=60))
    boundary_endpoint = arcgis_catchment_url()
    boundary = parse_catchment_boundary(
        fetcher(boundary_endpoint, timeout=60),
        source_endpoint=boundary_endpoint,
    )
    candidates = [
        ProvisionalSite(
            site_id=row["site_id"],
            station_name=None,
            source_station_id=None,
            latitude=float(row["latitude"]),
            longitude=float(row["longitude"]),
            join_distance_degrees=None,
            membership_basis="hilltop_site_list_coordinate_screening",
        )
        for row in site_rows
        if row.get("latitude") and row.get("longitude")
    ]
    included, excluded = filter_sites_to_boundary(candidates, boundary)
    measurement_profiles = []
    for site in included:
        endpoint = hilltop_url(request="MeasurementList", site=site.site_id)
        try:
            metadata = parse_measurement_metadata(
                fetcher(endpoint, timeout=60),
                site_id=site.site_id,
            )
            measurement_profiles.append({
                "site_id": site.site_id,
                "measurement_count": len(metadata),
                "measurements": [asdict(row) for row in metadata],
            })
        except AcquisitionError as error:
            measurement_profiles.append({
                "site_id": site.site_id,
                "measurement_count": None,
                "error": str(error),
            })
    result = {
        "schema_version": "ashburton-site-coverage-audit-v1",
        "retrieved_at": utc_now(),
        "study_area_id": "ashburton_hakatere",
        "boundary": {
            "source_endpoint": boundary.source_endpoint,
            "source_object_id": boundary.source_object_id,
            "catchment_group": boundary.catchment_group,
            "catchment_name": boundary.catchment_name,
            "area_ha": boundary.area_ha,
        },
        "site_list_count": len(site_rows),
        "coordinate_bearing_site_count": len(candidates),
        "in_boundary_site_count": len(included),
        "out_of_boundary_site_count": len(excluded),
        "in_boundary_sites": [asdict(site) for site in included],
        "measurement_profiles": measurement_profiles,
        "measurement_profile_error_count": sum("error" in profile for profile in measurement_profiles),
        "source_manifest": [asdict(response) for response in fetcher.responses],
        "limitations": [
            "This is a coordinate membership audit, not proof that every in-bound site has water-quality measurements.",
            "Measurement metadata and observations require a separate bounded acquisition after site-count and rate-limit review.",
            "The response body is not cached or committed pending source-term review.",
        ],
    }
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(result, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    return result


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=Path("reports/generated/ashburton-catchment-site-coverage.json"))
    args = parser.parse_args()
    result = audit_sites(args.output)
    print(json.dumps({key: result[key] for key in ("site_list_count", "coordinate_bearing_site_count", "in_boundary_site_count", "out_of_boundary_site_count")}, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
