#!/usr/bin/env python3
"""Reproducible, dependency-free source and catchment feasibility audit.

The live audit intentionally stores only compact profiling output. It does not
cache or commit source observations. Public endpoints and retrieval metadata
are retained in the report so a later pipeline can be built against an
explicitly reviewed source contract.
"""

from __future__ import annotations

import argparse
import json
import math
import sys
import time
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable


SURFACE_LAYER = (
    "https://gis.ecan.govt.nz/arcgis/rest/services/Public/"
    "WaterQualityandMonitoring/MapServer/0"
)
FLOW_LAYER = (
    "https://gis.ecan.govt.nz/arcgis/rest/services/Public/"
    "WaterQualityandMonitoring/MapServer/6"
)
FLOW_LIVE_LAYER = (
    "https://gis.ecan.govt.nz/arcgis/rest/services/Public/"
    "WaterQualityandMonitoring/MapServer/12"
)
HILLTOP_ENDPOINT = "http://wateruse.ecan.govt.nz/wqlawa.hts"
ECAN_WQ_PAGE = "https://www.ecan.govt.nz/data/water-quality-data"
ECAN_FLOW_PAGE = "https://www.ecan.govt.nz/data/riverflow"
ECAN_TERMS = "https://www.ecan.govt.nz/data/document/download?uri=3957205"
ECAN_SURFACE_ITEM = (
    "https://www.arcgis.com/sharing/rest/content/items/"
    "6e62f7f10cd5433c98e5e330b4ed3b7d?f=pjson"
)
LAWA_DOWNLOAD = "https://www.lawa.org.nz/download-data"

CANDIDATES: dict[str, dict[str, Any]] = {
    "Ashley-Rakahuri": {"aliases": ["ashley", "rakahuri"]},
    "Waimakariri": {"aliases": ["waimakariri"]},
    "Selwyn-Waikirikiri": {"aliases": ["selwyn", "waikirikiri"]},
    "Rakaia": {"aliases": ["rakaia"]},
    "Ashburton-Hakatere": {"aliases": ["ashburton", "hakatere"]},
    "Rangitata": {"aliases": ["rangitata"]},
    "Hurunui": {"aliases": ["hurunui"]},
}


class AuditError(RuntimeError):
    """Raised when a source response cannot support a complete audit."""


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def fetch_bytes(url: str, *, timeout: int = 60, retries: int = 3) -> bytes:
    """Fetch a public response with bounded retries and a descriptive error."""

    request = urllib.request.Request(
        url,
        headers={"User-Agent": "catchment-health-dashboard-feasibility-audit/0.1"},
    )
    last_error: Exception | None = None
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(request, timeout=timeout) as response:
                body = response.read()
                if not body:
                    raise AuditError(f"empty response from {url}")
                return body
        except Exception as error:  # urllib has several transport exceptions.
            last_error = error
            if attempt + 1 < retries:
                time.sleep(0.5 * (2**attempt))
    raise AuditError(f"failed after {retries} attempts: {url}: {last_error}")


def fetch_json(url: str) -> dict[str, Any]:
    try:
        payload = json.loads(fetch_bytes(url).decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as error:
        raise AuditError(f"invalid JSON from {url}: {error}") from error
    if isinstance(payload, dict) and payload.get("error"):
        raise AuditError(f"source error from {url}: {payload['error']}")
    if not isinstance(payload, dict):
        raise AuditError(f"expected JSON object from {url}")
    return payload


def query_params(base: str, params: dict[str, Any]) -> str:
    return f"{base}/query?{urllib.parse.urlencode(params)}"


def arcgis_features(
    layer_url: str,
    out_fields: Iterable[str],
    *,
    page_size: int = 1000,
) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    """Read every feature and verify the service count against retrieved rows."""

    metadata = fetch_json(f"{layer_url}?f=pjson")
    expected = fetch_json(
        query_params(
            layer_url,
            {"where": "1=1", "returnCountOnly": "true", "f": "pjson"},
        )
    ).get("count")
    if not isinstance(expected, int):
        raise AuditError(f"missing ArcGIS count for {layer_url}")

    rows: list[dict[str, Any]] = []
    fields = ",".join(out_fields)
    offset = 0
    while offset < expected:
        payload = fetch_json(
            query_params(
                layer_url,
                {
                    "where": "1=1",
                    "outFields": fields,
                    "returnGeometry": "false",
                    "resultOffset": offset,
                    "resultRecordCount": min(page_size, expected - offset),
                    "orderByFields": "OBJECTID ASC",
                    "f": "json",
                },
            )
        )
        features = payload.get("features")
        if not isinstance(features, list) or not features:
            raise AuditError(
                f"incomplete ArcGIS page for {layer_url} at offset {offset}"
            )
        rows.extend(
            feature.get("attributes", {})
            for feature in features
            if isinstance(feature, dict) and isinstance(feature.get("attributes"), dict)
        )
        offset += len(features)

    if len(rows) != expected:
        raise AuditError(
            f"ArcGIS completeness mismatch for {layer_url}: "
            f"expected {expected}, retrieved {len(rows)}"
        )
    return rows, {
        "url": layer_url,
        "expected_count": expected,
        "retrieved_count": len(rows),
        "max_record_count": metadata.get("maxRecordCount"),
        "supported_query_formats": metadata.get("supportedQueryFormats"),
        "fields": [field.get("name") for field in metadata.get("fields", [])],
        "spatial_reference": metadata.get("sourceSpatialReference", {}).get("wkid"),
        "copyright_text": metadata.get("copyrightText"),
        "description": metadata.get("description"),
    }


def child_text(element: ET.Element, name: str) -> str | None:
    for child in element:
        if child.tag.rsplit("}", 1)[-1] == name:
            return (child.text or "").strip() or None
    return None


def parse_hilltop_measurements(xml_bytes: bytes) -> list[dict[str, str]]:
    """Parse WFS MeasurementList rows without depending on a GIS package."""

    try:
        root = ET.fromstring(xml_bytes)
    except ET.ParseError as error:
        raise AuditError(f"invalid Hilltop XML: {error}") from error
    rows: list[dict[str, str]] = []
    for element in root.iter():
        if element.tag.rsplit("}", 1)[-1] != "MeasurementList":
            continue
        values = {
            key: child_text(element, key)
            for key in ("Site", "Measurement", "From", "To")
        }
        if values["Site"] and values["Measurement"]:
            rows.append({key: value for key, value in values.items() if value})
    if not rows:
        raise AuditError("Hilltop MeasurementList contained no measurements")
    return rows


def parse_hilltop_measurement_details(xml_bytes: bytes) -> list[dict[str, str]]:
    """Parse units and source semantics from a Hilltop site MeasurementList."""

    try:
        root = ET.fromstring(xml_bytes)
    except ET.ParseError as error:
        raise AuditError(f"invalid Hilltop XML: {error}") from error
    rows: list[dict[str, str]] = []
    for element in root.iter():
        if element.tag.rsplit("}", 1)[-1] != "DataSource":
            continue
        name = element.attrib.get("Name")
        if not name:
            continue
        row: dict[str, str] = {"Measurement": name}
        for key in ("NumItems", "TSType", "DataType", "Interpolation", "From", "To", "SensorGroup"):
            value = child_text(element, key)
            if value:
                row[key] = value
        measurement = next(
            (child for child in element if child.tag.rsplit("}", 1)[-1] == "Measurement"),
            None,
        )
        if measurement is not None:
            units = child_text(measurement, "Units")
            if units:
                row["Units"] = units
        rows.append(row)
    if not rows:
        raise AuditError("Hilltop site MeasurementList contained no data sources")
    return rows


def parse_hilltop_site_list(xml_bytes: bytes) -> list[dict[str, str]]:
    try:
        root = ET.fromstring(xml_bytes)
    except ET.ParseError as error:
        raise AuditError(f"invalid Hilltop XML: {error}") from error
    rows: list[dict[str, str]] = []
    for element in root.iter():
        if element.tag.rsplit("}", 1)[-1] != "Site":
            continue
        name = element.attrib.get("Name")
        latitude = child_text(element, "Latitude")
        longitude = child_text(element, "Longitude")
        if name:
            rows.append(
                {
                    "Site": name,
                    **({"Latitude": latitude} if latitude else {}),
                    **({"Longitude": longitude} if longitude else {}),
                }
            )
    if not rows:
        raise AuditError("Hilltop SiteList contained no sites")
    return rows


def nztm_to_wgs84(easting: float, northing: float) -> tuple[float, float]:
    """Inverse NZTM2000 projection, sufficient for nearest-site joining.

    This is a coordinate-linking aid for the feasibility audit, not a survey
    transformation. The source coordinates remain authoritative in the report.
    """

    a = 6378137.0
    ecc_squared = 0.00669438002290
    ecc_prime_squared = ecc_squared / (1 - ecc_squared)
    k0 = 0.9996
    false_easting = 1600000.0
    false_northing = 10000000.0
    central_meridian = math.radians(173.0)

    x = easting - false_easting
    y = northing - false_northing
    m = y / k0
    mu = m / (a * (1 - ecc_squared / 4 - 3 * ecc_squared**2 / 64))
    e1 = (1 - math.sqrt(1 - ecc_squared)) / (1 + math.sqrt(1 - ecc_squared))
    phi1 = (
        mu
        + (3 * e1 / 2 - 27 * e1**3 / 32) * math.sin(2 * mu)
        + (21 * e1**2 / 16 - 55 * e1**4 / 32) * math.sin(4 * mu)
        + (151 * e1**3 / 96) * math.sin(6 * mu)
        + (1097 * e1**4 / 512) * math.sin(8 * mu)
    )
    sin_phi = math.sin(phi1)
    cos_phi = math.cos(phi1)
    tan_phi = math.tan(phi1)
    n1 = a / math.sqrt(1 - ecc_squared * sin_phi**2)
    r1 = a * (1 - ecc_squared) / (1 - ecc_squared * sin_phi**2) ** 1.5
    d = x / (n1 * k0)
    lat = phi1 - (n1 * tan_phi / r1) * (
        d**2 / 2
        - (5 + 3 * tan_phi**2 + 10 * ecc_prime_squared * cos_phi**2) * d**4 / 24
        + (61 + 90 * tan_phi**2 + 298 * ecc_prime_squared * cos_phi**2) * d**6 / 720
    )
    lon = central_meridian + (
        d
        - (1 + 2 * tan_phi**2 + ecc_prime_squared * cos_phi**2) * d**3 / 6
        + (5 - 2 * ecc_prime_squared * cos_phi**2 + 28 * tan_phi**2) * d**5 / 120
    ) / cos_phi
    return math.degrees(lat), math.degrees(lon)


def epoch_millis_to_iso(value: Any) -> str | None:
    if not isinstance(value, (int, float)):
        return None
    return datetime.fromtimestamp(value / 1000, tz=timezone.utc).replace(microsecond=0).isoformat()


def coordinate_distance_degrees(left: tuple[float, float], right: tuple[float, float]) -> float:
    return math.hypot(left[0] - right[0], left[1] - right[1])


def candidate_for_name(name: str | None) -> str | None:
    haystack = (name or "").casefold()
    matches = [
        candidate
        for candidate, config in CANDIDATES.items()
        if any(alias in haystack for alias in config["aliases"])
    ]
    return matches[0] if len(matches) == 1 else None


def nearest_surface_station(
    site: dict[str, str], stations: list[dict[str, Any]], *, max_distance: float = 0.002
) -> tuple[dict[str, Any], float] | None:
    try:
        latitude = float(site["Latitude"])
        longitude = float(site["Longitude"])
    except (KeyError, TypeError, ValueError):
        return None
    possible: list[tuple[float, dict[str, Any]]] = []
    for station in stations:
        try:
            easting = float(station["NZTMX"])
            northing = float(station["NZTMY"])
        except (KeyError, TypeError, ValueError):
            continue
        station_point = nztm_to_wgs84(easting, northing)
        possible.append((coordinate_distance_degrees((latitude, longitude), station_point), station))
    if not possible:
        return None
    distance, station = min(possible, key=lambda item: item[0])
    return (station, distance) if distance <= max_distance else None


def linked_site_candidates(
    stations: list[dict[str, Any]], hilltop_sites: list[dict[str, str]]
) -> tuple[dict[str, str], list[float]]:
    site_candidate: dict[str, str] = {}
    join_distances: list[float] = []
    for hilltop_site in hilltop_sites:
        match = nearest_surface_station(hilltop_site, stations)
        if match:
            station, distance = match
            candidate = candidate_for_name(station.get("SITE_NAME"))
            if candidate:
                site_candidate[hilltop_site["Site"]] = candidate
                join_distances.append(distance)
    return site_candidate, join_distances


def summarize_candidate_data(
    stations: list[dict[str, Any]],
    hilltop_sites: list[dict[str, str]],
    measurements: list[dict[str, str]],
    flow_sites: list[dict[str, Any]],
    measurement_details: list[dict[str, str]] | None = None,
) -> dict[str, dict[str, Any]]:
    candidate_stations: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for station in stations:
        candidate = candidate_for_name(station.get("SITE_NAME"))
        if candidate:
            candidate_stations[candidate].append(station)

    site_candidate, join_distances = linked_site_candidates(stations, hilltop_sites)

    by_site: dict[str, list[dict[str, str]]] = defaultdict(list)
    for measurement in measurements:
        by_site[measurement["Site"]].append(measurement)
    details_by_measurement: dict[str, list[dict[str, str]]] = defaultdict(list)
    for detail in measurement_details or []:
        details_by_measurement[detail["Measurement"]].append(detail)

    output: dict[str, dict[str, Any]] = {}
    for candidate in CANDIDATES:
        relevant_sites = [site for site, value in site_candidate.items() if value == candidate]
        relevant_measurements = [
            row for site in relevant_sites for row in by_site.get(site, [])
        ]
        parameters: dict[str, dict[str, Any]] = {}
        for row in relevant_measurements:
            parameter = row["Measurement"]
            summary = parameters.setdefault(parameter, {"sites": set(), "from": [], "to": []})
            summary["sites"].add(row["Site"])
            if row.get("From"):
                summary["from"].append(row["From"])
            if row.get("To"):
                summary["to"].append(row["To"])
        parameter_rows = []
        for parameter, summary in sorted(parameters.items()):
            parameter_rows.append(
                {
                    "name": parameter,
                    "site_count": len(summary["sites"]),
                    "from": min(summary["from"]) if summary["from"] else None,
                    "to": max(summary["to"]) if summary["to"] else None,
                    "units_observed": sorted(
                        {detail["Units"] for detail in details_by_measurement[parameter] if detail.get("Units")}
                    ),
                    "sensor_groups_observed": sorted(
                        {
                            detail["SensorGroup"]
                            for detail in details_by_measurement[parameter]
                            if detail.get("SensorGroup")
                        }
                    ),
                    "interpolation_observed": sorted(
                        {
                            detail["Interpolation"]
                            for detail in details_by_measurement[parameter]
                            if detail.get("Interpolation")
                        }
                    ),
                }
            )
        flow_matches = [
            row
            for row in flow_sites
            if candidate_for_name(row.get("SITE")) == candidate
        ]
        output[candidate] = {
            "surface_station_count": len(candidate_stations[candidate]),
            "hilltop_site_count_joined": len(relevant_sites),
            "measurement_entry_count": len(relevant_measurements),
            "parameters": parameter_rows,
            "parameters_at_two_or_more_sites": [
                row["name"] for row in parameter_rows if row["site_count"] >= 2
            ],
            "flow_site_count_name_match": len(flow_matches),
            "flow_sites_with_gauging_history": sum(
                bool(row.get("FIRST_GAUGING") or row.get("LAST_GAUGING"))
                for row in flow_matches
            ),
            "flow_first_gauging": min(
                (
                    epoch_millis_to_iso(row["FIRST_GAUGING"])
                    for row in flow_matches
                    if row.get("FIRST_GAUGING") is not None
                    and epoch_millis_to_iso(row["FIRST_GAUGING"])
                ),
                default=None,
            ),
            "flow_last_gauging": max(
                (
                    epoch_millis_to_iso(row["LAST_GAUGING"])
                    for row in flow_matches
                    if row.get("LAST_GAUGING") is not None
                    and epoch_millis_to_iso(row["LAST_GAUGING"])
                ),
                default=None,
            ),
        }
    return {
        "candidates": output,
        "coordinate_join": {
            "hilltop_sites_total": len(hilltop_sites),
            "hilltop_sites_joined_to_surface_station": len(site_candidate),
            "candidate_join_count": len(site_candidate),
            "max_distance_degrees": max(join_distances, default=None),
            "method": "nearest NZTM2000-to-WGS84 point within 0.002 degrees, then station-name alias",
            "limitation": "name aliases are a screening proxy; they are not authoritative catchment membership",
        },
    }


def report_from_live_sources() -> dict[str, Any]:
    retrieved_at = utc_now()
    stations, station_meta = arcgis_features(
        SURFACE_LAYER,
        ["SITE_ID", "SITE_NAME", "SOURCE", "SITE_TYPE", "NZTMX", "NZTMY", "ALTITUDE", "Link"],
    )
    flow_sites, flow_meta = arcgis_features(
        FLOW_LAYER,
        [
            "SITE",
            "SITENUMBER",
            "TELEMETERED",
            "NO_OF_GAUGINGS",
            "FIRST_GAUGING",
            "LAST_GAUGING",
            "NZTMX",
            "NZTMY",
        ],
    )
    site_list_url = f"{HILLTOP_ENDPOINT}?Service=Hilltop&Request=SiteList&Location=LatLong"
    measurement_url = f"{HILLTOP_ENDPOINT}?Service=WFS&Request=GetFeature&TypeName=MeasurementList"
    hilltop_sites = parse_hilltop_site_list(fetch_bytes(site_list_url, timeout=120))
    measurements = parse_hilltop_measurements(fetch_bytes(measurement_url, timeout=180))
    linked_sites, _ = linked_site_candidates(stations, hilltop_sites)
    measurement_details: list[dict[str, str]] = []
    for site in sorted(linked_sites):
        detail_url = (
            f"{HILLTOP_ENDPOINT}?Service=Hilltop&Request=MeasurementList&"
            f"Site={urllib.parse.quote(site)}&Units=Yes"
        )
        measurement_details.extend(parse_hilltop_measurement_details(fetch_bytes(detail_url, timeout=60)))
    profile = summarize_candidate_data(
        stations,
        hilltop_sites,
        measurements,
        flow_sites,
        measurement_details,
    )
    return {
        "schema_version": "feasibility-audit-v1",
        "audit_retrieved_at": retrieved_at,
        "status": "complete_for_profiled_endpoints",
        "scope": {
            "candidate_screening": list(CANDIDATES),
            "surface_station_aliases": "case-insensitive name matching after coordinate join",
            "not_done": [
                "authoritative polygon catchment membership",
                "full observation download and quality/censoring profiling",
                "licence approval for redistribution of every source derivative",
                "owner selection of catchment, parameters, or analytical method",
            ],
        },
        "sources": [
            {
                "id": "ecan_surface_arcgis",
                "provider": "Environment Canterbury",
                "endpoint": SURFACE_LAYER,
                "role": "surface-water station inventory and coordinates",
                "retrieval": station_meta,
            },
            {
                "id": "ecan_surface_arcgis_catalog",
                "provider": "Environment Canterbury",
                "endpoint": ECAN_SURFACE_ITEM,
                "role": "ArcGIS catalog access and license metadata for the surface-water item",
                "retrieval": {
                    "access": "public",
                    "access_information": "Environment Canterbury",
                    "license_constraint_id": "CC-BY-3.0",
                    "service_url": SURFACE_LAYER,
                },
            },
            {
                "id": "ecan_flow_arcgis",
                "provider": "Environment Canterbury",
                "endpoint": FLOW_LAYER,
                "role": "historical gauging-site inventory and first/last gauging fields",
                "retrieval": flow_meta,
            },
            {
                "id": "ecan_flow_live_arcgis",
                "provider": "Environment Canterbury",
                "endpoint": FLOW_LIVE_LAYER,
                "role": "live flow/stage layer available as a service; not used as historical evidence",
                "retrieval": {"queried": False},
            },
            {
                "id": "ecan_hilltop_site_list",
                "provider": "Environment Canterbury",
                "endpoint": site_list_url,
                "role": "historical WQ/LAWA site catalog with coordinates",
                "retrieval": {
                    "retrieved_count": len(hilltop_sites),
                    "response_format": "Hilltop XML",
                },
            },
            {
                "id": "ecan_hilltop_measurement_list",
                "provider": "Environment Canterbury",
                "endpoint": measurement_url,
                "role": "per-site/per-parameter historical date bounds",
                "retrieval": {
                    "retrieved_count": len(measurements),
                    "response_format": "WFS 1.1.0 GML/XML",
                    "fields_profiled": ["Site", "Measurement", "From", "To"],
                },
            },
            {
                "id": "ecan_hilltop_measurement_details",
                "provider": "Environment Canterbury",
                "endpoint": f"{HILLTOP_ENDPOINT}?Service=Hilltop&Request=MeasurementList&Site=<site>&Units=Yes",
                "role": "units, sampling type, interpolation, sensor group, and per-site date bounds",
                "retrieval": {
                    "site_count": len(linked_sites),
                    "retrieved_count": len(measurement_details),
                    "fields_profiled": [
                        "Measurement",
                        "Units",
                        "NumItems",
                        "TSType",
                        "DataType",
                        "Interpolation",
                        "From",
                        "To",
                        "SensorGroup",
                    ],
                },
            },
            {
                "id": "ecan_water_quality_page",
                "provider": "Environment Canterbury",
                "endpoint": ECAN_WQ_PAGE,
                "role": "human-facing data publication and freshness note",
                "retrieval": {
                    "sampled": False,
                    "note": "page states publication may lag sampling by up to three months and offers site-level download/print",
                },
            },
            {
                "id": "lawa_download_catalog",
                "provider": "LAWA and partner agencies",
                "endpoint": LAWA_DOWNLOAD,
                "role": "national alternative and downloadable South Island data catalog",
                "retrieval": {
                    "sampled": False,
                    "note": "catalog describes South Island river-WQ data (2004-2024), but bulk file was not downloaded for this compact audit",
                },
            },
        ],
        "profile": profile,
        "constraints_and_attribution": {
            "ecan_water_quality_terms": ECAN_TERMS,
            "observed_terms": [
                "API access requires an account and subscription where the developer portal applies",
                "public outputs must attribute Environment Canterbury using its prescribed statement",
                "batch calls may require agreed scheduling outside business hours",
                "provider may change or discontinue platform/API content",
            ],
            "proposed_attribution": "This work uses material sourced from Water Quality Data, which is licensed under a Creative Commons Attribution 4.0 International licence by Environment Canterbury.",
            "licence_status": "dataset-specific water-quality CC BY 4.0 evidence recorded; release safeguards remain required",
        },
        "recommendation": {
            "status": "owner_decision_required",
            "preferred_screening_direction": "Ashburton-Hakatere is the strongest quantitative screen; Waimakariri and Ashley-Rakahuri are smaller alternatives, all subject to polygon-based membership and observation-level checks",
            "candidate_parameters_to_validate": [
                "E. coli",
                "Nitrate Nitrogen / Nitrate-N Nitrite-N",
                "Dissolved Reactive Phosphorus",
                "Total Nitrogen",
                "Total Phosphorus",
                "Turbidity",
                "pH",
                "Dissolved Oxygen",
                "Water Temperature (Field)",
            ],
            "plausible_analysis_window": "2007-2024 is indicated by the catalog for several common parameters at some sites; completeness is not yet established",
            "flow": "include as contextual data if a selected catchment has a defensible station match; do not infer causation",
        },
    }


def report_from_fixture(path: Path) -> dict[str, Any]:
    with path.open(encoding="utf-8") as handle:
        payload = json.load(handle)
    if not isinstance(payload, dict):
        raise AuditError("fixture must contain a JSON object")
    return payload


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--fixture", type=Path)
    args = parser.parse_args(argv)
    try:
        report = report_from_fixture(args.fixture) if args.fixture else report_from_live_sources()
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json.dumps(report, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    except AuditError as error:
        print(f"feasibility audit failed: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
