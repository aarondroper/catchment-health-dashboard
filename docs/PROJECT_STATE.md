# Project State

**As of:** 2026-09-15
**Authoritative status:** Ashburton–Hakatere `published_unflagged` analytical policy, refreshed 2007–2025 assets, complete identified-source inventory reconciliation, browser-verified MapLibre MVP, filtered export, runtime freshness safeguards, evidence-backed CC BY release rehearsal, and the Source Sans 3 visual-system polish are verified; external publication and deployment remain owner-authorized actions

This file is the factual snapshot of repository capability. It is not a progress diary. Update it whenever implementation, verification, blockers, or the development frontier materially changes.

## Evidence Basis

This state was reconciled against the current checkout, live public-source inventory reconciliation, refreshed ECan/Hilltop acquisition and geometry checks, the 2007–2025 analytical build, exact ECan water-quality terms, ArcGIS item metadata, release-build rehearsal, the Source Sans 3 visual-system change, and repository quality gates on 2026-09-15. Generated source profiles and analytical assets remain ignored local outputs; no raw or derived production dataset is deployed.

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
- The owner-approved analytical scope is configured: six core parameters, Total Phosphorus and Water Temperature as secondary, pH excluded, 2007–2025 history, 2016–2025 primary window, and 2020–2025 recent window. The 2025 refresh has core-parameter observations at 9–15 sites and all twelve calendar months.
- `NormalizedObservationRecord` contract version `1.0.0` and `ashburton-analytical-v4-published-unflagged-2016-2025` builders preserve original values/units/result text/timestamps/quality-field representation/censoring/provenance while adding explicit unit, quality, value, and duplicate dispositions. The primary policy includes missing quality fields as `published_unflagged`; strict remains a sensitivity mode.
- The fresh eight-parameter long-window run retrieved 11,230 observations at 15 data-producing sites from all 19 exact station-ID matches inside the verified polygon. Local assets contain 324 coverage records, 1,930 annual/window summaries, 324 trend records, and a manifest with checksums; generated outputs are ignored.
- The complete identified-source reconciliation retrieved 6,266/6,266 surface features and 550 coordinate-bearing Hilltop sites, found 340 surface features and 19 Hilltop sites in the boundary, and accepted 19 exact station-ID matches with no unresolved joins. Three sites have no selected parameter metadata and one selected-metadata site returned no requested observations.

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
- A Vite/React/TypeScript frontend now loads the ignored versioned runtime shell and parameter-partitioned observation assets when prepared, with an explicit synthetic-fixture fallback, and coordinates parameter/window/station/map-display controls across a viewport-filling MapLibre workspace, selected-site series, recent observations, secondary observation inspection, summaries, coverage, interval comparison, filtered CSV export, and quality/provenance views. The local view has a map-centric three-region shell, coverage-led Total Nitrogen/SQ35874 default, verified ECan polygon geometry, optional OpenFreeMap Positron context with a timed local-geometry fallback, readable linear chart axes and discrete-observation cues, a responsive history plot with single-heading hierarchy, responsive date ticks and styled record/quality tooltips, neutral trend direction styling, concise detail surfaces, reason-specific Trend states, a deterministic 24-row Trend/comparison display audit, title-case controls with replaceable SVG icons, a scope-confirmed export dialog, a tabular catchment summary, and a static Natural Earth-derived New Zealand locator. The map uses a deliberate top-left Reset/legend stack, separate top-right navigation controls, and one collapsed circular `i` attribution trigger with a viewport-positioned source overlay; the redundant map site-count pill is not shown and basemap state is retained only as non-visual live status. `web/package-lock.json` is checked in.
- Quality gates pass: the repository Python suite, fixture validation, Python compilation, frontend strict typecheck, seventeen frontend unit tests, frontend production build, twenty-four Playwright/axe browser checks, local release-readiness checks, all-site source acquisition, site-membership audit, analytical asset generation, viability audit, source-manifest integrity, and deterministic asset rebuild checks. The final browser suite was rerun for this Trend/comparison display audit on 2026-09-15 against the real local asset and production preview.
- A bounded live Hilltop profile verified 12 real observations for `SQ20104`/Dissolved Reactive Phosphorus; no production dataset is committed.
- The normal bounded three-parameter profile joined 10 in-bound sites and retrieved 243 observations; 9 sites had data, 194 observations were numeric, and 49 were left-censored. Two Canterbury Bight marine name-screened records were excluded by the polygon.
- The earlier neutral nine-parameter candidate profiles retrieved 644 observations for 2024 and 8,644 observations for 2007–2024; these were the evidence used for the owner-approved eight-parameter scope. pH covered only 5 sites, ended in 2013, and had no reported unit.
- The selected long-window run contained 9,478 numeric, 933 left-censored, and 15 right-censored results. Raw quality representations were 9,434 `missing_field` and 992 `nonempty_code`; nonempty values were 774 `600`, 72 `500`, and 146 `400`, with no blank elements or quality parser failures.
- The adopted `published_unflagged` policy distinguishes raw quality representation from normalized disposition: 9,434 `published_unflagged`, 152 excluded poor, 289 retained fair, and 1,355 retained good. It yields 11,078 primary-eligible observations, 1,370 reported summaries, and 30 determinate trends across all windows, including 9 in the primary window. The strict sensitivity build yields 1,644 eligible observations, 348 reported summaries, and no determinate trends.
- The adopted policy changes 154 shared reported medians relative to strict; no shared reported slope comparison exists because strict trends are all indeterminate. It is not an explicit quality-verification claim, and blank-field/unknown-code/poor/conflict exclusions remain visible in provenance and audit counts.
- Strict trend indeterminacy is fully categorized: 159 insufficient eligible observations, 84 insufficient temporal span, 81 eligible-censoring suppressions, zero interval-coverage suppressions, and zero duplicate/conflict suppressions. The current method does not silently drop censored values.

## Not Implemented or Not Evidenced

- A deployed public site and operational freshness/removal process. The exact ECan water-quality Terms of Use support attributed public reuse under CC BY 4.0; `docs/release/` preserves the PDF/hash, `tools/check_release_readiness.py` verifies the evidence, and runtime checks block stale/invalid assets. Hosting and external publication remain owner actions.
- Complete catchment observation-level coverage and production-scale profile.
- Full raw snapshot/cache and public production asset publication. The current response manifest records identity only; raw response bodies remain local/ephemeral.
- Censor-aware ROS summaries and censor-aware Mann–Kendall/Akritas–Theil–Sen trends. The current documented fallback suppresses affected statistics and emits indeterminate trends.
- A local runtime shell now includes the audited catchment geometry and station coordinates; flow assets are not in scope, and the reconciled observation scope is not a claim of complete environmental monitoring.
- Public deployment and production operations. OpenFreeMap Positron is implemented as an attributed, no-key contextual dependency with a local fallback; generated observation assets remain ignored and are not deployed in this milestone.
- Python formatter/linter/static checks, CI, and observation-level source fixtures.
- Deployment configuration, hosting selection, deployed application, monitoring, or live verification.
- Public portfolio repository, screenshots, or case-study material.

## Partially Implemented

The local production-shaped workflow is implemented against ignored generated assets. It is not a public production dashboard: the application uses MapLibre with verified ECan catchment geometry and station coordinates, attempts the attributed OpenFreeMap Positron style, and fails closed to the local geometry when contextual tiles are unavailable or incomplete. It falls back to a synthetic fixture only if the runtime asset has not been prepared. Runtime contract `2.0.0` stages parameter-partitioned detail while the processing layer retains the rich normalized/audit representation. The profile's site membership is spatially validated against the configured ECan major-catchment polygon, while observation coverage remains bounded to the retrieved public service history.

## Known Limitations and Risks

- Ashburton–Hakatere is selected as the working catchment direction; the verified ECan major-catchment boundary and identified source inventories are reconciled, while coverage beyond those inventories and final suitability remain outside the evidence.
- Environment Canterbury provides verified public station/flow inventory and legacy Hilltop catalog access. The water-quality terms provide CC BY 4.0 reuse with attribution; the website's undocumented internal export endpoint was not captured because ECan returned an Incapsula challenge, so Hilltop remains the documented bulk-history adapter.
- Source records may contain irregular sampling, inconsistent analyte names or units, quality flags, censored values, duplicates, schema changes, and incomplete coverage.
- Inventory-level flow matching is promising; a selected catchment still needs a defensible gauge-to-monitoring relationship.
- Static delivery is preferred and locally verified for the current payload; the refreshed shell is about 1.29 MB raw and the full partition set is about 2.83 MB raw before compression. Publication requires a fresh source retrieval, release manifest, and operational removal/refresh operation.
- The adopted published-unflagged policy improves exploratory coverage, but censoring and irregular sampling still leave 283 of 324 trend records indeterminate; this is surfaced rather than relaxed.
- Regulatory thresholds and directional terms such as “improving” or “declining” may be inapplicable or parameter-specific.
- No project formatter/linter, Python static/type checker, or CI workflow exists yet. Foundation test, fixture-validation, compilation, typecheck, unit test, build, and browser-verification commands are documented and verified.

## Current Test and Validation State

- **Automated tests:** focused Python, frontend unit, freshness, source-inventory, and release-gate tests are implemented; the full post-refresh suite is run for this milestone and recorded in the completed plan.
- **Linting/formatting:** no configuration or successful project run evidenced.
- **Python static/type checks:** no Python project or configuration evidenced.
- **Frontend type check/build:** the repository-defined typecheck, unit test, production build, and browser gates remain required after the refreshed contract. Public builds omit source maps; the exact current sizes are recorded after the final build.
- **Data validation:** source inventory/catalog validation is evidenced by the count-checked live reconciliation; parser and contract validation is evidenced by fixtures plus the fresh 2007–2025 Hilltop profile. Coverage beyond identified inventories remains unverified.
- **Scientific validation:** the conservative numeric-only summary and uncensored Theil–Sen/Kendall fallback are unit-tested against an independently calculated pairwise Theil–Sen fixture; the viability report audits all trend reasons. Censor-aware ROS/Mann–Kendall methods remain unimplemented and should not be implied.
- **Visual/accessibility/responsive validation:** Playwright full-page screenshots were inspected at 1440×900, 1536×864, 1920×1080, 1024×768, and 390×844 viewport sizes after the Source Sans 3 visual-system pass and chart bug fix. The 24-test browser suite found no application console errors, page errors, failed required requests, horizontal overflow, or serious/critical axe violations; it explicitly filters only the known Chromium/WebGL MapLibre compositor diagnostic and allows the documented OpenFreeMap fallback. Desktop body scrolling is zero at 1440×900, 1536×864, and 1920×1080. The measured history plotting regions are 748×151px, 837×137px, and 1,212×220px respectively; the browser regression checks local font loading/application, responsive SVG sizing across coordinated selection and resize transitions, plotting-area proportion, viewport-safe body tooltips at chart edge points, a readable compact cross-site summary at 1536×864, settled remote/fallback map status, the static New Zealand locator, title-case controls, the accessible export dialog, map-control non-overlap, absence of the visible status footer, one keyboard-operable expanded attribution disclosure with fallback-specific credits, and real-asset Trend/comparison selection across all 24 parameter/window combinations. Core default, interval comparison, parameter/window/station/map-display, determinate/indeterminate/no-data trend, sparse comparison, export, no-data, censored, fallback/error, Data notes, keyboard, tooltip, and chart-inspection flows are asserted.
- **Deployment verification:** no deployment evidenced.
- **Repository baseline:** file inventory, required-document checks, audit tests, live audit, contract validation, Python compilation, frontend typecheck, frontend unit tests, frontend build, browser interaction/accessibility checks, responsive screenshot inspection, runtime shell/partition measurement, and local asset timing measurement completed; formatter/linter, CI, and deployment gates remain unavailable or not yet applicable.
- **Live audit:** the 2026-09-14 reconciliation retrieved 6,266/6,266 surface features through ordered pages, 550 coordinate-bearing Hilltop sites, and 19 polygon members; 19 exact station IDs matched and 321 in-bound surface-only features were retained as unmatched inventory.
- **Git state:** valid repository on `main`; the current milestone includes tracked visual-system, dashboard, test, dependency, and governance changes, while generated observations/assets and browser screenshots remain ignored.

## Current Deployment State

No hosting provider, deployment configuration, production URL, or successful deployment has been evidenced.

## Major Blockers and Decision Boundaries

The owner has selected Ashburton–Hakatere and approved the parameter/time scope. The bounded acquisition, exact-ID source-inventory reconciliation, ECan polygon membership, normalization, quality-semantics audit, coverage diagnostics, conservative summaries, trends, local runtime asset loading, MapLibre geography, filtered export, runtime freshness blocking, and browser-verified React integration are implemented. Exact water-quality terms and spatial item licences are preserved and support attributed public reuse. The 120-day freshness safeguard and reproducible public-shaped build are verified locally; external publication and deployment remain open.

Implementation beyond feasibility is gated by:

1. Owner authorization for publication to a public GitHub repository and static host.
2. An operational refresh/remove action after publication; the code and local rehearsal are ready but no host is configured.
3. Owner review of any future consequential interpretation, thresholds, or status semantics before dashboard release.

Credentials or private access should not be assumed; sources must remain public/open unless the owner explicitly changes scope.

## Logical Current Development Frontier

Priority 0 is complete as a feasibility screen, Priority 1 is complete as a tested foundation, the approved analytical implementation plus quality-semantics review is complete, and the local functional MVP plus final map-centric shell is complete with refreshed 2025 coverage, exact-ID source reconciliation, verified MapLibre geography, attributed OpenFreeMap context with fail-closed local fallback, partitioned runtime data, filtered export, official attribution/source links, responsive selected-site plotting, and browser-tested transparency/accessibility behavior. The reproducible public-shaped release build and 120-day runtime freshness safeguards are implemented and rehearsed locally. The next frontier is owner-facing review followed by authorization and operational preparation for external publication/deployment, not further analytical scope.
