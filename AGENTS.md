# Agent Operating Contract

This repository contains the governance for the **Catchment Health Dashboard**. Keep claims grounded in repository evidence, preserve the product's scientific restraint, and keep the governance documents synchronized with implementation.

## Read first

Read these in order:

1. `AGENTS.md`
2. `docs/PROJECT_BRIEF.md`
3. `docs/PROJECT_STATE.md`
4. `docs/BACKLOG.md`
5. `docs/ARCHITECTURE.md`
6. `docs/QUALITY_GATES.md`
7. `docs/DECISIONS.md` when relevant
8. Any relevant plan under `docs/plans/active/`

Then inspect the actual code, tests, configuration, data manifests, documentation, and git state. Repository evidence outranks stale prose.

## Evidence language

Use these categories precisely:

- **Verified:** supported by inspected repository evidence or a reproducible check run now.
- **Implemented, not verified:** present but not successfully validated now.
- **Planned:** accepted future work, not current capability.
- **Assumption:** a working premise still requiring evidence.
- **Decision required:** an owner-level boundary has been reached.

Never claim that a source, calculation, test, build, deployment, or user flow works without evidence. Record unavailable validation and its reason.

## Authority and boundaries

Agents may inspect, plan substantial work, implement straightforward low-risk changes, add tests and documentation, run applicable checks, and commit coherent work when a usable git repository is available.

Do not silently decide or materially change product scope, catchment, core parameters, source choice, architecture, analytical methodology, thresholds/status semantics, composite scores, cost, privacy/security posture, major visual direction, or destructive data operations. At such a boundary, report evidence, options, recommendation, and consequences for owner review.

## Working loop

1. Inspect repository state before editing.
2. Select the next appropriate backlog item or explicit user objective.
3. For substantial work, create a concise plan under `docs/plans/active/`.
4. Implement without unrelated scope expansion.
5. Run the applicable gates in `docs/QUALITY_GATES.md` and record skipped checks.
6. Review the diff, correct stale claims or accidental artifacts, and synchronize state/backlog/technical docs.
7. Move completed plans to `docs/plans/completed/` and commit when appropriate.

## Product guardrails

Use real public observations and programmatic acquisition where practical. Preserve provenance, source identifiers, units, timestamps, quality flags, and processing versions. Make missingness and incomplete coverage explicit. Do not imply causation, regulatory compliance, continuous sampling, or environmental improvement/decline beyond the adopted methodology. Prefer static or nearly static runtime delivery unless evidence requires otherwise, and do not commit large raw or generated datasets.

See `docs/PROJECT_BRIEF.md` for product scope and non-goals, `docs/ARCHITECTURE.md` for intended/current boundaries, `docs/QUALITY_GATES.md` for validation, and `docs/DECISIONS.md` for accepted consequential decisions.
