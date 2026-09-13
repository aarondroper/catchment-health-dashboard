import json
import unittest
from datetime import datetime, timezone
from pathlib import Path

from catchment_dashboard.contracts import validate_observation
from catchment_dashboard.ecan_hilltop import (
    AcquisitionError,
    arcgis_candidate_url,
    build_source_ref,
    fetch_arcgis_candidates,
    parse_measurement_metadata,
    parse_observations,
    parse_site_list,
    parse_arcgis_candidates,
    provisional_site_join,
)


ROOT = Path(__file__).resolve().parent


class EcanHilltopTests(unittest.TestCase):
    def test_measurement_metadata_preserves_units_and_sampling_semantics(self):
        payload = (ROOT / "fixtures/hilltop_measurement_list.xml").read_bytes()
        rows = parse_measurement_metadata(payload, site_id="SQ20104")
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0].units, "mg/L")
        self.assertEqual(rows[0].data_type, "WQData")
        self.assertEqual(rows[0].interpolation, "Discrete")
        self.assertEqual(rows[0].from_time, "1995-10-12T10:35:00")

    def test_observations_preserve_numeric_censored_missing_and_quality_states(self):
        payload = (ROOT / "fixtures/hilltop_observations.xml").read_bytes()
        source = build_source_ref(
            endpoint="http://example.invalid/get-data",
            source_record_id="SQ20104/Dissolved Reactive Phosphorus",
            retrieved_at=datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
        )
        rows, counts = parse_observations(
            payload,
            site_id="SQ20104",
            measurement_name="Dissolved Reactive Phosphorus",
            original_unit="mg/L",
            source=source,
        )
        self.assertEqual(len(rows), 4)
        self.assertEqual(counts["numeric"], 1)
        self.assertEqual(counts["left_censored"], 2)
        self.assertEqual(counts["missing_value"], 1)
        self.assertEqual(counts["duplicates"], 1)
        self.assertEqual(rows[1].value, None)
        self.assertEqual(rows[1].result_text, "<0.001")
        self.assertEqual(rows[1].censoring, "left_censored")
        self.assertEqual(rows[0].quality_flag, "600")
        for row in rows:
            validate_observation(row)

    def test_malformed_or_empty_observation_response_fails(self):
        source = build_source_ref(
            endpoint="http://example.invalid/get-data",
            source_record_id="source-1",
            retrieved_at="2026-09-13T00:00:00+00:00",
        )
        with self.assertRaises(AcquisitionError):
            parse_observations(
                b"<Hilltop><Error>No data</Error></Hilltop>",
                site_id="SQ20104",
                measurement_name="pH",
                original_unit=None,
                source=source,
            )

    def test_site_join_is_explicitly_provisional(self):
        stations = [{
            "SITE_ID": "SQ20104",
            "SITE_NAME": "ASHBURTON RIVER AT SH1",
            "NZTMX": 1498725,
            "NZTMY": 5137403,
        }]
        sites = [{
            "site_id": "SQ20104",
            "latitude": "-43.9095144",
            "longitude": "171.73874347",
        }]
        rows = provisional_site_join(stations, sites)
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0].membership_basis, "nearest_coordinate_to_name-screened_ECan_station")

    def test_site_list_requires_coordinates(self):
        with self.assertRaises(AcquisitionError):
            parse_site_list(b"<HilltopServer><Site Name=\"missing-coordinates\" /></HilltopServer>")

    def test_arcgis_candidate_fetch_rejects_count_mismatch(self):
        count_payload = json.dumps({"count": 2}).encode()
        rows_payload = json.dumps({"features": [{"attributes": {"SITE_ID": "SQ20104"}}]}).encode()

        def fake_fetch(url, *, timeout):
            if url == arcgis_candidate_url(count_only=True):
                return count_payload
            return rows_payload

        with self.assertRaises(AcquisitionError):
            fetch_arcgis_candidates(fake_fetch)

    def test_arcgis_candidate_parser_rejects_transfer_limit(self):
        payload = json.dumps({"features": [{"attributes": {"SITE_ID": "SQ20104"}}], "exceededTransferLimit": True}).encode()
        with self.assertRaises(AcquisitionError):
            parse_arcgis_candidates(payload)


if __name__ == "__main__":
    unittest.main()
