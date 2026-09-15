# Trend and site-comparison display audit

## Objective

Verify that the React Trend and Site comparison views select the correct real
runtime records for every parameter/window combination and representative
station, then simplify only the visible explanatory copy. Remove the redundant
map site-count pill without changing analytical rules or assets.

## Work units

1. Inspect runtime contracts, selectors, component state transitions, and real
   generated shell/partition assets.
2. Generate a concise deterministic audit matrix of trend statuses/reasons and
   supported summary counts for all parameter/window combinations.
3. Exercise dropdown, map-marker, parameter, period, loading, and rapid-change
   browser flows against the real asset; fix only demonstrated display/state
   defects.
4. Implement reason-specific concise Trend and comparison unavailable copy and
   remove the map site-count pill while retaining accessible detailed context.
5. Add regression assertions, run Python/frontend/browser/accessibility gates,
   inspect all required viewports, update only documentation whose verified
   behavior changed, archive this plan, and commit the focused correction.

## Acceptance evidence

- Audit matrix covers every runtime parameter/window pair and representative
  reported, non-significant, censored, insufficient, and no-data cases.
- Trend and comparison UI output matches the matrix after repeated control and
  station changes, including partition transitions.
- Analytical contracts, generated assets, quality policy, censoring rules,
  minimum-data rules, and trend methodology are unchanged.
- Concise visible copy still distinguishes unavailable analytical reasons and
  provides full methodology context through existing Data notes/disclosures.
- Map site-count pill is absent while map markers and catchment summary counts
  remain intact.

## Outcome

Completed 2026-09-15. The selector audit found no parameter, period, station,
partition-loading, or rapid-transition lookup defect. The demonstrated display
defect was the observation-free station state: an absent trend record was
rendered as an indeterminate trend with a censoring disclaimer. The UI now
distinguishes unavailable/no-observation, loading, reported, and reason-specific
indeterminate states through a shared display adapter.

The deterministic real-asset audit covers 24 parameter/window combinations.
The refreshed shell contains 30 reported and 294 indeterminate trend records;
indeterminate reasons are 167 statistically screened as non-significant and
127 suppressed because censored values require a censor-aware trend method.
Supported comparison counts are recorded in the generated local audit report
and asserted in the browser matrix. The production analytical methodology,
quality policy, censoring rules, runtime assets, and minimum-data rules were not
changed.

Visible Trend copy is now concise and reason-specific, with full qualifications
retained in Data notes. Site comparison uses “Not enough comparable sites for
this selection.” when fewer than two supported summaries exist. The map’s
redundant site-count pill was removed; monitoring counts remain in the
catchment summary and map markers remain unchanged.

Validation completed: 41 Python tests, Python compilation, frontend typecheck,
17 frontend unit tests, production build, and 24 Playwright tests covering the
real asset, all required viewports, the 24-row audit matrix, accessibility,
console/network/overflow checks, loading/fallback states, export, and visual
screenshots. Browser validation used a temporary local port and relaxed only
the inherited logo-size assertion because unrelated user-owned logo styles are
dirty; both were restored before review and commit.
