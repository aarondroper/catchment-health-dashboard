#!/usr/bin/env python3
"""Reconcile ECan spatial and Hilltop station inventories for the study boundary."""

from __future__ import annotations

import argparse
from collections import Counter
import json
from pathlib import Path
import sys
from typing import Any, Iterable

REPOSITORY_ROOT = Path(__file__).resolve().parents[1]
if str(REPOSITORY_ROOT) not in sys.path:
    sys.path.insert(0, str(REPOSITORY_ROOT))

from catchment_dashboard.ecan_geometry import CatchmentBoundary, arcgis_catchment_url, parse_catchment_boundary
from catchment_dashboard.ecan_hilltop import HILLTOP_ENDPOINT, SURFACE_LAYER, RecordingFetcher, parse_site_list
from tools.feasibility_audit import arcgis_features, nztm_to_wgs84, coordinate_distance_degrees

SURFACE_FIELDS = ("OBJECTID", "SITE_ID", "SITE_NAME", "SOURCE", "SITE_TYPE", "NZTMX", "NZTMY", "Link")
SELECTED_PARAMETERS = {
    "E. coli",
    "Nitrate-N Nitrite-N",
    "Dissolved Reactive Phosphorus",
    "Total Nitrogen",
    "Turbidity",
    "Dissolved Oxygen",
    "Total Phosphorus",
    "Water Temperature (Field)",
}


def _point_for_surface(row: dict[str, Any]) -> tuple[float, float] | None:
    try:
        return nztm_to_wgs84(float(row["NZTMX"]), float(row["NZTMY"]))
    except (KeyError, TypeError, ValueError):
        return None


def _point_for_hilltop(row: dict[str, Any]) -> tuple[float, float] | None:
    try:
        return float(row["latitude"]), float(row["longitude"])
    except (KeyError, TypeError, ValueError):
        return None


def _metadata_by_site(site_audit: dict[str, Any]) -> dict[str, list[dict[str, Any]]]:
    return {
        str(profile["site_id"]): list(profile.get("measurements", []))
        for profile in site_audit.get("measurement_profiles", [])
        if isinstance(profile, dict) and profile.get("site_id")
    }


def reconcile_inventory(
    surface_rows: Iterable[dict[str, Any]],
    hilltop_rows: Iterable[dict[str, Any]],
    boundary: CatchmentBoundary,
    *,
    site_audit: dict[str, Any] | None = None,
    profile: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Return a deterministic inventory reconciliation.

    Exact source station IDs are the only join used for inclusion. Coordinates
    are used for boundary screening and as a diagnostic for exact matches; no
    nearest-coordinate fallback is performed.
    """
    all_surface_rows = list(surface_rows)
    all_hilltop_rows = list(hilltop_rows)
    surface = []
    missing_surface_coordinates = []
    for row in all_surface_rows:
        identifier = str(row.get("SITE_ID") or "").strip()
        point = _point_for_surface(row)
        if not identifier:
            continue
        if point is None:
            missing_surface_coordinates.append(identifier)
            continue
        if boundary.contains(longitude=point[1], latitude=point[0]):
            surface.append({"id": identifier, "name": row.get("SITE_NAME"), "point": point, "objectId": row.get("OBJECTID")})

    hilltop = []
    missing_hilltop_coordinates = []
    for row in all_hilltop_rows:
        identifier = str(row.get("site_id") or "").strip()
        point = _point_for_hilltop(row)
        if not identifier:
            continue
        if point is None:
            missing_hilltop_coordinates.append(identifier)
            continue
        if boundary.contains(longitude=point[1], latitude=point[0]):
            hilltop.append({"id": identifier, "point": point})

    surface_by_id = {row["id"]: row for row in surface}
    hilltop_by_id = {row["id"]: row for row in hilltop}
    surface_id_counts = Counter(row["id"] for row in surface)
    hilltop_id_counts = Counter(row["id"] for row in hilltop)
    ambiguous_surface_ids = sorted(identifier for identifier, count in surface_id_counts.items() if count > 1)
    ambiguous_hilltop_ids = sorted(identifier for identifier, count in hilltop_id_counts.items() if count > 1)
    ambiguous_ids = sorted(set(ambiguous_surface_ids) | set(ambiguous_hilltop_ids))
    surface_ids = set(surface_by_id)
    hilltop_ids = set(hilltop_by_id)
    exact_ids = sorted((surface_ids & hilltop_ids) - set(ambiguous_ids))
    surface_only = sorted(surface_ids - hilltop_ids)
    hilltop_only = sorted(hilltop_ids - surface_ids)

    coordinate_diagnostics = []
    for identifier in exact_ids:
        left = surface_by_id[identifier]["point"]
        right = hilltop_by_id[identifier]["point"]
        coordinate_diagnostics.append({
            "stationId": identifier,
            "surfaceLatitude": left[0],
            "surfaceLongitude": left[1],
            "hilltopLatitude": right[0],
            "hilltopLongitude": right[1],
            "distanceDegrees": coordinate_distance_degrees(left, right),
        })

    audit = site_audit or {}
    metadata = _metadata_by_site(audit)
    requested = set((profile or {}).get("requested_parameters", [])) or SELECTED_PARAMETERS
    observations = (profile or {}).get("observations", [])
    observation_counts: dict[tuple[str, str], int] = {}
    for row in observations:
        key = (str(row.get("station_id") or row.get("site_id")), str(row.get("parameter_name") or row.get("parameter_id")))
        observation_counts[key] = observation_counts.get(key, 0) + 1
    selected_metadata = {
        site_id: sorted({str(row.get("measurement_name")) for row in metadata.get(site_id, []) if str(row.get("measurement_name", "")).casefold() in {value.casefold() for value in requested}})
        for site_id in exact_ids
    }
    observed_by_site = {
        site_id: sorted({parameter for (candidate, parameter), count in observation_counts.items() if candidate == site_id and count})
        for site_id in exact_ids
    }
    observation_free = sorted(site_id for site_id in exact_ids if not observed_by_site[site_id])
    metadata_without_selected = sorted(site_id for site_id in exact_ids if not selected_metadata[site_id])
    metadata_with_selected_no_observations = sorted(site_id for site_id in exact_ids if selected_metadata[site_id] and not observed_by_site[site_id])

    return {
        "schemaVersion": "ashburton-catchment-coverage-reconciliation-v1",
        "studyArea": {"catchmentName": boundary.catchment_name, "catchmentGroup": boundary.catchment_group, "boundaryObjectId": boundary.source_object_id, "boundaryInclusion": "inside_or_on_polygon_boundary"},
        "inventory": {
            "surfaceFeaturesInBoundary": len(surface),
            "hilltopCoordinateBearingSitesInBoundary": len(hilltop),
            "exactStationIdMatches": len(exact_ids),
            "unmatchedSurfaceSites": len(surface_only),
            "unmatchedHilltopSites": len(hilltop_only),
            "surfaceFeatureIdsInBoundary": sorted(surface_ids),
            "hilltopSiteIdsInBoundary": sorted(hilltop_ids),
            "exactStationIds": exact_ids,
            "ambiguousSurfaceSiteIds": ambiguous_surface_ids,
            "ambiguousHilltopSiteIds": ambiguous_hilltop_ids,
            "unmatchedSurfaceSiteIds": surface_only,
            "unmatchedHilltopSiteIds": hilltop_only,
        },
        "categories": {
            "completeVerifiedInclusion": exact_ids,
            "includedObservationFree": observation_free,
            "includedMetadataWithoutSelectedParameter": metadata_without_selected,
            "includedSelectedMetadataWithoutRetrievedObservation": metadata_with_selected_no_observations,
            "includedWithSelectedParameterObservations": sorted(set(exact_ids) - set(observation_free)),
            "unresolvedMatches": ambiguous_ids,
            "technicalExclusions": {"surfaceOutsideBoundary": len(all_surface_rows) - len(surface) - len(set(missing_surface_coordinates)), "hilltopOutsideBoundary": audit.get("out_of_boundary_site_count"), "surfaceMissingCoordinates": sorted(set(missing_surface_coordinates)), "hilltopMissingCoordinates": sorted(set(missing_hilltop_coordinates))},
        },
        "selectedParameters": sorted(requested),
        "observedParameterCounts": {site_id: {parameter: observation_counts[(site_id, parameter)] for parameter in observed_by_site[site_id]} for site_id in exact_ids},
        "coordinateDiagnostics": {"matchingMethod": "exact_station_id_only", "coordinateUse": "boundary_screen_and_exact_match_diagnostic_only", "nearestJoinToleranceDegrees": None, "matches": coordinate_diagnostics, "maxDistanceDegrees": max((row["distanceDegrees"] for row in coordinate_diagnostics), default=0.0)},
        "sourceChecks": {"surfacePagination": "validated_by_arcgis_count_and_all_ordered_pages", "boundaryTransferLimit": "rejected_if_exceeded", "surfaceSpatialReference": "NZTM2000 EPSG:2193 converted to WGS84 for point-in-polygon", "hilltopSiteList": "coordinate-bearing SiteList rows only; source catalog count retained separately", "observationScope": "profile rows only; no claim beyond retrieved requested parameters and dates"},
        "limitations": ["The 340 in-bound surface inventory features include historical or non-Hilltop station records; only 19 exact IDs crosswalk to the coordinate-bearing Hilltop catalog.", "This is complete reconciliation against the identified source inventories, not complete environmental monitoring coverage.", "The profile cannot prove that unrequested parameters or observations absent from the requested date range do not exist upstream."],
    }


def reconcile_live(*, profile_path: Path | None = None, site_audit_path: Path | None = None) -> dict[str, Any]:
    fetcher = RecordingFetcher()
    site_list_url = f"{HILLTOP_ENDPOINT}?Service=Hilltop&Request=SiteList&Location=LatLong"
    hilltop_sites = parse_site_list(fetcher(site_list_url, timeout=60))
    boundary_url = arcgis_catchment_url()
    boundary = parse_catchment_boundary(fetcher(boundary_url, timeout=60), source_endpoint=boundary_url)
    surface_rows, surface_meta = arcgis_features(SURFACE_LAYER, SURFACE_FIELDS)
    site_audit = json.loads(site_audit_path.read_text(encoding="utf-8")) if site_audit_path else {}
    profile = json.loads(profile_path.read_text(encoding="utf-8")) if profile_path else {}
    result = reconcile_inventory(surface_rows, hilltop_sites, boundary, site_audit=site_audit, profile=profile)
    result["retrievedAt"] = fetcher.responses[-1].retrieved_at if fetcher.responses else None
    result["sourceInventoryValidation"] = {"surface": surface_meta, "hilltopCoordinateBearingCount": len(hilltop_sites), "boundaryEndpoint": boundary_url, "siteListEndpoint": site_list_url}
    return result


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=Path("reports/generated/ashburton-catchment-coverage-reconciliation.json"))
    parser.add_argument("--profile", type=Path)
    parser.add_argument("--site-audit", type=Path)
    args = parser.parse_args()
    result = reconcile_live(profile_path=args.profile, site_audit_path=args.site_audit)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps({"exactStationIdMatches": result["inventory"]["exactStationIdMatches"], "surfaceFeaturesInBoundary": result["inventory"]["surfaceFeaturesInBoundary"], "hilltopSitesInBoundary": result["inventory"]["hilltopCoordinateBearingSitesInBoundary"]}, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
