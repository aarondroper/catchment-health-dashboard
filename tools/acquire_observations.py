#!/usr/bin/env python3
"""Acquire a bounded, provenance-preserving Ashburton observation profile."""

from __future__ import annotations

import argparse
import json
from collections import Counter
from pathlib import Path
import sys


# Keep the repository-local command usable before the package is installed.
REPOSITORY_ROOT = Path(__file__).resolve().parents[1]
if str(REPOSITORY_ROOT) not in sys.path:
    sys.path.insert(0, str(REPOSITORY_ROOT))

from catchment_dashboard.contracts import validate_observation
from catchment_dashboard.ecan_geometry import (
    arcgis_catchment_url,
    filter_sites_to_boundary,
    parse_catchment_boundary,
)
from catchment_dashboard.ecan_hilltop import (
    HILLTOP_ENDPOINT,
    arcgis_candidate_url,
    build_source_ref,
    fetch_bytes,
    hilltop_url,
    fetch_arcgis_candidates,
    parse_measurement_metadata,
    parse_observations,
    parse_site_list,
    profile_to_dict,
    ProvisionalSite,
    provisional_site_join,
    utc_now,
)


DEFAULT_PARAMETERS = [
    "Dissolved Reactive Phosphorus",
    "Total Nitrogen",
    "Nitrate-N Nitrite-N",
]


def acquire_profile(
    *,
    output: Path,
    max_sites: int,
    parameters: list[str],
    from_date: str,
    to_date: str,
    site_ids: list[str] | None = None,
) -> dict[str, object]:
    retrieved_at = utc_now()
    station_endpoint = arcgis_candidate_url()
    source_endpoints: list[str] = []
    boundary = None
    excluded_sites: list[dict[str, str | None]] = []
    if site_ids:
        provisional_sites = [
            ProvisionalSite(
                site_id=site_id,
                station_name=None,
                source_station_id=None,
                latitude=None,
                longitude=None,
                join_distance_degrees=None,
                membership_basis="explicit_site_id_not_spatially_validated",
            )
            for site_id in sorted(set(site_ids))
        ]
    else:
        source_endpoints.append(station_endpoint)
        stations = fetch_arcgis_candidates()
        site_list_endpoint = f"{HILLTOP_ENDPOINT}?Service=Hilltop&Request=SiteList&Location=LatLong"
        sites = parse_site_list(fetch_bytes(site_list_endpoint, timeout=60))
        source_endpoints.append(site_list_endpoint)
        provisional_sites = provisional_site_join(stations, sites)
        boundary_endpoint = arcgis_catchment_url()
        boundary = parse_catchment_boundary(
            fetch_bytes(boundary_endpoint, timeout=60),
            source_endpoint=boundary_endpoint,
        )
        source_endpoints.append(boundary_endpoint)
        provisional_sites, excluded_sites = filter_sites_to_boundary(provisional_sites, boundary)
    if not provisional_sites:
        raise RuntimeError("no in-bound Ashburton site joins were found")
    selected_sites = provisional_sites[:max_sites]

    observations = []
    parse_counts: Counter[str] = Counter()
    matched_parameters: set[str] = set()
    observed_parameters: set[str] = set()
    for site in selected_sites:
        metadata_endpoint = hilltop_url(request="MeasurementList", site=site.site_id)
        metadata = parse_measurement_metadata(
            fetch_bytes(metadata_endpoint, timeout=60), site_id=site.site_id
        )
        source_endpoints.append(metadata_endpoint)
        by_name = {row.measurement_name.casefold(): row for row in metadata}
        for requested in parameters:
            match = by_name.get(requested.casefold())
            if match is None:
                continue
            matched_parameters.add(requested.casefold())
            observation_endpoint = hilltop_url(
                request="GetData",
                site=site.site_id,
                measurement=match.measurement_name,
                from_date=from_date,
                to_date=to_date,
            )
            source_endpoints.append(observation_endpoint)
            source = build_source_ref(
                endpoint=observation_endpoint,
                source_record_id=f"{site.site_id}/{match.measurement_name}",
                retrieved_at=retrieved_at,
            )
            rows, counts = parse_observations(
                fetch_bytes(observation_endpoint, timeout=60),
                site_id=site.site_id,
                measurement_name=match.measurement_name,
                original_unit=match.units,
                source=source,
            )
            for row in rows:
                validate_observation(row)
            observations.extend(rows)
            if rows:
                observed_parameters.add(requested.casefold())
            parse_counts.update(counts)

    unavailable = [
        requested
        for requested in parameters
        if requested.casefold() not in matched_parameters
    ]
    parameters_without_observations = [
        requested
        for requested in parameters
        if requested.casefold() in matched_parameters
        and requested.casefold() not in observed_parameters
    ]

    result = profile_to_dict(
        retrieved_at=retrieved_at,
        sites=selected_sites,
        observations=observations,
        parse_counts=parse_counts,
        requested_parameters=parameters,
        unavailable_parameters=unavailable,
        parameters_without_observations=parameters_without_observations,
        source_endpoints=source_endpoints,
        boundary=boundary,
        excluded_sites=excluded_sites,
    )
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(result, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    return result


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("reports/generated/ashburton-observation-profile.json"),
    )
    parser.add_argument("--max-sites", type=int, default=3)
    parser.add_argument("--from-date", default="2024-01-01")
    parser.add_argument("--to-date", default="2024-12-31")
    parser.add_argument("--parameter", dest="parameters", action="append")
    parser.add_argument(
        "--site-id",
        dest="site_ids",
        action="append",
        help="Probe an explicit Hilltop site without asserting spatial membership.",
    )
    args = parser.parse_args()
    if args.max_sites < 1:
        parser.error("--max-sites must be at least 1")
    parameters = args.parameters or DEFAULT_PARAMETERS
    result = acquire_profile(
        output=args.output,
        max_sites=args.max_sites,
        parameters=parameters,
        from_date=args.from_date,
        to_date=args.to_date,
        site_ids=args.site_ids,
    )
    print(json.dumps(result["summary"], sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
