# Public-release readiness

**Review date:** 2026-09-14
**Current position:** the same ECan water-quality dataset has a defensible
public reuse path under its dataset-specific CC BY 4.0 Terms of Use. Public
deployment has not been performed. A release build is permitted only with the
attribution, terms-accompanying, current-or-remove, no-branding, and
no-advertising safeguards below.

This document distinguishes verified source facts, reasonable interpretations,
and project safeguards. Public endpoint accessibility is not used as licence
evidence.

## Dataset-specific water-quality terms

The official water-quality page directly links the current Terms of Use at
[`https://www.ecan.govt.nz/data/document/download?uri=3957205`](https://www.ecan.govt.nz/data/document/download?uri=3957205).
The linked ECan page was retrieved on 2026-09-14 and states that its database
contains ECan and external-party results, supports search-result download/print,
and may lag sampling by up to three months for quality checks.

The exact one-page PDF is preserved at
[`docs/release/evidence/TermsOfUseWaterQualityDataPublicWebsite-3957205.pdf`](release/evidence/TermsOfUseWaterQualityDataPublicWebsite-3957205.pdf).
It was retrieved successfully from ECan's official Trim document route:
[`https://api.ecan.govt.nz/TrimPublicAPI/documents/download/3957205`](https://api.ecan.govt.nz/TrimPublicAPI/documents/download/3957205).

| Evidence | Verified value |
| --- | --- |
| Document date | August 2018 |
| Retrieval date | 2026-09-14 |
| SHA-256 | `87b0c0408c5e6dce82b0cf036acdcf8ffc78e7d31e45db2a1a60f15255ebe705` |
| Rights holder | Canterbury Regional Council (Environment Canterbury) |
| Licence | Creative Commons Attribution 4.0 International (CC BY 4.0) |
| Attribution | “This work uses material sourced from Water Quality Data, which is licensed under a Creative Commons Attribution 4.0 International licence by Environment Canterbury.” |
| Accompanying terms | A copy of the Terms of Use must accompany information made available to third parties. |
| Warranty/provisional information | The document disclaims a warranty of currency/completeness/accuracy and says provisional information may change and is not citable until reviewed and approved. |
| Numeric freshness interval | Not specified by the PDF. |

The machine-readable evidence, including exceptions and release-scope
classification, is in [`docs/release/ecan-source-licence-evidence.json`](release/ecan-source-licence-evidence.json).

## Official workflow and observation route

The official search is the ECan water-quality page. Its indexed site-detail
pages use the pattern
`/data/water-quality-data/wqdetails?SiteID={siteId}` and expose sampling
details, selected-sample print, and selected-sample export. During this review,
direct automated access to the ECan web host returned an Incapsula challenge, so
the undocumented internal button request could not be captured from browser
network logs.

The project’s established public Hilltop route is:

`http://wateruse.ecan.govt.nz/wqlawa.hts`

It provides `SiteList`, per-site `MeasurementList`, and `GetData` responses.
The live service returned the same site IDs, measurement names, timestamps,
units, result text, and detection-limit metadata represented by the official
site-detail pages. A representative check of `SQ35873` / `Total Nitrogen`
matched the official indexed result for 29 January 2026: `0.142 g/m3`.
An official selected-sample export is not a documented bulk-history replacement
for the project’s parameter/site history, so the adapter remains on Hilltop.

## Spatial-source terms

Spatial sources are assessed separately from water-quality observations:

| Source | Official item evidence | Release position |
| --- | --- | --- |
| Surface-water monitoring sites | ArcGIS item `6e62f7f10cd5433c98e5e330b4ed3b7d` records Environment Canterbury and CC BY 3.0 New Zealand. | Public station coordinates/metadata may be used with that attribution. |
| Major Catchment Boundaries | ArcGIS item `11b4857f314d4360b271ad9f9f9bdc2f` records Environment Canterbury and CC BY 3.0 New Zealand; the service copyright also names Land Information New Zealand and Environment Canterbury. | Public Ashburton boundary geometry may be used with the item attribution and source link. |
| Hosted station/geometry metadata | Derived runtime metadata remains an adaptation of the separately licensed sources. | Preserve source links, rights-holder attribution, and do not imply ECan endorsement. |

The exact item URLs and metadata basis are recorded in the evidence JSON. The
general ECan open-data agreement remains a supplementary source for current-or-
remove, attribution, no-branding, and no-advertising safeguards; it is not
substituted for the dataset-specific water-quality terms.

## Release classification

- **Ordinary public visualization:** permitted under the water-quality CC BY
  4.0 terms with attribution and the safeguards below. It is not a regulatory
  compliance product and must not imply catchment-wide or causal conclusions.
- **Hosted normalized/derived observations:** permitted as an attributed CC BY
  adaptation; keep source retrieval dates and provenance, accompany the terms,
  and apply the freshness/removal check.
- **Filtered CSV export:** permitted under the same attribution basis. Each
  export includes source, licence, attribution, and terms-link preamble lines;
  censored and excluded records retain their meaning.
- **Raw source responses:** remain ignored and are not committed. Local raw
  caching remains ephemeral.
- **Replacement source:** not required. No LAWA substitution was made.

## Implemented safeguards

- The exact terms PDF and a machine-readable source/licence evidence record are
  preserved in `docs/release/`.
- The runtime builder marks generated assets as
  `public_cc_by_attribution_freshness`.
- `tools/check_release_readiness.py --require-public-release` validates the
  preserved terms hash, evidence position, application attribution, current
  source retrieval, and absence of tracked raw/generated observation outputs.
  The default 120-day freshness gate is a project safeguard; the source page’s
  possible three-month publication lag is not treated as a guarantee that data
  are current.
- The UI links the dataset-specific Terms of Use and gives the plain-language
  attribution without ECan logos or branding. No advertising or remote
  basemap is introduced.
- CSV exports carry the source/CC BY/attribution/terms preamble.
- Public deployment and publication of generated assets are intentionally not
  performed in this milestone.

## Freshness and reproducible build safeguards

`tools/release_build.py` is the reproducible public-shaped build command. It
reacquires the 2007–2025 profile, validates source-inventory reconciliation,
generates the ignored analytical/runtime assets, runs the public-mode release
gate, runs the locked frontend checks/build, and writes an ignored manifest
with source identities, terms hash, timestamps, hashes, and byte counts. The
2026-09-14 rehearsal completed with 11,230 source observations, 19 exact
station-ID matches, a 1,294,388-byte runtime shell, and a 13-file static
frontend output. `npm ci` was run separately immediately after the
`--skip-npm-install` rehearsal because the lockfile install was already
available; the full command remains the clean-checkout path.

The frontend independently evaluates `sourceRetrievedAt` at runtime. Missing,
invalid, future, or more-than-120-day-old metadata blocks the analytical asset
and presents an actionable rebuild message; an asset within 30 days of expiry
is labelled near expiry in the runtime contract. The dashboard displays source
retrieval freshness separately from its 2007–2025 coverage period. No browser
code calls ECan at visitor runtime.

## Remaining release gates

Before any public deployment, the operator must run the asset-generation and
release-readiness commands against a fresh public-source retrieval, confirm
the source is within the freshness window, and have an operational path to
remove or refresh the hosted asset if the source changes or the release is
withdrawn. Public hosting must include the attribution and linked Terms of Use.
No ECan or Metro branding may be added without separate agreement.
