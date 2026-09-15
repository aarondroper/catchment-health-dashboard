#!/usr/bin/env python3
"""Build a concise deterministic audit matrix for dashboard Trend/comparison display."""

from __future__ import annotations

import argparse
from collections import Counter
import json
from pathlib import Path
from typing import Any

REPOSITORY_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_ASSET = REPOSITORY_ROOT / "web/public/data/ashburton/dashboard.json"
DEFAULT_OUTPUT = REPOSITORY_ROOT / "reports/generated/ashburton-display-audit.json"
WINDOWS = ("primary_2016_2025", "recent_2020_2025", "history_2007_2025")


def _read_asset(path: Path) -> dict[str, Any]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(payload, dict):
        raise ValueError("runtime asset root must be an object")
    return payload


def _counter(values: list[str | None]) -> dict[str, int]:
    return dict(sorted(Counter(value or "none" for value in values).items()))


def audit_asset(asset: dict[str, Any]) -> dict[str, Any]:
    parameters = asset.get("parameters", [])
    summaries = asset.get("summaries", [])
    trends = asset.get("trends", [])
    coverage = asset.get("coverage", [])
    matrix: list[dict[str, Any]] = []
    examples: dict[str, dict[str, Any]] = {}

    for parameter in parameters:
        parameter_id = parameter["parameterId"]
        for period in WINDOWS:
            period_summaries = [
                row for row in summaries
                if row.get("parameterId") == parameter_id
                and row.get("period") == period
                and row.get("status") == "reported"
                and all(row.get(field) is not None for field in ("value", "q1", "q3"))
            ]
            period_trends = [
                row for row in trends
                if row.get("parameterId") == parameter_id and row.get("period") == period
            ]
            matrix.append({
                "parameterId": parameter_id,
                "period": period,
                "supportedSummarySiteCount": len(period_summaries),
                "trendRecordCount": len(period_trends),
                "trendStatusCounts": dict(sorted(Counter(row.get("status", "missing") for row in period_trends).items())),
                "trendDirectionCounts": dict(sorted(Counter(row.get("direction", "missing") for row in period_trends).items())),
                "trendReasonCounts": _counter([row.get("indeterminateReason") for row in period_trends if row.get("status") != "reported"]),
            })
            for row in period_trends:
                reason = row.get("indeterminateReason")
                key = "reported_increasing" if row.get("status") == "reported" and row.get("direction") == "increasing" else "reported_decreasing" if row.get("status") == "reported" and row.get("direction") == "decreasing" else reason
                if key and key not in examples:
                    examples[key] = {"parameterId": parameter_id, "period": period, "stationId": row.get("stationId")}

    zero_coverage = [
        row for row in coverage
        if row.get("raw_count") == 0
    ]
    examples["no_data"] = (
        {"parameterId": zero_coverage[0].get("parameter_id"), "period": zero_coverage[0].get("window"), "stationId": zero_coverage[0].get("station_id")}
        if zero_coverage else {"source": "coverage", "note": "No zero-record coverage rows in this refreshed runtime asset; observation-free stations are represented by absent coverage/trend rows."}
    )
    return {
        "contractVersion": asset.get("contractVersion"),
        "analyticalVersion": asset.get("analyticalVersion"),
        "sourceRetrievedAt": asset.get("sourceRetrievedAt"),
        "parameterWindowMatrix": matrix,
        "examples": examples,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--asset", type=Path, default=DEFAULT_ASSET)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()
    asset_path = args.asset if args.asset.is_absolute() else REPOSITORY_ROOT / args.asset
    output_path = args.output if args.output.is_absolute() else REPOSITORY_ROOT / args.output
    report = audit_asset(_read_asset(asset_path))
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(report, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(f"DISPLAY_AUDIT_WRITTEN={output_path.relative_to(REPOSITORY_ROOT)}")
    print(f"DISPLAY_AUDIT_ROWS={len(report['parameterWindowMatrix'])}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
