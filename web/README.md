# Local dashboard frontend

This is the local production-shaped React/TypeScript/Vite dashboard for the
Ashburton–Hakatere study. It uses the ignored generated asset at
`public/data/ashburton/dashboard.json` when prepared, and clearly falls back to
the checked-in synthetic fixture if that local file is unavailable. It uses
MapLibre with the locally generated ECan catchment polygon and real station
coordinates. The local style intentionally has no remote basemap or tile
dependency.

Prerequisite: Node.js 22 or newer and npm.

The observed-history view uses typed inline SVG plus an HTML table. Numeric
eligible observations are plotted; censored, missing, and excluded records
remain inspectable in the scrollable detail table. This is a rendering choice,
not an analytical methodology decision.

From this directory:

```text
npm ci
npm run typecheck
npm run test:unit
npm run build
npm run test:browser
```

To prepare the local real-data asset, run from the repository root after the
ignored source profile and site audit have been acquired:

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
and captures ignored full-page review screenshots at 1440×900, 1024×768, and
390×844 viewport sizes. Playwright Chromium is downloaded to the normal user
cache; browser binaries, screenshots, traces, and reports are ignored and
must not be committed.

Observation assets remain local-only pending ECan/Hilltop source-term review.
