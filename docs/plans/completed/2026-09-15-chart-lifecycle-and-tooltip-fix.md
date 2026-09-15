# Chart lifecycle and tooltip bug fix

**Status:** Complete
**Started:** 2026-09-15

## Objective

Restore full responsive time-series plot sizing across coordinated dashboard
selection changes and move chart tooltips into a viewport-aware document overlay,
without changing the accepted dashboard composition, analytical behavior, or
map/history allocation.

## Investigation

- Inspect the SeriesChart mount/measurement lifecycle, conditional chart frame,
  state transitions, SVG sizing, and ancestor overflow/stacking contexts.
- Capture before/after rendered chart and plot measurements for parameter,
  period, station, map-marker, map-display, repeated, and resize transitions.

## Implementation

- Make the chart measurement observer attach to each current chart frame across
  loading, empty, error, and replacement-data lifecycles.
- Preserve the measured container width/height in the SVG viewBox and rendered
  plot region; do not use timing delays or fixed desktop dimensions.
- Render the styled tooltip through a deliberate shared overlay layer attached
  to `document.body`, with viewport-aware flip/clamp placement, pointer/focus
  parity, Escape/selection/unmount cleanup, and existing accessible detail
  semantics.
- Add focused browser regression assertions for responsive width persistence,
  rapid transitions, edge tooltip placement, and stale-overlay cleanup.

## Validation

- TypeScript, frontend unit tests, production build.
- Full Playwright/axe browser suite with real local analytical assets at
  1440×900, 1536×864, 1920×1080, 1024×768, and 390×844.
- Console/network, overflow, focus, tooltip boundary, and screenshot review.
- Diff review and archive this plan when the focused commit is complete.

## Completion notes

- Root cause of the width regression: the chart frame is conditionally absent
  while replacement parameter detail loads, but the original measurement effect
  had an empty dependency list. The replacement frame therefore never received
  a new `ResizeObserver` measurement and retained the initial 620-unit SVG
  fallback viewBox. No component key or analytical state reset was involved.
- Replaced the one-time ref measurement with a stable callback ref plus a
  `useLayoutEffect` keyed to the current frame element. Every mounted frame is
  measured immediately and observed until unmount; the existing responsive
  `ResizeObserver` now survives parameter, station, period, map-mode, rapid
  transition, empty/loading, and browser-resize states without delays or fixed
  desktop dimensions.
- Root cause of tooltip clipping: the tooltip was an absolutely positioned child
  of `.series-chart-frame`, whose intentional `overflow: hidden` clipped it at
  the chart boundary. Tooltips now render through `createPortal` into `body`
  with `position: fixed`, shared `--z-overlay` layering, viewport-coordinate
  placement, horizontal clamping, and above/below flipping.
- Tooltip interaction now supports pointer and keyboard focus, remains
  pointer-transparent, closes on pointer exit, Escape, selection/data changes,
  and unmount, and retains the existing visible styling and accessible detail
  route. SVG points use explicit button semantics and the chart group avoids
  nested-interactive axe violations.
- Focused browser measurements remained full width at every tested state:
  814px frame/SVG and 748.88px plot at 1440×900 through initial, station,
  map-station, parameter, period, map-display, and rapid transitions; after
  resizing to 1536×864 the frame/SVG was 910px and the plot was 837.2px. The
  edge-tooltip test verified the nearest left, right, top, and bottom points,
  viewport containment, body parent, fixed positioning, focus, Escape, and
  stale-state cleanup.
- Validation passed: 40 Python unittest tests, fixture validation, Python
  compilation, frontend typecheck, 12 unit tests, production build, and the
  complete 21-test Playwright/axe suite. The browser suite found no console or
  page errors, failed required requests, horizontal overflow, or serious/critical
  accessibility violations, and retained zero desktop body overflow at 1440×900,
  1536×864, and 1920×1080. Fresh screenshots were inspected at all five
  supported viewports, including `web/screenshots/ashburton-tooltip-edge.png`.
- Bundle impact after the fix: application JS 277.16 kB raw / 85.33 kB gzip;
  CSS 106.71 kB raw / 16.04 kB gzip; MapLibre remains 1,030.65 kB raw /
  277.66 kB gzip. The fix adds no analytical asset or remote runtime data.
- No remaining issue was found in the accepted map/history composition or
  analytical behavior. Public deployment remains outside this work unit.
