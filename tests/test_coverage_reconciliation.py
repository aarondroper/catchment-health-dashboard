import unittest

from catchment_dashboard.ecan_geometry import CatchmentBoundary
from tools.reconcile_catchment_coverage import reconcile_inventory


class CoverageReconciliationTests(unittest.TestCase):
    def setUp(self):
        self.boundary = CatchmentBoundary(
            catchment_group="688", catchment_name="Ashburton River", source_object_id="267", area_ha=1,
            geometry_type="Polygon", polygons=((( (170.0, -44.0), (172.0, -44.0), (172.0, -43.0), (170.0, -43.0), (170.0, -44.0)),),),
            source_endpoint="fixture",
        )

    def test_exact_ids_are_authoritative_and_unmatched_sites_are_reported(self):
        result = reconcile_inventory(
            [
                {"SITE_ID": "A", "SITE_NAME": "A", "NZTMX": 1440000, "NZTMY": 5170000},
                {"SITE_ID": "SURFACE_ONLY", "SITE_NAME": "Other", "NZTMX": 1440000, "NZTMY": 5170000},
            ],
            [{"site_id": "A", "latitude": -43.5, "longitude": 171.0}, {"site_id": "HILLTOP_ONLY", "latitude": -43.5, "longitude": 171.1}],
            self.boundary,
            site_audit={"measurement_profiles": [{"site_id": "A", "measurements": [{"measurement_name": "E. coli"}]}]},
            profile={"requested_parameters": ["E. coli"], "observations": [{"site_id": "A", "parameter_id": "e_coli"}]},
        )
        self.assertEqual(result["inventory"]["exactStationIds"], ["A"])
        self.assertEqual(result["inventory"]["unmatchedSurfaceSiteIds"], ["SURFACE_ONLY"])
        self.assertEqual(result["inventory"]["unmatchedHilltopSiteIds"], ["HILLTOP_ONLY"])
        self.assertEqual(result["categories"]["unresolvedMatches"], [])

    def test_ambiguous_source_ids_fail_closed(self):
        result = reconcile_inventory(
            [
                {"SITE_ID": "A", "SITE_NAME": "A1", "NZTMX": 1440000, "NZTMY": 5170000},
                {"SITE_ID": "A", "SITE_NAME": "A2", "NZTMX": 1440000, "NZTMY": 5170000},
            ],
            [{"site_id": "A", "latitude": -43.605790686, "longitude": 171.017442858}],
            self.boundary,
        )
        self.assertEqual(result["inventory"]["exactStationIds"], [])
        self.assertEqual(result["categories"]["unresolvedMatches"], ["A"])


if __name__ == "__main__":
    unittest.main()
