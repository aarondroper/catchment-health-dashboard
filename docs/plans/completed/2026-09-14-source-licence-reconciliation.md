# Source and licence reconciliation

**Status:** Complete — 2026-09-14

## Outcome

The exact ECan water-quality Terms of Use linked by the official publication
page were retrieved from the official Trim document route and preserved in
`docs/release/evidence/`. The PDF has SHA-256
`87b0c0408c5e6dce82b0cf036acdcf8ffc78e7d31e45db2a1a60f15255ebe705` and states
that the water-quality work is licensed for reuse under CC BY 4.0 by
Environment Canterbury, with attribution and accompanying Terms of Use.

The official water-quality search and selected-sample print/export capability
were verified from the publication page and indexed detail pages. Direct
automated browser access to the ECan web host returned an Incapsula challenge,
so the undocumented internal export request was not captured. The public
Hilltop `SiteList`, `MeasurementList`, and `GetData` service remains the
documented, reproducible bulk-history route; a representative SQ35873 Total
Nitrogen value matched the official indexed result.

ArcGIS item metadata independently records CC BY 3.0 New Zealand for the
surface-water monitoring-site and Major Catchment Boundaries items. The
release position is therefore attributed public visualization, hosted derived
assets, and filtered CSV under the verified terms and project safeguards, not
a blanket requirement for bespoke written permission.

## Implementation

- Added machine-readable source/licence evidence and preserved exact terms PDF.
- Added evidence/hash/freshness/attribution validation to
  `tools/check_release_readiness.py` and changed the generated runtime status
  to `public_cc_by_attribution_freshness`.
- Updated source provenance, Data notes, governance documentation, and release
  documentation.
- Added source/licence/attribution/Terms-of-Use preamble lines to CSV exports.
- Added regression coverage for the preserved evidence hash, release status,
  CSV metadata, and updated browser expectations.

## Validation

- `python3 -m unittest discover -s tests -v` — 37 passed.
- Fixture validation and Python compilation — passed.
- Frontend typecheck, Vitest unit tests — 4 passed.
- Production frontend build — passed; Vite reports the existing MapLibre chunk
  size warning.
- Playwright/Chromium browser suite — 15 passed, including real asset loading,
  interactions, export, axe, console/network checks, overflow, and responsive
  screenshots.
- Release check with `--require-public-release` — passed with safeguards.
- Deterministic runtime asset preparation — identical SHA-256 on repeat.

## Remaining work

Complete-catchment observation coverage, operational remove-or-refresh
procedures, deployment configuration, and public deployment remain future
work. No raw responses, generated observations, or public deployment were
performed in this milestone.
