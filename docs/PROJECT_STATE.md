# Project State

**As of:** 2026-09-13  
**Authoritative status:** Ashburton–Hakatere selected; repository foundation complete

This file is the factual snapshot of repository capability. It is not a progress diary. Update it whenever implementation, verification, blockers, or the development frontier materially changes.

## Evidence Basis

This state was reconciled against the current checkout, live public-source audit, and foundation quality gates on 2026-09-13. The checkout contains governance documentation, feasibility tooling, versioned contract definitions, a synthetic fixture path, and a frontend shell. It still contains no production observation dataset, analytical build, or deployment.

Accordingly, statements about the intended product are recorded as planned rather than implemented.

## Current Verified State

- The project is defined as a self-directed **Catchment Health Dashboard** and portfolio/consulting showcase.
- The accepted geographic direction is one contained catchment or closely related river system in Canterbury, New Zealand.
- The owner selected Ashburton–Hakatere on 2026-09-13 as the study-area direction; authoritative polygon membership remains to be implemented and validated.
- The target experience is a professional environmental analytical dashboard with coordinated map, chart, summary, table, and filter behavior.
- The intended implementation direction is a reproducible Python build pipeline feeding a static or nearly static React/TypeScript application with MapLibre.
- The scope, non-goals, constraints, decision boundaries, prioritized milestones, architecture intent, and quality expectations are documented in `docs/`.
- The agent operating contract is defined, and `docs/plans/active/` and `docs/plans/completed/` exist with `.gitkeep` placeholders.
- A live Priority 0 audit verified complete retrieval for the profiled ECan ArcGIS station/flow layers and ECan Hilltop site/measurement catalogs; results and limitations are documented in `docs/feasibility/SOURCE_AUDIT.md` and `docs/feasibility/audit-report.json`.
- The Priority 1 foundation is implemented in `catchment_dashboard/`, `config/`, `tests/fixtures/`, `tools/validate_fixture.py`, and `web/`; contract details are documented in `docs/CONTRACTS.md` and the completed plan.

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
- Quality gates pass: nine Python `unittest` tests, fixture validation, Python compilation, frontend strict typecheck, and frontend production build on 2026-09-13.

## Not Implemented or Not Evidenced

- Final parameter set or primary temporal window.
- Final licensing approval, rate-limit agreement, and redistribution decision. Public endpoints, schemas, station counts, catalog coverage, and inventory-level flow availability are now partially verified; see the audit limitations.
- Polygon-based catchment membership and observation-level completeness profile.
- Final four-to-six water-quality parameters or primary temporal window.
- Data acquisition, cache, normalization, quality-control, aggregation, trend, or asset-build code.
- Adopted handling of censored values, quality flags, duplicates, units, or time zones.
- Adopted analytical aggregation, comparison, trend, direction-label, or threshold methodology.
- Prepared monitoring, spatial, summary, trend, flow, or manifest assets.
- Production React/TypeScript application behavior, runtime MapLibre map, coordinated state, table/export beyond the fixture chart, and real data assets.
- Frontend component tests, Python formatter/linter/static checks, CI, and observation-level source fixtures.
- Visual design implementation, responsive validation, accessibility validation, or performance measurements.
- Deployment configuration, hosting selection, deployed application, monitoring, or live verification.
- Public portfolio repository, screenshots, or case-study material.

## Partially Implemented

The foundation preview is implemented, but it is not a production dashboard: the visible observations are synthetic, controls are intentionally disabled, and the map does not load remote tiles or verified catchment geometry.

## Known Limitations and Risks

- Ashburton–Hakatere is selected as the working catchment direction; exact polygon membership and suitability at observation level remain to be validated.
- Environment Canterbury provides verified public station/flow inventory and legacy Hilltop catalog access for the audit, but the production observation route, licensing, and redistribution terms remain unresolved.
- Source records may contain irregular sampling, inconsistent analyte names or units, quality flags, censored values, duplicates, schema changes, and incomplete coverage.
- Inventory-level flow matching is promising; a selected catchment still needs a defensible gauge-to-monitoring relationship.
- Static delivery is preferred but unproven against the eventual record count and payload sizes.
- Trend and comparison methods cannot be finalized responsibly until sampling density and completeness are profiled.
- Regulatory thresholds and directional terms such as “improving” or “declining” may be inapplicable or parameter-specific.
- No project formatter/linter, Python static/type checker, CI workflow, production data build, or UI automation exists yet. Foundation test, fixture-validation, compilation, typecheck, and build commands are documented and verified.

## Current Test and Validation State

- **Automated tests:** nine focused `unittest` tests pass with `python3 -m unittest discover -s tests -v`.
- **Linting/formatting:** no configuration or successful project run evidenced.
- **Python static/type checks:** no Python project or configuration evidenced.
- **Frontend type check/build:** `cd web && npm run typecheck` and `npm run build` pass; no runtime map or production asset flow is evidenced.
- **Data validation:** source inventory/catalog validation is evidenced by the live audit; full observation validation is not yet implemented.
- **Scientific validation:** no methodology selected or validated.
- **Visual/accessibility/responsive validation:** no UI exists to validate.
- **Deployment verification:** no deployment evidenced.
- **Repository baseline:** file inventory, required-document checks, audit tests, live audit, contract validation, Python compilation, frontend typecheck, and frontend build completed; formatter/linter, CI, production-data, visual, accessibility, and deployment gates remain unavailable or not yet applicable.
- **Live audit:** `python3 tools/feasibility_audit.py --output docs/feasibility/audit-report.json` completed on 2026-09-13 and retrieved 6,266/6,266 surface features, 185/185 flow features, 552 Hilltop sites, and 16,425 Hilltop measurement entries; 45 coordinate-linked candidate sites were probed for units and sampling metadata.
- **Git state:** valid repository on `main`; the latest completed commit is `Build repository contract foundation`; the foundation milestone is committed.

## Current Deployment State

No hosting provider, deployment configuration, production URL, or successful deployment has been evidenced.

## Major Blockers and Decision Boundaries

The owner has selected Ashburton–Hakatere as the working catchment direction. Full polygon and observation acquisition are the next technical validation steps; final parameters and analytical semantics remain owner decisions.

Implementation beyond feasibility is gated by:

1. Polygon and observation evidence for the selected Ashburton–Hakatere scope.
2. Owner selection of the core parameter direction after observation profiling.
3. Owner review of consequential analytical methodology, including trend interpretation and any threshold/status semantics.
4. Owner review of the major dashboard composition once the data's actual strengths and limitations are known.

Credentials or private access should not be assumed; sources must remain public/open unless the owner explicitly changes scope.

## Logical Current Development Frontier

Priority 0 is complete as a feasibility screen and Priority 1 is complete as a tested foundation. The next frontier is **Priority 2: Acquisition, Normalization, and Data Quality**. Polygon membership, observation-level source checks, final parameter selection, quality/unit semantics, and analytical methods remain future work and are not silently selected by the foundation.
