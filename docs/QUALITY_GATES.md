# Quality Gates

These gates define the evidence an agent must consider before declaring a work unit or milestone complete. Apply only the gates relevant to the change, but do not omit an applicable gate silently. Record commands, results, skipped checks, and environmental limitations in the completed execution plan or handoff.

As audited on 2026-09-13, Priority 2 now also defines dependency-free ECan geometry parsing and membership tests alongside the Python fixture/test commands and frontend install, typecheck, and build commands. Browser verification and frontend unit tests are configured under `web/` with Playwright/axe-core and Vitest. No project formatter/linter, Python static/type checker, or CI workflow is configured. Record unavailable project checks rather than inventing commands; use repository-defined commands once they exist.

Current executable foundation gates are:

- `python3 -m unittest discover -s tests -v`
- `python3 tools/validate_fixture.py tests/fixtures/minimal_asset.json`
- `cd web && npm ci && npm run typecheck && npm run build`
- `python3 -m py_compile catchment_dashboard/*.py tools/*.py tests/*.py`
- `python3 tools/acquire_observations.py` for the bounded live profile, when public endpoints are responsive
- `python3 tools/audit_catchment_sites.py` for the polygon-based site/measurement coverage audit, when public endpoints are responsive
- `python3 tools/build_analytical_assets.py --profile reports/generated/ashburton-analytical-profile-2007-2025-all-sites.json --output-dir reports/generated/ashburton-analytical-assets-all-sites` after an ignored full profile has been acquired with `--include-observations`
- `python3 tools/audit_analytical_viability.py --profile reports/generated/ashburton-analytical-profile-2007-2025-all-sites.json --output reports/generated/ashburton-viability-review.json` for quality-field semantics, scenario comparison, coverage, and trend-reason diagnostics
- `python3 tools/audit_catchment_sites.py` to refresh ignored site membership and preserve the verified boundary geometry for local runtime preparation
- `python3 tools/prepare_dashboard_assets.py` to materialize the ignored local React asset at `web/public/data/ashburton/dashboard.json` from the generated analytical assets and site audit
- `python3 tools/check_release_readiness.py` to verify asset freshness/build metadata, the preserved dataset-specific terms hash, official attribution, and that raw/generated observation outputs are not tracked. `--require-public-release` passes only when the prepared runtime asset carries `public_cc_by_attribution_freshness` and all safeguards are evidenced.
- `python3 tools/reconcile_catchment_coverage.py` to verify count-checked ArcGIS pagination, CRS, boundary inclusion, exact station IDs, unmatched inventories, and selected-parameter observation coverage.
- `python3 tools/release_build.py` to rehearse the complete public-shaped static build from public sources; it fails closed on unresolved coverage, stale/malformed/unlicensed inputs, and tracked generated outputs.

For the local production-shaped dashboard, run `cd web && npm ci && npm run typecheck && npm run test:unit && npm run build && npx playwright install chromium && npm run test:browser`. The browser suite starts Vite against the local prepared runtime shell and parameter partition, asserts that real assets and geometry are loaded instead of silently using the fixture, checks coordinated interactions, MapLibre selection, filtered export, keyboard access, and key empty/censored/indeterminate states, runs axe-core checks, measures asset timing, and captures ignored screenshots at 1440×900, 1024×768, and 390×844. Chromium is installed in the normal user cache; browser binaries, reports, traces, screenshots, and test results must not be committed.

The frontend lockfile is `web/package-lock.json`; `node_modules/` and build output are ignored. The fixture is synthetic and does not validate production source completeness or analytical meaning. Live profile output is written under ignored `reports/generated/`; raw source responses remain ephemeral and public publication still requires a fresh release check.

### Current documentation-only baseline

While the repository remains documentation-only, run and record these checks:

- `rg --files --hidden -g '!.git/**'` to inspect the workspace file inventory, including placeholder files;
- `for required_doc in AGENTS.md docs/PROJECT_BRIEF.md docs/PROJECT_STATE.md docs/BACKLOG.md docs/ARCHITECTURE.md docs/QUALITY_GATES.md docs/DECISIONS.md; do test -s "$required_doc" || exit 1; done` to confirm required governance files are non-empty;
- `find docs/plans -maxdepth 2 -type f -print | sort` to inspect active and completed plans;
- `git status --short --branch` and related history commands when `.git` is valid; if git metadata is absent or invalid, record that limitation rather than treating the checkout as clean.

These checks establish repository/documentation presence only. They do not substitute for the test, lint, type, build, data, UI, or deployment gates that become applicable after implementation work exists.

## Completion Standard

Work is complete only when:

- acceptance criteria are met by the implementation, not only described;
- applicable automated and manual checks pass;
- the diff has been self-reviewed;
- failures caused by the change are fixed;
- generated, temporary, secret, or unintended large files are absent;
- `docs/PROJECT_STATE.md`, `docs/BACKLOG.md`, and affected documentation reflect reality;
- validation that could not be run is reported accurately and does not become a false claim of success.

## 1. Correctness and Scope

- Trace the result to the active objective and acceptance criteria.
- Exercise the primary success path, relevant edge cases, and failure behavior.
- Confirm that station, parameter, time-range, map, chart, table, and export semantics agree wherever they are affected.
- Check for incomplete placeholders, dead or duplicated code, accidental scope expansion, and unsupported claims.
- Preserve backward-compatible data contracts unless a versioned and documented change is intentional.

## 2. Automated Tests

- Add focused unit tests for transformation, normalization, aggregation, trend, filtering, and export logic changed by the work.
- Add integration/contract tests at source-adapter, pipeline-stage, asset-schema, and frontend data boundaries where appropriate.
- Use small representative fixtures, including missing, censored, duplicated, invalid, sparse, and schema-change cases when relevant.
- Add UI/component or end-to-end coverage for high-value coordinated interactions rather than relying only on snapshots.
- Run the smallest relevant suite during iteration and the repository-defined full suite before milestone completion.
- Do not weaken assertions, delete coverage, or mark tests skipped merely to obtain a passing run.

## 3. Formatting, Linting, Static Analysis, and Types

- Run the repository-defined Python formatter/linter and any configured static/type checker.
- Run frontend formatting/linting and TypeScript type checking.
- Resolve new warnings unless a documented, narrowly justified exception exists.
- Keep public data models, asset schemas, and shared UI state typed explicitly.

## 4. Build and Packaging

- Run the production frontend build for UI or asset-contract changes.
- Run or exercise the relevant pipeline stage for processing changes.
- Confirm generated assets are discoverable at the paths expected by the built application.
- Verify lockfiles and reproducible install instructions when dependencies change.
- Confirm repository ignore rules prevent raw caches, secrets, temporary outputs, and unintended bulk data from being committed.

## 5. Source Acquisition and Data Validation

For source or pipeline changes, verify and report:

- provider, dataset/service, retrieval time, request scope, licensing/attribution, and source identifiers;
- pagination/completeness, HTTP/service failures, retries, time bounds, and rate-limit behavior;
- expected and observed schemas, required fields, uniqueness, record counts, and rejected-record counts by reason;
- station coordinates, CRS, catchment membership, parameter identities, timestamps/time zones, units, quality flags, censored results, missingness, and duplicates;
- reasonable numeric ranges and discontinuities without deleting legitimate extremes merely because they look unusual;
- referential integrity among stations, observations, parameters, summaries, trends, geometries, and flow series;
- warnings or hard failure when retrieval is partial or schema expectations change.

Never silently reuse stale cache as if it were a fresh successful acquisition. Cache provenance and freshness must be explicit.

## 6. Scientific and Analytical Validity

For analytical changes:

- show that aggregation matches actual sampling frequency and does not imply continuous monitoring;
- test minimum-observation and coverage rules across stations and periods;
- validate unit conversion numerically and preserve original-unit provenance;
- document and test treatment of non-detects/censored values, quality flags, duplicates, and missing data;
- compare calculated summaries against an independently inspectable sample or hand-worked fixture;
- validate trend sign, magnitude, time basis, edge cases, and uncertainty/significance fields required by the adopted method;
- avoid first-versus-last-point trend shortcuts unless explicitly adopted with justification;
- ensure positive/negative interpretation is parameter-specific and owner-approved;
- use regulatory or guideline thresholds only with an authoritative citation and demonstrated applicability;
- do not infer causation from water-quality/flow association;
- keep raw, aggregated, modeled/estimated, and classified values distinguishable.

Consequential methodology changes require a decision record and owner review before release.

## 7. Reproducibility and Provenance

- A documented command should regenerate outputs from public sources or an explicitly identified cache/snapshot.
- Pin or constrain dependencies sufficiently for repeatable development and CI.
- Record source versions or retrieval times, processing/method version, spatial and temporal coverage, record counts, and asset checksums/version identifiers where appropriate.
- Confirm identical inputs and configuration yield equivalent analytical outputs apart from explicitly volatile metadata.
- Keep manual desktop-GIS edits out of the critical build path.
- Ensure a prepared record can be traced to source station, parameter, observation, and transformation metadata where the source permits it.

## 8. Error Handling and Observability

- Fail with actionable messages for unavailable sources, authentication/permission issues, unexpected schemas, invalid units, corrupt assets, and incomplete retrieval.
- Do not convert missing/invalid values to zero or silently discard them.
- Surface partial coverage, unavailable parameters, empty selections, stale data, and unsupported comparisons clearly in the UI.
- Avoid leaking stack traces, local paths, credentials, or sensitive configuration in the deployed product.
- Log enough structured context during builds to diagnose the source and stage of failure without logging secrets.

## 9. Security, Privacy, Licensing, and Supply Chain

- Keep credentials and tokens outside tracked files and browser bundles.
- Inspect changes for secrets before commit and use least-privilege credentials if any are later required.
- Validate untrusted source data at ingestion and escape/safely render source text in the UI and exports.
- Review dependency changes for necessity, maintenance, license compatibility, and known critical vulnerabilities using the repository's configured tooling.
- Preserve provider attribution and comply with data redistribution, caching, and derivative-product terms.
- Do not introduce paid services, tracking, authentication, or a new privacy posture without owner approval.

## 10. Performance

- Measure generated asset sizes, production bundle size, initial loading behavior, and common interaction latency for relevant changes.
- Validate that parameter changes, station selection, and time filtering feel immediate with representative production-scale data.
- Partition or simplify assets based on measurements, not assumptions, while preserving analytical accuracy and provenance.
- Avoid repeated parsing, transformation, or network acquisition in the browser when it belongs in the build pipeline.
- Check map and chart rendering with the realistic maximum station and observation counts selected for MVP.

## 11. Accessibility

- Use semantic headings, landmarks, labels, controls, tables, and status messaging.
- Ensure full keyboard access, logical focus order, visible focus, and no keyboard traps for core workflows.
- Meet appropriate contrast standards and do not encode condition or trend by color alone.
- Give charts and maps accessible titles/context and provide a textual or tabular route to essential values.
- Respect reduced-motion preferences and avoid gratuitous animation.
- Test key flows with automated accessibility tooling when configured, plus a manual keyboard check.

## 12. Responsive UI and Visual Verification

- Validate representative desktop, tablet, and small-screen viewports; desktop remains primary, but smaller screens must degrade coherently.
- Check long station/parameter names, large and small values, sparse/dense series, missing data, loading, error, and no-result states.
- Confirm legends, units, time ranges, hover/focus states, tooltips, selected states, and map/chart highlighting remain consistent.
- Inspect screenshots or the running application rather than treating a successful build as visual proof.
- Check for clipping, overflow, illegible axes, overlapping map controls, unstable layout, default-library styling, excessive cards/chrome, and misleading visual emphasis.
- Where practical, compare key views against an intentional reference or approved mockup.

## 13. Documentation

- Update user/developer instructions, data sources, methodology, limitations, attribution, schemas, and deployment notes when affected.
- Keep `docs/PROJECT_STATE.md` factual and current; do not use it as a chronological log.
- Update `docs/BACKLOG.md` when scope or milestone reality changes.
- Add to `docs/DECISIONS.md` only for consequential accepted choices.
- Complete and move the active execution plan when its objective is achieved.
- Ensure public-facing documentation distinguishes freshness, coverage, observation, aggregation, trend, threshold, and inference accurately.

## 14. Deployment Verification

Before declaring a release complete:

- deploy the exact validated revision and record the revision/version where the platform supports it;
- verify the public URL and production asset requests, not only a local preview;
- confirm the deployed application reports or exposes the expected data-build/update metadata;
- exercise the core flow: load dashboard, select parameter, change time range, select station, inspect charts/table, and export filtered data;
- inspect browser/runtime errors and missing assets;
- confirm attribution, licensing, error behavior, responsive layout, and caching/freshness behavior in production;
- document any external source outage separately from code failure.

## Required Self-Review Questions

Before completion, answer internally or in the execution-plan outcome:

1. What evidence proves the requested behavior works?
2. Which applicable gate was not run, and why?
3. Did the change alter analytical meaning, source choice, scope, architecture, cost, privacy, or major visual direction?
4. Can incomplete or missing data be mistaken for a valid result?
5. Are tests exercising meaning rather than merely implementation shape?
6. Is documentation now more accurate than before?
7. Would another developer find accidental files, unexplained generated assets, or misleading completion claims in the diff?
