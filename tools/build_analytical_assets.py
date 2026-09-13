#!/usr/bin/env python3
"""Build local, versioned analytical assets from a full acquisition profile."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
import sys

REPOSITORY_ROOT = Path(__file__).resolve().parents[1]
if str(REPOSITORY_ROOT) not in sys.path:
    sys.path.insert(0, str(REPOSITORY_ROOT))

from catchment_dashboard.analytics import build_assets


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--profile", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, default=Path("reports/generated/ashburton-analytical-assets"))
    parser.add_argument("--quality-policy", choices=("published_unflagged", "strict"), default=None)
    args = parser.parse_args()
    build_kwargs = {} if args.quality_policy is None else {"quality_policy": args.quality_policy}
    manifest = build_assets(args.profile, args.output_dir, **build_kwargs)
    print(json.dumps(manifest["counts"], sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
