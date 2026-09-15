# Restore compact map attribution control

## Evidence and implementation

The parent of `6047b93` used MapLibre's `{ compact: true }` attribution option
and a separate plain-text `.map-attribution`; repository history contains no
custom application `i` implementation. The faulty commit disabled the MapLibre
control and introduced the narrow `Map sources` disclosure. This correction
keeps `attributionControl: false` and restores the familiar compact interaction
as an application-owned circular `i` trigger.

- Removed the `Map sources` `<details>` and its in-map scrolling content strip.
- Added one collapsed circular `i` button with an accessible name and
  `aria-expanded`/`aria-controls` state.
- Rendered the expanded source content through a fixed document-level overlay,
  positioned against the trigger and bounded to the viewport so the map's
  overflow containment cannot clip it.
- Added Escape and outside-pointer close behavior, Escape focus restoration,
  viewport repositioning, and responsive readable content.
- Preserved remote OpenFreeMap/OpenMapTiles/OpenStreetMap credits and
  ECan spatial-source credits in remote mode; fallback mode omits remote
  providers and identifies the local context fallback.
- Preserved the Reset/legend top-left stack, top-right MapLibre navigation,
  removed visible status footer, map data, and analytical behavior.

## Validation

- `npm run typecheck` passed.
- `npm run test:unit` passed: 12 tests.
- `npm run build` passed.
- Full Playwright/axe suite passed: 22 tests, using the real local analytical
  asset and rebuilt production bundle on an alternate local preview port
  because 4173 was occupied by an unrelated workspace service.
- Focused fallback and all-viewport attribution checks passed. They verified
  1440×900, 1536×864, 1920×1080, 1024×768, and 390×844, collapsed-by-default
  state, compact `i` trigger, complete links, viewport bounds, no normal
  scroll strip, keyboard activation, Escape, and focus restoration.
- Browser checks reported no application console errors, page errors, failed
  required requests, horizontal overflow, or serious/critical axe findings.
- Fresh ignored desktop, compact, and mobile screenshots were inspected; the
  `i` control is visible and unobtrusive without altering map control placement.

## Outcome

Completed and archived on 2026-09-15. No analytical, map-data, licensing,
source, release, or deployment behavior changed. Generated assets, screenshots,
browser artifacts, and raw responses remain ignored; nothing was published.
