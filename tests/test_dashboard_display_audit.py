import unittest

from tools.audit_dashboard_display import audit_asset


class DashboardDisplayAuditTests(unittest.TestCase):
    def test_audit_matrix_counts_comparable_summaries_and_trend_reasons(self) -> None:
        asset = {
            "contractVersion": "2.0.0",
            "analyticalVersion": "test",
            "sourceRetrievedAt": "2026-09-14T00:00:00+00:00",
            "parameters": [{"parameterId": "p"}],
            "summaries": [
                {"parameterId": "p", "period": "primary_2016_2025", "status": "reported", "value": 1, "q1": 0.5, "q3": 1.5},
                {"parameterId": "p", "period": "primary_2016_2025", "status": "reported", "value": 2, "q1": None, "q3": 2.5},
            ],
            "trends": [
                {"parameterId": "p", "period": "primary_2016_2025", "stationId": "s1", "status": "reported", "direction": "increasing", "indeterminateReason": None},
                {"parameterId": "p", "period": "recent_2020_2025", "stationId": "s1", "status": "indeterminate", "direction": "indeterminate", "indeterminateReason": "screened_not_significant"},
            ],
            "coverage": [],
        }
        report = audit_asset(asset)
        rows = {(row["parameterId"], row["period"]): row for row in report["parameterWindowMatrix"]}
        self.assertEqual(rows["p", "primary_2016_2025"]["supportedSummarySiteCount"], 1)
        self.assertEqual(rows["p", "primary_2016_2025"]["trendDirectionCounts"], {"increasing": 1})
        self.assertEqual(rows["p", "recent_2020_2025"]["trendReasonCounts"], {"screened_not_significant": 1})
        self.assertIn("reported_increasing", report["examples"])
        self.assertIn("no_data", report["examples"])
