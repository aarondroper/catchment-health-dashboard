"""Dependency-light ECan ArcGIS/Hilltop acquisition primitives.

The adapter preserves the provider response at the normalized boundary. It
does not convert units, discard quality codes, replace censored values, or
assert authoritative catchment membership.
"""

from __future__ import annotations

import json
import hashlib
import math
import re
import time
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from collections import Counter
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable, Iterable

from .contracts import CONTRACT_VERSION, ObservationRecord, SourceRef


SURFACE_LAYER = (
    "https://gis.ecan.govt.nz/arcgis/rest/services/Public/"
    "WaterQualityandMonitoring/MapServer/0"
)
HILLTOP_ENDPOINT = "http://wateruse.ecan.govt.nz/wqlawa.hts"
ADAPTER_VERSION = "ecan-hilltop-v1"
CANDIDATE_ALIASES = ("ashburton", "hakatere")


class AcquisitionError(RuntimeError):
    """Raised when an upstream response cannot support a complete profile."""


@dataclass(frozen=True)
class MeasurementMetadata:
    site_id: str
    measurement_name: str
    units: str | None
    data_type: str | None
    interpolation: str | None
    from_time: str | None
    to_time: str | None
    num_items: int | None
    sensor_group: str | None


@dataclass(frozen=True)
class ProvisionalSite:
    site_id: str
    station_name: str | None
    source_station_id: str | None
    latitude: float | None
    longitude: float | None
    join_distance_degrees: float | None
    membership_basis: str


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def fetch_bytes(url: str, *, timeout: int = 60, retries: int = 3) -> bytes:
    """Fetch a public response with bounded retries and a useful error."""

    request = urllib.request.Request(
        url,
        headers={"User-Agent": f"catchment-health-dashboard/{ADAPTER_VERSION}"},
    )
    last_error: Exception | None = None
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(request, timeout=timeout) as response:
                body = response.read()
                if not body:
                    raise AcquisitionError(f"empty response from {url}")
                return body
        except Exception as error:  # urllib exposes several transport errors.
            last_error = error
            if attempt + 1 < retries:
                time.sleep(0.5 * (2**attempt))
    raise AcquisitionError(f"failed after {retries} attempts: {url}: {last_error}")


@dataclass(frozen=True)
class SourceResponse:
    """Lineage metadata for one successfully retrieved source response."""

    endpoint: str
    retrieved_at: str
    byte_count: int
    sha256: str


class RecordingFetcher:
    """Fetch public responses while recording content lineage metadata."""

    def __init__(self, fetcher: Callable[..., bytes] = fetch_bytes):
        self._fetcher = fetcher
        self.responses: list[SourceResponse] = []

    def __call__(self, url: str, *, timeout: int = 60) -> bytes:
        body = self._fetcher(url, timeout=timeout)
        self.responses.append(
            SourceResponse(
                endpoint=url,
                retrieved_at=utc_now(),
                byte_count=len(body),
                sha256=hashlib.sha256(body).hexdigest(),
            )
        )
        return body


def _local_name(tag: str) -> str:
    return tag.rsplit("}", 1)[-1]


def _child_text(element: ET.Element, name: str) -> str | None:
    for child in element:
        if _local_name(child.tag) == name:
            text = (child.text or "").strip()
            return text or None
    return None


def _child_text_with_presence(element: ET.Element, name: str) -> tuple[str | None, bool]:
    """Return normalized text plus whether the named child was supplied."""

    for child in element:
        if _local_name(child.tag) == name:
            text = (child.text or "").strip()
            return text or None, True
    return None, False


def _parse_xml(xml_bytes: bytes) -> ET.Element:
    try:
        return ET.fromstring(xml_bytes)
    except ET.ParseError as error:
        raise AcquisitionError(f"invalid Hilltop XML: {error}") from error


def parse_measurement_metadata(xml_bytes: bytes, *, site_id: str) -> list[MeasurementMetadata]:
    """Parse a Hilltop MeasurementList response and reject error responses."""

    root = _parse_xml(xml_bytes)
    errors = [element.text.strip() for element in root.iter() if _local_name(element.tag) == "Error" and element.text]
    if errors:
        raise AcquisitionError(f"Hilltop measurement metadata error for {site_id}: {errors[0]}")

    rows: list[MeasurementMetadata] = []
    for data_source in root.iter():
        if _local_name(data_source.tag) != "DataSource":
            continue
        measurements = [child for child in data_source if _local_name(child.tag) == "Measurement"]
        for measurement in measurements:
            name = measurement.attrib.get("Name") or _child_text(measurement, "RequestAs")
            if not name:
                continue
            item_info = next(
                (child for child in data_source if _local_name(child.tag) == "ItemInfo"),
                None,
            )
            units = _child_text(measurement, "Units") or (
                _child_text(item_info, "Units") if item_info is not None else None
            )
            num_items = _child_text(data_source, "NumItems")
            rows.append(
                MeasurementMetadata(
                    site_id=site_id,
                    measurement_name=name,
                    units=units,
                    data_type=_child_text(data_source, "DataType"),
                    interpolation=_child_text(data_source, "Interpolation"),
                    from_time=_child_text(data_source, "From"),
                    to_time=_child_text(data_source, "To"),
                    num_items=int(num_items) if num_items and num_items.isdigit() else None,
                    sensor_group=_child_text(data_source, "SensorGroup"),
                )
            )
    if not rows:
        raise AcquisitionError(f"Hilltop measurement metadata contained no measurements for {site_id}")
    return rows


def parse_site_list(xml_bytes: bytes) -> list[dict[str, str]]:
    """Parse Hilltop site coordinates used for a provisional join."""

    root = _parse_xml(xml_bytes)
    errors = [element.text.strip() for element in root.iter() if _local_name(element.tag) == "Error" and element.text]
    if errors:
        raise AcquisitionError(f"Hilltop site-list error: {errors[0]}")
    rows: list[dict[str, str]] = []
    for element in root.iter():
        if _local_name(element.tag) != "Site" or not element.attrib.get("Name"):
            continue
        row = {"site_id": element.attrib["Name"]}
        for field in ("Latitude", "Longitude"):
            value = _child_text(element, field)
            if value:
                row[field.casefold()] = value
        if "latitude" in row and "longitude" in row:
            rows.append(row)
    if not rows:
        raise AcquisitionError("Hilltop site list contained no coordinate-bearing sites")
    return rows


def _nztm_to_wgs84(easting: float, northing: float) -> tuple[float, float]:
    """Inverse NZTM2000 projection for a bounded coordinate join."""

    a = 6378137.0
    ecc_squared = 0.00669438002290
    ecc_prime_squared = ecc_squared / (1 - ecc_squared)
    k0 = 0.9996
    central_meridian = math.radians(173.0)
    x = easting - 1600000.0
    y = northing - 10000000.0
    mu = (y / k0) / (a * (1 - ecc_squared / 4 - 3 * ecc_squared**2 / 64))
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


def provisional_site_join(
    stations: Iterable[dict[str, Any]],
    sites: Iterable[dict[str, str]],
    *,
    max_distance_degrees: float = 0.002,
) -> list[ProvisionalSite]:
    """Join candidate-named stations and Hilltop sites by nearest coordinate.

    This is deliberately a screening join. It does not establish hydrological
    membership in the Ashburton–Hakatere catchment.
    """

    station_rows = []
    for station in stations:
        name = str(station.get("SITE_NAME") or "")
        if not any(alias in name.casefold() for alias in CANDIDATE_ALIASES):
            continue
        try:
            point = _nztm_to_wgs84(float(station["NZTMX"]), float(station["NZTMY"]))
        except (KeyError, TypeError, ValueError):
            continue
        station_rows.append((point, station))

    joined: list[ProvisionalSite] = []
    for site in sites:
        try:
            site_point = (float(site["latitude"]), float(site["longitude"]))
        except (KeyError, TypeError, ValueError):
            continue
        possible = [
            (math.hypot(site_point[0] - point[0], site_point[1] - point[1]), station)
            for point, station in station_rows
        ]
        if not possible:
            continue
        distance, station = min(possible, key=lambda item: item[0])
        if distance > max_distance_degrees:
            continue
        joined.append(
            ProvisionalSite(
                site_id=site["site_id"],
                station_name=str(station.get("SITE_NAME") or "") or None,
                source_station_id=str(station.get("SITE_ID") or "") or None,
                latitude=site_point[0],
                longitude=site_point[1],
                join_distance_degrees=distance,
                membership_basis="nearest_coordinate_to_name-screened_ECan_station",
            )
        )
    return sorted(joined, key=lambda site: site.site_id)


def _slug(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", value.casefold()).strip("_") or "unknown"


def _parse_value(raw_value: str | None) -> tuple[float | None, str | None, str]:
    """Return numeric value, censoring state, and preserved source text."""

    if raw_value is None or not raw_value.strip():
        return None, "missing_value", "[missing]"
    text = raw_value.strip()
    if text.startswith("<"):
        return None, "left_censored", text
    if text.startswith(">"):
        return None, "right_censored", text
    try:
        value = float(text)
    except ValueError:
        return None, "non_numeric_result", text
    if not math.isfinite(value):
        return None, "non_finite_result", text
    return value, None, text


def parse_observations(
    xml_bytes: bytes,
    *,
    site_id: str,
    measurement_name: str,
    original_unit: str | None,
    source: SourceRef,
) -> tuple[list[ObservationRecord], dict[str, int]]:
    """Parse native Hilltop WQData into source-preserving observations."""

    root = _parse_xml(xml_bytes)
    errors = [element.text.strip() for element in root.iter() if _local_name(element.tag) == "Error" and element.text]
    if errors:
        if all(error.casefold().startswith("no data") for error in errors):
            return [], {"no_observations": 1}
        raise AcquisitionError(f"Hilltop observation error for {site_id}/{measurement_name}: {errors[0]}")
    measurement = next(
        (element for element in root.iter() if _local_name(element.tag) == "Measurement"),
        None,
    )
    if measurement is None:
        # Hilltop returns a valid, data-free <Hilltop> response for some
        # site/parameter/date combinations. Keep that absence explicit rather
        # than treating it as a numeric zero or aborting a multi-site profile.
        return [], {"no_observations": 1}
    data = next((element for element in measurement if _local_name(element.tag) == "Data"), None)
    if data is None:
        raise AcquisitionError(f"Hilltop response has no Data for {site_id}/{measurement_name}")

    records: list[ObservationRecord] = []
    observed_keys: set[str] = set()
    counts: Counter[str] = Counter()
    parameter_id = _slug(measurement_name)
    for index, row in enumerate(child for child in data if _local_name(child.tag) == "E"):
        observed_at = _child_text(row, "T")
        if not observed_at:
            counts["rejected_missing_timestamp"] += 1
            continue
        raw_value = _child_text(row, "Value")
        value, censoring, result_text = _parse_value(raw_value)
        quality_flag, quality_present = _child_text_with_presence(row, "QualityCode")
        quality_representation = "blank_field" if quality_present and quality_flag is None else "nonempty_code" if quality_present else "missing_field"
        counts[f"quality_representation_{quality_representation}"] += 1
        observed_key = f"{site_id}/{measurement_name}/{observed_at}"
        if observed_key in observed_keys:
            counts["duplicates"] += 1
        observed_keys.add(observed_key)
        source_record_id = f"{observed_key}/{index}"
        if value is None:
            counts[censoring or "missing"] += 1
        else:
            counts["numeric"] += 1
        records.append(
            ObservationRecord(
                observation_id=f"{_slug(site_id)}-{parameter_id}-{index:06d}",
                station_id=site_id,
                parameter_id=parameter_id,
                observed_at=observed_at,
                value=value,
                result_text=result_text,
                original_unit=original_unit,
                canonical_unit=None,
                quality_flag=quality_flag,
                censoring=censoring,
                source=SourceRef(
                    provider=source.provider,
                    dataset=source.dataset,
                    endpoint=source.endpoint,
                    retrieved_at=source.retrieved_at,
                    source_record_id=source_record_id,
                    source_version=source.source_version,
                    license=source.license,
                ),
                quality_representation=quality_representation,
            )
        )
    if not records and not counts["rejected_missing_timestamp"]:
        raise AcquisitionError(f"Hilltop response contained no observation rows for {site_id}/{measurement_name}")
    return records, dict(counts)


def hilltop_url(*, request: str, site: str, measurement: str | None = None, from_date: str | None = None, to_date: str | None = None, quality_codes: bool = True) -> str:
    """Build Hilltop URLs with percent-encoded spaces (not ``+``)."""

    params: list[tuple[str, str]] = [("Service", "Hilltop"), ("Request", request), ("Site", site)]
    if measurement is not None:
        params.append(("Measurement", measurement))
    if from_date is not None:
        params.append(("From", from_date))
    if to_date is not None:
        params.append(("To", to_date))
    if quality_codes:
        params.append(("Quality", "Yes"))
    query = "&".join(f"{urllib.parse.quote(key)}={urllib.parse.quote(value)}" for key, value in params)
    return f"{HILLTOP_ENDPOINT}?{query}"


def arcgis_candidate_url(*, count_only: bool = False) -> str:
    where = "UPPER(SITE_NAME) LIKE '%ASHBURTON%' OR UPPER(SITE_NAME) LIKE '%HAKATERE%'"
    params = {"where": where, "f": "json"}
    if count_only:
        params["returnCountOnly"] = "true"
    else:
        params.update(
            {
                "outFields": "SITE_ID,SITE_NAME,SOURCE,SITE_TYPE,NZTMX,NZTMY,ALTITUDE,Link",
                "returnGeometry": "false",
            }
        )
    return f"{SURFACE_LAYER}/query?{urllib.parse.urlencode(params)}"


def parse_arcgis_candidates(payload: bytes) -> list[dict[str, Any]]:
    try:
        parsed = json.loads(payload.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as error:
        raise AcquisitionError(f"invalid ArcGIS candidate response: {error}") from error
    if parsed.get("error"):
        raise AcquisitionError(f"ArcGIS candidate response error: {parsed['error']}")
    features = parsed.get("features")
    if not isinstance(features, list):
        raise AcquisitionError("ArcGIS candidate response has no features list")
    rows = [feature.get("attributes", {}) for feature in features if isinstance(feature, dict) and isinstance(feature.get("attributes"), dict)]
    if not rows:
        raise AcquisitionError("ArcGIS candidate response contained no station rows")
    if parsed.get("exceededTransferLimit"):
        raise AcquisitionError("ArcGIS candidate response is incomplete due to transfer limit")
    return rows


def parse_arcgis_count(payload: bytes) -> int:
    try:
        parsed = json.loads(payload.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as error:
        raise AcquisitionError(f"invalid ArcGIS count response: {error}") from error
    if parsed.get("error"):
        raise AcquisitionError(f"ArcGIS count response error: {parsed['error']}")
    count = parsed.get("count")
    if not isinstance(count, int) or count < 1:
        raise AcquisitionError("ArcGIS count response did not contain a positive count")
    return count


def fetch_arcgis_candidates(fetcher: Callable[..., bytes] = fetch_bytes) -> list[dict[str, Any]]:
    """Fetch the candidate query and verify its reported count."""

    expected = parse_arcgis_count(fetcher(arcgis_candidate_url(count_only=True), timeout=30))
    rows = parse_arcgis_candidates(fetcher(arcgis_candidate_url(), timeout=30))
    if len(rows) != expected:
        raise AcquisitionError(
            f"ArcGIS candidate count mismatch: expected {expected}, retrieved {len(rows)}"
        )
    return rows


def build_source_ref(*, endpoint: str, source_record_id: str, retrieved_at: str) -> SourceRef:
    return SourceRef(
        provider="Environment Canterbury",
        dataset="ECan Hilltop water-quality observations",
        endpoint=endpoint,
        retrieved_at=retrieved_at,
        source_record_id=source_record_id,
        source_version=None,
        license="CC BY 4.0; ECan Water Quality Data Terms of Use retrieved 2026-09-14",
    )


def summarize_observations(observations: Iterable[ObservationRecord], parse_counts: Counter[str]) -> dict[str, Any]:
    rows = list(observations)
    quality_flags = Counter(row.quality_flag for row in rows if row.quality_flag is not None)
    quality_representations = Counter(row.quality_representation or ("nonempty_code" if row.quality_flag else "legacy_unspecified") for row in rows)
    by_parameter: dict[str, dict[str, Any]] = {}
    by_site_parameter: dict[tuple[str, str], dict[str, Any]] = {}
    for parameter_id in sorted({row.parameter_id for row in rows}):
        parameter_rows = [row for row in rows if row.parameter_id == parameter_id]
        by_parameter[parameter_id] = {
            "observation_count": len(parameter_rows),
            "site_count": len({row.station_id for row in parameter_rows}),
            "from": min(row.observed_at for row in parameter_rows),
            "to": max(row.observed_at for row in parameter_rows),
            "units": sorted({row.original_unit for row in parameter_rows if row.original_unit}),
            "numeric_count": sum(row.value is not None for row in parameter_rows),
            "censored_or_missing_count": sum(row.value is None for row in parameter_rows),
            "quality_flag_count": sum(row.quality_flag is not None for row in parameter_rows),
            "quality_flag_counts": dict(sorted(Counter(
                row.quality_flag for row in parameter_rows if row.quality_flag is not None
            ).items())),
        }
    for row in rows:
        key = (row.station_id, row.parameter_id)
        profile = by_site_parameter.setdefault(
            key,
            {
                "site_id": row.station_id,
                "parameter_id": row.parameter_id,
                "observation_count": 0,
                "numeric_count": 0,
                "censored_or_missing_count": 0,
                "quality_flag_count": 0,
                "quality_flag_counts": Counter(),
                "units": set(),
                "censoring_counts": Counter(),
            },
        )
        profile["observation_count"] += 1
        if row.value is None:
            profile["censored_or_missing_count"] += 1
            if row.censoring:
                profile["censoring_counts"][row.censoring] += 1
        else:
            profile["numeric_count"] += 1
        if row.quality_flag is not None:
            profile["quality_flag_count"] += 1
            profile["quality_flag_counts"][row.quality_flag] += 1
        if row.original_unit:
            profile["units"].add(row.original_unit)
    site_parameter_profiles = []
    for key in sorted(by_site_parameter):
        profile = by_site_parameter[key]
        profile["units"] = sorted(profile["units"])
        profile["censoring_counts"] = dict(sorted(profile["censoring_counts"].items()))
        profile["quality_flag_counts"] = dict(sorted(profile["quality_flag_counts"].items()))
        site_parameter_profiles.append(profile)
    return {
        "observation_count": len(rows),
        "site_count": len({row.station_id for row in rows}),
        "parameter_count": len(by_parameter),
        "parameters": by_parameter,
        "site_parameter_profiles": site_parameter_profiles,
        "parse_counts": dict(parse_counts),
        "quality_flag_counts": dict(sorted(quality_flags.items())),
        "quality_representation_counts": dict(sorted(quality_representations.items())),
    }


def profile_to_dict(
    *,
    retrieved_at: str,
    sites: list[ProvisionalSite],
    observations: list[ObservationRecord],
    parse_counts: Counter[str],
    requested_parameters: list[str],
    unavailable_parameters: list[str],
    source_endpoints: list[str],
    parameters_without_observations: list[str] | None = None,
    boundary: Any | None = None,
    excluded_sites: list[dict[str, str | None]] | None = None,
    source_manifest: Iterable[SourceResponse] | None = None,
    include_observations: bool = False,
    site_selection_mode: str = "bounded_name_screened_station_join",
) -> dict[str, Any]:
    boundary_metadata = None
    membership_status = "provisional_coordinate_and_name_screening_not_authoritative_polygon"
    if boundary is not None:
        boundary_metadata = {
            "source_endpoint": boundary.source_endpoint,
            "source_layer": boundary.source_endpoint.split("/query?", 1)[0],
            "source_object_id": boundary.source_object_id,
            "catchment_group": boundary.catchment_group,
            "catchment_name": boundary.catchment_name,
            "area_ha": boundary.area_ha,
            "geometry_type": boundary.geometry_type,
            "source_crs": boundary.source_crs,
            "coordinate_crs": boundary.coordinate_crs,
            "modified_date_epoch_ms": boundary.modified_date_epoch_ms,
        }
        membership_status = "authoritative_ecan_major_catchment_polygon"
    return {
        "schema_version": ADAPTER_VERSION,
        "contract_version": CONTRACT_VERSION,
        "retrieved_at": retrieved_at,
        "study_area_id": "ashburton_hakatere",
        "status": "observation_profile_only",
        "site_selection_mode": site_selection_mode,
        "membership_status": membership_status,
        "catchment_boundary": boundary_metadata,
        "excluded_sites": excluded_sites or [],
        "requested_parameters": requested_parameters,
        "unavailable_parameters": unavailable_parameters,
        "parameters_without_observations": parameters_without_observations or [],
        "provisional_sites": [asdict(site) for site in sites],
        "summary": summarize_observations(observations, parse_counts),
        "sample_observations": [asdict(row) for row in observations[:10]],
        "observations": [asdict(row) for row in observations] if include_observations else None,
        "source_endpoints": source_endpoints,
        "source_manifest": [asdict(response) for response in source_manifest or ()],
        "limitations": [
            "Profile uses bounded requested parameters and sites; it is not a complete catchment dataset.",
            "Unit conversion, quality exclusion, duplicate collapse, or censored-value substitution was not applied.",
            "Hilltop timestamps are preserved as supplied; timezone interpretation remains a later source-quality decision.",
            "This profile is source-preserving acquisition input; normalization and analytical eligibility are applied by the analytical build.",
        ],
    }
