import json
import unittest
from datetime import datetime, timezone
from pathlib import Path

from catchment_dashboard.analytics import (
    ANALYTICAL_VERSION,
    build_coverage,
    build_summaries,
    build_trends,
    normalize_observations,
)
from catchment_dashboard.contracts import ObservationRecord, SourceRef


ROOT = Path(__file__).resolve().parent


def source(record_id: str) -> SourceRef:
    return SourceRef(
        provider="Environment Canterbury",
        dataset="fixture",
        endpoint="https://example.invalid/hilltop",
        retrieved_at=datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
        source_record_id=record_id,
    )


def observation(
    record_id: str,
    observed_at: str,
    value: float | None,
    *,
    parameter_id: str = "dissolved_reactive_phosphorus",
    result_text: str | None = None,
    unit: str | None = "g/m3",
    quality: str | None = "600",
    censoring: str | None = None,
) -> ObservationRecord:
    return ObservationRecord(
        observation_id=record_id,
        station_id="SQ-FIXTURE",
        parameter_id=parameter_id,
        observed_at=observed_at,
        value=value,
        result_text=result_text or (str(value) if value is not None else "<0.001"),
        original_unit=unit,
        canonical_unit=None,
        quality_flag=quality,
        censoring=censoring,
        source=source(record_id),
    )


class AnalyticsTests(unittest.TestCase):
    def test_independent_json_fixture_exercises_disposition_contract(self):
        payload = json.loads((ROOT / "fixtures/analytics_observations.json").read_text(encoding="utf-8"))
        observations = [
            ObservationRecord(
                source=SourceRef(
                    provider=payload["source"]["provider"],
                    dataset=payload["source"]["dataset"],
                    endpoint=payload["source"]["endpoint"],
                    retrieved_at=payload["source"]["retrieved_at"],
                    source_record_id=f"{payload['source']['source_record_id_prefix']}/{row['observation_id']}",
                ),
                **row,
            )
            for row in payload["observations"]
        ]
        rows, _ = normalize_observations(observations)
        self.assertEqual(rows[0].canonical_unit, "mg/L")
        self.assertEqual(rows[1].censor_limit, 0.01)
        self.assertFalse(rows[2].analysis_eligible)
        self.assertEqual(rows[3].quality_disposition, "unresolved_quality")

    def test_normalization_preserves_units_and_applies_documented_quality_disposition(self):
        rows, counts = normalize_observations([
            observation("good", "2020-01-01T00:00:00", 0.2),
            observation("fair", "2020-02-01T00:00:00", 0.3, quality="500"),
            observation("poor", "2020-03-01T00:00:00", 0.4, quality="400"),
            observation("unknown", "2020-04-01T00:00:00", 0.5, quality="999"),
        ])
        self.assertEqual(rows[0].canonical_unit, "mg/L")
        self.assertEqual(rows[0].canonical_value, 0.2)
        self.assertEqual(rows[0].quality_disposition, "retained_good_quality")
        self.assertTrue(rows[1].analysis_eligible)
        self.assertFalse(rows[2].analysis_eligible)
        self.assertEqual(rows[3].quality_disposition, "unresolved_quality")
        self.assertEqual(counts["analysis_eligible"], 2)

    def test_censoring_is_represented_without_half_limit_substitution(self):
        rows, _ = normalize_observations([
            observation("censored", "2020-01-01T00:00:00", None, result_text="<0.001", censoring="left_censored"),
        ])
        self.assertEqual(rows[0].value_kind, "censored")
        self.assertIsNone(rows[0].canonical_value)
        self.assertEqual(rows[0].censor_limit, 0.001)
        self.assertTrue(rows[0].analysis_eligible)

    def test_exact_duplicates_are_suppressed_and_conflicts_are_indeterminate(self):
        exact_a = observation("exact-a", "2020-01-01T00:00:00", 0.2)
        exact_b = observation("exact-b", "2020-01-01T00:00:00", 0.2)
        conflict_a = observation("conflict-a", "2020-02-01T00:00:00", 0.2)
        conflict_b = observation("conflict-b", "2020-02-01T00:00:00", 0.4)
        rows, _ = normalize_observations([exact_a, exact_b, conflict_a, conflict_b])
        self.assertEqual(rows[0].duplicate_disposition, "exact_duplicate")
        self.assertEqual(rows[1].duplicate_disposition, "suppressed_exact_duplicate")
        self.assertFalse(rows[1].analysis_eligible)
        self.assertEqual({rows[2].duplicate_disposition, rows[3].duplicate_disposition}, {"conflict"})
        self.assertFalse(rows[2].analysis_eligible)

    def test_summary_is_reported_only_without_censoring(self):
        rows, _ = normalize_observations([
            observation("a", "2020-01-01T00:00:00", 0.1),
            observation("b", "2020-02-01T00:00:00", 0.2),
            observation("c", "2020-03-01T00:00:00", 0.3),
        ])
        summary = build_summaries(rows)
        annual = next(row for row in summary if row["period"] == "year_2020")
        self.assertEqual(annual["status"], "reported")
        self.assertEqual(annual["value"], 0.2)
        censored, _ = normalize_observations([
            observation("d", "2020-04-01T00:00:00", None, result_text="<0.001", censoring="left_censored"),
            observation("e", "2020-05-01T00:00:00", 0.2),
            observation("f", "2020-06-01T00:00:00", 0.3),
        ])
        censored_annual = next(row for row in build_summaries(censored) if row["period"] == "year_2020")
        self.assertEqual(censored_annual["status"], "indeterminate")
        self.assertIsNone(censored_annual["value"])

    def test_trend_uses_neutral_direction_and_minimums(self):
        rows, _ = normalize_observations([
            observation(f"trend-{year}", f"{year}-06-01T00:00:00", float(year - 2014))
            for year in range(2015, 2024)
        ])
        trends = build_trends(rows)
        primary = next(row for row in trends if row["period"] == "primary_2015_2024")
        self.assertEqual(primary["direction"], "increasing")
        self.assertEqual(primary["status"], "reported")
        self.assertGreater(primary["estimate_per_year"], 0)
        self.assertEqual(primary["method"], "uncensored_theil_sen_slope_with_kendall_screen_v1")

    def test_coverage_reports_sampled_months_not_continuous_monitoring(self):
        rows, _ = normalize_observations([
            observation("coverage-a", "2020-01-01T00:00:00", 0.1),
            observation("coverage-b", "2020-06-01T00:00:00", 0.2),
        ])
        coverage = build_coverage(rows)
        recent = next(row for row in coverage["records"] if row["window"] == "recent_2020_2024")
        self.assertEqual(recent["sampled_calendar_month_count"], 2)
        self.assertEqual(recent["coverage_interpretation"], "sampled_calendar_coverage_not_continuous_monitoring")
        self.assertEqual(coverage["analytical_version"], ANALYTICAL_VERSION)


if __name__ == "__main__":
    unittest.main()
