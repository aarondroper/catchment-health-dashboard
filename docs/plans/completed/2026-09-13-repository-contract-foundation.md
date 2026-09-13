# Execution Plan — Repository and Contract Foundation

## Objective

Establish a minimal, reproducible Priority 1 codebase for the owner-selected Ashburton–Hakatere scope, with explicit provider boundaries, versioned data contracts, a Python fixture path, and a React/TypeScript frontend scaffold ready for MapLibre and coordinated state.

## Scope

- Record the owner catchment decision without finalizing the core parameter set or analytical methodology.
- Establish Python packaging/tooling, dependency constraints, test layout, configuration, and data-directory policy.
- Define versioned source, normalized observation, station, aggregate/trend placeholder, and asset-manifest contracts based only on verified source evidence.
- Add a small fixture that crosses source-shaped input, normalized records, and application asset validation.
- Create a React/TypeScript/Vite shell with a MapLibre-ready boundary and an accessible inline-SVG chart spike; avoid committing runtime map tiles or source data.
- Add reproducible commands for Python tests, formatting/lint/type checks where configured, frontend type checking/build, and contract validation.

## Work units

1. Update decisions/state/backlog and create this plan.
2. Add Python package metadata, configuration, typed contract definitions, fixture validation, and focused tests.
3. Add frontend package metadata, typed asset loading/state boundaries, MapLibre-ready shell, charting spike, and build/type tests.
4. Add developer documentation and ignore/data policy; run install/build/test/contract gates.
5. Review the diff, archive the plan with evidence, and commit the coherent foundation.

## Boundaries

- Ashburton–Hakatere is accepted as the study-area direction.
- The exact polygon membership workflow, final four-to-six parameters, units normalization, censored/quality handling, trend method, thresholds, and status labels remain Priority 2/3 and owner-review boundaries.
- The chart spike may select a technical rendering approach, but it must not introduce environmental interpretation.

## Acceptance evidence

- A fresh checkout has documented commands for Python and frontend setup/validation.
- A minimal fixture validates a stable internal contract and rejects structurally invalid records.
- Provider-shaped fields are isolated at the adapter boundary; source IDs and provenance remain available.
- Frontend TypeScript type checking and production build pass.
- Python tests and contract validation pass.
- No raw data, secrets, or large generated assets are tracked.
- Owner catchment selection is recorded; no scientific methodology is silently adopted.

## Planned validation

- Python tests, formatter/linter/type checks if installed/configured.
- Frontend `npm run typecheck`, `npm run build`, and any configured lint/test checks.
- Contract fixture validation and git diff/secret/artifact review.
- Record unavailable checks explicitly rather than converting them into false success claims.

## Outcome

Completed on 2026-09-13. The owner-selected Ashburton–Hakatere direction is recorded without finalizing polygon membership, parameters, or analytical semantics. Version `0.1.0` Python contracts, configuration, a synthetic fixture validator, focused tests, and a Vite/React/TypeScript shell with a MapLibre boundary and inline-SVG/table chart spike are implemented. `web/package-lock.json` was generated from the declared exact dependencies.

Verified commands:

- `python3 -m unittest discover -s tests -v` — 9 tests passed.
- `python3 tools/validate_fixture.py tests/fixtures/minimal_asset.json` — passed; 1 source, 1 station, 1 parameter, 2 observations, 1 manifest asset.
- `python3 -m py_compile catchment_dashboard/*.py tools/*.py tests/*.py` — passed.
- `cd web && npm run typecheck` — passed.
- `cd web && npm run build` — passed; Vite emitted the production bundle.

Not run or not yet configured: formatter/linter, Python static/type checker, CI, automated browser/accessibility checks, production observation acquisition, visual screenshot review, deployment, and vulnerability/licensing review beyond the lockfile metadata. Those gates belong to later work or require tools/configuration not present in the repository.
