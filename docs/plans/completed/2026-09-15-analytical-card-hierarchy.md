# Analytical card hierarchy refinement

**Status:** Complete
**Date:** 2026-09-15

## Objective

Continue the accepted interface-simplification direction by reducing duplicate
headings and low-value copy in the history and right analytical cards while
preserving the existing analytical outputs, disclosures, interactions, map
composition, and release safeguards.

## Scope

- reshape the history card around a single `Time series` heading;
- replace native point titles with a styled, accessible observation tooltip and
  retain a non-pointer route through observation detail;
- add responsive date ticks and recover horizontal plotting space;
- simplify Selected site, Trend, Site comparison, and Recent observations
  headings and spacing;
- give the comparison plot the vertical space released by compacting adjacent
  cards while retaining its short-height ranked fallback and exact disclosure.

## Validation and completion

- update focused browser assertions for headings, tooltip/detail access,
  comparison descriptions, and removed redundant controls;
- run frontend typecheck, unit tests, production build, and the complete
  Playwright/axe suite;
- inspect 1440×900, 1536×864, 1920×1080, 1024×768, and 390×844 captures;
- review the diff, update current project documentation, archive this plan,
  and create one coherent UI commit.

## Outcome

Implemented and browser-verified on 2026-09-15. The history card now uses a
single `Time series` heading with subdued station context, a wider responsive
plot, additional date ticks, and a styled pointer tooltip containing date,
value, unit, record state, and quality context. The persistent explanatory
sentence and point-inspection disclosure were removed; the chart now points
screen readers to the existing complete observation dialog for exact values.

The right rail now uses single headings for Selected site, Trend, Site
comparison, and Recent observations. Redundant comparison prose and the
secondary observation-detail button were removed, while the comparison plot,
ranked short-height fallback, exact-value disclosure, trend qualification, and
View all route remain intact. The primary map/history allocation and analytical
contracts were not changed.

Typecheck, 12 frontend unit tests, production build, and all 19 Playwright/axe
browser tests passed. Final screenshots were regenerated and inspected at
1440×900, 1536×864, 1920×1080, 1024×768, and 390×844. The measured history
plotting regions are 749×164px, 837×150px, and 1,213×233px respectively at
the three desktop viewports.
