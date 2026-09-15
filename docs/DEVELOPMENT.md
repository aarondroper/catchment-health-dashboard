# Development

## Environment

Use Python 3.12+, Node.js 22+, npm, and a network connection for fresh source
acquisition. Work from the repository root. Generated source responses,
analytical assets, runtime partitions, browser artifacts, and build outputs are
ignored; do not add them to commits.

Install frontend dependencies from the lockfile:

```bash
cd web
npm ci
```

## Python and asset checks

```bash
python3 -m unittest discover -s tests -v
python3 tools/validate_fixture.py tests/fixtures/minimal_asset.json
python3 -m py_compile catchment_dashboard/*.py tools/*.py tests/*.py
```

To acquire sources and prepare the real dashboard assets, use:

```bash
python3 tools/release_build.py
```

This validates station reconciliation, contracts, attribution evidence,
freshness, ignored generated outputs, and the static build boundary. Live
source publication can change the resulting profile.

## Frontend checks

From `web/`:

```bash
npm run typecheck
npm run test:unit
npm run build
npm run test:browser
```

The browser suite uses local Chromium and real prepared assets when available,
checking coordinated selections, map/fallback behavior, attribution,
accessibility, responsive overflow, chart sizing and tooltips, trend/site
comparison states, observation details, and CSV export. `npm run dev` starts a
local development server at `http://localhost:5173/`.

## Release and review expectations

Run `python3 tools/check_release_readiness.py --require-public-release` before
any public build. Review the generated manifest, source terms, attribution,
retrieval date, checksums, and 120-day current-or-remove behavior. A public
host must serve the SPA fallback, correct MIME types, compressed assets, and
revalidation for runtime data; visitors must not need live ECan access.

For a Cloudflare Pages artifact review, run
`python3 tools/check_cloudflare_artifact.py --dist web/dist` after the release
build. Do not use a Git-connected Pages build because the real analytical
assets are ignored. The direct artifact workflow and hosted browser command
are documented in [`RELEASE.md`](RELEASE.md).

Keep source-preserving processing and frontend decoding changes covered by
contract, unit, and browser tests. Use screenshots only as local review
artifacts; the repository tracks one representative image in `docs/assets/`.

The replaceable header logo is `web/src/assets/app-logo.svg`. Keep that
filename and path unchanged, use a stable transparent SVG viewBox/aspect ratio,
and keep the artwork self-contained: no external resources, scripts, embedded
raster data, or unnecessary metadata. The surrounding image sizing should not
need React or CSS changes when the placeholder is replaced.
