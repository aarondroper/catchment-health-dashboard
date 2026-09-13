# Decisions

This log preserves consequential decisions that constrain future work. It does not record routine implementation choices. New entries should include evidence and should be added only when a decision has actually been made.

## D-001 — Build a catchment analytical dashboard

- **Status:** Accepted
- **Decision:** Build a Catchment Health Dashboard rather than another primarily map-based environmental explorer.
- **Rationale:** The portfolio needs stronger evidence of environmental dashboarding, time-series analysis, monitoring-data engineering, and coordinated analytical views.
- **Alternatives considered:** Another map-led explorer; a generic environmental dashboard.
- **Consequences:** The map shares visual priority with charts and summaries. Information hierarchy and linked analytical behavior matter more than adding many spatial layers.

## D-002 — Use Canterbury, New Zealand as the geographic direction

- **Status:** Accepted; Ashburton–Hakatere selected under D-013
- **Decision:** Focus source feasibility on Canterbury and use one contained catchment or closely related river system; Ashburton–Hakatere is the selected working scope.
- **Rationale:** Canterbury diversifies the portfolio geographically and appears to offer a promising public freshwater-data ecosystem while allowing a coherent study area.
- **Alternatives considered:** An English Environment Agency catchment; nationwide or all-Canterbury coverage.
- **Consequences:** UK sources should not replace Canterbury merely for convenience. A change of region or material catchment scope requires evidence and owner review. Final parameters, time window, quality rules, and analytical semantics remain open.

## D-003 — Limit the core to approximately four to six water-quality parameters

- **Status:** Accepted scope; identities recorded in D-014
- **Decision:** Use a deliberately limited principal parameter set chosen after source-coverage analysis.
- **Rationale:** This is broad enough to demonstrate environmental monitoring while avoiding an unfocused portal.
- **Alternatives considered:** Expose every available analyte; preselect parameters solely for environmental familiarity.
- **Consequences:** Final selection must balance relevance, site coverage, temporal depth, sampling frequency, unit consistency, and comparability and requires owner review.

## D-004 — Include river flow as context when feasible

- **Status:** Accepted conditionally
- **Decision:** Integrate historical flow or stage only if it can be acquired reliably and matched meaningfully to the selected monitoring context.
- **Rationale:** Hydrological context can improve interpretation and broaden the analytical product.
- **Alternatives considered:** Water quality only; add rainfall as a required feature.
- **Consequences:** Flow is not allowed to block the entire MVP if access or interpretation is disproportionately difficult. Initial use is contextual, not causal modelling. Rainfall remains optional.

## D-005 — Make coordinated views the primary interaction model

- **Status:** Accepted
- **Decision:** Parameter, station, and time selection should drive a shared analytical state across the map, summaries, charts, and detailed records.
- **Rationale:** A coherent analytical environment demonstrates more product and dashboard skill than unrelated widgets.
- **Alternatives considered:** Independent charts; a map-first layer explorer.
- **Consequences:** Filter semantics and identifiers must be centralized and tested. Chart selection should remain purposeful and limited.

## D-006 — Prefer build-time processing and static runtime delivery

- **Status:** Accepted architectural direction
- **Decision:** Acquire and process remote data outside the browser, publish compact application-ready assets, and deploy a static or nearly static React application.
- **Rationale:** This reduces runtime dependence on fragile services, improves interaction speed and reproducibility, and supports free or very low-cost hosting.
- **Alternatives considered:** Live browser queries; always-on API and database; heavy PostGIS architecture.
- **Consequences:** Source freshness is determined by rebuilds and must be visible. Asset contracts and manifests are important. A backend or PostGIS requires a demonstrated requirement and explicit architecture review.

## D-007 — Use Python for processing and React/TypeScript with MapLibre for the application

- **Status:** Accepted direction
- **Decision:** Use Python for ingestion/analysis and React plus TypeScript and MapLibre for the dashboard.
- **Rationale:** The stack fits reproducible environmental data processing, typed interactive product development, and geospatial presentation.
- **Alternatives considered:** Not resolved in detail; charting and frontend build libraries remain implementation choices.
- **Consequences:** The repository should establish separate, explicit data and UI contracts. No chart library is mandated; an agent may select a mature option based on coordination, performance, accessibility, TypeScript support, and maintenance burden.

## D-008 — Keep analytical claims transparent and source-grounded

- **Status:** Accepted
- **Decision:** Distinguish raw observations, aggregates, summaries, trends, and classifications; do not infer causation or disguise missing/irregular sampling.
- **Rationale:** Freshwater records may be sparse, censored, noisy, or inconsistently sampled, so presentation must not exceed the evidence.
- **Alternatives considered:** Simplified visual status without explicit methodology.
- **Consequences:** Data quality, units, coverage, method, provenance, and limitations are product requirements. Trend language requires minimum-data rules and owner-reviewed semantics.

## D-009 — Do not invent a composite health score

- **Status:** Accepted
- **Decision:** A generic catchment health score is not part of the default product.
- **Rationale:** An unsupported score could obscure actual measurements and imply false comparability or regulatory meaning.
- **Alternatives considered:** A central red/amber/green score or gauge for visual simplicity.
- **Consequences:** The dashboard should present a small set of transparent parameter-specific measures. A future composite indicator requires a defensible external or explicitly developed methodology and owner decision.

## D-010 — Require methodology review for consequential interpretation

- **Status:** Accepted governance boundary
- **Decision:** The owner reviews the final core parameters, temporal/trend methodology, direction labels, applicable thresholds, and any composite indicator before they become product claims.
- **Rationale:** These choices change environmental meaning and cannot be made solely for implementation convenience.
- **Alternatives considered:** Allow autonomous selection of all analysis and labels.
- **Consequences:** Agents may research, profile data, implement neutral primitives, and present recommendations, but must stop at the decision boundary before shipping interpretive semantics.

## D-011 — Include filtered tabular export

- **Status:** Accepted
- **Decision:** Provide CSV or an equivalent lightweight export of the currently filtered analytical records.
- **Rationale:** Export supports transparency and resembles real environmental consulting and monitoring workflows.
- **Alternatives considered:** Visualization-only product; chart export as MVP.
- **Consequences:** Filter/export equivalence, clear units, useful identifiers, and provenance context require automated verification. Chart export remains optional.

## D-012 — Optimize for a credible, finishable portfolio deliverable

- **Status:** Accepted
- **Decision:** Limit initial scope to one catchment, a manageable station network, selected parameters, purposeful visualizations, and low-cost infrastructure.
- **Rationale:** Depth, reproducibility, and professional polish are more valuable than regional breadth or feature count.
- **Alternatives considered:** Nationwide platform, general BI features, live operations, prediction, ML, authentication, and arbitrary user data.
- **Consequences:** Scope additions must directly strengthen the core freshwater-monitoring questions and must not jeopardize completion.

## D-013 — Select Ashburton–Hakatere as the study-area direction

- **Status:** Accepted by owner on 2026-09-13; bounded ECan membership boundary verified
- **Decision:** Use the Ashburton–Hakatere catchment as the selected study-area direction for repository foundation and subsequent source/geometry validation.
- **Evidence:** The Priority 0 audit found the strongest quantitative screening profile for this candidate: 37 name-screened ECan surface stations, 10 coordinate-linked Hilltop sites, 458 measurement entries, 72 parameters present at two or more linked sites, and 8 name-matched flow sites. These are screening measures, not authoritative polygon membership.
- **Alternatives considered:** Waimakariri and Ashley–Rakahuri as smaller alternatives; revisiting Canterbury.
- **Consequences:** Ashburton–Hakatere becomes the working configuration scope. The bounded acquisition uses ECan's `Ashburton River` major-catchment polygon (`CatchmentGroup=688`) for membership; this is a hydrological source boundary, not a regulatory or water-zone claim. Parameter, window, and analytical decisions are recorded below. Flow pairing, thresholds, and any health/status semantics remain outside this milestone. The audit recommendation and limitations remain in `docs/feasibility/SOURCE_AUDIT.md`.

## D-014 — Approve Ashburton parameter and time scope

- **Status:** Accepted by owner on 2026-09-13
- **Decision:** Use E. coli, Nitrate-N Nitrite-N, Dissolved Reactive Phosphorus, Total Nitrogen, Turbidity, and Dissolved Oxygen as core parameters. Retain Total Phosphorus and Water Temperature as secondary normalized parameters, exclude pH from the common scope, preserve 2007–2024 history, and expose 2015–2024 as the provisional primary window with 2020–2024 recent-condition summaries.
- **Evidence:** The long-window polygon-based profile retrieved eight non-pH parameters at 15 data-producing sites inside 19 in-bound catalog sites. pH covered five sites in the earlier neutral profile, ended in 2013, and had no reported unit. The selected scope and windows are configured in `config/study_area.json`.
- **Consequences:** Future dashboard work must not silently add pH, replace the selected core, or shorten the retained history. Coverage remains subject to source completeness and the explicit site/parameter diagnostics.

## D-015 — Adopt conservative normalized dispositions and analytical fallback

- **Status:** Accepted for implementation by owner authorization on 2026-09-13; release interpretation remains constrained
- **Decision:** Preserve every source row; normalize equivalent nutrient units to `mg/L`; retain documented fair/good quality records; retain but exclude unresolved, synthetic, and documented poor/compromised records from primary eligibility; suppress summaries when censored values prevent a defensible numeric-only statistic; and use an uncensored Theil–Sen/Kendall fallback with explicit minimums and neutral direction labels.
- **Evidence:** The inspected source documentation provides NEMS meanings for 100/200/300/400/500/600, but no complete public ECan child-code map was found. The selected polygon-based long-window run contained 10,426 observations, 948 censored values, 774 good-quality codes, 72 fair-quality codes, 146 documented poor-quality codes, and 9,434 absent/unresolved quality dispositions. A dependency-free censor-aware ROS/Mann–Kendall implementation was not sufficiently validated for this milestone.
- **Alternatives considered:** Universal half-limit substitution; silently including unresolved quality; unvalidated ROS or censor-aware trend libraries; regulatory thresholds or a composite score. These were rejected under the product guardrails.
- **Consequences:** Many current primary summaries and all current selected-site trend rows may be indeterminate. This is explicit in the generated assets and must remain visible in the application. Source terms and complete coverage remain release gates.

## D-016 — Treat ECan published data terms as a local-processing basis, not release approval

- **Status:** Verified source-terms guidance on 2026-09-13; public redistribution remains a release gate
- **Decision:** Continue local acquisition, normalization, testing, and ignored asset generation. Do not commit or publicly serve raw responses or generated observations until the legacy Hilltop route is confirmed under the applicable ECan terms and the product implements attribution, freshness/update responsibility, no-branding, and no-advertising constraints.
- **Evidence:** ECan's water-quality page links terms of use. The published ECan data agreement states ECan copyright, source attribution, no ECan branding without permission, no advertising in applications without permission, a public-electronic-data freshness/removal responsibility, and CC BY 4.0 unless specifically stated otherwise. It also notes that provisional values may change.
- **Consequences:** The licensing question no longer blocks the analytical implementation milestone, but it remains a release gate for committed or publicly redistributed data and requires an explicit attribution/freshness plan.

## D-017 — Retain omitted Hilltop quality as unresolved pending source-specific semantics

- **Status:** Accepted for local analytical development on 2026-09-13
- **Decision:** Preserve raw quality-field representation as `missing_field`, `blank_field`, or `nonempty_code`. Keep missing and blank quality excluded from strict primary eligibility as `missing_quality_field`; keep unfamiliar nonempty codes as `unresolved_quality`; retain documented fair/good records and exclude documented compromised/poor records. Evaluate `unflagged_usable` only as a diagnostic scenario.
- **Evidence:** The refreshed 10,426-row profile contains 9,434 missing quality elements, 992 nonempty codes, no blank elements, and no parser quality failures. NEMS/LAWA defines QC200 as no quality/non-verified and QC400 as compromised representation, but the inspected guidance does not establish that an omitted element in this ECan Hilltop response means good, accepted, or unqualified data. The same guidance distinguishes data without a quality code as its own measurable category.
- **Alternatives considered:** Treat omitted/blank quality as usable; reject all records lacking QC500/QC600; implement a source-specific mapping without documentation. The first would materially increase eligible observations but would turn an undocumented absence into an analytical assertion; the latter two would unnecessarily discard documented raw observations. The conservative distinction is recommended and adopted.
- **Consequences:** Strict assets contain 846 eligible observations, 208 usable summaries, and 0 determinate trends. The diagnostic unflagged policy contains 10,280 eligible observations, 1,296 usable summaries, and 17 determinate primary trends, but is not used for production assets. The dashboard must foreground observed history, distributions, coverage, and indeterminate results until source semantics or a validated censor-aware method supports broader analytical use.
