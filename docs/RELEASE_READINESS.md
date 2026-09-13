# Public-release readiness

**Review date:** 2026-09-13  
**Current position:** local development is permitted by project decision; public
observation display, generated-asset hosting, and filtered CSV distribution
remain blocked pending source-specific confirmation.

This document separates what the inspected official material says from project
interpretation and project safeguards. Public endpoint accessibility is not
treated as permission to redistribute the returned content.

## Source inventory and terms position

| Source used by the local build | Exact use | Verified official evidence | Release position |
| --- | --- | --- | --- |
| ECan Hilltop `http://wateruse.ecan.govt.nz/wqlawa.hts` `SiteList` and per-site `MeasurementList` | Site IDs, names, coordinates, measurement metadata | The repository audit retrieves and parses these public Hilltop XML responses. ECan’s water-quality page links data terms, but no route-specific licence or retention statement for this legacy endpoint was located. | Local processing: allowed under the project’s existing decision. Public redistribution: unresolved. |
| ECan Hilltop `GetData` observation requests | 2007–2024 observations, result text, values, units, quality fields, timestamps | The repository parser and live profile verify the response route and fields. The ECan data page says results can be downloaded/printed and may be delayed up to three months for quality checks; it does not expressly grant redistribution of this legacy response route. | Local processing: allowed under the project’s existing decision. Public raw, normalized, derived, or bulk export: unresolved. |
| ECan ArcGIS `Public/WaterQualityandMonitoring/MapServer/0` | Surface-water station inventory used for the acquisition join/audit | Official service metadata identifies the layer, describes sampled sites, and reports `Copyright Text: Environment Canterbury`. The ECan Open Data Portal says data are CC BY 4.0 unless specifically stated otherwise, but an item-specific licence for this exact service was not confirmed. | Local geometry/site processing with attribution: reasonable project interpretation. Public reuse of the exact layer or derived station package: confirm before release. |
| ECan ArcGIS `Public/Hydrology/MapServer/0` | Ashburton River catchment polygon used for local membership/map geometry | Official service response is the verified polygon source. No item-specific licence metadata was found in the inspected response; the general ECan data terms and copyright/attribution rules remain the relevant evidence. | Local processing: allowed. Public polygon redistribution: confirm exact layer terms before release. |
| MapLibre GL JS | Local map rendering library; no remote basemap or tile source | The application uses a minimal local style and does not request third-party tiles. | No third-party basemap licence or hosting dependency is introduced. |

## Verified official terms

The current official ECan materials establish the following constraints:

- The ECan Open Data Portal agreement says ECan owns copyright, requires
  attribution when information is made available to third parties or the
  public, prohibits ECan/Metro/Metroinfo branding without prior agreement,
  prohibits advertising in applications without permission, places a current-
  or-remove responsibility on a public electronic site, and says data are CC
  BY 4.0 unless specifically stated otherwise.
- The ECan Developer Data Portal terms provide the explicit attribution
  wording: **“This work uses data sourced from Environment Canterbury.”** They
  also say API content must not be licensed, sublicensed, or resold, and that
  users of a customer site must receive terms no less protective of ECan.
  These terms apply clearly to that API platform; they do not establish that
  the legacy Hilltop route is governed by the same subscription licence.
- The water-quality publication page says ECan manages a database containing
  ECan and external-party results, allows site-level download/print, and may
  delay publication by up to three months for quality checks. The linked terms
  also warn that provisional values may change.
- ECan’s general copyright page says website material is owned or licensed by
  ECan and limits reproduction to personal, informational, and non-commercial
  use unless permission applies. This is not treated as a replacement for the
  more specific data agreement.

Official sources reviewed:

- [ECan water-quality data](https://www.ecan.govt.nz/data/water-quality-data)
- [ECan Open Data Portal agreement](https://data.ecan.govt.nz/Catalogue/Agreement?AgreementFile=Agreement.htm&AgreementRequirements=General)
- [ECan Developer Data Portal terms](https://apidevelopers.ecan.govt.nz/terms)
- [ECan surface-water ArcGIS layer](https://gis.ecan.govt.nz/arcgis/rest/services/Public/WaterQualityandMonitoring/MapServer/0)
- [ECan major-catchment ArcGIS layer](https://gis.ecan.govt.nz/arcgis/rest/services/Public/Hydrology/MapServer/0)
- [ECan copyright information](https://www.ecan.govt.nz/info/copyright/)

## Interpretation and project choices

### Reasonable interpretation

The general ECan agreement and explicit API attribution wording support keeping
the provider attribution, source link, no-branding rule, no-advertising rule,
and freshness/removal responsibility in a public implementation if the exact
dataset route is confirmed as covered. They support local processing and
ignored caches while that confirmation is pending. They do not justify
claiming that a derived JSON asset or a user-filtered CSV is automatically
licensed for public bulk redistribution.

### Unresolved release question

For the exact legacy Hilltop observation route and the exact ArcGIS catchment
layer, may this project publicly host and redistribute (a) normalized or
derived observation assets, (b) user-filtered CSV exports, and (c) the
catchment polygon/station package, subject to the stated attribution,
no-branding, no-advertising, freshness, and removal obligations?

The official material inspected does not answer that dataset-specific question.
The generic CC BY statement and developer API terms cannot safely be
substituted for route-specific confirmation, and the developer terms expressly
restrict sublicensing/resale of API content.

### Product categories

- **Private/local portfolio development:** permitted by the project decision;
  ignored raw responses and generated assets stay on the developer machine.
- **Public portfolio screenshot or code-only demonstration:** can avoid
  observation redistribution, but must not imply that the source terms are
  resolved. Attribution and release-gate language remain appropriate.
- **Public dashboard displaying observations:** is a public electronic site
  and requires the exact source permission plus freshness/removal operation.
- **Public generated JSON or CSV download:** is the strongest redistribution
  case and should not be enabled until the exact permission is confirmed.

## Implemented safeguards

- The application includes the official attribution statement and links to
  the ECan water-quality source and data-use terms inside Data notes.
- The application retains retrieval/build metadata and states that public
  redistribution remains a release gate.
- No ECan logo, Metro branding, third-party basemap, advertising, or remote
  tile dependency is included.
- Raw responses, analytical outputs, runtime observation assets, screenshots,
  and browser artifacts remain ignored and untracked.
- `python3 tools/check_release_readiness.py` verifies a prepared local shell
  has freshness/build metadata, the attribution statement is present, and no
  generated/raw output is tracked. It reports `PUBLIC_RELEASE=blocked` and
  exits successfully only for the local-safe state. Passing
  `--require-public-release` intentionally fails until terms are explicitly
  cleared.

## Recommended release option

The safest practical option is to keep the dashboard local-only and request a
written ECan clarification for the exact Hilltop and ArcGIS resources before
public deployment or enabling downloadable observation CSV. If clarification
is not available, publish only a code/UI portfolio demonstration with no
observation assets and retain this release gate. Replacing the source with an
explicitly compatible licence is an alternative, but would require a new
source/coverage decision and is not a low-risk continuation of this project.

The public-release decision boundary is therefore recorded, not silently
resolved. No public deployment or generated observation publication has been
performed.
