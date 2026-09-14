# Execution plan: responsive history chart layout

Status: Complete

## Objective

Increase the usable plotting area of the selected-site history chart while preserving the accepted map-centric dashboard, analytical contracts, and release safeguards.

## Work units

1. Confirm the fixed primary-column row and fixed SVG plotting coordinates are constraining the chart.
2. Allocate a deliberate desktop map/history ratio and make the SVG dimensions follow its measured panel rather than an intrinsic aspect ratio.
3. Keep compact and mobile layouts usable, with bounded panel behavior and no desktop body scrolling.
4. Add browser regression assertions for chart and plot dimensions at 1440×900, 1536×864, and 1920×1080; regenerate review screenshots.
5. Run applicable frontend, browser, accessibility, and repository gates; update state/gate documentation; archive this plan and commit one UI correction.

## Non-goals

No analytical, data-source, map, release, or methodology changes.

## Outcome

The fixed 205px desktop history row was replaced with a deliberate responsive
map/history split (`1.62fr` / `1fr`, with compact-width safeguards). The chart
now measures its panel with `ResizeObserver`, derives axes, line, points, and
gridlines from the measured SVG dimensions, and retains a compact visible
observation-context legend plus keyboard inspection disclosure. The plotting
region no longer uses the old fixed 492px span or intrinsic SVG aspect ratio.

Verified rendered dimensions from the rebuilt production-shaped dashboard:

- 1440×900: map panel 836×490px; history panel 836×303px; plot 724×150px.
- 1536×864: map panel 932×468px; history panel 932×289px; plot 812×136px.
- 1920×1080: map panel 1316×602px; history panel 1316×371px; plot 1,195×219px.

The 17-test Playwright suite, including real-asset loading, responsive
plot-size assertions, accessibility, no-overflow, and screenshot capture,
passed after the final production build. Typecheck, 12 frontend unit tests,
and production build also passed. Fresh review screenshots are retained in
the ignored `web/screenshots/` directory; the tracked representative
`docs/assets/dashboard-desktop.png` was refreshed.
