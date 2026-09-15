# Interface simplification milestone

**Status:** Complete
**Date:** 2026-09-15

## Objective

Reduce presentation noise in the existing map-centric Ashburton–Hakatere
dashboard without changing its analytical behavior, primary map/history sizing,
right analytical rail, source boundaries, or release safeguards.

## Scope

- simplify the header, controls card, catchment summary, and footer;
- add reusable restrained control/action SVG icons;
- move CSV scope selection into an accessible confirmation dialog;
- replace the map-context status card with a small local New Zealand locator;
- preserve the primary MapLibre status only where it is already useful;
- update browser tests, screenshots, and affected frontend/governance docs.

## Validation and completion

- run frontend typecheck, unit tests, production build, and Playwright/axe
  browser checks;
- inspect 1440×900, 1536×864, 1920×1080, compact, and mobile screenshots;
- confirm desktop body overflow remains absent and real assets still load;
- review the diff, update project state/backlog/readme, archive this plan, and
  create one coherent commit.

## Outcome

Implemented and browser-verified on 2026-09-15. The header now keeps only the
Data notes action; controls use one heading, title-case labels, replaceable
inline SVG slots, and a compact export action whose scope is chosen in an
accessible dialog. The catchment summary is tabular and includes sampled
history. The former map-status card is now a static Natural Earth-derived New
Zealand locator with an Ashburton–Hakatere marker. The primary MapLibre map,
history chart, analytical rail, data semantics, and release safeguards were
not changed.

`npm run typecheck`, `npm run test:unit`, `npm run build`, and the 19-test
Playwright/axe browser suite passed. The browser suite confirmed real local
asset loading, no desktop body or horizontal overflow, keyboard and dialog
behavior, export determinism, fallback/error behavior, and unchanged history
plot measurements. Review screenshots were regenerated in the ignored
`web/screenshots/` directory at desktop, wide desktop, ultrawide desktop,
compact, and mobile sizes.
