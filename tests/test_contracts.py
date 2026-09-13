import json
import unittest
from pathlib import Path

from catchment_dashboard.contracts import (
    CONTRACT_VERSION,
    AggregateRecord,
    ContractError,
    ObservationRecord,
    SourceRef,
    TrendRecord,
    validate_aggregate,
    validate_observation,
    validate_trend,
    validate_fixture,
)


ROOT = Path(__file__).resolve().parents[1]


class ContractTests(unittest.TestCase):
    def test_minimal_fixture_crosses_source_normalized_and_manifest_boundaries(self):
        result = validate_fixture(ROOT / "tests/fixtures/minimal_asset.json")
        self.assertEqual(result, {"sources": 1, "stations": 1, "parameters": 1, "observations": 2, "manifest_assets": 1})

    def test_null_value_requires_preserved_result_text(self):
        source = SourceRef(
            provider="fixture",
            dataset="fixture",
            endpoint="https://example.invalid",
            retrieved_at="2026-09-13T00:00:00Z",
            source_record_id="source-1",
        )
        observation = ObservationRecord(
            observation_id="obs-1",
            station_id="station-1",
            parameter_id="parameter-1",
            observed_at="2026-09-13T00:00:00Z",
            value=None,
            result_text=None,
            original_unit=None,
            canonical_unit=None,
            quality_flag=None,
            censoring=None,
            source=source,
        )
        with self.assertRaises(ContractError):
            validate_observation(observation)

    def test_fixture_contract_version_is_explicit(self):
        with (ROOT / "tests/fixtures/minimal_asset.json").open(encoding="utf-8") as handle:
            fixture = json.load(handle)
        self.assertEqual(fixture["contract_version"], CONTRACT_VERSION)

    def test_analytical_boundaries_require_explicit_method_metadata(self):
        aggregate = AggregateRecord(
            aggregate_id="aggregate-1",
            scope_id="ashburton_hakatere",
            station_id="station-ash-001",
            parameter_id="nitrate_nitrite",
            period_start="2024-01-01T00:00:00Z",
            period_end="2024-03-31T00:00:00Z",
            statistic="pending",
            value=None,
            observation_count=0,
            coverage_fraction=None,
            method="pending_owner_review",
            method_version="not-adopted",
        )
        trend = TrendRecord(
            trend_id="trend-1",
            scope_id="ashburton_hakatere",
            station_id=None,
            parameter_id="nitrate_nitrite",
            period_start="2024-01-01T00:00:00Z",
            period_end="2024-03-31T00:00:00Z",
            estimate=None,
            uncertainty=None,
            significance=None,
            coverage_fraction=0,
            method="pending_owner_review",
            method_version="not-adopted",
        )
        validate_aggregate(aggregate)
        validate_trend(trend)


if __name__ == "__main__":
    unittest.main()
