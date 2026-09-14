# Reproducible release build

Run from the repository root:

```bash
python3 tools/release_build.py
```

The command acquires the approved eight-parameter 2007–2025 profile, refreshes
the site and boundary audit, reconciles the complete identified source
inventories, builds the versioned analytical assets, prepares the ignored
runtime shell and partitions, runs `check_release_readiness.py
--require-public-release`, installs the locked frontend dependencies, runs
frontend type/unit checks, builds `web/dist`, and writes an ignored
`reports/generated/release-work/release-manifest.json`.

The manifest records the analytical version, build time, git revision, source
identities, terms-document hash, runtime/deployable file hashes and sizes,
freshness policy, and attribution requirement. Raw responses, intermediate
profiles, analytical assets, runtime observations, browser artifacts, and build
outputs remain ignored. The release command fails closed when source
reconciliation is unresolved, the asset is stale or malformed, required
attribution/terms evidence is absent, or generated outputs are tracked.

The public static build has no live ECan calls in the browser. No hosting
provider is selected in the repository, so cache headers and SPA fallback must
be configured by the eventual deployer: serve hashed `/assets/*` files with
long-lived immutable caching, serve `/data/ashburton/*` with revalidation/no
long-lived cache, and route `/` to `index.html`. The built Vite app does not
publish source maps. Direct navigation to `/` and all runtime data paths are
local-build verified; no external deployment is performed here.

The runtime performs the same 120-day freshness check as the release gate. A
missing, invalid, future, or expired source retrieval date blocks the public
asset and shows an actionable rebuild message rather than presenting stale
observations as current monitoring.
