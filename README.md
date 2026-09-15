# Catchment Health Dashboard

![Ashburton–Hakatere monitoring dashboard](docs/assets/dashboard-desktop.png)

An evidence-led environmental monitoring dashboard for the Ashburton–Hakatere
catchment. It helps users see what was sampled, where, over which period, and
which summaries or neutral trend results are supported—without turning sparse
observations into a health score or compliance claim.

## What the project demonstrates

- A map-centric React/TypeScript dashboard with MapLibre, coordinated station,
  parameter, period, history, comparison, coverage, observation-detail views,
  and filtered CSV export.
- Real Environment Canterbury observations reconciled to 19 in-bound station
  IDs, with 15 stations producing selected-parameter observations and four
  retained as observation-free or metadata-only scope.
- Source-preserving normalization: original values, result text, units,
  timestamps, quality representation, censoring, exclusions, identifiers, and
  provenance remain inspectable.
- Median/IQR summaries, conservative trend screening, deterministic versioned
  assets, and runtime freshness safeguards.

## Data and analytical workflow

Build-time Python adapters acquire the ECan ArcGIS boundary and station
inventories plus the public Hilltop water-quality route. Normalization and
analysis produce a versioned runtime shell and parameter partitions; the
browser serves those static assets and does not call ECan during interaction.
The current retained history is 2007–2025, with 2016–2025 as the primary
window and 2020–2025 as the recent window. Six parameters are core; Total
Phosphorus and Water Temperature are retained as secondary parameters.

Published-unflagged observations are usable exploratory records when the
published response supplies no quality field; this is not an explicit quality
verification. Censored observations remain distinguishable and are not
replaced by half detection limits. Summaries, trends, exclusions, and
indeterminate reasons follow [`docs/METHODOLOGY.md`](docs/METHODOLOGY.md).

## Run locally

Prerequisites are Python 3.12+, Node.js 22+, npm, and network access when
acquiring a fresh profile.

To prepare real ignored analytical assets and build the application:

```bash
python3 tools/release_build.py
```

The command validates licensed sources, reconciles station inventories,
generates ignored runtime assets, checks public-release conditions, installs
the locked frontend dependencies, and creates `web/dist/`. A prepared local
frontend can then be run with:

```bash
cd web
npm ci
npm run dev
```

Open `http://localhost:5173/`. Generated analytical assets are intentionally
ignored; a fresh clone must prepare them locally. The frontend retains an
explicit synthetic fallback for development, but it is not a substitute for
preparing the real asset when reviewing the application.

## Validate and rehearse release

Contributor commands and their purpose are in
[`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md). The complete static release
rehearsal is:

```bash
python3 tools/release_build.py
```

It fails closed for stale, malformed, incomplete, unlicensed, or accidentally
tracked generated inputs. Public deployment is not configured or performed
by this repository. Cloudflare Pages preparation uses a direct Wrangler
deployment of the locally validated `web/dist/` artifact; see
[`docs/RELEASE.md`](docs/RELEASE.md). A Git-connected Pages build is not
appropriate because the real analytical assets are intentionally ignored.

## Sources, attribution, and licences

Water Quality Data is reused under Environment Canterbury's preserved,
dataset-specific CC BY 4.0 Terms of Use. The surface-water monitoring sites
and Major Catchment Boundaries have separately recorded CC BY 3.0 New Zealand
licences. OpenFreeMap, OpenMapTiles, OpenStreetMap, and Natural Earth retain
their own terms and attribution. Evidence and current source details are in
[`docs/DATA_SOURCES.md`](docs/DATA_SOURCES.md) and [`docs/RELEASE.md`](docs/RELEASE.md).

MIT applies only to original project source code; it does not relicense ECan
observations or spatial layers, map content, fonts, third-party dependencies,
or other external assets. See [`LICENSE`](LICENSE).

## Limitations

This is a monitoring-history view, not a claim of complete environmental
coverage or current catchment-wide condition. Sampling is irregular, source
publication can lag collection, and some summaries or trends are unavailable
under the conservative eligibility and censoring rules. No regulatory
thresholds, causal conclusions, composite score, ECan branding, or live demo
URL is implied.
