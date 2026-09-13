# Ashburton–Hakatere spatial membership

## Objective

Replace the bounded acquisition slice's name-only station screen with
evidence-based membership in Environment Canterbury's public major-catchment
boundary for the owner-selected Ashburton–Hakatere direction.

## Evidence and scope

- Use the ECan ArcGIS `Public/Hydrology/MapServer/0` “Major Catchment
  Boundaries” layer.
- Select `CatchmentGroup=688`, whose live record is named `Ashburton River`.
- Preserve the source endpoint, layer identifier, source object identifier,
  source CRS, output CRS, update metadata, and area in the configuration and
  generated profile metadata.
- Validate Hilltop site coordinates against the returned GeoJSON polygon.
- Keep the study-area display name Ashburton–Hakatere; do not infer that the
  boundary is a regulatory or water-zone boundary.
- Do not select final dashboard parameters or analytical semantics in this
  slice.

## Implementation

1. Add dependency-free ArcGIS boundary retrieval and GeoJSON polygon/
   multipolygon membership helpers with explicit boundary handling.
2. Add a bounded acquisition mode that retrieves the authoritative boundary,
   validates provisional Hilltop sites, and excludes out-of-bound sites before
   measurement retrieval.
3. Add fixtures and tests for polygon membership, holes, multipolygons,
   malformed geometry, complete boundary retrieval, and marine-site exclusion.
4. Update configuration and acquisition/state documentation with the verified
   source semantics and current profile evidence.
5. Run the Python quality gates and a live bounded profile, review the diff,
   archive this plan, and commit the coherent slice.

## Acceptance criteria

- A complete boundary response is required; partial or empty responses fail.
- Membership is based on the authoritative polygon, not station-name aliases.
- The live bounded profile reports eight in-bound provisional sites and no
  offshore Canterbury Bight records for the current 10-site probe.
- No raw geometry or generated observation output is committed.
- Final parameter selection remains explicitly pending owner review.

## Outcome

Completed on 2026-09-13. Added dependency-free ArcGIS GeoJSON boundary
validation and point-in-polygon filtering. The live 2024 bounded profile
retrieved one complete ECan `Ashburton River` major-catchment feature for
`CatchmentGroup=688`, retained 10 in-bound sites, excluded the two Canterbury
Bight marine name-screened sites, and retrieved 243 observations from 9 sites.
Twenty-one Python tests pass. A neutral nine-parameter profile retrieved 644
observations across 8 parameters and found no pH observations in the 2024
window. Full observation coverage, normalization rules,
and final parameters remain open.
