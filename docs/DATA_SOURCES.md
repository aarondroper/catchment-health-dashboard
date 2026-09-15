# Data sources and coverage

This document records the current source inventory and the boundary of the
claims made by the dashboard. Counts are dated evidence and may change when
ECan inventories or publication history change.

## Study area and source roles

The display scope is Ashburton–Hakatere, represented by ECan's `Ashburton
River` major-catchment feature (`CatchmentGroup=688`). The verified boundary is
a hydrological source polygon, not a regulatory zone or a claim about all
environmental conditions in the catchment.

| Source | Role | Current basis |
| --- | --- | --- |
| ECan Water Quality and Monitoring ArcGIS station layer | Surface-water station inventory and source metadata | CC BY 3.0 NZ item metadata |
| ECan Hilltop `wqlawa.hts` | Coordinate-bearing site catalogue and published water-quality observations | Dataset-specific ECan Water Quality Data Terms of Use, CC BY 4.0 |
| ECan Major Catchment Boundaries ArcGIS layer | Ashburton boundary geometry | CC BY 3.0 NZ item metadata; service also identifies LINZ and ECan |
| Natural Earth-derived local locator | Small New Zealand context inset | Natural Earth public-domain terms |
| OpenFreeMap Positron | Optional browser-time context basemap | OpenFreeMap/OpenMapTiles/OpenStreetMap attribution and terms |

The application preserves ECan attribution and does not use ECan branding or
imply endorsement. Exact terms evidence and hashes are in
[`release/ecan-source-licence-evidence.json`](release/ecan-source-licence-evidence.json)
and the preserved Terms of Use PDF.

## Reconciled monitoring scope

The following audit was verified on 2026-09-14 against the identified source
inventories and the 2007–2025 analytical profile:

| Inventory check | Result |
| --- | ---: |
| Official surface-water features inspected | 6,266 / 6,266 |
| Surface features inside or on the boundary | 340 |
| Coordinate-bearing Hilltop sites | 550 |
| Coordinate-bearing Hilltop sites inside or on the boundary | 19 |
| Exact station-ID matches | 19 |
| Unmatched in-bound Hilltop sites | 0 |
| Unmatched in-bound surface features | 321 |
| Selected-parameter data-producing sites | 15 |
| Observation-free or metadata-only in-bound sites | 4 |

Exact stable station IDs are the inclusion key. No nearest-coordinate join is
used for production inclusion. Coordinate comparison is diagnostic only; the
maximum difference among exact matches was approximately `0.0000153` degrees.
Three sites (`SQ00120`, `SQ00126`, `SQ20117`) expose no selected-parameter
measurement metadata, while `SQ32804` has selected metadata but no returned
rows in the requested profile. All 19 reconciled sites remain available in the
map and audit scope.

ArcGIS pagination is checked against the reported feature count with pages of
up to 1,000 features, source CRS handling, and transfer-limit indicators. The
boundary includes points on its edge. Hilltop completeness means all
coordinate-bearing `SiteList` rows returned by the service at retrieval time;
it cannot prove an unlisted or non-coordinate site exists. The 321 unmatched
surface features are retained as a source-inventory limitation rather than
joined by name or proximity.

## Observation route and history

The build uses the public Hilltop endpoint
`http://wateruse.ecan.govt.nz/wqlawa.hts` with `SiteList`,
`MeasurementList`, and bounded `GetData` requests. Successful requests are
recorded in the source manifest with endpoint identity, retrieval time,
response metadata, and checksums; raw response bodies are local/ephemeral and
not tracked.

The retained observation history is 2007–2025. The primary analytical window
is 2016–2025 and the recent window is 2020–2025. The latest retained source
observation in the current profile is dated 2025-12-18. These are sampled
monitoring records, not continuous catchment measurements; ECan publication
can lag sampling for quality review.

## Licensing and freshness

Water Quality Data is reused under ECan's preserved CC BY 4.0 terms with the
required attribution and accompanying terms. Station locations and the major
catchment boundary are separately licensed under CC BY 3.0 NZ. Derived
runtime assets retain source and retrieval provenance and do not change the
terms of the source material. The public-release process requires a current
or removed asset after 120 days and does not permit stale observations to be
presented as current conditions.
