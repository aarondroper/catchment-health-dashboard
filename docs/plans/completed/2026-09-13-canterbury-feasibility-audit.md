# Completed Plan — Canterbury Source and Catchment Feasibility Audit

## Outcome

Priority 0 feasibility screening is complete. The repository now contains a dependency-free audit command, focused tests, and a live compact report at `docs/feasibility/audit-report.json`, with the interpretation and owner decision brief in `docs/feasibility/SOURCE_AUDIT.md`.

Verified live retrieval on 2026-09-13 completed for:

- ECan surface-water ArcGIS: 6,266 expected and 6,266 retrieved features.
- ECan historical flow-site ArcGIS: 185 expected and 185 retrieved features.
- ECan Hilltop site list: 552 sites.
- ECan Hilltop WFS measurement list: 16,425 site/measurement entries with date bounds.
- Per-site Hilltop metadata: 1,728 entries across 45 coordinate-linked candidate sites, including units where supplied and discrete sampling semantics.

The screen recommends Ashburton–Hakatere as the strongest quantitative candidate, with Waimakariri and Ashley–Rakahuri as smaller alternatives. This is a recommendation only. Exact catchment selection, final four-to-six parameters, observation-level quality rules, trend methodology, thresholds, and status semantics remain owner decisions.

## Implementation

- Added `tools/feasibility_audit.py` with bounded retries, ArcGIS pagination/completeness checks, Hilltop XML parsing, NZTM2000-to-WGS84 coordinate linkage, candidate profiling, provenance, and explicit limitations.
- Added five focused standard-library tests under `tests/test_feasibility_audit.py`.
- Added `.gitignore` rules for caches, environments, raw/cache data, and generated reports.
- Added the source audit report and machine-readable result under `docs/feasibility/`.
- Synchronized `PROJECT_STATE.md`, `BACKLOG.md`, and `ARCHITECTURE.md`.

## Validation evidence

- **Pass:** `python3 -m unittest discover -s tests -v` — 5 tests.
- **Pass:** `python3 tools/feasibility_audit.py --output docs/feasibility/audit-report.json` — live source audit completed.
- **Pass:** required governance files are non-empty.
- **Pass:** `rg --files --hidden -g '!.git/**'` and plan-directory inventory reviewed.
- **Pass:** valid git state confirmed with `git rev-parse`, `git log`, and `git status`.
- **Skipped/unavailable:** formatter, linter, Python type checker, dependency-lock/install check, frontend type/build, UI/accessibility/responsive/performance, deployment, and full observation data-quality gates. No corresponding project configuration, application, or normalized observation dataset exists yet.

## Self-review and limitations

- Candidate membership is a documented name-alias screening proxy after coordinate linkage, not authoritative polygon catchment membership.
- The audit profiles catalogs and metadata, not the full observation value population; duplicates, missingness, censored results, quality flags, numeric ranges, and true sampling frequencies require Priority 2 acquisition work.
- Unit values are preserved as observed metadata and are not normalized by this work.
- Source licensing and redistribution terms are identified but not approved for a final deployment.
- The audit does not imply continuous sampling, environmental improvement/decline, regulatory compliance, or causation.

## Next step

Owner selects the exact catchment and core parameter direction from the decision brief. After that decision, begin Priority 1 repository/contract foundation and then perform polygon-based membership plus observation-level acquisition and quality profiling.
