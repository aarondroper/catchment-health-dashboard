"""Environment Canterbury catchment-boundary retrieval and membership helpers."""

from __future__ import annotations

import json
import math
import urllib.parse
from dataclasses import dataclass, replace
from typing import Any, Iterable

from .ecan_hilltop import AcquisitionError, ProvisionalSite


MAJOR_CATCHMENT_LAYER = (
    "https://gis.ecan.govt.nz/arcgis/rest/services/Public/Hydrology/MapServer/0"
)
ASHBURTON_CATCHMENT_GROUP = "688"
BOUNDARY_SOURCE_CRS = "EPSG:2193"
BOUNDARY_COORDINATE_CRS = "EPSG:4326"


@dataclass(frozen=True)
class CatchmentBoundary:
    """A validated polygon boundary and its source identity."""

    catchment_group: str
    catchment_name: str
    source_object_id: str
    area_ha: float | None
    geometry_type: str
    polygons: tuple[tuple[tuple[tuple[float, float], ...], ...], ...]
    source_endpoint: str
    source_crs: str = BOUNDARY_SOURCE_CRS
    coordinate_crs: str = BOUNDARY_COORDINATE_CRS
    modified_date_epoch_ms: int | None = None

    def contains(self, *, longitude: float, latitude: float) -> bool:
        """Return whether a WGS84 point is inside or on this boundary."""

        if not math.isfinite(longitude) or not math.isfinite(latitude):
            return False
        return any(
            _point_in_polygon(longitude, latitude, rings)
            for rings in self.polygons
        )


def arcgis_catchment_url(
    *,
    catchment_group: str = ASHBURTON_CATCHMENT_GROUP,
) -> str:
    """Build a complete, single-group GeoJSON boundary query."""

    params = {
        "where": f"CatchmentGroup='{catchment_group}'",
        "outFields": "OBJECTID,CatchmentGroup,CatchmentGroupName,AREA_HA,MODIFIEDDATE",
        "returnGeometry": "true",
        "outSR": "4326",
        "f": "geojson",
    }
    return f"{MAJOR_CATCHMENT_LAYER}/query?{urllib.parse.urlencode(params)}"


def _as_coordinate(value: Any) -> tuple[float, float]:
    if not isinstance(value, list) or len(value) != 2:
        raise AcquisitionError("ArcGIS boundary contains an invalid coordinate")
    try:
        coordinate = (float(value[0]), float(value[1]))
    except (TypeError, ValueError) as error:
        raise AcquisitionError("ArcGIS boundary contains a non-numeric coordinate") from error
    if not all(math.isfinite(item) for item in coordinate):
        raise AcquisitionError("ArcGIS boundary contains a non-finite coordinate")
    return coordinate


def _parse_ring(value: Any) -> tuple[tuple[float, float], ...]:
    if not isinstance(value, list) or len(value) < 4:
        raise AcquisitionError("ArcGIS boundary contains a ring with too few coordinates")
    ring = tuple(_as_coordinate(coordinate) for coordinate in value)
    if ring[0] != ring[-1]:
        raise AcquisitionError("ArcGIS boundary contains an unclosed ring")
    return ring


def _parse_polygons(geometry: dict[str, Any]) -> tuple[tuple[tuple[tuple[float, float], ...], ...], ...]:
    geometry_type = geometry.get("type")
    coordinates = geometry.get("coordinates")
    if geometry_type == "Polygon":
        if not isinstance(coordinates, list) or not coordinates:
            raise AcquisitionError("ArcGIS boundary Polygon has no rings")
        return (tuple(_parse_ring(ring) for ring in coordinates),)
    if geometry_type == "MultiPolygon":
        if not isinstance(coordinates, list) or not coordinates:
            raise AcquisitionError("ArcGIS boundary MultiPolygon has no polygons")
        polygons = []
        for polygon in coordinates:
            if not isinstance(polygon, list) or not polygon:
                raise AcquisitionError("ArcGIS boundary MultiPolygon has an empty polygon")
            polygons.append(tuple(_parse_ring(ring) for ring in polygon))
        return tuple(polygons)
    raise AcquisitionError(f"unsupported ArcGIS boundary geometry: {geometry_type!r}")


def parse_catchment_boundary(
    payload: bytes,
    *,
    source_endpoint: str,
    catchment_group: str = ASHBURTON_CATCHMENT_GROUP,
) -> CatchmentBoundary:
    """Parse a complete ArcGIS GeoJSON boundary response."""

    try:
        parsed = json.loads(payload.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as error:
        raise AcquisitionError(f"invalid ArcGIS boundary response: {error}") from error
    if not isinstance(parsed, dict):
        raise AcquisitionError("ArcGIS boundary response is not a JSON object")
    if parsed.get("error"):
        raise AcquisitionError(f"ArcGIS boundary response error: {parsed['error']}")
    if parsed.get("exceededTransferLimit"):
        raise AcquisitionError("ArcGIS boundary response is incomplete due to transfer limit")
    if parsed.get("type") != "FeatureCollection":
        raise AcquisitionError("ArcGIS boundary response is not a GeoJSON FeatureCollection")
    features = parsed.get("features")
    if not isinstance(features, list) or not features:
        raise AcquisitionError("ArcGIS boundary response contains no features")
    if len(features) != 1:
        raise AcquisitionError(
            f"expected one boundary feature for catchment group {catchment_group}, got {len(features)}"
        )
    feature = features[0]
    if not isinstance(feature, dict) or not isinstance(feature.get("geometry"), dict):
        raise AcquisitionError("ArcGIS boundary feature has no geometry")
    properties = feature.get("properties")
    if not isinstance(properties, dict):
        raise AcquisitionError("ArcGIS boundary feature has no properties")
    if str(properties.get("CatchmentGroup") or "") != catchment_group:
        raise AcquisitionError("ArcGIS boundary feature does not match requested catchment group")
    name = str(properties.get("CatchmentGroupName") or "").strip()
    if not name:
        raise AcquisitionError("ArcGIS boundary feature has no catchment name")
    raw_area = properties.get("AREA_HA")
    try:
        area_ha = float(raw_area) if raw_area is not None else None
    except (TypeError, ValueError) as error:
        raise AcquisitionError("ArcGIS boundary area is not numeric") from error
    if area_ha is not None and (not math.isfinite(area_ha) or area_ha <= 0):
        raise AcquisitionError("ArcGIS boundary area is not a positive finite number")
    raw_object_id = properties.get("OBJECTID") or feature.get("id")
    if raw_object_id is None:
        raise AcquisitionError("ArcGIS boundary feature has no source object identifier")
    raw_modified = properties.get("MODIFIEDDATE")
    try:
        modified = int(raw_modified) if raw_modified is not None else None
    except (TypeError, ValueError) as error:
        raise AcquisitionError("ArcGIS boundary modified date is not an integer") from error
    geometry = feature["geometry"]
    return CatchmentBoundary(
        catchment_group=catchment_group,
        catchment_name=name,
        source_object_id=str(raw_object_id),
        area_ha=area_ha,
        geometry_type=str(geometry.get("type")),
        polygons=_parse_polygons(geometry),
        source_endpoint=source_endpoint,
        modified_date_epoch_ms=modified,
    )


def _point_on_segment(
    x: float,
    y: float,
    first: tuple[float, float],
    second: tuple[float, float],
) -> bool:
    x1, y1 = first
    x2, y2 = second
    cross = (x - x1) * (y2 - y1) - (y - y1) * (x2 - x1)
    scale = max(abs(x1), abs(y1), abs(x2), abs(y2), 1.0)
    if abs(cross) > 1e-10 * scale:
        return False
    return (
        min(x1, x2) - 1e-10 <= x <= max(x1, x2) + 1e-10
        and min(y1, y2) - 1e-10 <= y <= max(y1, y2) + 1e-10
    )


def _point_in_ring(
    x: float,
    y: float,
    ring: tuple[tuple[float, float], ...],
) -> tuple[bool, bool]:
    inside = False
    for first, second in zip(ring, ring[1:]):
        if _point_on_segment(x, y, first, second):
            return True, True
        x1, y1 = first
        x2, y2 = second
        if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / (y2 - y1) + x1:
            inside = not inside
    return inside, False


def _point_in_polygon(
    x: float,
    y: float,
    rings: tuple[tuple[tuple[float, float], ...], ...],
) -> bool:
    outer_inside, outer_boundary = _point_in_ring(x, y, rings[0])
    if outer_boundary:
        return True
    if not outer_inside:
        return False
    for hole in rings[1:]:
        hole_inside, hole_boundary = _point_in_ring(x, y, hole)
        if hole_boundary:
            return True
        if hole_inside:
            return False
    return True


def filter_sites_to_boundary(
    sites: Iterable[ProvisionalSite],
    boundary: CatchmentBoundary,
) -> tuple[list[ProvisionalSite], list[dict[str, str | None]]]:
    """Keep sites inside the authoritative boundary and report exclusions."""

    included: list[ProvisionalSite] = []
    excluded: list[dict[str, str | None]] = []
    for site in sites:
        if site.latitude is not None and site.longitude is not None and boundary.contains(
            longitude=site.longitude,
            latitude=site.latitude,
        ):
            included.append(
                replace(
                    site,
                    membership_basis="authoritative_ecan_major_catchment_polygon",
                )
            )
        else:
            excluded.append(
                {
                    "site_id": site.site_id,
                    "station_name": site.station_name,
                    "reason": "site_coordinate_outside_authoritative_ecan_major_catchment_polygon",
                }
            )
    return included, excluded
