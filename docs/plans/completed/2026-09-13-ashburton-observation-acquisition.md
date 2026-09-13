# Execution Plan — Ashburton Observation Acquisition and Spatial Validation

## Objective

Advance Priority 2 with a bounded, reproducible source-adapter slice for the owner-selected Ashburton–Hakatere direction. Retrieve representative public Hilltop observations, join sites to the ECan station inventory, preserve source semantics and provenance, and produce a compact profiling report without silently selecting final parameters or analytical methods.

## Scope

- Reuse the verified ECan ArcGIS surface-water inventory and Hilltop catalog endpoints.
- Implement explicit request/response parsing for site metadata, measurement metadata, and representative observation records.
- Use the existing name/coordinate screen only to identify candidate sites; label it as provisional and not authoritative polygon membership.
- Add a configuration-driven candidate parameter shortlist from the feasibility evidence, with status pending owner review.
- Validate pagination/response completeness where the endpoint supports it, schema assumptions, timestamps, units, quality/censoring text, duplicates, and missingness.
- Write compact JSON profiling output and small test fixtures; do not commit raw production downloads or claim a final production asset.

## Boundaries

- Do not adopt the final four-to-six parameters, primary time window, unit conversions, quality exclusions, censored-value substitution, trend method, thresholds, or status semantics.
- Do not treat name aliases or nearest-site joins as authoritative catchment polygon membership.
- Do not use flow data to infer causation; flow remains contextual and out of scope unless a defensible match is evidenced.
- Fail on malformed or incomplete source responses rather than silently reusing partial data.

## Work units

1. Confirm Hilltop observation request semantics and identify Ashburton-linked sites from live catalogs.
2. Add a dependency-light acquisition/normalization module with explicit source adapters and a profile command.
3. Add representative fixtures and tests for XML parsing, numeric/censored/missing results, duplicate detection, source provenance, and incomplete responses.
4. Run the live bounded profile, review units/time coverage and limitations, and update configuration/report documentation.
5. Run quality gates, self-review the diff, archive this plan if the slice is complete, and commit the coherent work.

## Acceptance evidence

- A documented command retrieves the bounded Ashburton profile from public endpoints and emits a versioned compact report.
- Every retained observation preserves station/parameter identity, observed time, original result text/unit, quality/censoring fields, source record identity, endpoint, and retrieval time.
- Tests cover valid numeric, censored, missing, malformed, duplicate, and partial-response cases.
- The profile reports site/parameter counts, time bounds, units, duplicate/missing/censored counts, and any rejected or incomplete records.
- The report explicitly distinguishes provisional coordinate/name screening from authoritative polygon membership and final scientific decisions.
- Raw/large source data is not tracked.

## Planned validation

- `python3 -m unittest discover -s tests -v`
- `python3 tools/validate_fixture.py tests/fixtures/minimal_asset.json`
- `python3 -m py_compile catchment_dashboard/*.py tools/*.py tests/*.py`
- The bounded live profile command against the public endpoints.
- `git diff --check`, artifact/secret scan, and staged diff review.
- Frontend gates are unchanged but will be rerun if shared contract files change.

## Outcome

Bounded slice completed on 2026-09-13. The adapter and CLI now provide count-checked ArcGIS candidate retrieval, Hilltop site and measurement metadata parsing, native Hilltop observation parsing, source-preserving contract validation, and provisional coordinate/name joining. Fixtures and tests cover numeric, left-censored, missing, non-numeric, duplicate, malformed, transfer-limit, and count-mismatch cases.

Verified live evidence:

- The explicit-site probe for `SQ20104`/Dissolved Reactive Phosphorus retrieved 12 observations.
- The normal station/catalog run joined 10 provisional sites and retrieved 195 observations for the three bounded profile parameters in the 2024 technical window; 9 sites had data, 160 observations were numeric, and 35 were left-censored.
- Units were `mg/L` for dissolved reactive phosphorus and `g/m3` for total nitrogen and nitrate-nitrite. Fifty-three rows carried quality codes.
- Two provisional joins were marine stations selected by the name alias screen, so authoritative polygon membership and any source-type inclusion rule remain unresolved.

Validation passed:

- `python3 -m unittest discover -s tests -v` — 16 tests passed.
- `python3 -m py_compile catchment_dashboard/*.py tools/*.py tests/*.py` — passed.
- `python3 tools/acquire_observations.py --max-sites 10 --parameter 'Dissolved Reactive Phosphorus' --parameter 'Total Nitrogen' --parameter 'Nitrate-N Nitrite-N' --from-date 2024-01-01 --to-date 2024-12-31` — passed with the live summary above.
- `git diff --check` and ignored-artifact review — passed.

Not completed by this slice: full raw/source snapshot policy, authoritative catchment polygon, complete observation period, final parameter selection, unit conversion, quality exclusion, censored-value treatment, flow pairing, analytical methods, and production assets. Priority 2 remains active for those work units.
