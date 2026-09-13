# Priority 2 acquisition boundary

`catchment_dashboard/ecan_hilltop.py` and `tools/acquire_observations.py` provide a dependency-light, bounded ECan acquisition/profile path. The adapter currently supports:

- candidate station retrieval from the ECan ArcGIS surface-water layer with a reported-count check;
- Hilltop site-list and per-site measurement metadata parsing;
- Hilltop `GetData` observation parsing with source timestamps, original units, numeric values, censored result text, quality codes, and explicit missing/non-numeric states;
- a provisional nearest-coordinate join to name-screened ECan stations;
- compact ignored output under `reports/generated/`.

Run from the repository root:

```text
python3 tools/acquire_observations.py
```

The default is deliberately bounded to three provisional sites and the three profile parameters in `config/study_area.json`, for the technical window `2024-01-01` through `2024-12-31`. These are profiling settings, not the final parameter set or primary product window.

When ArcGIS is unavailable but a known Hilltop site needs a source-only probe, use the explicit-site mode:

```text
python3 tools/acquire_observations.py \
  --site-id SQ20104 \
  --max-sites 1 \
  --parameter "Dissolved Reactive Phosphorus"
```

Explicit-site mode labels membership as `explicit_site_id_not_spatially_validated`; it must not be used to claim catchment membership.

## Live profile evidence

On 2026-09-13, the normal bounded command completed the ArcGIS count-checked station query, Hilltop site-list join, metadata requests, and observation requests for 10 provisional linked sites. Nine sites exposed at least one of the three bounded profile parameters, yielding 195 observations in the technical window `2024-01-01` through `2024-12-31`: 160 numeric and 35 left-censored results. The parameter summaries were:

| Profile parameter | Sites | Observations | Numeric | Left-censored | Units |
| --- | ---: | ---: | ---: | ---: | --- |
| Dissolved Reactive Phosphorus | 9 | 65 | 41 | 24 | `mg/L` |
| Total Nitrogen | 9 | 65 | 64 | 1 | `g/m3` |
| Nitrate-N Nitrite-N | 9 | 65 | 55 | 10 | `g/m3` |

Fifty-three observations carried a quality code. Two of the 10 provisional joins were marine station records whose names mention Ashburton, demonstrating why name/coordinate matching is only a screening proxy. The generated JSON is ignored because source redistribution terms remain under review.

The ArcGIS candidate query and Hilltop coordinate join are now live-verified for this bounded run, but no authoritative polygon membership result is claimed. The two marine false positives and any other inclusion rule require source/geometry evidence and owner review.

No unit conversion, quality exclusion, duplicate collapse, censored-value substitution, temporal aggregation, trend estimate, threshold, or health/status interpretation is applied.
