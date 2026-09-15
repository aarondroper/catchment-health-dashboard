# Visual-system and interface-polish milestone

**Status:** Complete
**Started:** 2026-09-15

## Objective

Refine the existing map-centric Ashburton–Hakatere dashboard into a more
cohesive, mature environmental-monitoring interface without changing its
information architecture, analytical behavior, data contracts, map modes,
release safeguards, or responsive dashboard composition.

## Baseline evidence

- React 19 / TypeScript / Vite frontend with shared styles in
  `web/src/styles.css` and focused components under `web/src/components/`.
- Current font is Inter with system fallbacks; no bundled application font or
  remote font loading is present.
- Shared styling is token-light and repeats white rounded panels, pale borders,
  small bold labels, badges, and shadows across rails, map overlays, charts,
  tables, and dialogs.
- MapLibre owns the primary map, with OpenFreeMap context, local geometry
  fallback, attribution, legends, markers, and status state in `MapPanel`.
- `SeriesChart` uses SVG sizing driven by a `ResizeObserver`; the corrected
  map/history allocation must remain unchanged.
- Responsive breakpoints are 1180, 1100, 1040, 760, and 500 px; desktop uses
  `100dvh` and hidden body overflow, while mobile reflows and permits page
  scrolling.
- Baseline review screenshots are the current ignored files in
  `web/screenshots/` at 1440×900, 1536×864, 1920×1080, 1024×768, and 390×844.
- Baseline repository state was clean apart from the intentionally untracked
  `references/` directory. Latest commit before this work: `f8d6e34`.

## Work units

1. Add and verify a self-hosted Source Sans 3 font subset/weights, then
   rationalize shared type, spacing, color, surface, control, status, and data
   display tokens without introducing a new UI framework.
2. Reduce repeated panel/card chrome and refine the header, controls, glance
   summary, inset, map overlays, history chart, analytical rail, tables, and
   dialogs through shared primitives and narrowly scoped component rules.
3. Preserve the current New Zealand locator label containment, map status,
   chart dimensions, compact comparison mode, keyboard/dialog behavior, and
   all analytical/release semantics.
4. Add focused browser assertions for actual Source Sans 3 application,
   desktop overflow, comparison mode, label containment, and retained
   interaction states. Regenerate and inspect all owner-review screenshots.
5. Run the applicable repository gates, update affected documentation, archive
   this plan with measured outcomes, and commit one coherent UI refinement.

## Validation gates

- `python3 -m pytest -q`
- fixture/source validation and Python compilation where applicable
- `npm run typecheck`, `npm run test:unit`, `npm run build`
- focused and full Playwright/axe browser checks against the production-shaped
  real-data build
- browser checks for font loading/application, overflow, chart dimensions,
  map fallback/status, context-label bounds, dialogs, keyboard operation, and
  compact comparison behavior
- visual inspection at all five supported review viewports
- `git diff --check`, ignored-artifact review, and final repository-state review

## Completion notes

- Added locally bundled Source Sans 3 weights 400, 500, 600, and 700 through
  `@fontsource/source-sans-3`; the browser assertion confirms the applied family
  and all four local WOFF2 resources without a remote font request.
- Introduced shared visual tokens for typography, color, spacing, surfaces,
  borders, radii, focus states, and overlays. Reduced routine panel shadows and
  repeated card chrome, grouped the right analytical rail, and removed the
  eyebrow-plus-heading duplication from user-facing cards and dialogs.
- Refined supporting typography, controls, map overlays, chart labels/tooltips,
  comparison labels, table/dialog surfaces, and compact-height rail sizing while
  preserving the accepted map/history allocation, map behavior, interaction
  state, analytical rules, export contract, and release safeguards.
- The real local asset was verified in-browser with 19 sites, the coverage-led
  Total Nitrogen / `SQ35874` / 2016–2025 default, populated history, site
  comparison, and recent observations. Review screenshots were regenerated and
  inspected at 1440×900, 1536×864, 1920×1080, 1024×768, and 390×844 under the
  ignored `web/screenshots/` directory.
- Validation passed: Python suite/fixture validation/compilation, frontend
  typecheck, 12 unit tests, production build, and all 19 Playwright/axe tests.
  The browser suite reported no application console/page errors, failed
  required requests, horizontal overflow, or serious/critical axe violations;
  desktop body overflow remained zero at 1440×900, 1536×864, and 1920×1080.
  Measured plotting regions remained 748×151px, 837×137px, and 1,212×220px at
  those desktop sizes.
- Remaining limitation: the local application still uses the documented
  OpenFreeMap runtime dependency when available and falls back to verified local
  geometry; external publication, hosting, and operational refresh/removal
  remain owner-authorized release work.
