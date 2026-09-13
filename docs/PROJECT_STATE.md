# Project State

**As of:** 2026-09-13  
**Authoritative status:** Feasibility audit complete; owner scope decision pending

This file is the factual snapshot of repository capability. It is not a progress diary. Update it whenever implementation, verification, blockers, or the development frontier materially changes.

## Evidence Basis

This state was reconciled against the current checkout and live public-source audit on 2026-09-13. The checkout now contains governance documentation, a dependency-free feasibility audit tool, focused tests, and a compact audit report. It still contains no application, normalized observation dataset, frontend, or deployment.

Accordingly, statements about the intended product are recorded as planned rather than implemented.

## Current Verified State

- The project is defined as a self-directed **Catchment Health Dashboard** and portfolio/consulting showcase.
- The accepted geographic direction is one contained catchment or closely related river system in Canterbury, New Zealand.
- The target experience is a professional environmental analytical dashboard with coordinated map, chart, summary, table, and filter behavior.
- The intended implementation direction is a reproducible Python build pipeline feeding a static or nearly static React/TypeScript application with MapLibre.
- The scope, non-goals, constraints, decision boundaries, prioritized milestones, architecture intent, and quality expectations are documented in `docs/`.
- The agent operating contract is defined, and `docs/plans/active/` and `docs/plans/completed/` exist with `.gitkeep` placeholders.
- A live Priority 0 audit verified complete retrieval for the profiled ECan ArcGIS station/flow layers and ECan Hilltop site/measurement catalogs; results and limitations are documented in `docs/feasibility/SOURCE_AUDIT.md` and `docs/feasibility/audit-report.json`.

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

## Not Implemented or Not Evidenced

- Repository scaffold for Python or frontend code.
- Selected Canterbury catchment or final parameter set.
- Final licensing approval, rate-limit agreement, and redistribution decision. Public endpoints, schemas, station counts, catalog coverage, and inventory-level flow availability are now partially verified; see the audit limitations.
- Polygon-based catchment membership and observation-level completeness profile.
- Final four-to-six water-quality parameters or primary temporal window.
- Data acquisition, cache, normalization, quality-control, aggregation, trend, or asset-build code.
- Adopted handling of censored values, quality flags, duplicates, units, or time zones.
- Adopted analytical aggregation, comparison, trend, direction-label, or threshold methodology.
- Prepared monitoring, spatial, summary, trend, flow, or manifest assets.
- React/TypeScript application, MapLibre map, charting integration, state coordination, table, or export.
- Frontend tests/build, Python packaging/static checks, CI, dependency lock, and observation-level fixtures.
- Visual design implementation, responsive validation, accessibility validation, or performance measurements.
- Deployment configuration, hosting selection, deployed application, monitoring, or live verification.
- Public portfolio repository, screenshots, or case-study material.

## Partially Implemented

No product capability is partially implemented based on available evidence. Project definition and governance are complete enough to begin feasibility work, but they are not application implementation.

## Known Limitations and Risks

- The exact catchment is unresolved; its suitability depends on monitoring-site density, parameter overlap, history, flow context, geography, and licensing.
- Environment Canterbury provides verified public station/flow inventory and legacy Hilltop catalog access for the audit, but the production observation route, licensing, and redistribution terms remain unresolved.
- Source records may contain irregular sampling, inconsistent analyte names or units, quality flags, censored values, duplicates, schema changes, and incomplete coverage.
- Inventory-level flow matching is promising; a selected catchment still needs a defensible gauge-to-monitoring relationship.
- Static delivery is preferred but unproven against the eventual record count and payload sizes.
- Trend and comparison methods cannot be finalized responsibly until sampling density and completeness are profiled.
- Regulatory thresholds and directional terms such as “improving” or “declining” may be inapplicable or parameter-specific.
- No canonical project formatter, linter, type checker, frontend build, or pipeline command exists yet. The audit command and focused unittest command are documented and verified.

## Current Test and Validation State

- **Automated tests:** five focused `unittest` tests pass with `python3 -m unittest discover -s tests -v`.
- **Linting/formatting:** no configuration or successful project run evidenced.
- **Python static/type checks:** no Python project or configuration evidenced.
- **Frontend type check/build:** no frontend project or configuration evidenced.
- **Data validation:** source inventory/catalog validation is evidenced by the live audit; full observation validation is not yet implemented.
- **Scientific validation:** no methodology selected or validated.
- **Visual/accessibility/responsive validation:** no UI exists to validate.
- **Deployment verification:** no deployment evidenced.
- **Repository baseline:** file inventory, required-document checks, audit tests, and live audit completed; project lint/type/build/data gates remain unavailable because their toolchains do not exist yet.
- **Live audit:** `python3 tools/feasibility_audit.py --output docs/feasibility/audit-report.json` completed on 2026-09-13 and retrieved 6,266/6,266 surface features, 185/185 flow features, 552 Hilltop sites, and 16,425 Hilltop measurement entries; 45 coordinate-linked candidate sites were probed for units and sampling metadata.
- **Git state:** valid repository on `main`, initial commit `d1c0c83`; current work is uncommitted pending final review.

## Current Deployment State

No hosting provider, deployment configuration, production URL, or successful deployment has been evidenced.

## Major Blockers and Decision Boundaries

The source-feasibility audit does not show a blocker to continuing, but exact catchment and parameter selection remain owner decisions. Full observation acquisition is the next technical validation step after scope selection.

Implementation beyond feasibility is gated by:

1. Evidence about candidate Canterbury catchments and accessible source services.
2. Owner selection of the exact catchment and core parameter set after that evidence is presented.
3. Owner review of consequential analytical methodology, including trend interpretation and any threshold/status semantics.
4. Owner review of the major dashboard composition once the data's actual strengths and limitations are known.

Credentials or private access should not be assumed; sources must remain public/open unless the owner explicitly changes scope.

## Logical Current Development Frontier

Priority 0 is complete as a feasibility screen. The next frontier is the owner decision on the exact catchment and core parameter direction, followed by **Priority 1: Repository and Contract Foundation**. Polygon-based membership, full observation acquisition, quality/censoring semantics, and final analytical methods remain future work and are not silently selected by the audit.
