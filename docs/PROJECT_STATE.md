# Project State

**As of:** 2026-09-13
**Authoritative status:** Ashburton–Hakatere `published_unflagged` analytical policy, deterministic local asset regeneration, browser-verified MapLibre MVP, and filtered export verified; public source-term release, complete observation coverage, and public deployment remain open

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
- `NormalizedObservationRecord` contract version `1.0.0` and `ashburton-analytical-v3-published-unflagged` builders preserve original values/units/result text/timestamps/quality-field representation/censoring/provenance while adding explicit unit, quality, value, and duplicate dispositions. The primary policy includes missing quality fields as `published_unflagged`; strict remains a sensitivity mode.
- The approved eight-parameter long-window run retrieved 10,426 observations at 15 data-producing sites from all 19 coordinate-bearing Hilltop sites inside the verified polygon. Local assets contain 324 coverage records, 1,830 summaries, 324 trend records, and a manifest with checksums; generated outputs are ignored.

Verification here distinguishes documented decisions from executable evidence; the local dashboard capability claims below are backed by the recorded typecheck, build, and browser runs.

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
- A Vite/React/TypeScript frontend now loads the ignored versioned runtime shell and parameter-partitioned observation assets when prepared, with an explicit synthetic-fixture fallback, and coordinates parameter/window/station controls across the MapLibre map, selected-site series/table, summaries, coverage, comparison, filtered CSV export, and quality/provenance views. The local view has a compact owner-facing product shell, coverage-led Total Nitrogen/SQ35874 default, verified ECan polygon geometry, readable linear chart axes and discrete-observation cues, concise expandable row detail, responsive layout, explicit empty/censored/indeterminate states, and browser/unit verification. `web/package-lock.json` is checked in.
- Quality gates pass: thirty-three Python `unittest` tests, fixture validation, Python compilation, frontend strict typecheck, four frontend unit tests, frontend production build, fourteen Playwright/axe browser checks, all-site source acquisition, site-membership audit, analytical asset generation, viability audit, source-manifest integrity, and deterministic asset rebuild checks on 2026-09-13.
- A bounded live Hilltop profile verified 12 real observations for `SQ20104`/Dissolved Reactive Phosphorus; no production dataset is committed.
- The normal bounded three-parameter profile joined 10 in-bound sites and retrieved 243 observations; 9 sites had data, 194 observations were numeric, and 49 were left-censored. Two Canterbury Bight marine name-screened records were excluded by the polygon.
- The earlier neutral nine-parameter candidate profiles retrieved 644 observations for 2024 and 8,644 observations for 2007–2024; these were the evidence used for the owner-approved eight-parameter scope. pH covered only 5 sites, ended in 2013, and had no reported unit.
- The selected long-window run contained 9,478 numeric, 933 left-censored, and 15 right-censored results. Raw quality representations were 9,434 `missing_field` and 992 `nonempty_code`; nonempty values were 774 `600`, 72 `500`, and 146 `400`, with no blank elements or quality parser failures.
- The adopted `published_unflagged` policy distinguishes raw quality representation from normalized disposition: 9,434 `published_unflagged`, 146 excluded poor, 72 retained fair, and 774 retained good. It yields 10,280 primary-eligible observations, 1,296 usable summaries, 66 primary structurally eligible trend series, and 17 determinate primary trends. The strict sensitivity policy yields 846 eligible observations, 208 usable summaries, and no determinate trends.
- The adopted policy changes 154 shared reported medians relative to strict; no shared reported slope comparison exists because strict trends are all indeterminate. It is not an explicit quality-verification claim, and blank-field/unknown-code/poor/conflict exclusions remain visible in provenance and audit counts.
- Strict trend indeterminacy is fully categorized: 159 insufficient eligible observations, 84 insufficient temporal span, 81 eligible-censoring suppressions, zero interval-coverage suppressions, and zero duplicate/conflict suppressions. The current method does not silently drop censored values.

## Not Implemented or Not Evidenced

- Dataset-specific confirmation for the legacy Hilltop route, rate-limit agreement, attribution/freshness implementation, and public redistribution decision. ECan's published data-agreement terms are now documented as a local-processing basis, not release approval.
- Complete catchment observation-level coverage and production-scale profile.
- Full raw snapshot/cache and public production asset publication. The current response manifest records identity only; raw response bodies remain local/ephemeral.
- Censor-aware ROS summaries and censor-aware Mann–Kendall/Akritas–Theil–Sen trends. The current documented fallback suppresses affected statistics and emits indeterminate trends.
- A local runtime shell now includes the audited catchment geometry and station coordinates; flow assets and complete observation coverage are still not prepared for production use.
- Public observation assets, licensed basemap/tiles, and public deployment.
- Frontend component tests, Python formatter/linter/static checks, CI, and observation-level source fixtures.
- Deployment configuration, hosting selection, deployed application, monitoring, or live verification.
- Public portfolio repository, screenshots, or case-study material.

## Partially Implemented

The local production-shaped workflow is implemented against ignored generated assets. It is not a public production dashboard: the application uses a minimal local MapLibre style with verified ECan catchment geometry and station coordinates but no third-party basemap or remote tile dependency, and falls back to a synthetic fixture if the runtime asset has not been prepared. Runtime contract `2.0.0` stages parameter-partitioned detail while the processing layer retains the rich normalized/audit representation. The profile's site membership is spatially validated against the configured ECan major-catchment polygon, while observation coverage remains bounded to the retrieved public service history.

## Known Limitations and Risks

- Ashburton–Hakatere is selected as the working catchment direction; the verified ECan major-catchment boundary covers the bounded profile, while complete observation coverage and final suitability remain to be validated.
- Environment Canterbury provides verified public station/flow inventory and legacy Hilltop catalog access for the audit, but the production observation route, licensing, and redistribution terms remain unresolved.
- Source records may contain irregular sampling, inconsistent analyte names or units, quality flags, censored values, duplicates, schema changes, and incomplete coverage.
- Inventory-level flow matching is promising; a selected catchment still needs a defensible gauge-to-monitoring relationship.
- Static delivery is preferred and locally verified for the current payload; the old formatted monolith was 10,473,514 bytes, while the new shell is about 1.26 MB raw and shell plus initial E. coli detail about 1.41 MB raw. The full partition set remains about 1.71 MB raw; public delivery terms remain unresolved.
- The adopted published-unflagged policy improves exploratory coverage, but censoring and irregular sampling still leave 283 of 324 trend records indeterminate; this is surfaced rather than relaxed.
- Regulatory thresholds and directional terms such as “improving” or “declining” may be inapplicable or parameter-specific.
- No project formatter/linter, Python static/type checker, or CI workflow exists yet. Foundation test, fixture-validation, compilation, typecheck, unit test, build, and browser-verification commands are documented and verified.

## Current Test and Validation State

- **Automated tests:** thirty-three focused `unittest` tests pass with `python3 -m unittest discover -s tests -v`.
- **Linting/formatting:** no configuration or successful project run evidenced.
- **Python static/type checks:** no Python project or configuration evidenced.
- **Frontend type check/build:** `cd web && npm ci && npm run typecheck && npm run test:unit && npm run build` passes. The build keeps MapLibre in a separate lazy chunk: initial JS is about 255.72 kB (78.77 kB gzip), MapLibre is about 1.02 MB (276.18 kB gzip), and CSS is about 12.19 kB (3.32 kB gzip).
- **Data validation:** source inventory/catalog validation is evidenced by the live audit; parser and contract validation is evidenced by fixtures plus a bounded live Hilltop profile; complete production observation coverage remains unverified.
- **Scientific validation:** the conservative numeric-only summary and uncensored Theil–Sen/Kendall fallback are unit-tested against an independently calculated pairwise Theil–Sen fixture; the viability report audits all trend reasons. Censor-aware ROS/Mann–Kendall methods remain unimplemented and should not be implied.
- **Visual/accessibility/responsive validation:** Playwright full-page screenshots were inspected at 1440×900, 1024×768, and 390×844 viewport sizes. The browser suite found no application console errors, page errors, failed requests, horizontal overflow, or serious/critical axe violations; it explicitly filters only the known Chromium/WebGL MapLibre compositor diagnostic. Core default, parameter/window/station/map, determinate/indeterminate trend, export, no-data, censored, fallback, error, Data notes, keyboard, and chart-inspection flows are asserted.
- **Deployment verification:** no deployment evidenced.
- **Repository baseline:** file inventory, required-document checks, audit tests, live audit, contract validation, Python compilation, frontend typecheck, frontend unit tests, frontend build, browser interaction/accessibility checks, responsive screenshot inspection, runtime shell/partition measurement, and local asset timing measurement completed; formatter/linter, CI, and deployment gates remain unavailable or not yet applicable.
- **Live audit:** `python3 tools/feasibility_audit.py --output docs/feasibility/audit-report.json` completed on 2026-09-13 and retrieved 6,266/6,266 surface features, 185/185 flow features, 552 Hilltop sites, and 16,425 Hilltop measurement entries; 45 coordinate-linked candidate sites were probed for units and sampling metadata.
- **Git state:** valid repository on `main`; the current milestone includes tracked policy, asset-materialization, dashboard, test, and governance changes, while generated observations/assets remain ignored.

## Current Deployment State

No hosting provider, deployment configuration, production URL, or successful deployment has been evidenced.

## Major Blockers and Decision Boundaries

The owner has selected Ashburton–Hakatere and approved the parameter/time scope. The bounded acquisition, ECan polygon membership, normalization, quality-semantics audit, coverage diagnostics, conservative summaries, trends, local runtime asset loading, MapLibre geography, filtered export, and browser-verified React integration are implemented. Complete catchment observation coverage, exact source-term approval, and public publication remain open; local production-shaped asset loading is verified.

Implementation beyond feasibility is gated by:

1. Retrieval and review of exact source terms for local caching and public redistribution.
2. Complete-catchment observation acquisition and coverage reconciliation beyond the bounded retrieved profile.
3. Owner review of any future consequential interpretation, thresholds, or status semantics before dashboard release.

Credentials or private access should not be assumed; sources must remain public/open unless the owner explicitly changes scope.

## Logical Current Development Frontier

Priority 0 is complete as a feasibility screen, Priority 1 is complete as a tested foundation, the approved bounded Priority 2/3 analytical implementation plus quality-semantics review is complete, and the local functional MVP is complete with verified MapLibre geography, partitioned runtime data, filtered export, and browser-tested transparency/accessibility behavior. The next frontier is **owner-facing visual review and public-release readiness**, especially the licensing/data-distribution path, freshness/attribution implementation, and any final visual decisions; complete observation coverage and public deployment remain separate gates.
