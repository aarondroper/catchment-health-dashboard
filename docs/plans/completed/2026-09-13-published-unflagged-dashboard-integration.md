# Published-unflagged dashboard integration

**Status:** Completed
**Started:** 2026-09-13
**Scope:** Adopt the owner-approved two-tier quality policy, regenerate local analytical assets, and integrate the real ignored assets into a production-shaped local React dashboard.

## Objective

Use `published_unflagged` as the primary exploratory-dashboard disposition for
observations returned without a source quality-code field, retain strict
sensitivity analysis, and make the resulting site/parameter/window coverage,
summaries, observations, and supported trends inspectable through coordinated
local dashboard views.

## Guardrails

- QC600/QC500 remain explicitly labelled; `published_unflagged` is not “good”
  or quality-verified.
- Blank fields, unknown codes, QC400, censored, missing, invalid, and conflict
  states remain distinguishable and governed by explicit rules.
- Keep ignored local assets out of git and do not publicly deploy observations.
- Do not add thresholds, composite scores, causal claims, or health classes.

## Work units

1. Update analytical dispositions, strict sensitivity reporting, contracts, and
   tests.
2. Regenerate and inspect local production-policy assets and policy-sensitive
   summaries/trends.
3. Create a local asset materialization step for the React app without
   committing generated observations.
4. Replace the fixture-only view with coordinated real-asset controls, map/site
   coverage, observations, distributions, summaries, trend states, and detail.
5. Add validation and visual checks, update governance, archive this plan, and
   commit.

## Acceptance evidence

- Production assets use `published_unflagged` and retain strict comparison data.
- Site/parameter/window controls update all applicable views consistently.
- The local app visibly distinguishes observed, censored, excluded, missing,
  unavailable, and indeterminate states.
- Real ignored assets load locally; no observation data is tracked or deployed.
- Python and frontend gates pass, and representative desktop/tablet/mobile
  layouts are inspected or the unavailable browser tooling is recorded.

## Outcome

Implemented and locally verified on 2026-09-13. The primary policy is now
`published_unflagged`, with strict sensitivity retained. The regenerated local
asset contains 10,426 observations, 10,280 eligible observations, 19 stations,
1,830 summaries, and 324 trend records. Forty-one trends are reported and 283
are indeterminate; 17 reported trends are in the primary window. The React app
loads the ignored asset, coordinates parameter/window/station and map-pin
selection, and exposes observations, censoring, exclusions, summary/trend
states, coverage, comparison, and provenance context. Python tests,
fixture-validation, compilation, `npm ci`, TypeScript typecheck, production
build, runtime HTTP delivery, and ignore-rule checks passed. No browser or
screenshot automation is installed, so visual verification beyond responsive
CSS inspection and the production build remains the next frontier.

The plan is archived. Public observation release remains blocked by
the unresolved dataset-specific Hilltop/source-terms gate.
