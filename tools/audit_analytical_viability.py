#!/usr/bin/env python3
"""Build the ignored quality-semantics and analytical-viability report."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
import sys

REPOSITORY_ROOT = Path(__file__).resolve().parents[1]
if str(REPOSITORY_ROOT) not in sys.path:
    sys.path.insert(0, str(REPOSITORY_ROOT))

from catchment_dashboard.viability import build_viability_report


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--profile", type=Path, required=True)
    parser.add_argument("--output", type=Path, default=Path("reports/generated/ashburton-viability-review.json"))
    args = parser.parse_args()
    report = build_viability_report(args.profile)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, indent=2, sort_keys=True, default=str) + "\n", encoding="utf-8")
    print(json.dumps({
        "source_observation_count": report["source_observation_count"],
        "raw_quality_representation_counts": report["raw_quality_representation_counts"],
        "comparison": report["comparison_strict_to_unflagged"],
    }, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
