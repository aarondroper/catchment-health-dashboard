# Bounded observation-quality profile

## Objective

Make the spatially validated Ashburton acquisition slice auditable at the
site/parameter level without adopting normalization, exclusion, censoring,
unit-conversion, or analytical rules.

## Scope

- Extend the existing source-preserving profile summary with per-site and
  per-parameter counts, units, null/censoring, and quality-code presence.
- Keep source timestamps, values, result text, units, quality codes, and
  censoring unchanged.
- Treat Hilltop's explicit no-data responses as a reported absence and fail on
  other source errors or incomplete responses.
- Run the nine-parameter profile inside the verified ECan polygon and record
  bounded coverage evidence for owner review.

## Acceptance criteria

- A small fixture verifies site/parameter quality summaries and no-data states.
- The live profile reports site-level coverage without pretending to represent
  complete catchment history.
- No parameter set, canonical unit, quality exclusion, censoring substitution,
  aggregation, trend, threshold, or health/status label is selected.
- Applicable Python, fixture, compilation, frontend, diff, and JSON gates pass.
- Documentation and project state distinguish bounded evidence from adopted
  methodology; the completed plan is archived.

## Outcome

Completed on 2026-09-13. The profile summary now emits deterministic
site/parameter quality records with counts, units, censoring categories, and
quality-code presence. Hilltop empty and `No data` responses are explicit
`no_observations` counts while unexpected source errors still fail. The live
three-parameter profile verified 243 observations across 10 in-bound sites,
with 9 sites producing data. Twenty-one Python tests and the repository's
fixture, compilation, frontend, JSON, and diff gates pass. The plan remains
bounded evidence; normalization, final parameters, and analytical methods are
not selected.
