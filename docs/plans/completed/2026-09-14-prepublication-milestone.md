# Final pre-publication milestone

**Status:** Completed and archived
**Scope:** Reconcile the complete Ashburton–Hakatere source-inventory slice, refresh the supported analytical window, harden freshness/runtime release behavior, rehearse the reproducible static build, and prepare portfolio-facing repository documentation without publishing or deploying.

## Work units

1. Inspect and extend the source-inventory/site reconciliation so exact IDs,
   boundary inclusion, pagination, CRS, unmatched records, and source limits
   are deterministic and fail closed.
2. Run a fresh live acquisition and coverage audit, assess 2025 completeness,
   and advance or retain the primary/history windows only from measured
   coverage.
3. Add runtime freshness validation and tests for fresh, near-expiry, expired,
   invalid, and missing metadata.
4. Document and rehearse one clean release command that acquires, validates,
   builds, checks, and produces the static application without tracking data.
5. Validate static-hosting behavior locally, improve public repository
   presentation, add one permissible representative screenshot, and run all
   gates.

## Exit criteria

- Coverage reconciliation distinguishes verified inclusion, observation-free,
  unresolved, excluded, and source-limited records without claiming environmental
  completeness.
- The analytical window decision is recorded with current source evidence and
  regenerated assets are deterministic.
- Stale/invalid runtime assets are blocked with actionable UI behavior.
- A documented release rehearsal passes from repository sources through a
  production frontend build; raw/generated outputs remain ignored.
- README and governance documents match verified reality.
- This plan is archived and the implementation is committed; no external
  publication, remote repository, or deployment occurs.

## Outcome

Completed on 2026-09-14. The source-inventory reconciliation retrieved
6,266/6,266 ArcGIS surface features and 550 coordinate-bearing Hilltop sites;
340 surface features and 19 Hilltop sites are inside/on the verified boundary,
with 19 exact station-ID matches, 321 surface-only inventory records, no
Hilltop-only matches, three metadata-only sites, and one selected-metadata
site without returned observations. No nearest-coordinate fallback was used;
the largest exact-ID coordinate difference was approximately 0.0000153
degrees.

The fresh profile contains 11,230 observations through 2025-12-18. All six
core parameter families have 2025 observations at 9–15 sites across all twelve
calendar months, supporting the 2016–2025 primary window and 2020–2025 recent
window. The regenerated `ashburton-analytical-v4-published-unflagged-2016-2025`
asset contains 11,078 eligible rows, 1,370 reported summaries, 324 trend rows,
and 30 determinate trends overall/9 in the primary window. The strict sensitivity
build contains 1,644 eligible rows, 348 reported summaries, and no reported
trends. Existing quality, censoring, summary, and neutral trend rules were not
relaxed.

Runtime freshness checks and deterministic tests now reject missing, invalid,
future, or expired source metadata, with a near-expiry state. The documented
`python3 tools/release_build.py` command was rehearsed with `--skip-npm-install`
after a successful `npm ci`; it acquired sources, reconciled inventories,
passed the public release gate, built the frontend, and wrote an ignored hashed
release manifest. The shell is 1,294,388 bytes raw; production preview browser
transfer measured approximately 88 kB for the shell and 33 kB for the initial
Total Nitrogen partition. The deployable build contains no source maps.

Validation completed: 39 Python unit tests, fixture validation, Python
compilation, current viability audit, deterministic analytical/runtime rebuild,
public release readiness, frontend typecheck, 12 frontend unit tests, Vite
production build, 15 Playwright/axe tests against Vite preview, console/page-
error/request-failure/overflow checks, responsive screenshots at 1440×900,
1024×768, and 390×844, and visual inspection of all three viewports. No
public repository, generated data commit, or deployment was performed. No
formatter/linter or hosted smoke check exists in the repository; external
publication and deployment remain owner-authorized next steps.
