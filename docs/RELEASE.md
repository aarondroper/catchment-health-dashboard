# Release

## Reproducible build

From a clean checkout with Python 3.12+, Node.js 22+, npm, and source access:

```bash
python3 tools/release_build.py
```

The command acquires and validates the approved ECan sources, reconciles the
identified station inventories, generates ignored analytical/runtime assets,
runs the public release gate, installs the locked frontend dependencies,
builds `web/dist/`, and writes an ignored release manifest. The manifest
records analytical and source versions, timestamps, git revision, source
identities, hashes, sizes, freshness policy, and attribution requirements.

The build fails closed for incomplete reconciliation, malformed or stale
inputs, missing licence evidence, required attribution/terms omissions, or
tracked generated outputs. Raw responses and generated observation assets are
not committed.

## Public-use safeguards

Water Quality Data is supported for attributed public reuse under ECan's
dataset-specific CC BY 4.0 Terms of Use. The source terms must accompany
published information. Surface-water sites and Major Catchment Boundaries
retain their separately recorded CC BY 3.0 NZ terms. OpenFreeMap,
OpenMapTiles, OpenStreetMap, Natural Earth, fonts, and dependencies retain
their own terms.

The application must preserve required attribution, avoid ECan branding or
endorsement, expose source and retrieval dates, and retain provenance. CSV
export includes source/licence metadata; a public build must not remove the
terms or make unsupported bulk-redistribution claims.

## Freshness and hosting

The permitted freshness interval is 120 days. The runtime rejects missing,
invalid, future, or expired retrieval metadata and presents an actionable
rebuild/remove message instead of old observations as current monitoring. The
release check enforces the same policy before build.

Static hosting should serve the SPA fallback for direct navigation, use correct
MIME types, apply long-lived immutable caching only to hashed application
assets, and revalidate runtime data. The built app has no live ECan calls and
does not publish source maps. Hosting provider configuration, deployment, and
operational monitoring remain outside this repository.

The exact water-quality terms evidence is preserved in
[`release/ecan-source-licence-evidence.json`](release/ecan-source-licence-evidence.json)
and [`release/evidence/TermsOfUseWaterQualityDataPublicWebsite-3957205.pdf`](release/evidence/TermsOfUseWaterQualityDataPublicWebsite-3957205.pdf).
