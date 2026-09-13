# Priority 2 acquisition boundary

`catchment_dashboard/ecan_hilltop.py` and `tools/acquire_observations.py` provide a dependency-light, bounded ECan acquisition/profile path. The adapter currently supports:

- candidate station retrieval from the ECan ArcGIS surface-water layer with a reported-count check;
- Hilltop site-list and per-site measurement metadata parsing;
- Hilltop `GetData` observation parsing with source timestamps, original units, numeric values, censored result text, quality codes, distinct missing/blank/nonempty quality-field representations, and explicit missing/non-numeric states;
- deterministic profile summaries by parameter and site/parameter, including observation counts, numeric/null counts, units, censoring categories, and quality-code presence;
- a response manifest containing the exact successful request endpoints,
  retrieval timestamps, byte counts, and SHA-256 digests;
- an optional full source-preserving observation materialization for the local
  analytical build (`--include-observations`); and
- a provisional nearest-coordinate join to name-screened ECan stations followed
  by point-in-polygon membership against ECan's major-catchment boundary;
- compact ignored output under `reports/generated/`.

Run from the repository root:

```text
python3 tools/acquire_observations.py
```

The default remains deliberately bounded to three in-bound provisional site
joins. For the approved analytical build, pass `--max-sites 19`,
`--all-in-bound-sites`, the eight
configured core/secondary source parameters, `--from-date 2007-01-01`,
`--to-date 2024-12-31`, and `--include-observations`. The full profile is an
ignored local input to `tools/build_analytical_assets.py`; it is not a
redistributable raw snapshot.

When ArcGIS is unavailable but a known Hilltop site needs a source-only probe, use the explicit-site mode:

```text
python3 tools/acquire_observations.py \
  --site-id SQ20104 \
  --max-sites 1 \
  --parameter "Dissolved Reactive Phosphorus"
```

Explicit-site mode labels membership as `explicit_site_id_not_spatially_validated`; it must not be used to claim catchment membership.

To audit full coordinate membership before observation retrieval, run:

```text
python3 tools/audit_catchment_sites.py
```

The 2026-09-13 audit found 550 coordinate-bearing Hilltop sites, 19 inside
the Ashburton polygon, and no measurement-catalog retrieval errors. Seventeen
of those 19 sites exposed at least one selected water-quality parameter in
metadata; two exposed biological metrics only. The all-site acquisition mode
uses these polygon members directly and records the selection mode in its
profile.

## Source-response manifest

Each successful request in a profile is recorded in `source_manifest`,
including the ArcGIS count and feature queries, Hilltop site list, boundary,
measurement metadata, and observation responses. `source_endpoints` retains
the same request list for compatibility. The manifest records response
identity and size only; raw response bodies are not written or committed, and
no stale-cache reuse policy is implied while redistribution terms remain under
review.

## Verified spatial boundary

The live profile now retrieves ECan's public [Major Catchment Boundaries
layer](https://gis.ecan.govt.nz/arcgis/rest/services/Public/Hydrology/MapServer/0)
with `CatchmentGroup=688`. The response contains one polygon feature named
`Ashburton River`, source spatial reference EPSG:2193, output coordinates in
EPSG:4326, source object ID `267`, and reported area 167,845.9283 ha. The
project display name remains Ashburton–Hakatere because Hakatere is the Māori
name used for the Ashburton River in the project scope; the layer is treated
as a hydrological boundary, not as a regulatory or water-zone boundary.

The adapter fails on an empty, malformed, multi-feature, transfer-limited, or
wrong-group boundary response. Site coordinates on the boundary are included.
The raw geometry is fetched at build/profile time and is not committed.

## Live profile evidence

On 2026-09-13, the normal bounded command completed the ArcGIS count-checked station query, Hilltop site-list join, authoritative boundary query, metadata requests, and observation requests for 10 in-bound linked sites. Nine sites exposed at least one of the three bounded profile parameters, yielding 243 observations in the technical window `2024-01-01` through `2024-12-31`: 194 numeric and 49 left-censored results. The parameter summaries were:

| Profile parameter | Sites | Observations | Numeric | Left-censored | Units |
| --- | ---: | ---: | ---: | ---: | --- |
| Dissolved Reactive Phosphorus | 9 | 81 | 47 | 34 | `mg/L` |
| Total Nitrogen | 9 | 81 | 80 | 1 | `g/m3` |
| Nitrate-N Nitrite-N | 9 | 81 | 67 | 14 | `g/m3` |

Sixty-nine observations carried a quality code. The two current marine name-screened joins (`SQ35193` and `SQ35200`, Canterbury Bight) were excluded by the authoritative polygon. The generated JSON is ignored because source redistribution terms remain under review.

The ArcGIS candidate query, Hilltop coordinate join, boundary retrieval, and
site membership filter are live-verified for this bounded diagnostic run. The
separate all-site audit and acquisition below establish the current polygon
membership and selected-parameter retrieval evidence; they still do not prove
that the public source contains every possible monitoring record for the
catchment.

A separate neutral candidate run requested the nine parameters listed in
`config/study_area.json` for the same 10 in-bound sites and 2024 window. Eight
parameters returned observations at 9 sites; pH had metadata matches but no
observations in this window. This is coverage evidence, not a parameter
selection:

| Candidate parameter | Sites | Observations | Numeric | Censored/missing | Units |
| --- | ---: | ---: | ---: | ---: | --- |
| E. coli | 9 | 81 | 77 | 4 | `MPN/100mL` |
| Nitrate-N Nitrite-N | 9 | 81 | 67 | 14 | `g/m3` |
| Dissolved Reactive Phosphorus | 9 | 81 | 47 | 34 | `mg/L` |
| Total Nitrogen | 9 | 81 | 80 | 1 | `g/m3` |
| Total Phosphorus | 9 | 81 | 63 | 18 | `g/m3` |
| Turbidity | 9 | 81 | 81 | 0 | `NTU` |
| Dissolved Oxygen | 9 | 77 | 77 | 0 | `mg/L` |
| Water Temperature (Field) | 9 | 81 | 81 | 0 | `C` |

The run retrieved 644 observations: 573 numeric, 71 left-censored, and 7
data-free site/parameter responses. The requested pH parameter is recorded in
the generated profile's `parameters_without_observations` field. No unit
conversion, quality exclusion, duplicate collapse, censored-value
substitution, temporal aggregation, trend estimate, threshold, or
health/status interpretation is applied.

## Longer-window coverage evidence

On 2026-09-13, the same nine-parameter request was run for `2007-01-01`
through `2024-12-31` against the 10 in-bound site joins. It retrieved 8,644
observations across all nine requested parameters. Eight parameters returned
records at 9 sites; pH returned 99 numeric records at 5 sites, ending in 2013,
and had no reported unit. The result is still bounded to the selected site
probe and is not a complete catchment history:

| Candidate parameter | Sites | Observations | Numeric | Censored/missing | Quality-coded | Units | Observed span |
| --- | ---: | ---: | ---: | ---: | ---: | --- | --- |
| E. coli | 9 | 1,070 | 1,011 | 59 | 111 | `MPN/100mL` | 2007–2024 |
| Nitrate-N Nitrite-N | 9 | 1,070 | 979 | 91 | 111 | `g/m3` | 2007–2024 |
| Dissolved Reactive Phosphorus | 9 | 1,070 | 719 | 351 | 111 | `mg/L` | 2007–2024 |
| Total Nitrogen | 9 | 1,070 | 1,032 | 38 | 111 | `g/m3` | 2007–2024 |
| Total Phosphorus | 9 | 1,070 | 792 | 278 | 111 | `g/m3` | 2007–2024 |
| Turbidity | 9 | 1,070 | 1,068 | 2 | 49 | `NTU` | 2007–2024 |
| Dissolved Oxygen | 9 | 1,057 | 1,057 | 0 | 107 | `mg/L` | 2007–2024 |
| Water Temperature (Field) | 9 | 1,068 | 1,068 | 0 | 111 | `C` | 2007–2024 |
| pH | 5 | 99 | 99 | 0 | 0 | not reported | 2007–2013 |

The retrieval recorded 7,825 numeric results, 804 left-censored results, 15
right-censored results, and two data-free site/parameter responses. This
neutral run is superseded for the analytical build by the owner-approved
eight-parameter run, which intentionally excludes pH.

## Approved analytical acquisition and asset build

The approved eight-parameter `2007-01-01` through `2024-12-31` run was
refreshed on 2026-09-13 against all 19 coordinate-bearing sites inside the
verified polygon. Fifteen sites returned data, yielding 10,426 source
observations across the six core and two secondary parameters. The source
summary contained 9,478 numeric, 933 left-censored, and 15 right-censored
results. Quality-code counts were 774 code `600`, 72 code `500`, and 146 code
`400`; the parser also recorded 9,434 rows with a missing `<QualityCode>` child
and no blank quality elements. The code `400` rows are retained and excluded
from primary analytical eligibility under the documented compromised-quality
rule. Missing quality is kept as `missing_field` and remains unresolved under
the strict production policy; it is not treated as good.

`python3 tools/build_analytical_assets.py` generated ignored local assets with:

- 10,426 normalized observation rows;
- 324 station/parameter/window coverage records;
- 1,830 annual/window summary records;
- 324 trend records;
- 846 primary-eligible rows after documented quality, unit, value, and
  duplicate rules.

All 324 generated trend rows are currently `indeterminate`: 81 are suppressed
by the zero-tolerance eligible-censoring rule, 159 do not meet the eligible-
observation minimum, and 84 do not span three eligible calendar years. No
duplicate/conflict or sampling-interval suppression occurred. The separate
viability report compares a diagnostic policy that treats missing/blank quality
as `unflagged_usable`; it produces 10,280 eligible observations and 17
determinate primary trends, but that policy is not adopted because omitted
quality semantics are not documented for this ECan response.

The generated manifest and coverage asset are the evidence source for these
counts. The source profile,
raw responses, and generated assets remain ignored pending dataset-specific
source-terms confirmation and release review; the published ECan data
agreement findings and attribution/freshness requirements are in
`docs/METHODOLOGY.md`.
