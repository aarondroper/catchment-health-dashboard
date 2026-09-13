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

Owner selected Ashburton–Hakatere as the catchment direction. The completed screening evidence is in `docs/feasibility/SOURCE_AUDIT.md` and `docs/feasibility/audit-report.json`. The ECan major-catchment polygon is validated for the bounded profile; the core parameter/time scope is now owner-approved, while complete observation-level coverage and source-term release remain open.

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

**Status:** Complete for the approved bounded profile and refreshed quality-semantics review; complete-catchment acquisition, source-term approval, and production publication remain open. Plans are archived under `docs/plans/completed/`.

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

The ECan/Hilltop adapter now performs a count-checked candidate station query, authoritative polygon membership, measurement metadata parsing, source-preserving observation parsing, deterministic site/parameter quality summaries, and successful-response manifests. The owner-approved eight-parameter 2007–2024 polygon-based run retrieved 10,426 observations at 15 data-producing sites from 19 in-bound catalog sites. Normalization and asset generation produced explicit raw quality-representation, quality/unit/censoring/duplicate dispositions, 324 coverage records, 1,830 summaries, and 324 trend records. The focused quality-semantics review verified 9,434 missing quality elements, 992 nonempty quality codes, strict eligibility of 846 rows, and complete trend indeterminacy reasons. Thirty-three Python tests plus fixture, compilation, acquisition, deterministic-build, and viability-report checks pass. Source-term approval, public asset publication, and censor-aware trend implementation remain open.

## Priority 3 — Analytical Methodology and Derived Assets

**Status:** Complete for the approved bounded profile; quality-semantics review retained the conservative production policy and documented the diagnostic unflagged alternative. Local React integration is next.

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
assets. Strict assets are scientifically usable for observed-history and
coverage/distribution views but do not support a general trend view; the UI
must label unsupported summaries/trends rather than relax the rules.

## Priority 4 — Core Coordinated Dashboard

**Status:** In progress; local fixture-backed analytical contract integration is implemented and verified. Production asset loading, runtime map, real-data visual review, and component tests remain.

### Objective

Deliver the primary desktop analytical workflow as a coherent React/TypeScript application.

### Major deliverables

- Owner-reviewed layout direction based on the actual data and monitoring questions.
- Catchment overview, parameter selection, time-range control, and station selection.
- Clean MapLibre catchment/station map with context-dependent symbology.
- Headline summaries, selected-site time series, and one purposeful comparison/trend view.
- Shared analytical state so relevant views update consistently.
- Units, coverage, method, data-date, provenance, limitation, empty, and error context.

### Dependencies

- Validated application assets and owner-approved methodological semantics.
- Major visual composition review at the design boundary.

### Acceptance criteria

- A user can move from catchment overview to a station history and meaningful comparison without contradictory filter state.
- Parameter, station, and time changes update all applicable views correctly.
- Map and charts use intentional freshwater-monitoring design rather than default library styling.
- Incomplete or unavailable information is not represented as zero, normal, or complete.
- Core flows pass automated logic/component tests and visual review at supported desktop sizes.

## Priority 5 — Transparency, Export, Responsiveness, and Accessibility

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

## Priority 6 — Reproducibility, Deployment, and Portfolio Release

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
