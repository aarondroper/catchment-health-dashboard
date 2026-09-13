# Analytical viability and quality-semantics review

**Status:** Complete; archived after implementation and validation
**Started:** 2026-09-13
**Scope:** Quality-code semantics, alternative eligibility policies, censoring/trend viability, and pre-dashboard analytical readiness

## Objective

Determine whether the current 10,426-row Ashburton–Hakatere analytical build is being made artificially sparse by incorrect handling of absent quality codes, and establish whether its summary/trend outputs are useful and defensible before React integration.

## Review questions

1. Distinguish omitted, blank, recognized, unfamiliar, and unparsable quality representations from raw Hilltop responses and parser behavior.
2. Locate authoritative ECan/Hilltop/NEMS documentation for quality-code meanings and omitted-quality semantics.
3. Compare the current strict policy with a documented unflagged-observation policy and any other source-supported policy without selecting by determinacy alone.
4. Explain every trend indeterminacy reason and quantify the effect of censoring and eligibility filtering, especially for dissolved reactive phosphorus.
5. Validate trend calculations independently with known fixtures and determine whether dashboard trends are sufficiently supported.

## Candidate policies

- **Strict current:** only documented fair/good codes are primary-eligible; absent and unfamiliar codes remain retained but unresolved.
- **Unflagged usable:** absent/blank quality is a distinct `unflagged_usable` disposition and is eligible when units/value/censoring rules permit; documented compromised/rejected/superseded records remain excluded.
- **Other source-supported policy:** only adopt if authoritative documentation establishes a more specific meaning for omitted or nonempty codes.

The review must not call absent quality “good” unless source evidence supports that interpretation.

## Work units

1. Inspect representative raw profile rows, Hilltop XML fixtures, parser behavior, and source documentation; add a raw-representation audit report with frequency tables by representation, disposition, parameter, site, year, and eligibility.
2. Implement scenario evaluation over the preserved local profile without initially changing production policy. Compare eligibility, coverage, summary, slope, and trend outcomes.
3. Expand trend diagnostics to distinguish censoring, minimum counts, temporal span/interval coverage, duplicates/conflicts, statistical indeterminacy, and implementation suppression. Validate Theil–Sen/Kendall against independent fixtures.
4. Decide and implement the evidence-supported disposition policy, version the analytical method, regenerate ignored assets, and inspect representative core-parameter outputs.
5. Update methodology, acquisition, decisions, architecture, project state, backlog, and quality gates. Keep licensing as a release gate and preserve attribution requirements.
6. Archive this plan and commit the review. If assets are defensible and useful, proceed directly to local React integration in the next work unit.

## Acceptance evidence

- Missing/blank/nonempty/unfamiliar/parser-failure representations are separately measurable and not silently conflated.
- Scenario results include old/new counts, site/parameter eligibility, temporal coverage, summaries, trends, medians, slopes, and indeterminacy reasons.
- Every current trend record has an explainable reason category, and censoring is not silently discarded.
- Production policy is evidence-supported, tested, documented, and reflected in regenerated deterministic assets.
- Dashboard viability is stated from evidence, including any recommendation to emphasize history/coverage/distributions instead of trends.
- Raw responses and generated assets remain ignored; no public deployment or observation-asset commit occurs under unresolved dataset-specific terms.

## Completion evidence

- Refreshed the polygon-based local profile: 10,426 observations, 9,434
  missing quality elements, 992 nonempty quality elements, no blank elements,
  and no quality parser failures.
- Strict production normalization: 846 eligible observations, 208 usable
  summaries, 0 determinate trends. Diagnostic unflagged scenario: 10,280
  eligible observations, 1,296 usable summaries, 66 structurally eligible
  primary trend series, 17 determinate primary trends.
- Strict trend reasons across all 324 records: 159 insufficient observations,
  84 insufficient temporal span, 81 zero-tolerance censoring suppressions,
  zero interval-coverage suppressions, and zero duplicate/conflict suppressions.
- Added 33 passing Python tests, including missing/blank parser fixtures and an
  independently calculated pairwise Theil–Sen fixture. Python compilation,
  fixture validation, deterministic asset generation, frontend typecheck, and
  frontend production build passed.
- Updated methodology, acquisition, contracts, architecture, decisions,
  quality gates, project state, and backlog. Local React integration began in
  the connected follow-on plan.
