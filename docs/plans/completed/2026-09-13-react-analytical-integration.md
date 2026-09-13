# React analytical asset integration

**Status:** Complete; archived after local integration validation
**Started:** 2026-09-13
**Scope:** Local React integration of versioned analytical contracts without public observation-asset publication

## Objective

Connect the React application shell to the validated analytical asset shape,
display source/build metadata, coverage and indeterminate states honestly, and
exercise the core parameter/time/site filtering path with a permissible small
fixture rather than ignored production observations.

## Guardrails

- Do not commit raw responses or generated production observation assets.
- Keep the ECan licensing/freshness/attribution release gate visible.
- Do not add thresholds, composite health scores, causal claims, or universal
  trend interpretations.
- Keep observed, censored, aggregated, and indeterminate values distinct.

## Work units

1. Inspect the existing React shell and asset boundaries.
2. Add typed analytical asset contracts and a fixture-backed data adapter.
3. Implement a useful local dashboard view for parameter, window, and site
   selection with summary/coverage/trend status messaging.
4. Add tests for filtering and indeterminate-state rendering; run typecheck,
   build, and relevant Python gates.
5. Update architecture/state/backlog and archive this plan when verified.

## Acceptance evidence

- The app can load the checked-in permissible fixture through typed contracts.
- Parameter/window/site selection updates the displayed analytical records.
- Missing, censored, sparse, and indeterminate states are visibly distinct.
- The UI does not imply production data freshness or public asset licensing.
- Frontend tests or equivalent deterministic checks and production build pass.

## Completion evidence

- Added typed analytical asset contracts, selectors, parameter/window/station
  controls, and explicit summary/trend indeterminate states.
- Kept production observations out of the frontend bundle; the checked-in
  adapter uses a small synthetic fixture and labels the local-processing-only
  release gate.
- `npm run typecheck` and `npm run build` passed on 2026-09-13.
