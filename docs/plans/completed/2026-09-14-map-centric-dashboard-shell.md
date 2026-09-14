# Map-centric dashboard shell

**Status:** Completed and archived on 2026-09-14
**Scope:** Recompose the local React dashboard into a viewport-filling,
map-centric Ashburton–Hakatere monitoring workspace while preserving the
accepted analytical contracts, release safeguards, and export behavior.

## Work units

1. Inspect the reference and current real-data application, then define the
   compact desktop, compact-width, and mobile information architecture.
2. Replace the document-flow layout with a dashboard shell: compact header,
   control/context rail, dominant MapLibre map, selected-site history, compact
   analytical rail, and modal/drawer detail surfaces.
3. Add a restrained OpenFreeMap vector basemap with visible attribution and a
   deterministic local geometry-only fallback for unavailable basemap requests.
4. Add the smallest useful data-backed map display modes: availability,
   relative selected-window median, and supported neutral trend direction.
5. Add/adjust component and browser tests for viewport fit, responsive layout,
   basemap/fallback behavior, map modes, dialog detail, accessibility, and
   existing coordinated interactions.
6. Update governance and release documentation, visually inspect all requested
   viewports against the supplied reference, archive this plan, and commit the
   completed milestone without publishing or deploying.

## Guardrails

- Do not change analytical methodology, parameter scope, source terms, data
  freshness, or quality/censoring rules.
- Do not introduce unsupported health, compliance, threshold, flow, or seasonal
  claims.
- Do not track generated observation assets, browser artifacts, or the supplied
  reference image.
- Record OpenFreeMap/OpenStreetMap attribution, privacy/availability caveats,
  and the fallback behavior separately from ECan data licensing.

## Exit criteria

- At 1440×900 and larger the primary dashboard has no body scrollbar and the
  map, controls, selected-site history, summary/trend/comparison, and recent
  observations are reachable without page scrolling.
- 1024×768 remains a dashboard composition; mobile reflows coherently with
  bounded internal detail surfaces.
- Real production-shaped assets load without fixture fallback; map selection,
  controls, export, map modes, dialogs, and failure states remain coordinated.
- Playwright, axe, unit/type/build, asset/release, overflow, console/request,
  and visual checks pass or are recorded as unavailable with evidence.
- Documentation reflects the implemented shell and basemap dependency; the
  plan is archived and the work is committed.

## Outcome

- Replaced the long document flow with a compact header, left control/context
  rail, dominant MapLibre map plus selected-site history, and right analytical
  rail. Full observation detail and technical provenance remain in accessible
  dialogs.
- Added availability, relative selected-window median, and neutral supported
  trend map modes. The selected-window median uses relative bands only; it is
  not a health classification.
- Added OpenFreeMap Positron style loading with on-map
  OpenFreeMap/OpenMapTiles/OpenStreetMap attribution. A startup/style-readiness
  watchdog fails closed to the verified local catchment geometry and station
  layers when the remote vector lifecycle is incomplete. The fallback also
  renders the verified polygon outline independently of the unavailable
  contextual tiles and provides a reset-to-catchment control. The current
  headless environment exercised that fallback; no ECan visitor requests were
  made.
- The owner-review default remains Total Nitrogen at `SQ35874`, 2016–2025:
  this is a neutral coverage-led choice with 15 sites returning observations,
  a supported selected-site median/IQR, a 117-record history, and a readable
  cross-site comparison, rather than a result chosen for direction or
  severity.
- Validation: `npm run typecheck`, `npm run test:unit`, `npm run build`, and
  the 17-test Playwright/axe suite pass. The browser suite found no application
  console/page errors, failed required requests, horizontal overflow, or
  serious/critical axe violations. Desktop body overflow is zero at
  1440×900, 1536×864, and 1920×1080; compact/mobile screenshots were captured
  at 1024×768 and 390×844.
- Production build output remains source-map free. The current frontend build
  is approximately 271.4 kB raw/83.0 kB gzip for the application chunk and
  1,030.7 kB raw/277.7 kB gzip for the lazy MapLibre chunk. The browser’s
  measured shell transfer was 88.0 kB and the initial Total Nitrogen partition
  33.0 kB in the local preview; runtime readiness was approximately 74 ms in
  the passing performance check.
- Screenshot paths (ignored local review artefacts):
  `web/screenshots/ashburton-desktop.png`,
  `web/screenshots/ashburton-wide.png`,
  `web/screenshots/ashburton-compact.png`, and
  `web/screenshots/ashburton-mobile.png`.
- The supplied mockup remains an untracked reference. No generated analytical
  data, raw responses, browser binaries, traces, or deployment artefacts were
  added to version control.
