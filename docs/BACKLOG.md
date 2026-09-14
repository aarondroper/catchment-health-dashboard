# Backlog

This is the prioritized remaining-work roadmap. Milestones describe outcomes, dependencies, and broad acceptance criteria. Create a concise file under `docs/plans/active/` for detailed execution when a milestone or substantial slice begins.

## Priority 0 — Canterbury Source and Catchment Feasibility

**Status:** Audit complete; Ashburton–Hakatere selected by owner on 2026-09-13.

### Objective

Establish whether authoritative public data can support a credible dashboard and identify the strongest contained Canterbury catchment options.

### Major deliverables

- Reproducible audit of Environment Canterbury and relevant national New Zealand sources.
- Documented access methods, endpoints/services, schemas, licensing/attribution, rate constraints, and retrieval limitations.
- Candidate-catchment comparison covering station density, parameter overlap, temporal depth, unit consistency, quality metadata, geographic coherence, and flow/stage availability.
- Small non-production samples or profiling artifacts sufficient to verify access and schema behavior.
- Recommended catchment, four-to-six candidate parameters, plausible analysis period, and flow recommendation.
- Explicit owner decision brief with evidence, options, recommendation, and consequences.

### Dependencies

- Public source availability and documentation.
- Ability to inspect representative historical records and station metadata.

### Acceptance criteria

- At least the realistic candidate catchments are compared using reproducible evidence rather than source reputation alone.
- Completeness claims account for pagination, time bounds, and failed requests.
- Parameter coverage is measured by station and time, with units and sampling frequency profiled.
- Licensing permits the intended processing and deployment model, or restrictions are clearly identified.
- Flow feasibility is tested rather than assumed.
- No catchment, final parameter set, or trend method is silently finalized.

### Exit decision

Owner selected Ashburton–Hakatere as the catchment direction. The completed screening evidence is in `docs/feasibility/SOURCE_AUDIT.md` and `docs/feasibility/audit-report.json`. The ECan major-catchment polygon is validated for the bounded profile; the core parameter/time scope is owner-approved, while complete observation-level coverage and deployment operations remain open.

## Priority 1 — Repository and Contract Foundation

**Status:** Complete; foundation plan archived at `docs/plans/completed/2026-09-13-repository-contract-foundation.md`.

### Objective

Create a minimal, reproducible codebase and stable contracts for the selected data scope.

### Major deliverables

- Python package/tooling, dependency lock, configuration, test structure, and documented commands.
- React/TypeScript frontend scaffold with MapLibre-ready structure and a selected charting approach justified by a focused spike.
- Source, normalized, analytical, and asset-manifest schema definitions with versioning strategy.
- Configuration for study area, source retrieval, paths, and build metadata.
- Data-directory and git-ignore policy separating source cache, test fixtures, generated assets, and deployable artifacts.
- Usable version-control metadata so status, diff review, and coherent commits work; this checkout currently has valid git metadata.
- Baseline lint, format, type-check, test, and build automation, preferably reflected in CI.

### Dependencies

- Priority 0 owner decision and enough source-schema evidence to avoid speculative contracts.
- A valid version-controlled checkout, or an explicitly documented environment limitation while repository bootstrap is completed.

### Acceptance criteria

- A fresh checkout can install both toolchains and run documented baseline validation.
- A minimal end-to-end fixture passes through the intended component boundaries.
- Provider-specific fields are isolated from stable internal contracts.
- No large raw or generated datasets are inadvertently tracked.
- `git status`, diff review, and history inspection work in the development checkout, or the remaining environment limitation is recorded for the owner.
- The charting choice supports coordinated interaction, responsiveness, TypeScript use, and accessibility expectations.

### Exit evidence

The repository now contains a Python package and versioned contracts, a synthetic cross-boundary fixture, Ashburton–Hakatere configuration, a Vite/React/TypeScript shell, a MapLibre-ready boundary, an inline-SVG/table chart spike, and a checked-in npm lockfile. Nine Python tests, fixture validation, strict TypeScript checking, production build, and Python compilation passed on 2026-09-13. Formatter/linter, Python static/type, CI, UI/accessibility automation, and production-data checks remain unavailable or out of scope until later work units add them.

## Priority 2 — Acquisition, Normalization, and Data Quality

**Status:** Complete for the approved scope and identified source inventories; broader source completeness and production publication remain outside the evidence. Plans are archived under `docs/plans/completed/`.

### Objective

Build a reliable pipeline from authoritative public sources to validated normalized observations and spatial metadata.

### Major deliverables

- Source adapters for selected water-quality, station, catchment/hydrography, and feasible flow data.
- Explicit caching/snapshot and source-manifest behavior.
- Canonical station, parameter, observation, and optional flow schemas.
- Source-grounded handling of timestamps, aliases, units, missingness, duplicates, quality flags, and censored results.
- Coverage and exclusion reports, with hard failure or prominent warnings for incomplete retrieval.
- Automated tests using small representative fixtures, including malformed and changed-schema cases.

### Dependencies

- Stable source choices and contracts from Priorities 0–1.
- Source metadata sufficient to define quality and unit rules.

### Acceptance criteria

- Documented commands reproduce normalized outputs from source inputs or cache.
- Every retained record has stable station/parameter identity and adequate provenance.
- Unit conversions and exclusions are tested and reported.
- Duplicate, invalid, censored, missing, and partial-retrieval behavior is explicit.
- Station coordinates and catchment membership pass spatial validation.
- Flow records, if included, have a documented and defensible relationship to the monitoring context.

### Bounded slice evidence

The ECan/Hilltop adapter now performs a count-checked candidate station query, authoritative polygon membership, measurement metadata parsing, source-preserving observation parsing, deterministic site/parameter quality summaries, and successful-response manifests. The fresh 2007–2025 polygon-based run retrieved 11,230 observations at 15 data-producing sites from 19 exact-ID in-bound matches. Normalization and asset generation produced explicit raw quality-representation, quality/unit/censoring/duplicate dispositions, 324 coverage records, 1,930 summaries, and 324 trend records. The focused quality-semantics review remains preserved; the fresh adopted build has 11,078 eligible rows, 1,370 reported summaries, and 30 determinate trends, while the strict sensitivity build has 1,644 eligible rows, 348 reported summaries, and no determinate trends. Source-inventory reconciliation, runtime freshness, and the public-shaped release build are implemented; publication and deployment remain owner actions.

## Priority 3 — Analytical Methodology and Derived Assets

**Status:** Complete for the approved bounded profile; the adopted `published_unflagged` policy, strict sensitivity comparison, and ignored application-ready assets are implemented and regenerated. The local React dashboard integration is complete for this milestone.

### Objective

Adopt defensible summaries and trends, then generate compact application-ready assets.

### Major deliverables

- Sampling-density and completeness analysis used to choose temporal aggregation.
- Proposed site comparison baseline, recent-versus-historical logic, trend estimator, minimum-data rules, uncertainty language, and parameter direction semantics.
- Owner-reviewed methodology record before interpretive labels are shipped.
- Tested calculations for summaries, coverage, comparisons, trends, and supported seasonality.
- Versioned station, parameter, observation/series, summary, trend, geometry, optional flow, and manifest assets.
- Determinism and referential-integrity validation.

### Dependencies

- Valid normalized data from Priority 2.
- Owner decisions for consequential scientific interpretation.

### Acceptance criteria

- Methods are explainable, documented, and appropriate to irregular sampling.
- Sparse data does not masquerade as continuous coverage or a reliable trend.
- Raw observations, aggregates, estimates, and classifications remain distinguishable.
- Thresholds appear only when an authoritative, applicable source is documented.
- Repeated builds from identical inputs produce equivalent outputs apart from explicitly volatile metadata.
- Asset sizes and load strategy are measured and compatible with the static architecture.

### Exit evidence

The completed plan `docs/plans/completed/2026-09-13-analytical-viability-review.md`
records the source evidence, quality-field contract, alternative-policy audit,
trend-reason taxonomy, independent Theil–Sen fixture, and regenerated ignored
assets. The adopted assets are scientifically usable for observed-history and
coverage/distribution views and support only a subset of neutral trend rows;
the UI labels unsupported summaries/trends rather than relaxing the rules.

## Priority 4 — Core Coordinated Dashboard

**Status:** Complete for the local production-shaped milestone; public deployment and hosting operations remain later release gates.

### Objective

Deliver the primary desktop analytical workflow as a coherent React/TypeScript application.

### Major deliverables

- Owner-reviewed layout direction based on the actual data and monitoring questions.
- Catchment overview, parameter selection, time-range control, and station selection.
- Clean MapLibre catchment/station map with context-dependent symbology.
- Headline summaries, selected-site time series, and one purposeful comparison/trend view.
- Shared analytical state so relevant views update consistently.
- Units, coverage, method, data-date, provenance, limitation, empty, and error context.

### Exit evidence

The local app loads `web/public/data/ashburton/dashboard.json` when prepared by
`tools/prepare_dashboard_assets.py`, with an explicit synthetic-fixture
fallback. Parameter, window, station, and map-pin selections share state
across the map, series/table, summaries, coverage, comparison, and quality
context. The refreshed v4 runtime contains 11,230 observations, 11,078
eligible observations, 19 stations, 1,930 summaries, and 324 trend records;
9 primary-window trends are determinate. Typecheck, production build, and the
17-test browser suite pass. Browser verification confirmed the real asset,
coordinated controls, no-data/censored/indeterminate states, OpenFreeMap
attribution and fail-closed local geometry fallback, responsive overflow, and
the absence of serious/critical accessibility violations at 1440×900,
1536×864, 1024×768, and 390×844.

### Acceptance criteria

- A user can move from catchment overview to a station history and meaningful comparison without contradictory filter state.
- Parameter, station, and time changes update all applicable views correctly.
- Map and charts use intentional freshwater-monitoring design rather than default library styling.
- Incomplete or unavailable information is not represented as zero, normal, or complete.
- Core flows pass automated logic/component tests and visual review at supported desktop sizes.

## Priority 4.5 — UX/UI Refinement and Visual Verification

**Status:** Complete for the local milestone; plan archived at `docs/plans/completed/2026-09-13-browser-verified-dashboard-refinement.md`.

### Objective

Refine the local dashboard’s visual hierarchy and verify the coordinated
workflow at representative desktop, tablet, and mobile viewports without
expanding analytical scope.

### Initial work

- Run a browser-capable visual review and correct layout, chart, map-pin,
  empty-state, accessibility, and responsive issues.
- Add focused frontend interaction/component tests for shared selection state.
- Measure realistic local asset load and interaction behavior.
- Keep source-term and public-data release gates unchanged.

### Exit evidence

Playwright/Chromium and axe-core verification were added under `web/`. The
earlier refinement slice had eight browser tests against the prepared local asset, including parameter,
window, station, map-pin, no-data, censored, indeterminate, fallback/error,
accessibility, asset timing, and responsive screenshot checks. The dashboard
was visually inspected at 1440×900, 1024×768, and 390×844 with no horizontal
overflow. The local asset is 10,473,514 bytes; the static bundle remains small
relative to that payload. The current local runtime uses a 2.0.0 shell plus
parameter partitions, verified MapLibre geometry, and filtered export; public
observation delivery has an evidence-backed CC BY route but still requires
freshness/removal operations and deployment checks.

## Priority 5 — Transparency, Export, Responsiveness, and Accessibility

**Status:** Complete for the local functional MVP; public deployment remains a release gate with an evidence-backed data licence and operational freshness requirements.

### Objective

Make the analytical product usable, inspectable, and robust beyond the central desktop flow.

### Major deliverables

- Detailed data table or equivalent inspection view.
- Filtered CSV/data export with clear field names, units, source/provenance context, and deterministic filter semantics.
- Sensible tablet and mobile degradation without requiring full desktop parity.
- Keyboard navigation, visible focus, semantic controls, text alternatives, contrast, and non-color-only encoding.
- Performance improvements guided by measured bundle, asset, render, and interaction behavior.
- Polished empty, partial, loading, stale-data, and failure states.

### Dependencies

- Stable coordinated state and data contracts from Priority 4.

### Acceptance criteria

- Exported rows match the visible filter context and pass automated tests.
- Core tasks remain understandable and operable with keyboard input and at supported viewport sizes.
- Meaning is not encoded by color alone and chart/map context has an accessible textual equivalent where practical.
- Common selection and filtering interactions feel immediate on a representative deployed build.

### Exit evidence

The local dashboard uses the versioned 2.0.0 runtime shell and parameter
partitions, preserves source and analytical meaning through typed decoding, and
exports the active station/all-site context as deterministic UTF-8 CSV. The
local MapLibre view displays the audited ECan polygon and 19 in-bound sites.
Twelve frontend unit tests and eighteen Playwright/Chromium browser tests pass,
including real-data loading, coordinated parameter/window/station/map flows,
censored and indeterminate states, export, fallback/error behavior, keyboard
access, axe checks, performance timing, and responsive overflow checks. Full-
page screenshots were inspected at 1440×900, 1536×864, 1920×1080, 1024×768,
and 390×844. The map/history workspace was subsequently corrected so the
measured history plotting region fills the responsive chart frame: 724×150px at
1440×900, 812×136px at 1536×864, and 1,195×219px at 1920×1080. The shell
is about 1.26 MB raw/82 kB gzip; shell plus initial E. coli detail is about
1.41 MB raw/103 kB gzip; all partitions are about 1.71 MB raw/207 kB gzip.

## Priority 5.5 — Owner-Facing Review and Public-Release Readiness

**Status:** Local UI, source-inventory, freshness, and release-readiness work complete; external publication and deployment authorization remain

### Objective

Obtain owner-facing visual/product review of the local MVP and resolve the
release path without weakening the analytical or licensing guardrails.

### Major deliverables

- Owner review of the restrained visual language, map presentation, wording,
  and the balance between observed history, coverage, distributions, and
  supported trends.
- Dataset-specific source-term, attribution, freshness, and redistribution
  decision for observation assets.
- Release checklist covering complete observation coverage, asset freshness,
  permitted hosting/distribution, and public smoke verification.
- Any final visual corrections required by review, without expanding analytical
  scope absent a demonstrated correctness defect.

### Local refinement exit evidence

The accepted owner-facing visual direction is implemented locally without
analytical or licensing changes. The hero is compact, controls and export sit
in a primary workspace bar, map/history/selected-site evidence are visible
early, technical details are consolidated under Data notes, and the default is
Total Nitrogen at `SQ35874` for 2016–2025 based on coverage and supported
output. The chart uses a labelled linear scale with gridlines, dated
observation context, pointer titles, and a keyboard inspection list. The
observation table is decoupled from the map/chart row and appears as a later
full-width bounded inspection panel. Cross-site summaries use a sorted
median/IQR interval plot with exact values behind an accessible disclosure;
at short desktop heights it uses a labelled lowest/selected/highest ranked
summary rather than a miniature unreadable plot. The map status reports a
settled remote context or local fallback rather than remaining on a stale
loading label. Four frontend unit tests and eighteen browser tests pass, and
screenshots at 1440×900, 1536×864, 1920×1080, 1024×768, and 390×844 were
inspected. The map-centric shell now
fits without body scrolling at 1440×900, 1536×864, and 1920×1080, uses
OpenFreeMap Positron when its vector-source lifecycle completes, and fails
closed to the verified local geometry otherwise. The remaining work is
owner-facing review plus external publication authorization and deployment
operations, not more local feature scope.

### Release-readiness outcome

The exact ECan water-quality Terms of Use linked from the official publication
page were retrieved and preserved on 2026-09-14. They license the water-quality
work for reuse under CC BY 4.0 with attribution and accompanying terms. The
surface-water site and Major Catchment Boundary ArcGIS item metadata separately
record CC BY 3.0 New Zealand. `docs/RELEASE_READINESS.md` and
`docs/release/ecan-source-licence-evidence.json` distinguish these verified
facts from the project freshness/removal safeguards. The adapter remains on
the public Hilltop route because the website export is selected-sample oriented,
not a documented replacement for bulk history. Public deployment is still not
performed, but a fresh generated asset can pass
`python3 tools/check_release_readiness.py --require-public-release` when the
current-source, attribution, terms-hash, and no-tracked-output checks pass.

### Acceptance criteria

- Owner-facing visual decisions are recorded before public release.
- Observation and geometry assets are distributed only under the confirmed
  source terms, with attribution, accompanying terms, provenance, and
  current-or-remove safeguards.
- Freshness and attribution information is visible and reproducible.
- Complete coverage and deployment gates are evidenced separately from local
  development verification.

## Priority 6 — Reproducibility, Deployment, and Portfolio Release

**Status:** Pre-publication implementation complete locally; external GitHub
publication and deployment remain owner-authorized actions only.

### Objective

Publish a validated, maintainable, low-cost demonstration and the evidence needed to present it professionally.

### Major deliverables

- End-to-end documented build from fresh checkout through data preparation and frontend output.
- CI/release checks appropriate to the repository.
- Static hosting configuration and public deployment.
- Live smoke verification, data/update metadata, attribution, and documented refresh procedure.
- Project README and detailed source, methodology, limitations, architecture, and deployment documentation.
- Portfolio-ready screenshots, concise case-study narrative, and architecture/method explanation.

### Dependencies

- All MVP behavior and applicable quality gates from Priorities 1–5.

### Pre-publication exit evidence

The 2026-09-14 rehearsal reconciles 6,266/6,266 ECan surface features, 550
coordinate-bearing Hilltop sites, 19 polygon-member Hilltop sites, and 19 exact
station-ID matches. A fresh 11,230-row profile reaches 2025-12-18 and supports
the 2016–2025 primary window for all six core parameter families, while keeping
2007–2025 history. Runtime freshness blocks missing, invalid, future, or
expired assets at 120 days. `tools/release_build.py` is the documented
end-to-end build and writes an ignored release manifest. Public deployment is
deliberately not performed.

### Acceptance criteria

- Fresh-checkout reproduction succeeds subject to documented public-source availability.
- Required tests, lint/static checks, type checks, builds, data validation, and visual review pass.
- The deployed application loads its expected asset version and completes the core user journey.
- Public documentation does not overstate freshness, completeness, regulatory status, scientific certainty, or causal meaning.
- Repository contents are intentional, license-compatible, free of secrets and large accidental artifacts, and suitable for portfolio review.

## Post-MVP Candidates

Consider only after the core project succeeds and evidence supports the value:

- scheduled CI data refresh;
- rainfall or carefully selected land-use/land-cover context;
- additional map modes such as trend or monitoring coverage;
- chart/image export;
- shareable filtered URLs;
- expansion to another related subcatchment.

These are not commitments. Moving one into the active backlog requires a clear user or portfolio benefit and a scope assessment.
