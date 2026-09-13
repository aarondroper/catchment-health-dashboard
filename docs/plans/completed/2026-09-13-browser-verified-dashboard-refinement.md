# Browser-verified dashboard refinement

**Status:** Completed
**Started:** 2026-09-13
**Scope:** Establish local headless-browser verification and refine the production-shaped Ashburton–Hakatere React dashboard without changing analytical scope or policy.

## Objective

Make the local real-data dashboard visually coherent, responsive, accessible,
and interaction-verified at desktop, tablet, and mobile viewports.

## Guardrails

- Keep the adopted `published_unflagged` policy, analytical assets, windows,
  and trend safeguards unchanged unless browser testing reveals a correctness
  defect.
- Keep observation assets local/ignored; do not deploy or commit generated data,
  browser binaries, screenshots, traces, or temporary profiles.
- Prefer focused UI and test changes over new analytical functionality.

## Work units

1. Inspect and establish Playwright/Chromium verification if absent.
2. Improve hierarchy, map/chart/detail presentation, responsive behavior,
   loading/error/no-data states, and accessible semantics based on screenshots.
3. Add focused browser tests for real-asset loading and coordinated controls.
4. Measure bundle/asset/runtime behavior and correct proportionate issues.
5. Run all gates, inspect screenshots and console/network output, update docs,
   archive this plan, and commit.

## Acceptance evidence

- Real asset loading is asserted in the browser and fixture fallback is not
  silently used.
- Parameter, window, station, map-pin, no-data, censored, indeterminate, and
  fallback/error behaviors have meaningful browser assertions.
- Screenshots at approximately 1440×900, 1024×768, and 390×844 are inspected;
  generated artifacts remain ignored.
- Responsive overflow, focus/contrast, console errors, failed requests, and
  bundle/asset sizes are checked.
- Governance documentation and the next frontier reflect the validated state.

## Outcome

- Established Playwright with a user-cache Chromium install and axe-core
  accessibility checks; browser artifacts and screenshots remain ignored.
- Refined the real-data dashboard shell, controls, schematic station map,
  observed-history chart/table, empty states, responsive layout, contrast, and
  focusable detail regions without changing analytical scope or policy.
- Added eight browser tests covering real-asset loading, coordinated parameter,
  window, station, and map interactions, no-data/censored/indeterminate states,
  fixture fallback/error behavior, accessibility, asset timing, and three
  responsive screenshot viewports.
- Verified the prepared asset loaded at `/data/ashburton/dashboard.json` with
  19 sites and no fallback, no browser console/page/network errors, no serious
  or critical axe violations, and no horizontal overflow at 1440×900,
  1024×768, or 390×844.
- Measured the local analytical asset at 10,473,514 bytes. The production
  bundle remains small relative to the data payload; the asset size is a
  documented future partitioning/performance consideration.
- Updated frontend, architecture, quality-gate, project-state, and backlog
  documentation. Public observation redistribution and source-term review
  remain release gates.

## Self-review and limitations

The verified map is intentionally a coordinate-based local schematic rather
than a licensed runtime basemap or full catchment geometry layer. This keeps
the local workflow usable without remote tile requests, but runtime geometry
and public data delivery remain later release work. No configured formatter,
frontend linter, CI, or public deployment exists; those checks remain recorded
as unavailable rather than implied.
