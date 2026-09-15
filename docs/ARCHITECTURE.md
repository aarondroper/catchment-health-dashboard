# Architecture

The project separates licensed environmental-source acquisition from the
browser runtime. A reproducible build retrieves source inventories and
observations, validates them, computes analytical outputs, and produces static
versioned assets for the React application.

```text
ECan ArcGIS + Hilltop sources
        -> Python acquisition and source manifests
        -> source-preserving normalization and eligibility
        -> summaries, coverage, and screened trends
        -> runtime shell + parameter partitions
        -> static React/TypeScript dashboard
```

## Processing

`catchment_dashboard/` contains the source contracts, ECan adapters, geometry
membership, normalization, analytics, and freshness/release checks. The
`tools/` scripts orchestrate acquisition, coverage reconciliation, analytical
asset generation, fixture validation, and release rehearsal. Original source
values, result text, units, timestamps, quality representations, censoring,
exclusion reasons, identifiers, and provenance are retained in the processing
contracts. Summary and trend eligibility is deliberately stricter than source
retention; see [`METHODOLOGY.md`](METHODOLOGY.md).

The runtime contract is a versioned JSON shell with shared lookup tables,
station and parameter metadata, local catchment geometry, coverage and
summary records, and parameter-partitioned observation detail. Build metadata,
checksums, source identities, retrieval dates, and freshness policy are kept in
the manifest. Generated assets and raw responses remain ignored local outputs.

## Frontend and mapping

`web/` is a Vite React/TypeScript application. Shared selection state drives
the MapLibre catchment map, observed-history chart, selected-site summaries,
site comparison, recent observations, details, and CSV export. The map uses
the verified local ECan boundary and station coordinates. OpenFreeMap Positron
is optional contextual geography with OpenMapTiles/OpenStreetMap attribution;
the local geometry fallback keeps the analytical map usable when that remote
context is unavailable.

The browser loads local runtime assets and does not make live ECan observation
requests. A checked-in synthetic fixture is an explicit development fallback;
production-shaped review requires locally prepared real assets.

## Hosting and release boundary

The intended deployment is a static host serving the built Vite application,
runtime data, and required attribution/terms metadata. Hashed application
assets can use immutable caching; runtime data should revalidate. Direct
navigation must fall back to `index.html`, and the browser must not call ECan.
Runtime freshness enforcement blocks missing, invalid, future, or expired
observation assets and explains that a rebuild is required.

Public use is supported by the recorded source terms only when attribution,
terms accompaniment, no-branding/no-endorsement safeguards, and the 120-day
current-or-remove policy are preserved. No public repository, deployment, or
operational provider configuration is included here.

## Tracked versus generated files

Source code, contracts, tests, fixtures, documentation, licence evidence, and
release tooling are tracked. Raw responses, analytical profiles, runtime
observation partitions, build directories, browser artifacts, and release
working outputs are ignored. See [`DEVELOPMENT.md`](DEVELOPMENT.md) and
[`RELEASE.md`](RELEASE.md) for the reproducible commands.
