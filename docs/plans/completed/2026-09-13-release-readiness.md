# Public-release readiness — 2026-09-13

## Objective

Establish the current official source-term position for every source used by
the local dashboard and implement low-risk attribution, freshness, and
reproducible release checks without publishing raw or generated observation
assets.

## Outcome

Reviewed the current official ECan water-quality publication page, ECan Open
Data agreement, ECan Developer Data Portal terms, ECan surface-water ArcGIS
layer, ECan major-catchment ArcGIS layer, and ECan copyright information.
Recorded the actual legacy Hilltop and ArcGIS endpoint inventory and separated
verified terms, reasonable interpretation, unresolved route-specific
permission, and project choices in `docs/RELEASE_READINESS.md`.

The official evidence supports the attribution wording “This work uses data
sourced from Environment Canterbury.”, no ECan/Metro branding without prior
agreement, no advertising without permission, and current-or-remove handling
for a public electronic site. The ECan developer terms also prohibit
licensing, sublicensing, or reselling API content. The inspected material does
not conclusively establish that the exact legacy Hilltop observation route or
exact ArcGIS catchment layer may be publicly redistributed as normalized JSON,
derived assets, or filtered CSV. Public display/download remains blocked.

Implemented safeguards: official attribution and source/terms links in Data
notes; retrieval/build metadata retained; no ECan branding, advertising, or
remote basemap; ignored raw/generated outputs; and
`tools/check_release_readiness.py`, which verifies local asset freshness,
build metadata, attribution, and untracked generated outputs. The normal
check passes as `local-safe-but-not-public`; `--require-public-release`
fails until source terms are explicitly cleared.

## Validation

- `python3 -m unittest discover -s tests -v` — 36 tests pass.
- `python3 tools/validate_fixture.py tests/fixtures/minimal_asset.json` — pass.
- `python3 -m py_compile catchment_dashboard/*.py tools/*.py tests/*.py` — pass.
- `cd web && npm run typecheck && npm run test:unit && npm run build` — pass;
  initial JS 259.79 kB/79.77 kB gzip, CSS 13.86 kB/3.61 kB gzip, MapLibre
  remains separate.
- `cd web && npm run test:browser` — 15 tests pass against the real asset,
  including attribution notes, MapLibre, interactions, axe, console/network,
  overflow, performance, and responsive screenshots.
- `python3 tools/check_release_readiness.py` — local-safe, public blocked.
- `python3 tools/check_release_readiness.py --require-public-release` —
  expected failure because written source-term approval is not recorded.

## Decision boundary

No owner input is required to continue local work. Before public observation
display, public generated assets, or downloadable observation CSV, the owner
needs route-specific written confirmation from ECan or must choose a new
explicitly licensed source. The safest recommendation is written
confirmation; until then a code/UI-only portfolio demonstration without
observation assets is the public fallback.
