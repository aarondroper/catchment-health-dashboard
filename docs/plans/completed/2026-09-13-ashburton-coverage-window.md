# Ashburton coverage-window profile

## Objective

Test the previously suggested 2007–2024 technical window against the
spatially validated Ashburton–Hakatere profile, using the existing source-
preserving acquisition route and candidate parameter list.

## Scope

- Query the nine configured candidate parameters for the current in-bound
  bounded site set from 2007-01-01 through 2024-12-31.
- Preserve source values, timestamps, units, quality flags, censoring, and
  explicit no-data responses.
- Report per-parameter and per-site/parameter observation spans and counts.
- Compare coverage evidence without selecting a final parameter set, analysis
  window, completeness threshold, unit conversion, quality exclusion,
  censoring substitution, aggregation, or trend method.
- Keep the generated profile ignored because redistribution terms remain under
  review.

## Acceptance criteria

- The live retrieval either completes with explicit source coverage or fails
  clearly on incomplete/unexpected responses.
- The result distinguishes no observations from unavailable metadata and from
  transport/source errors.
- Documentation records the evidence and remaining owner-level decisions.
- Applicable tests and repository quality gates pass; the plan is archived.

## Outcome

Completed on 2026-09-13. The live 2007–2024 profile retrieved 8,644
observations across the 10 spatially validated site joins. Eight parameters
covered 9 sites; pH covered 5 sites, ended in 2013, and had no reported unit.
The profile preserved 7,825 numeric, 804 left-censored, 15 right-censored,
and two data-free responses. This is bounded coverage evidence, not a final
parameter or time-window decision. The live retrieval, Python tests, fixture,
compilation, frontend, JSON, and diff gates passed.
