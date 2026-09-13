# Project State

**As of:** 2026-09-13
**Authoritative status:** Ashburton–Hakatere quality-semantics viability review, deterministic analytical asset regeneration, and local React contract integration verified; production asset loading, source-term release, and complete observation coverage remain open

This file is the factual snapshot of repository capability. It is not a progress diary. Update it whenever implementation, verification, blockers, or the development frontier materially changes.

## Evidence Basis

This state was reconciled against the current checkout, live public-source audit, refreshed ECan/Hilltop acquisition and geometry checks, the approved 2007–2024 local analytical build, the quality-semantics viability report, and repository quality gates on 2026-09-13. Generated source profiles and analytical assets remain ignored local outputs; no raw or derived production dataset is committed or deployed.

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
- Each successful bounded acquisition response now has a SHA-256/byte-count source manifest entry; raw payload caching remains intentionally unimplemented pending licensing and freshness decisions.
- The owner-approved analytical scope is configured: six core parameters, Total Phosphorus and Water Temperature as secondary, pH excluded, 2007–2024 history, 2015–2024 primary window, and 2020–2024 recent window.
- `NormalizedObservationRecord` contract version `1.0.0` and `ashburton-analytical-v2-quality-semantics` builders preserve original values/units/result text/timestamps/quality-field representation/censoring/provenance while adding explicit unit, quality, value, and duplicate dispositions.
- The approved eight-parameter long-window run retrieved 10,426 observations at 15 data-producing sites from all 19 coordinate-bearing Hilltop sites inside the verified polygon. Local assets contain 324 coverage records, 1,830 summaries, 324 trend records, and a manifest with checksums; generated outputs are ignored.

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
- A Vite/React/TypeScript frontend now has typed analytical asset contracts, fixture-backed parameter/window/station controls, explicit summary/trend indeterminate states, and an accessible inline-SVG/table series view. Production observation assets remain outside the bundle. `web/package-lock.json` is checked in.
- Quality gates pass: thirty-three Python `unittest` tests, fixture validation, Python compilation, frontend strict typecheck, frontend production build, all-site source acquisition, site-membership audit, analytical asset generation, viability audit, source-manifest integrity, and deterministic asset rebuild checks on 2026-09-13.
- A bounded live Hilltop profile verified 12 real observations for `SQ20104`/Dissolved Reactive Phosphorus; no production dataset is committed.
- The normal bounded three-parameter profile joined 10 in-bound sites and retrieved 243 observations; 9 sites had data, 194 observations were numeric, and 49 were left-censored. Two Canterbury Bight marine name-screened records were excluded by the polygon.
- The earlier neutral nine-parameter candidate profiles retrieved 644 observations for 2024 and 8,644 observations for 2007–2024; these were the evidence used for the owner-approved eight-parameter scope. pH covered only 5 sites, ended in 2013, and had no reported unit.
- The selected long-window run contained 9,478 numeric, 933 left-censored, and 15 right-censored results. Raw quality representations were 9,434 `missing_field` and 992 `nonempty_code`; nonempty values were 774 `600`, 72 `500`, and 146 `400`, with no blank elements or quality parser failures.
- The strict production policy now distinguishes raw quality representation from normalized disposition: 9,434 `missing_quality_field`, 146 excluded poor, 72 retained fair, and 774 retained good. It yields 846 primary-eligible observations, 208 usable summaries, and all 324 trends indeterminate.
- The diagnostic `unflagged_usable` policy yields 10,280 eligible observations, 1,296 usable summaries, 66 primary structurally eligible trend series, and 17 determinate primary trends. It is not adopted because source documentation does not establish omitted quality as unqualified.
- Strict trend indeterminacy is fully categorized: 159 insufficient eligible observations, 84 insufficient temporal span, 81 eligible-censoring suppressions, zero interval-coverage suppressions, and zero duplicate/conflict suppressions. The current method does not silently drop censored values.

## Not Implemented or Not Evidenced

- Dataset-specific confirmation for the legacy Hilltop route, rate-limit agreement, attribution/freshness implementation, and public redistribution decision. ECan's published data-agreement terms are now documented as a local-processing basis, not release approval.
- Complete catchment observation-level coverage and production-scale profile.
- Full raw snapshot/cache and public production asset publication. The current response manifest records identity only; raw response bodies remain local/ephemeral.
- Censor-aware ROS summaries and censor-aware Mann–Kendall/Akritas–Theil–Sen trends. The current documented fallback suppresses affected statistics and emits indeterminate trends.
- Prepared station geometry and flow assets for the production application; the current analytical assets are observation/coverage/summary/trend JSON only.
- Production analytical-asset loading, runtime MapLibre map, full real-data coordinated view, table/export beyond the fixture chart, and public observation assets.
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
- The bounded profile's quality-coded eligible subset is sparse relative to the raw history; trend and censored-summary outputs therefore remain predominantly indeterminate.
- Regulatory thresholds and directional terms such as “improving” or “declining” may be inapplicable or parameter-specific.
- No project formatter/linter, Python static/type checker, CI workflow, production data build, or UI automation exists yet. Foundation test, fixture-validation, compilation, typecheck, and build commands are documented and verified.

## Current Test and Validation State

- **Automated tests:** thirty-three focused `unittest` tests pass with `python3 -m unittest discover -s tests -v`.
- **Linting/formatting:** no configuration or successful project run evidenced.
- **Python static/type checks:** no Python project or configuration evidenced.
- **Frontend type check/build:** `cd web && npm run typecheck` and `npm run build` pass; no runtime map or production asset flow is evidenced.
- **Data validation:** source inventory/catalog validation is evidenced by the live audit; parser and contract validation is evidenced by fixtures plus a bounded live Hilltop profile; complete production observation coverage remains unverified.
- **Scientific validation:** the conservative numeric-only summary and uncensored Theil–Sen/Kendall fallback are unit-tested against an independently calculated pairwise Theil–Sen fixture; the viability report audits all trend reasons. Censor-aware ROS/Mann–Kendall methods remain unimplemented and should not be implied.
- **Visual/accessibility/responsive validation:** no UI exists to validate.
- **Deployment verification:** no deployment evidenced.
- **Repository baseline:** file inventory, required-document checks, audit tests, live audit, contract validation, Python compilation, frontend typecheck, and frontend build completed; formatter/linter, CI, production-data, visual, accessibility, and deployment gates remain unavailable or not yet applicable.
- **Live audit:** `python3 tools/feasibility_audit.py --output docs/feasibility/audit-report.json` completed on 2026-09-13 and retrieved 6,266/6,266 surface features, 185/185 flow features, 552 Hilltop sites, and 16,425 Hilltop measurement entries; 45 coordinate-linked candidate sites were probed for units and sampling metadata.
- **Git state:** valid repository on `main`; the latest completed commit is `Implement Ashburton analytical asset pipeline`; this review has an active uncommitted plan and implementation changes pending final review.

## Current Deployment State

No hosting provider, deployment configuration, production URL, or successful deployment has been evidenced.

## Major Blockers and Decision Boundaries

The owner has selected Ashburton–Hakatere and approved the parameter/time scope. The bounded acquisition, ECan polygon membership, normalization, quality-semantics audit, coverage diagnostics, conservative summaries, trends, local asset manifest, and fixture-backed React contract integration are implemented. Complete catchment observation coverage, exact source-term approval, production asset loading, and public publication remain open.

Implementation beyond feasibility is gated by:

1. Complete observation evidence for the selected Ashburton–Hakatere scope.
2. Retrieval and review of exact source terms for local caching and public redistribution.
3. Complete-catchment observation acquisition and coverage reconciliation beyond the bounded ten-site profile.
4. Owner review of any future consequential interpretation, thresholds, or status semantics before dashboard release.

Credentials or private access should not be assumed; sources must remain public/open unless the owner explicitly changes scope.

## Logical Current Development Frontier

Priority 0 is complete as a feasibility screen, Priority 1 is complete as a tested foundation, the approved bounded Priority 2/3 analytical implementation plus quality-semantics review is complete, and the first local React contract integration is verified. The next frontier is **production-shaped dashboard views and real asset loading**, with complete-catchment coverage, source-term/release-gate resolution, and public observation publication still explicitly separate gates.
