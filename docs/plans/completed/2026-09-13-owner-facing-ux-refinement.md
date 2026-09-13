# Owner-facing UX and visual refinement

**Status:** Completed
**Started:** 2026-09-13
**Scope:** Restructure and polish the existing local React dashboard for owner
visual review without changing analytical methods, quality policy, source
boundaries, runtime architecture, or licensing gates.

## Objective

Make the principal monitoring evidence understandable in the first desktop
viewport, replace internal engineering language with clear user-facing copy,
improve the map/chart/table/summary composition, and preserve the existing
coordinated interactions and transparent analytical states across desktop,
tablet, and mobile layouts.

## Default landing decision

Use Total Nitrogen with station `SQ35874` and the existing primary window
2015–2024. The asset coverage diagnostics show Total Nitrogen observations at
15 sites, 14 supported primary-window summaries, and four supported primary-
window trends. `SQ35874` has 117 eligible observations, a reported median and
IQR, and a supported neutral trend. This is a coverage-led representative
choice rather than a selection based on an extreme value; the source metadata
does not provide a more descriptive station name, so the UI will present the
station ID as `Monitoring station SQ35874` without inventing a name.

## Work units

1. Move controls and export into a compact workspace header, reduce hero and
   overview prominence, and restructure the analytical workspace around map,
   selected station, observed history, summary, trend, coverage, and comparison.
2. Replace internal-facing labels and repeated technical caveats with plain
   language, while preserving detailed policy, build, provenance, freshness,
   licensing, and methodology content in expandable Data notes.
3. Improve the time-series chart with explicit axes, units, scale cues, point
   inspection, discrete-observation wording, and accessible text alternatives.
4. Simplify the observation table and lower insight area without discarding
   complete detail from row expansion, provenance, or CSV export.
5. Add or update frontend/browser tests for the default state, visible labels,
   chart/table semantics, Data notes, and responsive/keyboard behavior.
6. Run all applicable quality gates and browser visual checks, inspect final
   screenshots, update governance documentation, archive this plan, and commit
   one coherent UX-refinement milestone.

## Guardrails

- Keep the accepted Ashburton–Hakatere scope, parameters, windows, quality
  policy, censoring safeguards, trend rules, and source/licensing gates intact.
- Do not add remote tiles, new analytical features, thresholds, scores, or
  unsupported station names/geographic features.
- Keep ignored generated data, screenshots, browser artifacts, and build
  output out of version control.

## Acceptance evidence

- The first desktop viewport exposes purpose, compact controls, catchment/site
  context, selected history, and concise analytical status.
- The default state is Total Nitrogen / `SQ35874` / primary 2015–2024 with the
  coverage rationale documented above.
- Chart axes, units, discrete observations, censored states, and table detail
  are understandable without relying on tooltips alone.
- Data notes contain the detailed quality/provenance/build/licensing context;
  internal policy keys and build hashes are not prominent in the main flow.
- Playwright, axe, overflow, console/network, real-asset, unit, TypeScript,
  build, Python, and asset-integrity checks pass; screenshots at 1440×900,
  1024×768, and 390×844 are inspected.

## Outcome

Completed on 2026-09-13. The local MVP now presents a compact hero and
workspace bar, with map, selected station, observed history, and current
analytical evidence visible substantially earlier on desktop. Internal labels
and build/policy identifiers were removed from the main flow and consolidated
under expandable Data notes. Source metadata contains station IDs rather than
descriptive names, so the UI uses the accurate label `Monitoring station
SQ35874` rather than inventing a site name.

The coverage-led default is Total Nitrogen at `SQ35874` for 2015–2024: the
prepared asset has primary-window observations at 15 sites, 14 supported
summaries, four supported trends, and 117 eligible observations plus a
reported summary/trend at the selected site. The loader was corrected to fetch
the selected default partition directly, preventing cross-parameter display
mixing.

The series chart now uses a clearly labelled linear scale with readable ticks,
gridlines, dates, units, all numeric values, pointer titles, and a collapsed
keyboard inspection list. The compact table shows date, reported result,
quality/status, and record state; row details preserve original values,
reporting limits, source IDs, and retrieval timestamps. Summary, trend, and
coverage states are compact and neutral, while source/method/licensing context
is in Data notes.

Validation completed:

- `python3 -m unittest discover -s tests -v`: 33 passed.
- Fixture validation and Python compilation passed.
- `cd web && npm run typecheck && npm run test:unit && npm run build`: passed;
  initial JS 255.69 kB/78.76 kB gzip, CSS 12.19 kB/3.32 kB gzip, MapLibre
  lazy chunk 1.02 MB/276.18 kB gzip.
- `cd web && npm run test:browser`: 14 passed, including real-data loading,
  the default selection, coordinated filters, map selection, export,
  censored/indeterminate states, Data notes, keyboard access, axe, console and
  request checks, runtime timing, and responsive overflow.
- Latest browser runtime-ready measurement was approximately 196 ms locally;
  the shell transfer was approximately 1.26 MB and the initial Total Nitrogen
  partition approximately 245 kB over the local test server.
- Full-page screenshots were inspected at 1440×900, 1024×768, and 390×844.
  No application console/page/network errors, horizontal overflow, or serious/
  critical axe violations were observed. The known headless Chromium/WebGL
  compositor diagnostic remains the only filtered browser warning.

No analytical assets, raw responses, screenshots, or browser artifacts were
added to version control. Licensing, freshness, attribution, complete coverage,
and public observation redistribution remain release gates.
