# Analytical methodology

**Method version:** `ashburton-analytical-v2-quality-semantics`
**Scope:** Ashburton–Hakatere, selected ECan/Hilltop monitoring sites
**Status:** Implemented and locally validated; release remains gated by source terms and complete-catchment coverage review

## Scope and windows

The normalized build preserves the available `2007-01-01` through
`2024-12-31` history for eight selected analytes. The six core parameters are
E. coli, Nitrate-N Nitrite-N, Dissolved Reactive Phosphorus, Total Nitrogen,
Turbidity, and Dissolved Oxygen. Total Phosphorus and Water Temperature are
retained as secondary parameters. pH is excluded from the common analytical
scope because the profiled records have narrower site/time coverage and no
reported unit in the long-window profile.

The versioned assets expose three windows:

- `history_2007_2024`: retained history and diagnostics;
- `primary_2015_2024`: provisional dashboard window;
- `recent_2020_2024`: recent-condition summaries.

These are observation windows, not claims of continuous sampling. Coverage
reports count sampled calendar months and years and retain raw counts,
censored counts, quality dispositions, duplicate/conflict dispositions, and
eligible counts by station, parameter, and window.

## Source and quality disposition

The acquisition boundary is Environment Canterbury's public Hilltop water
quality service. The provider's [water-quality data page](https://www.ecan.govt.nz/data/water-quality-data)
describes public result access and notes that results may lag sampling while
quality checks are completed. The [NEMS quality-code schema](https://www.lawa.org.nz/media/16580/nems-quality-code-schema-2013-06-1-.pdf)
defines the cross-source meanings used here: 100 missing, 200 no quality/non-
verified, 300 synthetic, 400 poor quality, 500 fair quality, and 600 good
quality. The [LAWA/Hilltop quality-code implementation example](https://www.lawa.org.nz/media/18255/implementing-qualcodes-tdc-for-lawa.pdf)
defines the same parent codes and explicitly reports data without a quality
code as a distinct category. It also states that imported telemetered data may
remain QC200 until checked, processed, and archived.

The project does not claim that NEMS is a complete ECan child-code map. In the
inspected public ECan/Hilltop documentation, an ECan-specific mapping for all
possible child codes was not found. Therefore:

- 500 and 600 are retained as eligible quality dispositions;
- 300, 400, and the documented compromised child codes 403, 404, and 450 are
  retained in the normalized record but excluded from primary eligibility;
-  200 and unfamiliar nonempty codes are retained with `unresolved_quality`
  and excluded from primary eligibility;
-  a missing `<QualityCode>` child is retained as `missing_field` and a
  supplied empty child as `blank_field`; both normalize to
  `missing_quality_field` under the strict production policy and are excluded
  from primary eligibility;
-  the source documentation does not establish that omitted quality means
  good, accepted, or unqualified data. A separate `unflagged_usable` scenario
  is implemented for diagnostic comparison only, not production publication;
- no source row is deleted by normalization.

This conservative treatment means a record can be present in raw and
normalized assets but absent from a reported statistic. Exclusion diagnostics
are published with the assets.

## Units and values

Nutrient values reported as `g/m3` or `mg/L` are numerically equivalent and
are represented canonically as `mg/L` while retaining the original unit and
value. Canonical units are `MPN/100 mL` for E. coli, `NTU` for turbidity,
`mg/L` for dissolved oxygen and nutrients, and `C` for water temperature.
Unsupported or missing units are retained but are not analysis-eligible.

Observed numeric values, censored values, missing values, non-numeric results,
aggregated values, and estimated values have separate fields/statuses. Censored
results preserve their result text, censoring direction, and parsed reporting
limit. No half-detection-limit or other universal substitution is applied.

## Duplicates and conflicts

Rows sharing station, parameter, and timestamp are compared using value,
result text, original unit, quality code, and censoring. Exact semantic
duplicates are retained in the normalized asset but only the deterministic
first row is eligible. Conflicting observations are all retained and marked
`conflict`; none is selected for primary analysis.

## Summaries

The current proportionate summary is a median and interquartile range for
eligible numeric observations. A statistic requires at least three eligible
numeric observations and no eligible censored values in the period. If
censoring is present, the statistic is explicitly `indeterminate` rather than
imputed. This is a conservative validated fallback while a reliable
censor-aware regression-on-order-statistics implementation has not been
validated in the repository.

The output remains an aggregated observed-numeric value, never an observation
or an estimated replacement. Calendar-month counts are diagnostic only and do
not imply sampling continuity.

## Trends

The implemented fallback is a Theil–Sen slope per year with a two-sided
Kendall screen for eligible, uncensored numeric observations. It requires at
least eight observations spanning at least three calendar years. A screened
significant positive or negative slope is labelled `increasing` or
`decreasing`; otherwise the result is `indeterminate`. Censored values,
insufficient observations, or insufficient time span produce an explicit
indeterminate reason. No causal, compliance, ecological-health, or
parameter-specific positive/negative interpretation is added.

The current build's selected-site profile contains censoring in several
parameters and sparse quality-coded eligible subsets, so the generated trend
assets are presently indeterminate. This is an evidence result, not a defect
to be hidden by relaxing the rules.

## Quality-semantics viability review

The raw parser now distinguishes missing, blank, and nonempty quality-field
representations and records parser failures separately. In the refreshed
10,426-row profile there were 9,434 `missing_field` rows and 992
`nonempty_code` rows; no blank quality elements, unfamiliar nonempty codes, or
quality parse failures were observed. The nonempty codes were 774 `600`, 72
`500`, and 146 `400`. The ignored report
`reports/generated/ashburton-viability-review.json` contains frequency tables
by representation, disposition, parameter, site, year, and inclusion status,
plus scenario-level coverage and summary comparisons.

The strict build has 846 eligible observations, 208 usable summaries across
annual and window records, and no determinate trends. The diagnostic
unflagged build has 10,280 eligible observations, 1,296 usable summaries, 66
structurally trend-eligible primary series, and 17 determinate primary trends.
It changes 154 shared reported medians; no shared reported slope comparison
is available because strict trends are all indeterminate. Core primary summary
coverage under strict rules is useful but uneven: dissolved oxygen reports at
9 sites, total nitrogen at 8, E. coli/turbidity at 6 each, nitrate and DRP at
6 each, with DRP reporting only one usable primary summary. The dashboard
should therefore emphasize observed history, distributions, seasonal/coverage
context, and explicitly unavailable results; a trend view should show only
supported results and indeterminate reasons.

## Reproducible build

The local, ignored build sequence is:

```text
python3 tools/acquire_observations.py --max-sites 19 \
  --all-in-bound-sites \
  --from-date 2007-01-01 --to-date 2024-12-31 \
  --include-observations \
  --parameter "E. coli" \
  --parameter "Nitrate-N Nitrite-N" \
  --parameter "Dissolved Reactive Phosphorus" \
  --parameter "Total Nitrogen" \
  --parameter "Total Phosphorus" \
  --parameter "Turbidity" \
  --parameter "Dissolved Oxygen" \
  --parameter "Water Temperature (Field)"
python3 tools/build_analytical_assets.py \
  --profile reports/generated/ashburton-analytical-profile-2007-2024-all-sites.json \
  --output-dir reports/generated/ashburton-analytical-assets-all-sites
python3 tools/audit_analytical_viability.py \
  --profile reports/generated/ashburton-analytical-profile-2007-2024-all-sites.json \
  --output reports/generated/ashburton-viability-review.json
```

The generated asset directory contains normalized observations, coverage,
summary, trend, and manifest JSON. Raw responses and generated assets remain
ignored local outputs. ECan's [water-quality page](https://www.ecan.govt.nz/data/water-quality-data)
links terms of use, and the published [ECan data agreement](https://data.ecan.govt.nz/Catalogue/Agreement?AgreementFile=Agreement.htm&AgreementRequirements=General)
states attribution, no council branding without permission, no advertising in
applications without permission, a responsibility to keep public electronic
data current or remove it, and CC BY 4.0 unless specifically stated otherwise.
These terms do not explicitly prohibit local processing. Dataset-specific
confirmation for the legacy Hilltop response route, attribution/freshness
implementation, and any public raw-response redistribution remain release
gates.
