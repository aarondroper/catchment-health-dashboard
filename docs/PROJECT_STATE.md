# Project State

**As of:** 2026-09-13  
**Authoritative status:** Ashburton–Hakatere selected; bounded spatially validated acquisition slice complete; Priority 2 normalization remains in progress

This file is the factual snapshot of repository capability. It is not a progress diary. Update it whenever implementation, verification, blockers, or the development frontier materially changes.

## Evidence Basis

This state was reconciled against the current checkout, live public-source audit, bounded ECan/Hilltop acquisition and geometry checks, and repository quality gates on 2026-09-13. The checkout contains governance documentation, feasibility tooling, versioned contract definitions, bounded source adapters, a synthetic fixture path, and a frontend shell. It still contains no production observation dataset, analytical build, or deployment.

Accordingly, statements about the intended product remain planned unless implementation and validation evidence is listed below.

## Current Verified State

- The project is defined as a self-directed **Catchment Health Dashboard** and portfolio/consulting showcase.
- The accepted geographic direction is one contained catchment or closely related river system in Canterbury, New Zealand.
- The owner selected Ashburton–Hakatere on 2026-09-13 as the study-area direction. ECan's `Ashburton River` major-catchment polygon (`CatchmentGroup=688`) is now the verified membership boundary for the bounded acquisition slice; it is not treated as a regulatory or water-zone boundary.
- The target experience is a professional environmental analytical dashboard with coordinated map, chart, summary, table, and filter behavior.
- The intended implementation direction is a reproducible Python build pipeline feeding a static or nearly static React/TypeScript application with MapLibre.
- The scope, non-goals, constraints, decision boundaries, prioritized milestones, architecture intent, and quality expectations are documented in `docs/`.
- The agent operating contract is defined, and `docs/plans/active/` and `docs/plans/completed/` exist with `.gitkeep` placeholders.
- A live Priority 0 audit verified complete retrieval for the profiled ECan ArcGIS station/flow layers and ECan Hilltop site/measurement catalogs; results and limitations are documented in `docs/feasibility/SOURCE_AUDIT.md` and `docs/feasibility/audit-report.json`.
- The Priority 1 foundation is implemented in `catchment_dashboard/`, `config/`, `tests/fixtures/`, `tools/validate_fixture.py`, and `web/`; contract details are documented in `docs/CONTRACTS.md` and the completed plan.
- The Priority 2 acquisition slice is implemented in `catchment_dashboard/ecan_hilltop.py` and `tools/acquire_observations.py`; its source boundary and limitations are documented in `docs/ACQUISITION.md`.
- The spatial membership slice is implemented in `catchment_dashboard/ecan_geometry.py`; it validates a complete ECan GeoJSON boundary response and filters out-of-bound Hilltop sites before observations are retrieved.
- The bounded profile now emits deterministic site/parameter quality summaries; valid Hilltop no-data responses remain explicit rather than being converted to zeros or treated as fatal transport errors.

Verification here means these decisions and requirements are present in the supplied context and governance documents—not that product functionality exists.

## Implemented

- Repository-governance documentation:
  - `AGENTS.md`
  - `docs/PROJECT_BRIEF.md`
  - `docs/ARCHITECTURE.md`
  - `docs/PROJECT_STATE.md`
  - `docs/BACKLOG.md`
  - `docs/DECISIONS.md`
  - `docs/QUALITY_GATES.md`
- Execution-plan directories exist as:
  - `docs/plans/active/`
  - `docs/plans/completed/`
  - Both contain `.gitkeep`; the completed Priority 0 plan is archived in `docs/plans/completed/`.
- Dependency-free audit tooling and focused tests exist at `tools/feasibility_audit.py` and `tests/test_feasibility_audit.py`.
- `.gitignore` separates Python caches, environments, raw/cache data, and generated reports from tracked source.
- Python package metadata and source-independent version `0.1.0` contracts exist for source, station, parameter, observation, aggregate, trend, and asset-manifest records.
- A synthetic fixture validates source provenance, normalized observation fields, censored/null preservation, referential integrity, and manifest counts.
- A Vite/React/TypeScript frontend shell exists with Ashburton–Hakatere copy, disabled pending controls, MapLibre-ready options boundary, and accessible inline-SVG/table chart spike. `web/package-lock.json` is checked in.
- Quality gates pass: twenty-one Python `unittest` tests, fixture validation, Python compilation, frontend strict typecheck, and frontend production build on 2026-09-13.
- A bounded live Hilltop profile verified 12 real observations for `SQ20104`/Dissolved Reactive Phosphorus; no production dataset is committed.
- The normal bounded three-parameter profile joined 10 in-bound sites and retrieved 243 observations; 9 sites had data, 194 observations were numeric, and 49 were left-censored. Two Canterbury Bight marine name-screened records were excluded by the polygon.
- A neutral nine-parameter candidate profile inside the same boundary retrieved 644 observations across 8 parameters at 9 sites; pH had metadata matches but no observations in the 2024 window. This informs, but does not make, the final parameter decision.
- A longer neutral nine-parameter profile for 2007–2024 retrieved 8,644 observations; eight parameters covered 9 sites, while pH covered 5 sites and ended in 2013 without reported units. This informs, but does not select, the final parameter or time window.

## Not Implemented or Not Evidenced

- Final parameter set or primary temporal window.
- Final licensing approval, rate-limit agreement, and redistribution decision. Public endpoints, schemas, station counts, catalog coverage, and inventory-level flow availability are now partially verified; see the audit limitations.
- Complete catchment observation-level coverage and production-scale profile.
- Final four-to-six water-quality parameters or primary temporal window.
- Production-scale data acquisition/cache, full normalization, quality-control reporting, aggregation, trend, or asset-build code.
- Adopted handling of censored values, quality flags, duplicates, units, or time zones.
- Adopted analytical aggregation, comparison, trend, direction-label, or threshold methodology.
- Prepared monitoring, spatial, summary, trend, flow, or manifest assets.
- Production React/TypeScript application behavior, runtime MapLibre map, coordinated state, table/export beyond the fixture chart, and real data assets.
- Frontend component tests, Python formatter/linter/static checks, CI, and observation-level source fixtures.
- Visual design implementation, responsive validation, accessibility validation, or performance measurements.
- Deployment configuration, hosting selection, deployed application, monitoring, or live verification.
- Public portfolio repository, screenshots, or case-study material.

## Partially Implemented

The foundation preview and bounded acquisition profile are implemented, but this is not a production dashboard: the visible web observations are synthetic, controls are intentionally disabled, and the map does not load remote tiles. The profile's site membership is spatially validated against the configured ECan major-catchment polygon, while the site-to-Hilltop coordinate join and observation coverage remain bounded.

## Known Limitations and Risks

- Ashburton–Hakatere is selected as the working catchment direction; the verified ECan major-catchment boundary covers the bounded profile, while complete observation coverage and final suitability remain to be validated.
- Environment Canterbury provides verified public station/flow inventory and legacy Hilltop catalog access for the audit, but the production observation route, licensing, and redistribution terms remain unresolved.
- Source records may contain irregular sampling, inconsistent analyte names or units, quality flags, censored values, duplicates, schema changes, and incomplete coverage.
- Inventory-level flow matching is promising; a selected catchment still needs a defensible gauge-to-monitoring relationship.
- Static delivery is preferred but unproven against the eventual record count and payload sizes.
- Trend and comparison methods cannot be finalized responsibly until sampling density and completeness are profiled.
- Regulatory thresholds and directional terms such as “improving” or “declining” may be inapplicable or parameter-specific.
- No project formatter/linter, Python static/type checker, CI workflow, production data build, or UI automation exists yet. Foundation test, fixture-validation, compilation, typecheck, and build commands are documented and verified.

## Current Test and Validation State

- **Automated tests:** twenty-one focused `unittest` tests pass with `python3 -m unittest discover -s tests -v`.
- **Linting/formatting:** no configuration or successful project run evidenced.
- **Python static/type checks:** no Python project or configuration evidenced.
- **Frontend type check/build:** `cd web && npm run typecheck` and `npm run build` pass; no runtime map or production asset flow is evidenced.
- **Data validation:** source inventory/catalog validation is evidenced by the live audit; parser and contract validation is evidenced by fixtures plus a bounded live Hilltop profile; complete production observation coverage remains unverified.
- **Scientific validation:** no methodology selected or validated.
- **Visual/accessibility/responsive validation:** no UI exists to validate.
- **Deployment verification:** no deployment evidenced.
- **Repository baseline:** file inventory, required-document checks, audit tests, live audit, contract validation, Python compilation, frontend typecheck, and frontend build completed; formatter/linter, CI, production-data, visual, accessibility, and deployment gates remain unavailable or not yet applicable.
- **Live audit:** `python3 tools/feasibility_audit.py --output docs/feasibility/audit-report.json` completed on 2026-09-13 and retrieved 6,266/6,266 surface features, 185/185 flow features, 552 Hilltop sites, and 16,425 Hilltop measurement entries; 45 coordinate-linked candidate sites were probed for units and sampling metadata.
- **Git state:** valid repository on `main`; the latest completed commit is `Build repository contract foundation`; the foundation milestone is committed.

## Current Deployment State

No hosting provider, deployment configuration, production URL, or successful deployment has been evidenced.

## Major Blockers and Decision Boundaries

The owner has selected Ashburton–Hakatere as the working catchment direction. The bounded acquisition and ECan polygon membership slice is complete; Priority 2 observation normalization and quality profiling remain in progress, and final parameters and analytical semantics remain owner decisions.

Implementation beyond feasibility is gated by:

1. Complete observation evidence for the selected Ashburton–Hakatere scope.
2. Owner selection of the core parameter direction after observation profiling.
3. Owner review of consequential analytical methodology, including trend interpretation and any threshold/status semantics.
4. Owner review of the major dashboard composition once the data's actual strengths and limitations are known.

Credentials or private access should not be assumed; sources must remain public/open unless the owner explicitly changes scope.

## Logical Current Development Frontier

Priority 0 is complete as a feasibility screen and Priority 1 is complete as a tested foundation. The current frontier is **Priority 2: Acquisition, Normalization, and Data Quality**, with bounded ECan/Hilltop acquisition and ECan polygon membership verified for the profile. Complete observation acquisition, final parameter selection, quality/unit semantics, and analytical methods remain future work and are not silently selected.
