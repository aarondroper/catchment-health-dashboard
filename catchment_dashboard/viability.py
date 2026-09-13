"""Quality-semantics and analytical-viability diagnostics for local builds."""

from __future__ import annotations

import json
from collections import Counter
from datetime import date
from pathlib import Path
from typing import Any

from .analytics import (
    QUALITY_POLICIES,
    build_coverage,
    build_summaries,
    build_trends,
    normalize_observations,
)
from .contracts import ObservationRecord, SourceRef


QUALITY_EVIDENCE = {
    "nems_schema": "https://www.lawa.org.nz/media/16580/nems-quality-code-schema-2013-06-1-.pdf",
    "lawa_hilltop_quality_example": "https://www.lawa.org.nz/media/18255/implementing-qualcodes-tdc-for-lawa.pdf",
    "ecan_water_quality": "https://www.ecan.govt.nz/data/water-quality-data",
}


def load_profile_observations(profile_path: Path) -> tuple[dict[str, Any], list[ObservationRecord]]:
    profile = json.loads(profile_path.read_text(encoding="utf-8"))
    rows = profile.get("observations")
    if not isinstance(rows, list):
        raise ValueError("profile must contain observations")
    observations: list[ObservationRecord] = []
    for payload in rows:
        item = dict(payload)
        source = SourceRef(**item.pop("source"))
        observations.append(ObservationRecord(source=source, **item))
    return profile, observations


def _year(row: ObservationRecord) -> int:
    return date.fromisoformat(row.observed_at[:10]).year


def _representation(row: ObservationRecord) -> str:
    return row.quality_representation or ("nonempty_code" if row.quality_flag else "legacy_unspecified")


def quality_frequency_table(normalized: list[Any], observations: list[ObservationRecord]) -> list[dict[str, Any]]:
    raw_by_id = {row.observation_id: row for row in observations}
    counts: Counter[tuple[str, str, str, str, int, str]] = Counter()
    for row in normalized:
        raw = raw_by_id[row.observation_id]
        counts[
            (
                _representation(raw),
                row.quality_disposition,
                row.parameter_id,
                row.station_id,
                _year(raw),
                "included" if row.analysis_eligible else "excluded",
            )
        ] += 1
    return [
        {
            "raw_quality_representation": key[0],
            "normalized_disposition": key[1],
            "parameter_id": key[2],
            "station_id": key[3],
            "year": key[4],
            "analysis_status": key[5],
            "count": count,
        }
        for key, count in sorted(counts.items())
    ]


def _series_coverage(rows: list[Any]) -> list[dict[str, Any]]:
    grouped: dict[tuple[str, str], list[Any]] = {}
    for row in rows:
        grouped.setdefault((row.station_id, row.parameter_id), []).append(row)
    result = []
    for (station_id, parameter_id), series in sorted(grouped.items()):
        eligible = [row for row in series if row.analysis_eligible]
        dates = sorted(date.fromisoformat(row.observed_at[:10]) for row in eligible)
        result.append({
            "station_id": station_id,
            "parameter_id": parameter_id,
            "raw_count": len(series),
            "eligible_count": len(eligible),
            "eligible_numeric_count": sum(row.value_kind == "observed_numeric" for row in eligible),
            "eligible_censored_count": sum(row.value_kind == "censored" for row in eligible),
            "first_eligible_date": dates[0].isoformat() if dates else None,
            "last_eligible_date": dates[-1].isoformat() if dates else None,
            "eligible_calendar_years": sorted({value.year for value in dates}),
            "eligible_calendar_year_count": len({value.year for value in dates}),
            "eligible_calendar_month_count": len({(value.year, value.month) for value in dates}),
        })
    return result


def _trend_reason_counts(trends: list[dict[str, Any]]) -> dict[str, int]:
    counts = Counter()
    for row in trends:
        if row["status"] == "reported":
            counts["reported"] += 1
        elif row.get("indeterminate_reason") == "censored_values_present_censor_aware_trend_not_implemented":
            counts["censoring_threshold_exceeded_zero_tolerance"] += 1
        elif row.get("indeterminate_reason") == "insufficient_eligible_numeric_observations":
            counts["insufficient_eligible_observations"] += 1
        elif row.get("indeterminate_reason") == "insufficient_calendar_year_span":
            counts["insufficient_temporal_span"] += 1
        elif row.get("indeterminate_reason") == "screened_not_significant":
            counts["statistically_indeterminate_direction"] += 1
        elif row.get("indeterminate_reason") == "no_ordered_pairs_for_trend_estimate":
            counts["implementation_level_no_ordered_pairs"] += 1
        else:
            counts[f"implementation_level_{row.get('indeterminate_reason') or 'unknown'}"] += 1
    # These are explicit audit categories. The current implementation does not
    # suppress for interval coverage or duplicates, but reports their counts.
    counts.setdefault("inadequate_sampling_interval_coverage", 0)
    counts.setdefault("statistically_indeterminate_direction", 0)
    counts.setdefault("implementation_level_suppression", 0)
    counts.setdefault("censoring_threshold_exceeded_zero_tolerance", 0)
    counts.setdefault("insufficient_eligible_observations", 0)
    counts.setdefault("insufficient_temporal_span", 0)
    counts["duplicate_or_conflict_exclusion"] = sum(
        row.get("duplicate_conflict_count", 0) + row.get("suppressed_exact_duplicate_count", 0)
        for row in trends
    )
    return dict(sorted(counts.items()))


def _scenario(observations: list[ObservationRecord], policy: str) -> dict[str, Any]:
    normalized, disposition_counts = normalize_observations(observations, quality_policy=policy)
    coverage = build_coverage(normalized)
    summaries = build_summaries(normalized)
    trends = build_trends(normalized)
    primary_coverage = [row for row in coverage["records"] if row["window"] == "primary_2015_2024"]
    primary_trends = [row for row in trends if row["period"] == "primary_2015_2024"]
    return {
        "policy": policy,
        "policy_description": QUALITY_POLICIES[policy],
        "normalized_counts": disposition_counts,
        "eligible_observation_count": sum(row.analysis_eligible for row in normalized),
        "eligible_by_site_parameter": [
            {
                "station_id": row["station_id"],
                "parameter_id": row["parameter_id"],
                "eligible_count": row["eligible_count"],
                "eligible_numeric_count": row["eligible_numeric_count"],
                "eligible_censored_count": row["eligible_censored_count"],
            }
            for row in primary_coverage
        ],
        "temporal_coverage_primary": _series_coverage([
            row for row in normalized if row.observed_at[:10] <= "2024-12-31" and row.observed_at[:10] >= "2015-01-01"
        ]),
        "usable_summary_count": sum(row["status"] == "reported" for row in summaries),
        "usable_summary_count_primary_or_recent": sum(
            row["status"] == "reported" and row["period"] in {"primary_2015_2024", "recent_2020_2024"} for row in summaries
        ),
        "trend_eligible_series_primary": sum(
            row["eligible_numeric_count"] >= row["minimum_observations"]
            and row["calendar_year_count"] >= row["minimum_calendar_years"]
            and row["eligible_censored_count"] == 0
            for row in primary_trends
        ),
        "trend_determinate_count_primary": sum(row["status"] == "reported" for row in primary_trends),
        "trend_indeterminate_count_primary": sum(row["status"] == "indeterminate" for row in primary_trends),
        "trend_reason_counts_primary": _trend_reason_counts(primary_trends),
        "trend_determinate_count_all_windows": sum(row["status"] == "reported" for row in trends),
        "trend_indeterminate_count_all_windows": sum(row["status"] == "indeterminate" for row in trends),
        "trend_reason_counts_all_windows": _trend_reason_counts(trends),
        "trends": trends,
        "summaries": summaries,
        "normalized": normalized,
        "coverage": coverage,
    }


def _comparison(left: dict[str, Any], right: dict[str, Any]) -> dict[str, Any]:
    left_summaries = {row["summary_id"]: row for row in left["summaries"]}
    right_summaries = {row["summary_id"]: row for row in right["summaries"]}
    shared_summary_ids = sorted(set(left_summaries) & set(right_summaries))
    changed_medians = sum(
        left_summaries[key]["value"] != right_summaries[key]["value"]
        for key in shared_summary_ids
        if left_summaries[key]["value"] is not None and right_summaries[key]["value"] is not None
    )
    left_trends = {row["trend_id"]: row for row in left["trends"]}
    right_trends = {row["trend_id"]: row for row in right["trends"]}
    shared_trend_ids = sorted(set(left_trends) & set(right_trends))
    changed_slopes = sum(
        left_trends[key]["estimate_per_year"] != right_trends[key]["estimate_per_year"]
        for key in shared_trend_ids
        if left_trends[key]["estimate_per_year"] is not None and right_trends[key]["estimate_per_year"] is not None
    )
    return {
        "eligible_observation_delta": right["eligible_observation_count"] - left["eligible_observation_count"],
        "usable_summary_delta": right["usable_summary_count"] - left["usable_summary_count"],
        "trend_eligible_series_primary_delta": right["trend_eligible_series_primary"] - left["trend_eligible_series_primary"],
        "trend_determinate_count_primary_delta": right["trend_determinate_count_primary"] - left["trend_determinate_count_primary"],
        "trend_indeterminate_count_primary_delta": right["trend_indeterminate_count_primary"] - left["trend_indeterminate_count_primary"],
        "shared_summary_count": len(shared_summary_ids),
        "changed_median_count_among_reported_shared_summaries": changed_medians,
        "shared_trend_count": len(shared_trend_ids),
        "changed_slope_count_among_reported_shared_trends": changed_slopes,
    }


def build_viability_report(profile_path: Path) -> dict[str, Any]:
    profile, observations = load_profile_observations(profile_path)
    strict = _scenario(observations, "strict")
    unflagged = _scenario(observations, "unflagged_usable")
    raw_representation_counts = Counter(_representation(row) for row in observations)
    legacy_counts = Counter()
    for row in strict["normalized"]:
        legacy_counts["unresolved_quality" if row.quality_disposition in {"missing_quality_field", "blank_quality_field"} else row.quality_disposition] += 1
    legacy_counts["analysis_eligible"] = strict["eligible_observation_count"]
    parse_failure_count = sum(
        value for key, value in (profile.get("summary", {}).get("parse_counts", {}) or {}).items()
        if "parse_failure" in key or "parse_error" in key
    )
    return {
        "report_version": "1.0.0",
        "analytical_version": strict["coverage"]["analytical_version"],
        "profile_path": str(profile_path),
        "source_observation_count": len(observations),
        "raw_quality_representation_counts": dict(sorted(raw_representation_counts.items())),
        "quality_parse_failure_count": parse_failure_count,
        "baseline_current_output_counts": {
            **dict(sorted(legacy_counts.items())),
            "note": "Legacy v1 output combined absent quality fields with unresolved quality under one disposition; refreshed v2 separates the representation and uses missing_quality_field for the observed absent-field rows.",
        },
        "quality_frequency_table": quality_frequency_table(strict["normalized"], observations),
        "authoritative_evidence": {
            "sources": QUALITY_EVIDENCE,
            "findings": [
                "NEMS/LAWA defines QC100 as missing record, QC200 as no quality or non-verified, QC300 as synthetic, QC400 as compromised representation or significantly modified, QC500 as fair representation, and QC600 as good representation.",
                "The Hilltop quality-code example states that telemetered and manually imported logger data can remain QC200 until checked, processed, and archived.",
                "The same guidance reports data without a quality code as a separately measurable category, but does not establish that an omitted quality element is good or unqualified.",
                "ECan states that public water-quality results may be delayed for quality checks and directs users to its terms of use.",
            ],
            "production_conclusion": "Retain missing and blank quality as unresolved in the production policy; evaluate unflagged_usable only as a diagnostic scenario because omitted-quality semantics are not documented for this ECan Hilltop response.",
        },
        "scenarios": {
            "strict_current": {key: value for key, value in strict.items() if key not in {"normalized", "coverage", "summaries", "trends"}},
            "unflagged_usable_diagnostic": {key: value for key, value in unflagged.items() if key not in {"normalized", "coverage", "summaries", "trends"}},
        },
        "comparison_strict_to_unflagged": _comparison(strict, unflagged),
        "trend_audit": {
            "strict_primary_reason_counts": strict["trend_reason_counts_primary"],
            "unflagged_primary_reason_counts": unflagged["trend_reason_counts_primary"],
            "method_note": "Current trends use uncensored Theil-Sen slopes with a Kendall screen. Eligible censored observations are not substituted or silently removed; the current zero-tolerance censoring rule suppresses the series and records the reason.",
            "sampling_interval_note": "Sampling intervals are reported for audit. No additional interval-coverage suppression rule is currently applied beyond minimum observation and calendar-year requirements.",
        },
    }
