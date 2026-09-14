import unittest
from datetime import datetime, timezone

from catchment_dashboard.analytics import build_trends, normalize_observations
from catchment_dashboard.contracts import ObservationRecord, SourceRef
from catchment_dashboard.viability import _trend_reason_counts


def _source(record_id: str) -> SourceRef:
    return SourceRef(
        provider="fixture",
        dataset="viability-fixture",
        endpoint="https://example.invalid/hilltop",
        retrieved_at=datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
        source_record_id=record_id,
    )


def _observation(record_id: str, observed_at: str, value: float, *, quality: str | None, representation: str | None) -> ObservationRecord:
    return ObservationRecord(
        observation_id=record_id,
        station_id="SITE-1",
        parameter_id="dissolved_reactive_phosphorus",
        observed_at=observed_at,
        value=value,
        result_text=str(value),
        original_unit="mg/L",
        canonical_unit=None,
        quality_flag=quality,
        censoring=None,
        source=_source(record_id),
        quality_representation=representation,
    )


class ViabilityTests(unittest.TestCase):
    def test_strict_and_published_unflagged_policies_are_distinct(self):
        rows = [
            _observation("missing", "2020-01-01T00:00:00", 1, quality=None, representation="missing_field"),
            _observation("blank", "2020-02-01T00:00:00", 2, quality=None, representation="blank_field"),
            _observation("good", "2020-03-01T00:00:00", 3, quality="600", representation="nonempty_code"),
            _observation("unknown", "2020-04-01T00:00:00", 4, quality="999", representation="nonempty_code"),
        ]
        strict, _ = normalize_observations(rows, quality_policy="strict")
        published, _ = normalize_observations(rows, quality_policy="published_unflagged")
        default_policy, _ = normalize_observations(rows)
        self.assertEqual(sum(row.analysis_eligible for row in strict), 1)
        self.assertEqual(sum(row.analysis_eligible for row in published), 2)
        self.assertEqual(sum(row.analysis_eligible for row in default_policy), 2)
        self.assertEqual(strict[0].quality_disposition, "missing_quality_field")
        self.assertEqual(published[0].quality_disposition, "published_unflagged")
        self.assertEqual(strict[1].quality_disposition, "blank_quality_field")
        self.assertEqual(published[1].quality_disposition, "blank_quality_field")

    def test_trend_fixture_matches_independent_pairwise_sen_slope(self):
        observations = [
            _observation(f"obs-{year}", f"{year}-06-01T00:00:00", float(year - 2014), quality="600", representation="nonempty_code")
            for year in range(2015, 2024)
        ]
        normalized, _ = normalize_observations(observations)
        trend = next(row for row in build_trends(normalized) if row["period"] == "primary_2016_2025")
        slopes = []
        for index, left in enumerate(observations):
            for right in observations[index + 1:]:
                left_year = int(left.observed_at[:4])
                right_year = int(right.observed_at[:4])
                slopes.append((right.value - left.value) / (right_year - left_year))
        self.assertAlmostEqual(trend["estimate_per_year"], 1.0, places=3)
        self.assertEqual(sorted(slopes)[len(slopes) // 2], 1.0)
        self.assertEqual(trend["direction"], "increasing")

    def test_trend_reason_audit_has_explicit_zero_categories(self):
        reasons = _trend_reason_counts([{
            "status": "indeterminate",
            "indeterminate_reason": "insufficient_eligible_numeric_observations",
            "duplicate_conflict_count": 0,
            "suppressed_exact_duplicate_count": 0,
        }])
        self.assertEqual(reasons["insufficient_eligible_observations"], 1)
        self.assertEqual(reasons["inadequate_sampling_interval_coverage"], 0)


if __name__ == "__main__":
    unittest.main()
