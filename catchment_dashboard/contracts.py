"""Versioned, source-independent data contracts.

These contracts preserve source values and provenance. They intentionally do
not apply unit conversions, quality exclusions, censored-value substitutions,
or trend/status interpretation; those require source evidence and owner review.
"""

from __future__ import annotations

import json
import math
from dataclasses import asdict, dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Any


CONTRACT_VERSION = "0.1.0"
NORMALIZED_CONTRACT_VERSION = "1.0.0"
STUDY_AREA_ID = "ashburton_hakatere"


class ContractError(ValueError):
    """Raised when a record does not satisfy the stable contract."""


@dataclass(frozen=True)
class SourceRef:
    provider: str
    dataset: str
    endpoint: str
    retrieved_at: str
    source_record_id: str
    source_version: str | None = None
    license: str | None = None


@dataclass(frozen=True)
class StationRecord:
    station_id: str
    source_station_id: str
    name: str
    latitude: float
    longitude: float
    coordinate_reference_system: str
    station_type: str | None
    catchment_id: str | None
    source: SourceRef


@dataclass(frozen=True)
class ParameterRecord:
    parameter_id: str
    display_name: str
    source_aliases: tuple[str, ...]
    canonical_unit: str | None
    selection_status: str
    source: SourceRef


@dataclass(frozen=True)
class ObservationRecord:
    observation_id: str
    station_id: str
    parameter_id: str
    observed_at: str
    value: float | None
    result_text: str | None
    original_unit: str | None
    canonical_unit: str | None
    quality_flag: str | None
    censoring: str | None
    source: SourceRef
    quality_representation: str | None = None


@dataclass(frozen=True)
class NormalizedObservationRecord:
    """A source-preserving observation after explicit analytical disposition.

    ``value`` and ``result_text`` are the provider values. ``canonical_value``
    is only a unit-normalized numeric value; it is never a substituted value
    for a censored or missing result.
    """

    normalized_observation_id: str
    observation_id: str
    station_id: str
    parameter_id: str
    parameter_name: str
    observed_at: str
    value: float | None
    canonical_value: float | None
    result_text: str | None
    original_unit: str | None
    canonical_unit: str | None
    censoring: str | None
    censor_limit: float | None
    quality_flag: str | None
    quality_representation: str
    quality_disposition: str
    value_kind: str
    duplicate_group_id: str
    duplicate_disposition: str
    analysis_eligible: bool
    source: SourceRef


@dataclass(frozen=True)
class AggregateRecord:
    """A method-tagged aggregate whose statistic is chosen by later work."""

    aggregate_id: str
    scope_id: str
    station_id: str | None
    parameter_id: str
    period_start: str
    period_end: str
    statistic: str
    value: float | None
    observation_count: int
    coverage_fraction: float | None
    method: str
    method_version: str


@dataclass(frozen=True)
class TrendRecord:
    """A method-tagged trend result with no implied direction semantics."""

    trend_id: str
    scope_id: str
    station_id: str | None
    parameter_id: str
    period_start: str
    period_end: str
    estimate: float | None
    uncertainty: float | None
    significance: str | None
    coverage_fraction: float | None
    method: str
    method_version: str


@dataclass(frozen=True)
class AssetManifest:
    manifest_version: str
    build_id: str
    generated_at: str
    study_area_id: str
    study_area_name: str
    contract_version: str
    source_refs: tuple[SourceRef, ...]
    counts: dict[str, int]
    assets: tuple[dict[str, Any], ...] = field(default_factory=tuple)
    warnings: tuple[str, ...] = field(default_factory=tuple)


def _required_text(value: Any, field_name: str) -> str:
    if not isinstance(value, str) or not value.strip():
        raise ContractError(f"{field_name} must be a non-empty string")
    return value


def _optional_text(value: Any, field_name: str) -> None | str:
    if value is not None and (not isinstance(value, str) or not value.strip()):
        raise ContractError(f"{field_name} must be null or a non-empty string")
    return value


def _iso_datetime(value: Any, field_name: str) -> str:
    text = _required_text(value, field_name)
    try:
        datetime.fromisoformat(text.replace("Z", "+00:00"))
    except ValueError as error:
        raise ContractError(f"{field_name} must be ISO-8601: {text}") from error
    return text


def validate_source(source: SourceRef) -> None:
    for name in ("provider", "dataset", "endpoint", "source_record_id"):
        _required_text(getattr(source, name), f"source.{name}")
    _iso_datetime(source.retrieved_at, "source.retrieved_at")
    _optional_text(source.source_version, "source.source_version")
    _optional_text(source.license, "source.license")


def validate_station(station: StationRecord) -> None:
    for name in ("station_id", "source_station_id", "name", "coordinate_reference_system"):
        _required_text(getattr(station, name), f"station.{name}")
    if not -90 <= station.latitude <= 90 or not -180 <= station.longitude <= 180:
        raise ContractError("station coordinates are outside WGS84 bounds")
    for name in ("station_type", "catchment_id"):
        _optional_text(getattr(station, name), f"station.{name}")
    validate_source(station.source)


def validate_parameter(parameter: ParameterRecord) -> None:
    for name in ("parameter_id", "display_name", "selection_status"):
        _required_text(getattr(parameter, name), f"parameter.{name}")
    if not parameter.source_aliases:
        raise ContractError("parameter.source_aliases must not be empty")
    for alias in parameter.source_aliases:
        _required_text(alias, "parameter.source_aliases[]")
    _optional_text(parameter.canonical_unit, "parameter.canonical_unit")
    validate_source(parameter.source)


def validate_observation(observation: ObservationRecord) -> None:
    for name in ("observation_id", "station_id", "parameter_id"):
        _required_text(getattr(observation, name), f"observation.{name}")
    _iso_datetime(observation.observed_at, "observation.observed_at")
    if observation.value is not None and (
        not isinstance(observation.value, (int, float))
        or not math.isfinite(observation.value)
    ):
        raise ContractError("observation.value must be finite or null")
    if observation.value is None and not observation.result_text:
        raise ContractError("a null observation.value requires result_text provenance")
    for name in (
        "result_text",
        "original_unit",
        "canonical_unit",
        "quality_flag",
        "censoring",
        "quality_representation",
    ):
        _optional_text(getattr(observation, name), f"observation.{name}")
    validate_source(observation.source)


def validate_normalized_observation(observation: NormalizedObservationRecord) -> None:
    """Validate the normalized contract without interpreting its disposition."""

    for name in (
        "normalized_observation_id",
        "observation_id",
        "station_id",
        "parameter_id",
        "parameter_name",
        "quality_representation",
        "quality_disposition",
        "value_kind",
        "duplicate_group_id",
        "duplicate_disposition",
    ):
        _required_text(getattr(observation, name), f"normalized_observation.{name}")
    _iso_datetime(observation.observed_at, "normalized_observation.observed_at")
    if observation.value is not None and (
        not isinstance(observation.value, (int, float)) or not math.isfinite(observation.value)
    ):
        raise ContractError("normalized_observation.value must be finite or null")
    if observation.canonical_value is not None and (
        not isinstance(observation.canonical_value, (int, float))
        or not math.isfinite(observation.canonical_value)
    ):
        raise ContractError("normalized_observation.canonical_value must be finite or null")
    if observation.censor_limit is not None and (
        not isinstance(observation.censor_limit, (int, float))
        or not math.isfinite(observation.censor_limit)
        or observation.censor_limit < 0
    ):
        raise ContractError("normalized_observation.censor_limit must be null or non-negative")
    if observation.value is None and not observation.result_text:
        raise ContractError("a null normalized value requires result_text provenance")
    for name in ("result_text", "original_unit", "canonical_unit", "censoring", "quality_flag"):
        _optional_text(getattr(observation, name), f"normalized_observation.{name}")
    if not isinstance(observation.analysis_eligible, bool):
        raise ContractError("normalized_observation.analysis_eligible must be boolean")
    validate_source(observation.source)


def _validate_period(start: str, end: str, field_prefix: str) -> None:
    start_text = _iso_datetime(start, f"{field_prefix}.period_start")
    end_text = _iso_datetime(end, f"{field_prefix}.period_end")
    if datetime.fromisoformat(start_text.replace("Z", "+00:00")) > datetime.fromisoformat(end_text.replace("Z", "+00:00")):
        raise ContractError(f"{field_prefix} period_start must not be after period_end")


def _validate_fraction(value: float | None, field_name: str) -> None:
    if value is not None and (not isinstance(value, (int, float)) or not math.isfinite(value) or not 0 <= value <= 1):
        raise ContractError(f"{field_name} must be null or a finite fraction from 0 to 1")


def validate_aggregate(aggregate: AggregateRecord) -> None:
    for name in ("aggregate_id", "scope_id", "parameter_id", "statistic", "method", "method_version"):
        _required_text(getattr(aggregate, name), f"aggregate.{name}")
    _optional_text(aggregate.station_id, "aggregate.station_id")
    _validate_period(aggregate.period_start, aggregate.period_end, "aggregate")
    if aggregate.value is not None and (not isinstance(aggregate.value, (int, float)) or not math.isfinite(aggregate.value)):
        raise ContractError("aggregate.value must be finite or null")
    if not isinstance(aggregate.observation_count, int) or aggregate.observation_count < 0:
        raise ContractError("aggregate.observation_count must be a non-negative integer")
    _validate_fraction(aggregate.coverage_fraction, "aggregate.coverage_fraction")


def validate_trend(trend: TrendRecord) -> None:
    for name in ("trend_id", "scope_id", "parameter_id", "method", "method_version"):
        _required_text(getattr(trend, name), f"trend.{name}")
    _optional_text(trend.station_id, "trend.station_id")
    _optional_text(trend.significance, "trend.significance")
    _validate_period(trend.period_start, trend.period_end, "trend")
    for name in ("estimate", "uncertainty"):
        value = getattr(trend, name)
        if value is not None and (not isinstance(value, (int, float)) or not math.isfinite(value)):
            raise ContractError(f"trend.{name} must be finite or null")
    _validate_fraction(trend.coverage_fraction, "trend.coverage_fraction")


def validate_manifest(manifest: AssetManifest) -> None:
    for name in ("manifest_version", "build_id", "study_area_id", "study_area_name", "contract_version"):
        _required_text(getattr(manifest, name), f"manifest.{name}")
    _iso_datetime(manifest.generated_at, "manifest.generated_at")
    if manifest.contract_version != CONTRACT_VERSION:
        raise ContractError("manifest.contract_version does not match the package")
    if not manifest.counts or any(not isinstance(value, int) or value < 0 for value in manifest.counts.values()):
        raise ContractError("manifest.counts must contain non-negative integer values")
    for source in manifest.source_refs:
        validate_source(source)


def dataclass_to_dict(value: Any) -> dict[str, Any]:
    return asdict(value)


def validate_fixture(path: Path) -> dict[str, int]:
    """Validate the minimal JSON fixture across contract boundaries."""

    with path.open(encoding="utf-8") as handle:
        payload = json.load(handle)
    if payload.get("contract_version") != CONTRACT_VERSION:
        raise ContractError("fixture contract_version does not match the package")
    source = SourceRef(**payload["source"])
    station = StationRecord(source=source, **payload["station"])
    parameter = ParameterRecord(source=source, **payload["parameter"])
    observations = [ObservationRecord(source=source, **row) for row in payload["observations"]]
    manifest = AssetManifest(source_refs=(source,), **payload["manifest"])
    validate_source(source)
    validate_station(station)
    validate_parameter(parameter)
    for observation in observations:
        validate_observation(observation)
    validate_manifest(manifest)
    if any(observation.station_id != station.station_id for observation in observations):
        raise ContractError("fixture observation station references are inconsistent")
    if any(observation.parameter_id != parameter.parameter_id for observation in observations):
        raise ContractError("fixture observation parameter references are inconsistent")
    return {
        "sources": 1,
        "stations": 1,
        "parameters": 1,
        "observations": len(observations),
        "manifest_assets": len(manifest.assets),
    }


def main() -> int:
    import argparse

    parser = argparse.ArgumentParser(description="Validate a contract fixture")
    parser.add_argument("fixture", type=Path)
    args = parser.parse_args()
    print(json.dumps(validate_fixture(args.fixture), sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
