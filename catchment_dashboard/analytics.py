"""Conservative Ashburton normalization and analytical asset builders.

The module deliberately keeps source observations separate from derived rows.
No censored value is substituted, and unresolved source quality is retained but
does not enter the primary eligible subset.
"""

from __future__ import annotations

import hashlib
import json
import math
import re
from collections import Counter, defaultdict
from dataclasses import asdict
from datetime import date, datetime
from pathlib import Path
from statistics import NormalDist, median
from typing import Any, Iterable

from .contracts import (
    NORMALIZED_CONTRACT_VERSION,
    NormalizedObservationRecord,
    ObservationRecord,
    SourceRef,
    validate_normalized_observation,
    validate_observation,
)


ANALYTICAL_VERSION = "ashburton-analytical-v2-quality-semantics"
MIN_SUMMARY_OBSERVATIONS = 3
MIN_TREND_OBSERVATIONS = 8
MIN_TREND_YEARS = 3

WINDOWS: dict[str, tuple[str, str]] = {
    "history_2007_2024": ("2007-01-01", "2024-12-31"),
    "primary_2015_2024": ("2015-01-01", "2024-12-31"),
    "recent_2020_2024": ("2020-01-01", "2024-12-31"),
}

# Source aliases are represented by the provider slug at the normalized
# boundary. Water Temperature (Field) is the observed Hilltop name, while the
# dashboard-facing name remains the shorter approved secondary label.
PARAMETER_SPECS: dict[str, dict[str, str]] = {
    "e_coli": {"name": "E. coli", "unit": "MPN/100 mL", "selection": "core"},
    "nitrate_n_nitrite_n": {"name": "Nitrate-N Nitrite-N", "unit": "mg/L", "selection": "core"},
    "dissolved_reactive_phosphorus": {"name": "Dissolved Reactive Phosphorus", "unit": "mg/L", "selection": "core"},
    "total_nitrogen": {"name": "Total Nitrogen", "unit": "mg/L", "selection": "core"},
    "turbidity": {"name": "Turbidity", "unit": "NTU", "selection": "core"},
    "dissolved_oxygen": {"name": "Dissolved Oxygen", "unit": "mg/L", "selection": "core"},
    "total_phosphorus": {"name": "Total Phosphorus", "unit": "mg/L", "selection": "secondary"},
    "water_temperature_field": {"name": "Water Temperature", "unit": "C", "selection": "secondary"},
    "water_temperature": {"name": "Water Temperature", "unit": "C", "selection": "secondary"},
}

# NEMS/LAWA meanings are the documented cross-source meanings available to
# this build. ECan-specific undocumented child codes are intentionally not
# guessed.
QUALITY_DISPOSITION: dict[str, str] = {
    "100": "excluded_missing_quality",
    "200": "unresolved_quality",
    "300": "excluded_synthetic",
    "400": "excluded_poor_quality",
    "403": "excluded_poor_quality",
    "404": "excluded_poor_quality",
    "450": "excluded_poor_quality",
    "500": "retained_fair_quality",
    "600": "retained_good_quality",
}

QUALITY_POLICIES: dict[str, str] = {
    "strict": "Only documented fair/good quality records are primary-eligible; missing, blank, and unfamiliar quality remain unresolved.",
    "unflagged_usable": "Missing or blank quality representations are primary-eligible as unflagged_usable; documented poor, synthetic, missing, and unfamiliar codes remain excluded or unresolved.",
}


def _parse_datetime(value: str) -> datetime:
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    return parsed.replace(tzinfo=parsed.tzinfo) if parsed.tzinfo else parsed


def _date(value: str) -> date:
    return _parse_datetime(value).date()


def _period_contains(observed_at: str, start: str, end: str) -> bool:
    observed = _date(observed_at)
    return date.fromisoformat(start) <= observed <= date.fromisoformat(end)


def _unit_key(unit: str | None) -> str:
    return re.sub(r"\s+", "", (unit or "")).casefold().replace("^", "")


def _canonicalize_unit(parameter_id: str, unit: str | None) -> tuple[str | None, bool]:
    spec = PARAMETER_SPECS.get(parameter_id)
    if spec is None:
        return None, False
    key = _unit_key(unit)
    expected = spec["unit"]
    if parameter_id in {"nitrate_n_nitrite_n", "dissolved_reactive_phosphorus", "total_nitrogen", "total_phosphorus", "dissolved_oxygen"}:
        return expected, key in {"mg/l", "g/m3"}
    if parameter_id == "e_coli":
        return expected, key in {"mpn/100ml", "mpn/100millilitre", "mpn/100millilitres"}
    if parameter_id == "turbidity":
        return expected, key == "ntu"
    if parameter_id in {"water_temperature", "water_temperature_field"}:
        return expected, key in {"c", "°c", "degc", "degreec"}
    return None, False


def _censor_limit(result_text: str | None, censoring: str | None) -> float | None:
    if censoring not in {"left_censored", "right_censored"} or not result_text:
        return None
    match = re.match(r"^[<>]\s*([0-9]+(?:\.[0-9]+)?(?:[Ee][+-]?[0-9]+)?)$", result_text.strip())
    if not match:
        return None
    value = float(match.group(1))
    return value if math.isfinite(value) else None


def _quality_disposition(row: ObservationRecord, quality_policy: str) -> str:
    if quality_policy not in QUALITY_POLICIES:
        raise ValueError(f"unsupported quality policy: {quality_policy}")
    representation = row.quality_representation
    if representation == "missing_field" or (representation is None and row.quality_flag is None):
        return "unflagged_usable" if quality_policy == "unflagged_usable" else "missing_quality_field"
    if representation == "blank_field":
        return "unflagged_usable" if quality_policy == "unflagged_usable" else "blank_quality_field"
    if row.quality_flag is None or not row.quality_flag.strip():
        return "unflagged_usable" if quality_policy == "unflagged_usable" else "blank_quality_field"
    return QUALITY_DISPOSITION.get(row.quality_flag.strip(), "unresolved_quality")


def _value_kind(row: ObservationRecord) -> str:
    if row.value is not None:
        return "observed_numeric"
    if row.censoring in {"left_censored", "right_censored"}:
        return "censored"
    if row.censoring in {"missing_value", None} or row.result_text == "[missing]":
        return "missing"
    return "non_numeric"


def _duplicate_group(row: ObservationRecord) -> str:
    key = "|".join((row.station_id, row.parameter_id, row.observed_at))
    return hashlib.sha256(key.encode("utf-8")).hexdigest()[:20]


def normalize_observations(
    rows: Iterable[ObservationRecord],
    *,
    quality_policy: str = "strict",
) -> tuple[list[NormalizedObservationRecord], dict[str, int]]:
    """Normalize rows while preserving every source record and its disposition."""

    source_rows = list(rows)
    for row in source_rows:
        validate_observation(row)
    grouped: dict[tuple[str, str, str], list[ObservationRecord]] = defaultdict(list)
    for row in source_rows:
        grouped[(row.station_id, row.parameter_id, row.observed_at)].append(row)

    normalized: list[NormalizedObservationRecord] = []
    for row in source_rows:
        spec = PARAMETER_SPECS.get(row.parameter_id)
        parameter_name = spec["name"] if spec else row.parameter_id
        canonical_unit, supported_unit = _canonicalize_unit(row.parameter_id, row.original_unit)
        quality = _quality_disposition(row, quality_policy)
        value_kind = _value_kind(row)
        limit = _censor_limit(row.result_text, row.censoring)
        canonical_value = row.value if supported_unit else None
        if value_kind in {"observed_numeric", "censored"} and not supported_unit:
            quality = "unresolved_unit"
        if value_kind == "censored" and limit is None:
            quality = "unresolved_censoring"
        eligible = quality in {"retained_fair_quality", "retained_good_quality", "unflagged_usable"}
        eligible = eligible and supported_unit and value_kind in {"observed_numeric", "censored"}
        group = grouped[(row.station_id, row.parameter_id, row.observed_at)]
        signatures = {
            (item.value, item.result_text, item.original_unit, item.quality_flag, item.quality_representation, item.censoring)
            for item in group
        }
        conflict = len(signatures) > 1
        duplicate = "conflict" if conflict else ("exact_duplicate" if len(group) > 1 else "unique")
        if duplicate == "exact_duplicate" and row is not group[0]:
            duplicate = "suppressed_exact_duplicate"
            eligible = False
        elif conflict:
            eligible = False
        normalized.append(
            NormalizedObservationRecord(
                normalized_observation_id="norm-" + hashlib.sha256(row.observation_id.encode("utf-8")).hexdigest()[:20],
                observation_id=row.observation_id,
                station_id=row.station_id,
                parameter_id=row.parameter_id,
                parameter_name=parameter_name,
                observed_at=row.observed_at,
                value=row.value,
                canonical_value=canonical_value,
                result_text=row.result_text,
                original_unit=row.original_unit,
                canonical_unit=canonical_unit,
                censoring=row.censoring,
                censor_limit=limit,
                quality_flag=row.quality_flag,
                quality_representation=row.quality_representation or ("nonempty_code" if row.quality_flag else "legacy_unspecified"),
                quality_disposition=quality,
                value_kind=value_kind,
                duplicate_group_id=_duplicate_group(row),
                duplicate_disposition=duplicate,
                analysis_eligible=eligible,
                source=row.source,
            )
        )
    for row in normalized:
        validate_normalized_observation(row)
    diagnostics = Counter(row.quality_disposition for row in normalized)
    diagnostics.update("duplicate_" + row.duplicate_disposition for row in normalized if row.duplicate_disposition != "unique")
    diagnostics.update("value_" + row.value_kind for row in normalized)
    diagnostics["analysis_eligible"] = sum(row.analysis_eligible for row in normalized)
    return normalized, dict(sorted(diagnostics.items()))


def _rows_for_period(rows: Iterable[NormalizedObservationRecord], start: str, end: str) -> list[NormalizedObservationRecord]:
    return [row for row in rows if _period_contains(row.observed_at, start, end)]


def _counts(rows: list[NormalizedObservationRecord]) -> dict[str, Any]:
    quality = Counter(row.quality_disposition for row in rows)
    values = Counter(row.value_kind for row in rows)
    duplicates = Counter(row.duplicate_disposition for row in rows)
    eligible = [row for row in rows if row.analysis_eligible]
    return {
        "raw_count": len(rows),
        "eligible_count": len(eligible),
        "eligible_numeric_count": sum(row.value_kind == "observed_numeric" for row in eligible),
        "eligible_censored_count": sum(row.value_kind == "censored" for row in eligible),
        "censored_count": values["censored"],
        "missing_count": values["missing"],
        "non_numeric_count": values["non_numeric"],
        "quality_disposition_counts": dict(sorted(quality.items())),
        "duplicate_disposition_counts": dict(sorted(duplicates.items())),
        "sampled_calendar_month_count": len({(_date(row.observed_at).year, _date(row.observed_at).month) for row in rows}),
        "sampled_calendar_year_count": len({_date(row.observed_at).year for row in rows}),
    }


def build_coverage(rows: Iterable[NormalizedObservationRecord]) -> dict[str, Any]:
    rows = list(rows)
    combinations = sorted({(row.station_id, row.parameter_id) for row in rows})
    records: list[dict[str, Any]] = []
    for station_id, parameter_id in combinations:
        for window, (start, end) in WINDOWS.items():
            scoped = _rows_for_period(
                (row for row in rows if row.station_id == station_id and row.parameter_id == parameter_id),
                start,
                end,
            )
            counts = _counts(scoped)
            counts.update({"station_id": station_id, "parameter_id": parameter_id, "window": window, "period_start": start, "period_end": end})
            counts["summary_eligibility"] = "adequate" if counts["eligible_numeric_count"] >= MIN_SUMMARY_OBSERVATIONS else "insufficient_observations"
            counts["trend_eligibility"] = (
                "adequate"
                if counts["eligible_numeric_count"] >= MIN_TREND_OBSERVATIONS and counts["sampled_calendar_year_count"] >= MIN_TREND_YEARS
                else "insufficient_observations_or_span"
            )
            counts["coverage_interpretation"] = "sampled_calendar_coverage_not_continuous_monitoring"
            records.append(counts)
    return {
        "analytical_version": ANALYTICAL_VERSION,
        "windows": {name: {"period_start": start, "period_end": end} for name, (start, end) in WINDOWS.items()},
        "minimum_summary_observations": MIN_SUMMARY_OBSERVATIONS,
        "minimum_trend_observations": MIN_TREND_OBSERVATIONS,
        "minimum_trend_calendar_years": MIN_TREND_YEARS,
        "records": records,
    }


def _quantile(values: list[float], fraction: float) -> float:
    ordered = sorted(values)
    if len(ordered) == 1:
        return ordered[0]
    position = (len(ordered) - 1) * fraction
    lower = math.floor(position)
    upper = math.ceil(position)
    if lower == upper:
        return ordered[lower]
    return ordered[lower] + (ordered[upper] - ordered[lower]) * (position - lower)


def _summary_row(station_id: str, parameter_id: str, period_name: str, start: str, end: str, rows: list[NormalizedObservationRecord]) -> dict[str, Any]:
    counts = _counts(rows)
    numeric = [row.canonical_value for row in rows if row.analysis_eligible and row.value_kind == "observed_numeric" and row.canonical_value is not None]
    if len(numeric) < MIN_SUMMARY_OBSERVATIONS:
        status, reason = "indeterminate", "insufficient_eligible_numeric_observations"
        value = q1 = q3 = None
    elif counts["eligible_censored_count"]:
        status, reason = "indeterminate", "censored_values_present_no_substitution_applied"
        value = q1 = q3 = None
    else:
        status, reason = "reported", None
        value, q1, q3 = median(numeric), _quantile(numeric, 0.25), _quantile(numeric, 0.75)
    return {
        "summary_id": hashlib.sha256(f"{station_id}|{parameter_id}|{period_name}".encode()).hexdigest()[:20],
        "station_id": station_id,
        "parameter_id": parameter_id,
        "period": period_name,
        "period_start": start,
        "period_end": end,
        "value": value,
        "q1": q1,
        "q3": q3,
        "unit": PARAMETER_SPECS.get(parameter_id, {}).get("unit"),
        "status": status,
        "indeterminate_reason": reason,
        "value_kind": "aggregated_observed_numeric" if status == "reported" else "indeterminate",
        "estimated": False,
        "method": "median_iqr_without_censoring_substitution_v1",
        "minimum_observations": MIN_SUMMARY_OBSERVATIONS,
        **counts,
    }


def build_summaries(rows: Iterable[NormalizedObservationRecord]) -> list[dict[str, Any]]:
    rows = list(rows)
    result: list[dict[str, Any]] = []
    for station_id, parameter_id in sorted({(row.station_id, row.parameter_id) for row in rows}):
        scoped = [row for row in rows if row.station_id == station_id and row.parameter_id == parameter_id]
        years = sorted({_date(row.observed_at).year for row in scoped})
        for year in years:
            year_start, year_end = f"{year:04d}-01-01", f"{year:04d}-12-31"
            result.append(_summary_row(station_id, parameter_id, f"year_{year}", year_start, year_end, _rows_for_period(scoped, year_start, year_end)))
        for period, (start, end) in WINDOWS.items():
            result.append(_summary_row(station_id, parameter_id, period, start, end, _rows_for_period(scoped, start, end)))
    return result


def _kendall_p_value(values: list[float]) -> float | None:
    n = len(values)
    if n < 2:
        return None
    s = 0
    for index, left in enumerate(values):
        for right in values[index + 1:]:
            s += (right > left) - (right < left)
    ties = Counter(values)
    variance = (n * (n - 1) * (2 * n + 5) - sum(count * (count - 1) * (2 * count + 5) for count in ties.values())) / 18
    if variance <= 0:
        return None
    z = (s - (1 if s > 0 else -1 if s < 0 else 0)) / math.sqrt(variance)
    return min(1.0, max(0.0, 2 * (1 - NormalDist().cdf(abs(z)))))


def _theil_sen(points: list[tuple[float, float]]) -> tuple[float | None, float | None]:
    slopes = [(right_y - left_y) / (right_x - left_x) for index, (left_x, left_y) in enumerate(points) for right_x, right_y in points[index + 1:] if right_x != left_x]
    if not slopes:
        return None, None
    estimate = median(slopes)
    return estimate, _quantile(slopes, 0.75) - _quantile(slopes, 0.25)


def _trend_row(station_id: str, parameter_id: str, period: str, start: str, end: str, rows: list[NormalizedObservationRecord]) -> dict[str, Any]:
    eligible = [row for row in rows if row.analysis_eligible]
    numeric = [row for row in eligible if row.value_kind == "observed_numeric" and row.canonical_value is not None]
    has_censoring = any(row.value_kind == "censored" for row in eligible)
    years = len({_date(row.observed_at).year for row in numeric})
    reason = None
    estimate = uncertainty = p_value = None
    significance = None
    direction = "indeterminate"
    observed_dates = sorted(_date(row.observed_at) for row in numeric)
    interval_days = [(right - left).days for left, right in zip(observed_dates, observed_dates[1:])]
    duplicate_counts = Counter(row.duplicate_disposition for row in rows)
    if has_censoring:
        reason = "censored_values_present_censor_aware_trend_not_implemented"
    elif len(numeric) < MIN_TREND_OBSERVATIONS:
        reason = "insufficient_eligible_numeric_observations"
    elif years < MIN_TREND_YEARS:
        reason = "insufficient_calendar_year_span"
    else:
        points = [((_date(row.observed_at) - date(1970, 1, 1)).days / 365.2425, row.canonical_value) for row in numeric]
        estimate, uncertainty = _theil_sen(points)
        p_value = _kendall_p_value([point[1] for point in points])
        if estimate is None or p_value is None:
            reason = "no_ordered_pairs_for_trend_estimate"
        elif p_value < 0.05:
            direction = "increasing" if estimate > 0 else "decreasing" if estimate < 0 else "indeterminate"
            significance = "screened_significant"
        else:
            reason = "screened_not_significant"
            significance = "screened_not_significant"
    return {
        "trend_id": hashlib.sha256(f"{station_id}|{parameter_id}|{period}".encode()).hexdigest()[:20],
        "station_id": station_id,
        "parameter_id": parameter_id,
        "period": period,
        "period_start": start,
        "period_end": end,
        "estimate_per_year": estimate,
        "uncertainty_iqr_per_year": uncertainty,
        "p_value": p_value,
        "significance": significance,
        "direction": direction,
        "status": "reported" if direction != "indeterminate" else "indeterminate",
        "indeterminate_reason": reason,
        "eligible_numeric_count": len(numeric),
        "eligible_censored_count": sum(row.value_kind == "censored" for row in eligible),
        "excluded_censored_count": sum(row.value_kind == "censored" and not row.analysis_eligible for row in rows),
        "raw_observation_count": len(rows),
        "duplicate_conflict_count": duplicate_counts["conflict"],
        "suppressed_exact_duplicate_count": duplicate_counts["suppressed_exact_duplicate"],
        "calendar_year_count": years,
        "calendar_month_count": len({(value.year, value.month) for value in observed_dates}),
        "sampling_interval_median_days": median(interval_days) if interval_days else None,
        "sampling_interval_max_days": max(interval_days) if interval_days else None,
        "sampling_interval_assessment": "not_a_current_suppression_rule",
        "method": "uncensored_theil_sen_slope_with_kendall_screen_v1",
        "minimum_observations": MIN_TREND_OBSERVATIONS,
        "minimum_calendar_years": MIN_TREND_YEARS,
        "interpretation": "neutral_direction_label_no_causal_or_regulatory_inference",
    }


def build_trends(rows: Iterable[NormalizedObservationRecord]) -> list[dict[str, Any]]:
    rows = list(rows)
    result: list[dict[str, Any]] = []
    for station_id, parameter_id in sorted({(row.station_id, row.parameter_id) for row in rows}):
        scoped = [row for row in rows if row.station_id == station_id and row.parameter_id == parameter_id]
        for period, (start, end) in WINDOWS.items():
            result.append(_trend_row(station_id, parameter_id, period, start, end, _rows_for_period(scoped, start, end)))
    return result


def build_assets(profile_path: Path, output_dir: Path) -> dict[str, Any]:
    """Build ignored, versioned application assets from a full profile JSON."""

    with profile_path.open(encoding="utf-8") as handle:
        profile = json.load(handle)
    raw_rows = profile.get("observations")
    if not isinstance(raw_rows, list):
        raise ValueError("profile must contain observations; rerun acquisition with --include-observations")
    observations = []
    for source_payload in raw_rows:
        payload = dict(source_payload)
        source = SourceRef(**payload.pop("source"))
        observations.append(ObservationRecord(source=source, **payload))
    normalized, disposition_counts = normalize_observations(observations)
    coverage = build_coverage(normalized)
    summaries = build_summaries(normalized)
    trends = build_trends(normalized)
    output_dir.mkdir(parents=True, exist_ok=True)

    payloads = {
        "normalized_observations.json": {"contract_version": NORMALIZED_CONTRACT_VERSION, "analytical_version": ANALYTICAL_VERSION, "records": [asdict(row) for row in normalized]},
        "coverage.json": coverage,
        "summaries.json": {"analytical_version": ANALYTICAL_VERSION, "records": summaries},
        "trends.json": {"analytical_version": ANALYTICAL_VERSION, "records": trends},
    }
    checksums: dict[str, str] = {}
    for name, payload in payloads.items():
        content = json.dumps(payload, indent=2, sort_keys=True) + "\n"
        (output_dir / name).write_text(content, encoding="utf-8")
        checksums[name] = hashlib.sha256(content.encode("utf-8")).hexdigest()
    source_keys = {(row.source.provider, row.source.dataset, row.source.endpoint, row.source.retrieved_at) for row in observations}
    manifest = {
        "manifest_version": "1.0.0",
        "analytical_version": ANALYTICAL_VERSION,
        "normalized_contract_version": NORMALIZED_CONTRACT_VERSION,
        "study_area_id": "ashburton_hakatere",
        "site_selection_mode": profile.get("site_selection_mode"),
        "profile_site_count": len(profile.get("provisional_sites", [])),
        "profile_path": str(profile_path),
        "source_retrieved_at": profile.get("retrieved_at"),
        "source_terms_status": "published_general_terms_found_dataset_specific_hilltop_confirmation_required",
        "build_id": hashlib.sha256(json.dumps(checksums, sort_keys=True).encode()).hexdigest()[:20],
        "counts": {
            "source_observations": len(observations),
            "normalized_observations": len(normalized),
            "coverage_records": len(coverage["records"]),
            "summary_records": len(summaries),
            "trend_records": len(trends),
            "source_lineage_keys": len(source_keys),
            **disposition_counts,
        },
        "assets": [{"name": name, "sha256": digest} for name, digest in sorted(checksums.items())],
        "warnings": [
            "Raw acquisition profile and generated assets are local ignored outputs pending dataset-specific source-term and release review.",
            "Censored values are not substituted; summaries and trends can be indeterminate.",
            "The profile is bounded by the acquisition site's current spatial selection and is not asserted complete for the entire catchment.",
        ],
    }
    (output_dir / "manifest.json").write_text(json.dumps(manifest, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    return manifest
