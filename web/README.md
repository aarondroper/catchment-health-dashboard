# Local dashboard frontend

This is the local production-shaped React/TypeScript/Vite dashboard for the
Ashburton–Hakatere study. It uses the ignored generated asset at
`public/data/ashburton/dashboard.json` when prepared, and clearly falls back to
the checked-in synthetic fixture if that local file is unavailable. It uses
MapLibre as an explicit type/runtime dependency, but the current map is a
coordinate-based local schematic and does not request remote tiles.

Prerequisite: Node.js 22 or newer and npm.

The observed-history view uses typed inline SVG plus an HTML table. Numeric
eligible observations are plotted; censored, missing, and excluded records
remain inspectable in the scrollable detail table. This is a rendering choice,
not an analytical methodology decision.

From this directory:

```text
npm ci
npm run typecheck
npm run build
npm run test:browser
```

To prepare the local real-data asset, run from the repository root:

```text
python3 tools/prepare_dashboard_assets.py
```

The browser suite starts Vite, verifies the real asset request, checks the
coordinated controls and fallback/error state, runs axe-core checks, and
captures ignored screenshots at 1440×900, 1024×768, and 390×844. Playwright
Chromium is downloaded to the normal user cache; browser binaries, screenshots,
traces, and reports are ignored and must not be committed.

Observation assets remain local-only pending ECan/Hilltop source-term review.
