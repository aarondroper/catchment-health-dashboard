# Project Brief

## Project Identity

- **Name:** Catchment Health Dashboard
- **Type:** Self-directed portfolio and consulting showcase project
- **Geographic direction:** Ashburton–Hakatere, represented for bounded acquisition by Environment Canterbury's Ashburton River major-catchment boundary
- **Lifecycle stage:** Acquisition, normalization, and analytical-method preparation

Ashburton–Hakatere is the owner-selected working catchment following the Canterbury source-feasibility audit. Its bounded acquisition membership uses the verified ECan Ashburton River major-catchment polygon; final parameters, analysis window, and analytical semantics remain subject to owner review.

## Purpose

Build a map-linked freshwater monitoring dashboard that integrates water-quality observations, river-flow context where feasible, and catchment geography so users can understand spatial patterns, temporal change, and differences between monitoring locations.

The central client question is:

> What is happening across this river catchment, how do monitoring locations differ, and how are important water-quality and river-condition indicators changing over time?

The product must be an analytical dashboard with a map, not a full-screen map with incidental charts. Its defining interaction is coordination: a change of station, parameter, or time range updates the relevant map, statistics, charts, and detailed records together.

## Target Users and Client Context

The representative users are analysts, environmental officers, scientists, project managers, and communicators working for organizations such as:

- regional environmental authorities;
- catchment-management organizations and river trusts;
- environmental consultancies;
- freshwater-management teams;
- research organizations.

The dashboard is a portfolio-scale demonstration, not a commissioned regulatory or operational system. It should nevertheless resemble a credible small environmental consulting deliverable.

## Primary Use Cases

1. Review catchment-wide context for a selected water-quality parameter and time range.
2. Compare monitoring locations spatially using parameter-aware map symbology.
3. Select a station and inspect its observations, coverage, summaries, and temporal behavior.
4. Compare a selected site with other sites or an explicitly defined catchment-level distribution.
5. Examine longer-term trends and, where supported, seasonal patterns.
6. View river flow or stage as context where usable historical records can be matched reliably.
7. Export the currently filtered analytical records as CSV or an equivalent transparent tabular form.

## Intended Deliverable

The finished project comprises:

- a reproducible Python ingestion and processing pipeline;
- documented source, normalized, and application-ready data contracts;
- compact prepared spatial and temporal assets;
- a deployed React and TypeScript dashboard using MapLibre;
- parameter, station, and time controls with coordinated views;
- a catchment map, headline summaries, time-series and comparison views, and a detailed data view;
- filtered CSV/data export;
- automated tests for important transformation and analytical logic;
- methodology, provenance, limitations, development, and deployment documentation;
- a clean public repository and material suitable for a portfolio case study.

## Portfolio and Business Goals

The project should demonstrate professional capability in:

- environmental-monitoring data engineering and public-service ingestion;
- temporal normalization, quality handling, unit harmonization, and provenance;
- defensible aggregation, trend analysis, site comparison, and seasonality;
- catchment GIS and integration of spatial and temporal information;
- linked map/chart interaction and analytical information design;
- Python processing, typed frontend engineering, testing, reproducibility, and low-cost delivery;
- product judgement: turning real observations into a coherent management-oriented analytical experience.

It deliberately broadens the portfolio beyond map-centric exploration products.

## In-Scope Capabilities

### Geographic and data scope

- One Canterbury catchment or closely related river system.
- Approximately four to six principal water-quality parameters, selected after coverage analysis.
- A manageable station network and a likely primary analysis window of roughly five to ten years, determined by data quality rather than by a fixed promise.
- River flow or stage when historical data is programmatically obtainable and analytically compatible.
- Catchment boundaries and hydrography needed for geographic context.

### Processing and analysis

- Programmatic retrieval of public monitoring observations and metadata.
- Schema normalization, timestamps, missingness, duplicates, source quality flags, units, and censored values handled according to actual source semantics.
- Transparent temporal summaries suited to the observed sampling frequency.
- Defensible trend estimation and site/catchment comparison.
- Optional seasonal analysis when supported by the data.
- Explicit lineage from prepared records back to source station, parameter, and observation where available.

### Product

- Map, concise summary metrics, primary temporal visualization, focused comparison/trend view, purposeful controls, and detailed data table or equivalent.
- Immediate-feeling station, parameter, and time-range interactions.
- Graceful empty, unavailable, and incomplete-data states.
- Responsive behavior, with desktop as the primary analytical experience.
- Static or nearly static deployment using prepared browser assets.

## Explicit Non-Goals

The initial product is not:

- a national New Zealand or all-Canterbury platform;
- a general-purpose BI or uploaded-data product;
- a real-time operational or alerting system;
- a regulatory compliance system;
- a hydrological simulation or forecasting platform;
- a machine-learning project;
- a field-data-entry or scientific-publication platform;
- an authenticated multi-user application;
- a large live database or always-on backend.

The MVP will not include accounts, user-created dashboards, arbitrary uploads or metrics, predictive modelling, nationwide coverage, or decorative composite health scoring. Rainfall, land cover, land use, ecological classifications, chart export, scheduled refresh, thresholds, and additional map modes are optional only when evidence shows clear analytical value without compromising focus.

## Constraints

- Use authoritative or credible public/open data and verify licensing.
- Prefer programmatic acquisition and little to no manual data preparation.
- Use real observations; synthetic data may appear only in clearly marked automated-test fixtures.
- Keep hosting free or extremely inexpensive and avoid an always-on backend without demonstrated need.
- Do not commit unnecessarily large raw or generated datasets.
- Keep the project small enough to finish and suitable for iterative agentic development.
- Do not overstate environmental condition, trend certainty, causation, regulatory meaning, completeness, or sampling continuity.
- Obtain owner review before finalizing the core parameter set, primary analysis window, trend interpretation language, applicable thresholds, any composite indicator, or the major dashboard composition. The working catchment direction is already selected; any material geography change still requires owner review.

## Success Definition

The project is successful when a user can open a polished deployed dashboard, understand the selected catchment at a glance, select a water-quality parameter and time range, compare sites spatially, inspect an individual station's history, understand carefully defined longer-term or seasonal patterns, and export the supporting filtered data.

Success additionally requires that:

- the dashboard uses real public monitoring observations acquired by a documented reproducible process;
- map, charts, statistics, filters, and selection behave as one coordinated analytical system;
- important calculations and transformations are automatically tested;
- source coverage, quality rules, units, update dates, provenance, and limitations are visible or documented;
- a fresh checkout can regenerate the analytical data subject to documented source availability;
- the interface performs well, responds sensibly across supported screen sizes, and avoids misleading claims;
- the repository and case-study material credibly demonstrate the intended professional capabilities.

## Current Assumptions Requiring Validation

- Environment Canterbury exposes suitable programmatic historical water-quality and possibly flow data.
- At least one contained Canterbury catchment has adequate station density, parameter overlap, temporal depth, and usable licensing.
- A prepared static-data architecture can support the final record volume and interactions without a runtime database.
- Approximately four to six comparable parameters and a useful five-to-ten-year window will survive the source audit.

These are working assumptions, not statements of verified repository capability or source availability.
