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

The release command stages the runtime shell and parameter partitions under
the ignored release work directory before replacing `web/public/data/`. A
source timeout therefore cannot clear the last eligible local asset or leave a
partially prepared deployment directory. After the frontend build,
`tools/check_cloudflare_artifact.py` verifies the real public runtime shell,
all declared partitions, checksums, freshness metadata, source terms, and the
tracked Cloudflare cache policy.

## Cloudflare Pages deployment model

Use a direct Wrangler artifact deployment, not a Git-connected Cloudflare
build. Cloudflare documents Direct Upload for prebuilt asset directories and
notes that Git integration cannot later be changed to Direct Upload; see the
[Direct Upload documentation](https://developers.cloudflare.com/pages/get-started/direct-upload/).
The generated observation assets are intentionally ignored, so a connected
build could otherwise produce a fixture-only dashboard without obvious
failure. The release command prepares the complete static artifact locally and
the artifact checker fails closed before upload.

From the repository root, after installing the prerequisites:

```bash
python3 tools/release_build.py
python3 tools/check_cloudflare_artifact.py --dist web/dist
```

Authenticate Wrangler outside the repository, either with `npx wrangler login`
or an externally supplied `CLOUDFLARE_API_TOKEN`. Then set the Pages project
name in the shell and deploy the already-validated directory:

```bash
export CLOUDFLARE_PAGES_PROJECT='your-pages-project-name'
npx wrangler pages deploy web/dist --project-name "$CLOUDFLARE_PAGES_PROJECT"
```

No account ID, token, project name, Wrangler configuration, generated build,
or analytical asset is stored in the repository. The owner must create/select
the Pages project and provide authentication; token-based automation may also
need `CLOUDFLARE_ACCOUNT_ID` supplied in the shell. Cloudflare Pages supplies
the SPA fallback for this static application; the tracked `web/public/_headers`
file applies immutable caching to hashed application assets and revalidation
to `/data/ashburton/*` runtime data. Visitors make no live calls to ECan.

After deployment, run the existing browser suite against the hosted URL from
`web/`:

```bash
PLAYWRIGHT_BASE_URL='https://your-pages-project.pages.dev' npm run test:browser
```

This checks real runtime loading, attribution, fallback behavior, coordinated
interactions, accessibility, export, console/network errors, and responsive
overflow without starting a local server. A hosted smoke test does not replace
the 120-day current-or-remove operation: expired assets must be removed or
replaced by a fresh release. Cloudflare's `_headers` support is documented at
<https://developers.cloudflare.com/pages/configuration/headers/>, and its
single-page application fallback is described at
<https://developers.cloudflare.com/pages/configuration/serving-pages/>.

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
