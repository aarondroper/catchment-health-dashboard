# Priority 2 acquisition boundary

`catchment_dashboard/ecan_hilltop.py` and `tools/acquire_observations.py` provide a dependency-light, bounded ECan acquisition/profile path. The adapter currently supports:

- candidate station retrieval from the ECan ArcGIS surface-water layer with a reported-count check;
- Hilltop site-list and per-site measurement metadata parsing;
- Hilltop `GetData` observation parsing with source timestamps, original units, numeric values, censored result text, quality codes, and explicit missing/non-numeric states;
- deterministic profile summaries by parameter and site/parameter, including observation counts, numeric/null counts, units, censoring categories, and quality-code presence;
- a provisional nearest-coordinate join to name-screened ECan stations followed
  by point-in-polygon membership against ECan's major-catchment boundary;
- compact ignored output under `reports/generated/`.

Run from the repository root:

```text
python3 tools/acquire_observations.py
```

The default is deliberately bounded to three in-bound provisional site joins
and the three profile parameters in `config/study_area.json`, for the
technical window `2024-01-01` through `2024-12-31`. These are profiling
settings, not the final parameter set or primary product window.

When ArcGIS is unavailable but a known Hilltop site needs a source-only probe, use the explicit-site mode:

```text
python3 tools/acquire_observations.py \
  --site-id SQ20104 \
  --max-sites 1 \
  --parameter "Dissolved Reactive Phosphorus"
```

Explicit-site mode labels membership as `explicit_site_id_not_spatially_validated`; it must not be used to claim catchment membership.

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
site membership filter are live-verified for this bounded run. This validates
the spatial inclusion rule for the profiled sites; it does not establish
complete historical observation coverage or select the final parameters.

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
right-censored results, and two data-free site/parameter responses. This is
coverage evidence for owner review, not a recommendation to include all nine
parameters or to treat 2007–2024 as the final product window.
