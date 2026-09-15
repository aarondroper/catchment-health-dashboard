# Map controls and attribution cleanup

## Objective

Make the map controls and attribution presentation unambiguous without changing
the accepted dashboard layout, map behavior, analytical modes, or data.

## Implemented

- Disabled MapLibre's built-in attribution control at map construction.
- Retained one accessible `<details>` source control, collapsed by default,
  with links for OpenFreeMap, OpenMapTiles, OpenStreetMap, Environment
  Canterbury monitoring sites, and Major Catchment Boundaries when remote
  context is loaded.
- Switched the retained source control to local-fallback wording and ECan
  spatial credits when OpenFreeMap is unavailable; remote-provider credits are
  not shown as loaded in fallback mode.
- Moved MapLibre navigation to the top-right and placed Reset view plus the
  legend in a deliberate top-left stack, removing their previous collision.
- Removed the visible map footer/status strip. Context state remains in a
  visually clipped `role="status"` live region for assistive technology and
  application state.
- Added browser checks for control bounding-box non-overlap, exact single
  attribution presence, collapsed initial state, keyboard expansion, complete
  links, fallback-specific credits, and all owner-review viewport captures.

## Licence evidence

The preserved source evidence requires attribution and accompanying terms but
does not prescribe an expanded visual format. The compact disclosure remains
visible and keyboard operable, and its expanded content preserves the required
provider/source links. No source credit is hidden with CSS or duplicated by a
MapLibre-generated control.

## Validation evidence

- `npm run typecheck` passed.
- `npm run test:unit` passed: 12 tests.
- `npm run build` passed.
- Full Playwright/axe suite passed: 22 tests, using the real local analytical
  asset and production preview on an alternate local port because 4173 was
  occupied by an unrelated workspace service.
- Focused remote/fallback attribution and viewport suite passed: 4 tests.
- Browser checks covered 1440×900, 1536×864, 1920×1080, 1024×768, and 390×844;
  fresh ignored screenshots were captured. The environment exercised the
  documented local fallback path for the external context request, while the
  remote-credit branch remains covered conditionally when the provider loads.
- Browser output reported no application console errors, page errors, failed
  required requests, horizontal overflow, or serious/critical axe findings.

## Outcome

Completed and archived on 2026-09-15. No analytical, map-data, source-term, or
release-boundary changes were made. Generated assets, screenshots, browser
artifacts, and raw responses remain ignored; no publication or deployment was
performed.
