# Architecture

## Status and Evidence

This document distinguishes three states:

- **Existing:** evidenced in the repository.
- **Intended:** accepted direction but not yet implemented.
- **Unresolved:** requires feasibility evidence, an implementation choice, or an owner decision.

As audited on 2026-09-13, the checkout contains a dependency-free source-feasibility audit, versioned contract foundation, bounded ECan/Hilltop acquisition adapters, a validated ECan catchment-boundary membership slice, source-preserving normalization and analytical asset builders, synthetic and analytical fixtures, and a React/TypeScript/Vite shell. Generated production-scale outputs remain ignored local artifacts pending source-term review. `docs/PROJECT_STATE.md` is authoritative for what currently exists and has been verified.

## System Context

The intended system separates fragile external monitoring services from the user-facing runtime:

```text
Public monitoring and geospatial sources
    -> Python acquisition and source snapshot/cache
    -> normalization and quality-control transforms
    -> analytical summaries and trend calculations
    -> compact versioned application assets
    -> static React dashboard with linked map, charts, table, and export
```

The browser should not query remote environmental APIs for routine interactions. A manual, reproducible data build is sufficient for the MVP; scheduled refresh is optional later.

## Current Repository Architecture

### Existing

- Project intent and constraints are defined by the governance documentation.
- Agent workflow, backlog, decision record, and quality gates are defined under `AGENTS.md` and `docs/`.
- Active/completed plan directories exist under `docs/plans/`; completed plans include the feasibility audit and repository foundation plans.
- A read-only feasibility audit verifies public ECan ArcGIS station/flow inventory and ECan Hilltop WFS site/measurement catalog access. See `docs/feasibility/SOURCE_AUDIT.md`.
- `catchment_dashboard/contracts.py` defines version `0.1.0` source records and `1.0.0` normalized observation records alongside station, parameter, aggregate, trend, and asset-manifest boundaries. `docs/CONTRACTS.md` is the contract reference.
- `catchment_dashboard/ecan_hilltop.py`, `catchment_dashboard/ecan_geometry.py`, and `tools/acquire_observations.py` provide bounded, count-checked ECan/Hilltop acquisition, ECan major-catchment membership, quality summaries, successful-response manifests, and optional full source-preserving profile output.
- `catchment_dashboard/analytics.py` and `tools/build_analytical_assets.py` implement versioned normalization, quality/unit/censoring/duplicate dispositions, coverage diagnostics, conservative summaries/trends, and ignored application-ready JSON assets.
- `config/study_area.json` records the owner-approved Ashburton–Hakatere parameter and time scope and the verified ECan `Ashburton River` major-catchment boundary.
- `web/` contains a Vite/React/TypeScript dashboard shell, a local MapLibre map with the audited ECan catchment polygon and station coordinates, coordinated parameter/window/station state, typed inline-SVG and tabular analytical views, UTF-8 filtered CSV export, responsive/accessibility styling, and a local ignored application-asset loader. The loader reads the versioned runtime shell and parameter partitions from `web/public/data/ashburton/` when the developer has prepared them and falls back to a checked-in synthetic fixture with an explicit warning. `web/package-lock.json` and the Playwright/Vitest configurations provide reproducible frontend verification.

### Not yet evidenced

- Publicly redistributable production assets, licensed source snapshots, complete catchment observation coverage, and CI.
- A licensed third-party basemap or remote tiles; the local MapLibre style intentionally uses the verified boundary and station layers only.
- Configured lint/format tooling, deployment configuration, or live deployment.

Do not infer these components from the intended design.

## Intended Technology Stack

| Area | Intended direction | Status / boundary |
| --- | --- | --- |
| Processing | Python package with standard-library contract validation; pandas/GeoPandas remain candidates for source and spatial work | Contract foundation existing; processing dependencies unresolved |
| Columnar data | PyArrow/Parquet where beneficial | Intended preference; validate against browser delivery strategy |
| Local analytical query | DuckDB | Optional development decision based on data volume and transformations |
| Frontend | React + TypeScript + Vite | Coordinated local dashboard views and ignored application asset loading implemented; public observation delivery unresolved |
| Mapping | MapLibre GL JS with local GeoJSON boundary and station layers | Real ECan polygon, WGS84 stations, fit-to-bounds, selected/available states, map selection, and keyboard-equivalent station control implemented; third-party basemap remains intentionally absent |
| Charts | Typed inline SVG plus HTML table | Observed-history chart/table and coordinated filtering implemented; richer charting remains optional |
| Runtime assets | Versioned JSON shell plus parameter-partitioned detail JSON | Runtime contract `2.0.0` implemented with lookup-backed observations, local geometry, manifest checksums, and lazy parameter loading; public observation delivery unresolved |
| Runtime database | None by default | PostGIS/backend requires demonstrated need and architecture review |
| Hosting | Static/free or extremely low-cost service | Provider unresolved |

## Intended Components

### 1. Source adapters

Responsibilities:

- retrieve station metadata, water-quality observations, catchment boundaries/hydrography, and optional flow/stage records;
- isolate provider-specific URLs, request parameters, pagination, rate handling, and schema details;
- capture source retrieval time, licensing/attribution metadata, and source identifiers;
- fail explicitly on unexpected schema or incomplete retrieval.

The primary candidate provider is Environment Canterbury. Its public ArcGIS station/flow layers and legacy Hilltop WFS/catalog are verified feasibility candidates, while the production observation route, licensing, and historical completeness remain unresolved and must be reviewed before production adapters are designed. National New Zealand sources may supplement regional data only when justified and compatible.

### 2. Raw acquisition cache or source snapshots

Responsibilities:

- make builds repeatable and debuggable without repeated uncontrolled calls;
- retain source payloads or a documented reproducible cache representation where licensing and size permit;
- record checksums or equivalent manifest information for inputs.

Large raw datasets should remain outside version control. Small, license-compatible fixtures may be committed for tests. Cache location, retention, and refresh semantics are unresolved implementation details.

### 3. Normalization and quality control

Responsibilities:

- map provider schemas to stable internal contracts;
- normalize site, parameter, timestamp, value, unit, quality/status, censoring, and source-reference fields;
- validate identifiers, coordinates, time zones, numeric ranges, duplicates, and unit compatibility;
- preserve excluded or transformed-record counts and reasons;
- stop or prominently mark outputs when source completeness cannot be established.

The implemented `ashburton-analytical-v3-published-unflagged` rules preserve original values and
source fields, convert only equivalent nutrient units, retain distinct
missing/blank/nonempty quality representations with explicit dispositions, and
suppress censored summaries rather than
substitute values, and publish indeterminate trends when minimums or
censor-aware methods are not met. See `docs/METHODOLOGY.md`.

### 4. Analytical processing

Responsibilities:

- calculate data coverage and long-term descriptive statistics;
- aggregate observations at an interval appropriate to actual sampling density;
- derive recent-versus-historical and site-versus-catchment comparisons;
- estimate trends using an owner-reviewed method;
- optionally derive seasonality and flow context;
- attach method/version metadata to outputs.

Raw observations, aggregates, summaries, trends, and any classifications must remain distinguishable. Threshold or directional labels may not be added without applicable authoritative guidance and owner review.

### 5. Asset publication

Responsibilities:

- generate compact, deterministic, versioned application datasets;
- publish a manifest containing build time, source coverage, parameter/unit metadata, method version, record counts, and asset versions/checksums;
- keep geospatial payloads at suitable precision and size;
- validate referential integrity between stations, observations, summaries, catchment geometry, and optional flow series.

Asset partitioning—such as by parameter, station, or time—is an implementation decision to be based on measured payload size and interaction performance.

### 6. Dashboard shell and state

Responsibilities:

- own the selected parameter, station, time range, and analytical mode;
- expose one consistent filtered analytical state to all views;
- support linkable/shareable state only if it can be added simply and accessibly;
- provide loading, empty, partial, and error states.

State should remain client-side for the MVP unless a concrete runtime requirement disproves that approach.

### 7. Coordinated analytical views

Intended views:

- catchment overview and concise summary band;
- MapLibre catchment/station map with parameter-aware site styling;
- selected-site time series;
- one focused trend, distribution, seasonal, or site-comparison view chosen for the defined analytical questions;
- contextual station and data-coverage detail;
- data table or equivalent inspection view;
- filtered CSV/data export.

Map, charts, table, and summaries must consume the same filter semantics. A selection in one view should update or highlight the others where useful.

## Conceptual Data Model

The version `0.1.0` foundation schemas are documented in `docs/CONTRACTS.md` and implemented in `catchment_dashboard/contracts.py`. They preserve the conceptual entities below without adopting analytical semantics:

| Entity | Key fields / purpose |
| --- | --- |
| `source` | Provider, dataset, endpoint/reference, license, retrieved-at, source version/checksum |
| `catchment` | Stable internal ID, name, geometry reference, CRS/source metadata |
| `station` | Internal and source IDs, name, coordinates, water body/catchment relation, station type, active/coverage metadata |
| `parameter` | Canonical ID/name, source analyte aliases, canonical unit, interpretation metadata |
| `observation` | Station, parameter, timestamp, numeric/result representation, original and canonical units, quality/censoring status, source record reference |
| `flow_observation` | Gauge, timestamp, flow/stage value and unit, quality/source metadata; optional |
| `aggregate` | Station/parameter/period, method, count, coverage, statistic, method version |
| `trend` | Scope, period, method, estimate, uncertainty/significance fields where applicable, coverage, method version; current conservative fallback documented in `docs/METHODOLOGY.md` |
| `asset_manifest` | Build/source timestamps, spatial/temporal coverage, counts, versions, checksums, warnings |

Internal identifiers must be stable and source identifiers must be retained. Unit conversion must never erase the original value/unit context needed for audit.

## APIs and Runtime Boundaries

- **External acquisition APIs/services:** build-time only by default. ECan ArcGIS and legacy Hilltop catalog access are verified feasibility candidates; the exact production route remains unresolved.
- **Internal runtime API:** none intended for MVP.
- **Static assets:** the frontend's primary data interface; their schemas require explicit versioning and validation.
- **Export:** derived locally from the current filtered, normalized dataset or from a prebuilt equivalent; exported columns and units must be clear.

Introducing an always-on API, PostGIS, authentication, or server-side analytical service is a fundamental architecture change unless a narrowly scoped deployment requirement makes it unavoidable.

## Deployment Architecture

### Intended MVP

1. A developer or CI job runs the documented acquisition and build commands.
2. Validation prevents publication of structurally invalid or materially incomplete outputs.
3. Prepared assets are copied into or published alongside the frontend build.
4. The React application is built as static assets.
5. A free or extremely low-cost static host serves the application and data.
6. Deployment verification checks the live asset manifest and core user flow.

### Unresolved

- Hosting provider and CI platform.
- Whether generated assets belong in release artifacts, object storage, or a deploy-only directory.
- Refresh cadence and whether scheduled CI is worth maintaining.
- Payload thresholds that would require partitioning or a different architecture.

## Technical Boundaries

- The processing layer owns source semantics, quality decisions, unit harmonization, and analytical calculations; the UI must not independently recreate them.
- The UI owns presentation and interactive filtering but must expose method, unit, coverage, and uncertainty context supplied by the data products.
- Provider-specific schemas must not leak throughout analytical or UI modules.
- Geospatial display geometry and analytical station identity must share validated stable keys.
- Thresholds, health labels, and positive/negative trend interpretation are scientific/product decisions, not styling choices.
- Source substitution requires comparison of authority, licensing, coverage, semantics, and reproducibility—not just API convenience.
- Performance optimization should preserve numerical meaning and provenance.

## Architecture Validation Triggers

Revisit this design if evidence shows any of the following:

- the selected sources cannot be acquired reliably at build time;
- application assets are too large for responsive static delivery after sensible partitioning;
- required interaction needs server-side queries;
- update frequency becomes operational rather than periodic;
- licensing prevents the planned caching or redistribution model;
- catchment/source joins cannot be represented reliably without a spatial database.

Any resulting fundamental change requires an explicit decision record and owner review.
