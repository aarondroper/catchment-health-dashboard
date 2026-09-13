# Source response manifest

## Objective

Make bounded acquisition outputs traceable to the exact public responses used,
without committing raw source payloads or adopting a cache-freshness policy.

## Scope

- Record each successful source response's exact endpoint, retrieval timestamp,
  byte count, and SHA-256 digest.
- Include the manifest in generated profile output alongside existing source
  references and profile counts.
- Keep raw response bodies outside version control; do not add automatic cache
  reuse while redistribution terms and freshness semantics remain unresolved.
- Add focused tests for deterministic response metadata and profile inclusion.

## Acceptance criteria

- All acquisition requests used by the bounded profile are recorded, including
  station, boundary, metadata, and observation requests.
- A changed response body produces a changed digest and is not silently treated
  as the same source input.
- The manifest does not contain source payload bodies or credentials.
- Existing source-preserving behavior and explicit no-data/error handling remain
  unchanged.
- Applicable tests, fixture, compilation, frontend, JSON, and diff gates pass;
  the plan is archived.

## Outcome

Completed on 2026-09-13. Bounded profiles now record every successful source
response with its exact endpoint, UTC retrieval timestamp, byte count, and
SHA-256 digest. The live three-site profile recorded 13 responses, including
the ArcGIS count query, station query, Hilltop site list, ECan boundary, six
measurement metadata responses, and three observation responses. No raw
payloads are written or committed. Twenty-two Python tests pass; full raw
snapshot/cache behavior remains intentionally open pending licensing and
freshness decisions.
