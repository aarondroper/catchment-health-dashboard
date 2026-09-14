# Local dashboard frontend

This is the local production-shaped React/TypeScript/Vite dashboard for the
Ashburton–Hakatere study. It uses the ignored generated asset at
`public/data/ashburton/dashboard.json` when prepared, and clearly falls back to
the checked-in synthetic fixture if that local file is unavailable. It uses
MapLibre with the locally generated ECan catchment polygon and real station
coordinates. The dashboard attempts the no-key OpenFreeMap Positron vector
style for restrained geographic context, with OpenFreeMap/OpenMapTiles/
OpenStreetMap attribution shown on the map. If that style or its vector-source
lifecycle is unavailable, the application fails closed to the verified local
catchment geometry and station layers.

Prerequisite: Node.js 22 or newer and npm.

The owner-review landing view defaults to Total Nitrogen at monitoring station
`SQ35874` for 2016–2025 because that selection has broad site coverage and a
supported distribution summary without being chosen for an extreme result. The
observed-history view uses a labelled linear SVG scale plus an HTML table.
Numeric eligible observations are plotted; censored, missing, and excluded
records remain inspectable in the legend, expandable row details, and CSV
export. These are rendering choices, not analytical methodology decisions.

From this directory:

```text
npm ci
npm run typecheck
npm run test:unit
npm run build
npm run test:browser
```

To prepare the local real-data asset without the full release rehearsal, run
from the repository root after the ignored source profile and site audit have
been acquired:

```text
python3 tools/audit_catchment_sites.py
python3 tools/prepare_dashboard_assets.py
```

The prepared local contract is `2.0.0`: the shell contains metadata, geometry,
stations, summaries, coverage, and trends; parameter-partitioned observation
files are fetched on demand and decoded with lookup validation. The browser
suite starts Vite, verifies the real shell and initial partition requests,
checks coordinated controls, MapLibre selection, export, fallback/error state,
keyboard access, and no-data/censored/indeterminate behavior, runs axe-core,
checks map-context fallback and desktop body overflow, and captures ignored
full-page review screenshots at 1440×900, 1536×864, 1024×768, and 390×844
viewport sizes. Playwright Chromium is downloaded to the normal user
cache; browser binaries, screenshots, traces, and reports are ignored and
must not be committed.

The current ECan water-quality Terms of Use provide an attributed CC BY 4.0
reuse basis, separately from the CC BY 3.0 NZ spatial-source licences. Public
hosting still requires the reproducible release command, freshness/remove
operation, attribution, accompanying terms, and owner authorization. Generated
observation assets remain ignored in this repository.
