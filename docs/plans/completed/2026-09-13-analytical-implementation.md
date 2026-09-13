# Analytical implementation milestone

**Status:** Complete; archived after local all-site validation
**Started:** 2026-09-13
**Scope:** Ashburton–Hakatere observation normalization, coverage diagnostics, and first application-ready analytical assets

## Objective

Turn the verified bounded ECan/Hilltop acquisition path into a reproducible, source-preserving analytical build for the owner-approved Ashburton–Hakatere scope. The build must preserve raw observation meaning and make exclusions, unresolved quality, censoring, incomplete coverage, and analytical indeterminacy visible.

## Approved scope

- Preserve the available 2007–2024 history.
- Core parameters: E. coli; Nitrate-N Nitrite-N; Dissolved Reactive Phosphorus; Total Nitrogen; Turbidity; Dissolved Oxygen.
- Retain Total Phosphorus and Water Temperature as secondary normalized parameters.
- Exclude pH from the common analytical scope.
- Use 2015–2024 as the provisional primary window and 2020–2024 as the recent-condition window unless coverage diagnostics support a clearly better contiguous period.

## Implementation decisions within the approved boundary

- Keep the provider observation record immutable at the acquisition boundary; add a separate normalized record with canonical units, parsed censoring limits, quality disposition, duplicate disposition, and analysis eligibility.
- Treat documented NEMS quality meanings as the available authoritative cross-source semantics: 100 missing, 200 non-verified/no quality, 300 synthetic, 400 poor/compromised, 500 fair, and 600 good. ECan-specific child-code mappings not found in the inspected public documentation remain unresolved and are retained but excluded from primary analytical eligibility.
- Exclude synthetic and documented poor/compromised quality records from primary summaries; retain them in normalized assets and exclusion diagnostics. Retain fair/good records. Retain unresolved/unknown records with an explicit unresolved disposition but do not use them in primary statistics.
- Normalize only documented equivalent nutrient units (`g/m3` to `mg/L` with numeric identity) and canonical units supported by source metadata. Do not substitute censored values.
- Collapse only exact semantic duplicates for analytical eligibility. Preserve every normalized source row, and mark conflicting same-key observations indeterminate rather than selecting one.
- Use explicit numeric descriptive summaries with censoring suppression: publish statistics only when eligible observations meet minimum counts and contain no censored values; otherwise publish a null value with an indeterminate reason and counts. This is a conservative validated fallback while a reliable censor-aware ROS implementation is not yet available.
- Use a conservative uncensored Theil–Sen/Kendall trend screen only for windows with sufficient regularity, minimum observations, and no censored or unresolved records. Otherwise publish `indeterminate` with the reason. Direction labels remain `increasing`, `decreasing`, or `indeterminate`.
- Treat calendar-month coverage as a sampling diagnostic, not continuous coverage. Minimum summary count is three eligible observations; minimum trend count is eight eligible observations spanning at least three calendar years.

## Work units

1. Extend contracts and source profile output for full source-preserving observation materialization and quality-code diagnostics.
2. Implement normalization, quality disposition, unit/censoring parsing, duplicate/conflict detection, and deterministic diagnostics.
3. Implement coverage, summary, and trend builders with explicit minimum-observation and indeterminacy rules.
4. Add fixtures and focused tests for all disposition paths, unit/censoring behavior, duplicates/conflicts, coverage, summaries, and trends.
5. Run the long-window selected-parameter acquisition locally, build ignored application assets and a source manifest, and inspect the resulting coverage.
6. Update acquisition, methodology, architecture, decisions, state, backlog, and quality-gate documentation; archive this plan after validation and commit the milestone.

## Outcome

Implemented and locally verified on 2026-09-13. The final polygon-based acquisition used all 19 coordinate-bearing Hilltop sites inside the verified Ashburton boundary and retrieved 10,426 observations from 15 data-producing sites for the approved eight-parameter 2007–2024 history. The generated ignored asset set contains 10,426 normalized rows, 324 coverage records, 1,830 summary records, 324 trend records, and a checksummed manifest.

The normalized contract preserves source values, result text, units, timestamps, quality codes, censoring, limits parsed from censored result text, and provenance. Nutrient `g/m3`/`mg/L` equivalence is normalized to `mg/L`; pH is absent from the normalized scope. Exact duplicates are suppressible for eligibility and conflicts are retained/indeterminate. The build recorded 774 good, 72 fair, 146 documented poor/compromised, and 9,434 unresolved/absent quality dispositions; 846 rows were primary-eligible. All 324 trend records are indeterminate under the explicit censoring/minimum rules.

Independent JSON fixtures cover unit conversion, censoring, quality dispositions, duplicates/conflicts, summaries, trends, and coverage. Twenty-nine Python tests, fixture validation, compilation, frontend typecheck/build, live all-site acquisition, site audit, source-manifest checks, deterministic asset rebuild, and diff checks passed. No formatter/linter, Python static checker, UI automation, accessibility, deployment, or public-data release gate is configured/evidenced.

ECan's published data agreement was retrieved and documented: attribution, no branding without permission, no advertising without permission, public-data freshness/removal responsibility, and CC BY 4.0 unless specifically stated otherwise. Dataset-specific confirmation for the legacy Hilltop route and release attribution/freshness implementation remain release gates. The next frontier is application integration of the ignored assets, with no raw/generated data commit until that release gate is resolved.

## Acceptance evidence

- All raw/source fields required by the user remain available in the ignored acquisition profile and normalized assets.
- Every normalized row has a deterministic quality, value, unit, and duplicate disposition.
- Coverage reports distinguish observed, censored, excluded, unresolved, duplicate, and conflict records by station, parameter, and period.
- Application-ready assets are versioned and generated without committing raw responses or generated datasets.
- Tests and applicable repository gates pass; unavailable gates are recorded with reasons.
- The final documentation states the licensing/source-terms status as a release gate rather than implying redistribution permission.
