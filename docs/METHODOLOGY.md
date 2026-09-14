# Analytical methodology

**Method version:** `ashburton-analytical-v4-published-unflagged-2016-2025`
**Scope:** Ashburton–Hakatere, selected ECan/Hilltop monitoring sites
**Status:** Implemented and locally validated; public release is permitted by the dataset-specific water-quality terms subject to attribution/freshness safeguards and complete-catchment coverage limitations

## Scope and windows

The normalized build preserves the available `2007-01-01` through
`2025-12-31` history for eight selected analytes. The six core parameters are
E. coli, Nitrate-N Nitrite-N, Dissolved Reactive Phosphorus, Total Nitrogen,
Turbidity, and Dissolved Oxygen. Total Phosphorus and Water Temperature are
retained as secondary parameters. pH is excluded from the common analytical
scope because the profiled records have narrower site/time coverage and no
reported unit in the long-window profile.

The versioned assets expose three windows:

- `history_2007_2025`: retained history and diagnostics;
- `primary_2016_2025`: primary dashboard window;
- `recent_2020_2025`: recent-condition summaries.

The 2025 refresh returned all six core parameters, with 9–15 sites represented
and observations across all twelve calendar months. Some lower-frequency sites
have quarterly or five-visit coverage and one site/parameter combination
returned no rows. This supports advancing the primary window to 2016–2025
without implying complete or continuous catchment monitoring.

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
-  a missing `<QualityCode>` child is retained as `missing_field` and included
  under the adopted exploratory disposition `published_unflagged`; this means
  only that the observation was returned by the published service without a
  quality field, not that it was explicitly verified, QC600, or “good”;
-  a supplied empty child is retained as `blank_field`, normalized to
  `blank_quality_field`, and excluded because no blank-field semantics were
  observed or documented;
-  the prior strict policy remains available as a sensitivity mode: missing,
  blank, and unfamiliar quality values are excluded while documented fair/good
  records remain eligible;
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

The selected-site profile contains censoring in several parameters and
irregular sampling. The 2025 refresh uses the same trend method and minimums;
it does not add a censor-aware estimator or force a result to become
determinate. This is an evidence result, not a defect to be hidden by relaxing
the rules. Censored values remain visible in observation detail and are not
substituted.

## Quality-semantics viability review

The raw parser now distinguishes missing, blank, and nonempty quality-field
representations and records parser failures separately. In the refreshed
11,230-row profile there were 9,434 `missing_field` rows and 1,796
`nonempty_code` rows; no blank quality elements, unfamiliar nonempty codes, or
quality parse failures were observed. Exact quality-code counts and disposition
counts are retained in the generated manifest and ignored viability report.
The ignored report
`reports/generated/ashburton-viability-review.json` contains frequency tables
by representation, disposition, parameter, site, year, and inclusion status,
plus scenario-level coverage and summary comparisons.

The refreshed adopted `published_unflagged` build has 11,078 eligible
observations, 1,930 annual/window summary records, and 324 trend records. The
strict sensitivity policy remains available in the processing layer. The
earlier policy comparison changed 154 shared reported medians;
no shared reported slope comparison is available because strict trends remain a
sensitivity calculation rather than the dashboard policy. Core primary summary
coverage remains parameter- and site-dependent. The dashboard therefore
emphasizes observed history, distributions, seasonal/coverage context, and
explicitly unavailable results; a trend view shows only supported results and
indeterminate reasons.

Across the refreshed 324 generated trend records, reported and indeterminate
counts and their reasons remain in the trend asset. Censoring remains a
suppression reason because no validated censor-aware trend implementation is
available; adding 2025 does not relax that safeguard.

## Reproducible build

The local, ignored build sequence is:

```text
python3 tools/acquire_observations.py --max-sites 19 \
  --all-in-bound-sites \
  --from-date 2007-01-01 --to-date 2025-12-31 \
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
  --profile reports/generated/ashburton-analytical-profile-2007-2025-all-sites.json \
  --output-dir reports/generated/ashburton-analytical-assets-all-sites
python3 tools/audit_analytical_viability.py \
  --profile reports/generated/ashburton-analytical-profile-2007-2025-all-sites.json \
  --output reports/generated/ashburton-viability-review.json
```

The build defaults to `published_unflagged`. To regenerate the strict
sensitivity asset separately, pass `--quality-policy strict` and use a
separate ignored output directory so the adopted local asset is not replaced.

The generated asset directory contains normalized observations, coverage,
summary, trend, and manifest JSON. Raw responses and generated assets remain
ignored local outputs by repository policy. The exact water-quality Terms of
Use linked by ECan's [water-quality page](https://www.ecan.govt.nz/data/water-quality-data)
license the work for reuse under CC BY 4.0 and require attribution and
accompanying terms; the preserved PDF and hash are in `docs/release/`. The
general [ECan data agreement](https://data.ecan.govt.nz/Catalogue/Agreement?AgreementFile=Agreement.htm&AgreementRequirements=General)
adds current-or-remove, no-branding, and no-advertising safeguards. Public
reuse therefore has a defensible basis, but a release must use a fresh asset,
retain provenance, and pass `tools/check_release_readiness.py`.
