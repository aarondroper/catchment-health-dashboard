import unittest

from tools.feasibility_audit import (
    candidate_for_name,
    nztm_to_wgs84,
    parse_hilltop_measurement_details,
    parse_hilltop_measurements,
    summarize_candidate_data,
)


class FeasibilityAuditTests(unittest.TestCase):
    def test_candidate_aliases_are_screening_only_and_unmatched_names_are_none(self):
        self.assertEqual(candidate_for_name("Ashley River at SH1"), "Ashley-Rakahuri")
        self.assertEqual(candidate_for_name("Waikirikiri / Selwyn River"), "Selwyn-Waikirikiri")
        self.assertIsNone(candidate_for_name("Canterbury Bight"))

    def test_hilltop_measurement_parser_preserves_bounds_and_namespaces(self):
        xml = b"""
        <wfs:FeatureCollection xmlns:wfs='http://www.opengis.net/wfs'>
          <wfs:featureMember>
            <MeasurementList xmlns='urn:test'>
              <Site>WAI01</Site><Measurement>Nitrate Nitrogen</Measurement>
              <From>2007-01-01T00:00:00</From><To>2024-01-01T00:00:00</To>
            </MeasurementList>
          </wfs:featureMember>
        </wfs:FeatureCollection>
        """
        self.assertEqual(
            parse_hilltop_measurements(xml),
            [
                {
                    "Site": "WAI01",
                    "Measurement": "Nitrate Nitrogen",
                    "From": "2007-01-01T00:00:00",
                    "To": "2024-01-01T00:00:00",
                }
            ],
        )

    def test_nztm_inverse_is_in_canterbury(self):
        latitude, longitude = nztm_to_wgs84(1577433, 5168827)
        self.assertAlmostEqual(latitude, -43.6, delta=0.2)
        self.assertAlmostEqual(longitude, 172.7, delta=0.2)

    def test_hilltop_details_parser_preserves_units_and_sampling_semantics(self):
        xml = b"""
        <HilltopServer>
          <DataSource Name='Nitrate Nitrogen' Site='A1'>
            <NumItems>2</NumItems><TSType>StdSeries</TSType>
            <DataType>WQData</DataType><Interpolation>Discrete</Interpolation>
            <From>2007-01-01</From><To>2024-01-01</To>
            <SensorGroup>Nutrients</SensorGroup>
            <Measurement Name='Nitrate Nitrogen'><Units>g/m3</Units></Measurement>
          </DataSource>
        </HilltopServer>
        """
        self.assertEqual(
            parse_hilltop_measurement_details(xml)[0]["Units"], "g/m3"
        )
        self.assertEqual(
            parse_hilltop_measurement_details(xml)[0]["Interpolation"], "Discrete"
        )

    def test_candidate_summary_counts_sites_and_parameter_overlap(self):
        latitude, longitude = nztm_to_wgs84(1600000, 5160000)
        stations = [
            {"SITE_NAME": "Ashley River at SH1", "NZTMX": 1600000, "NZTMY": 5160000},
            {"SITE_NAME": "Ashley River upstream", "NZTMX": 1600100, "NZTMY": 5160100},
        ]
        hilltop_sites = [
            {"Site": "A1", "Latitude": str(latitude), "Longitude": str(longitude)},
            {"Site": "A2", "Latitude": str(latitude), "Longitude": str(longitude)},
        ]
        measurements = [
            {"Site": "A1", "Measurement": "E. coli", "From": "2020", "To": "2024"},
            {"Site": "A2", "Measurement": "E. coli", "From": "2021", "To": "2024"},
        ]
        flow_sites = []
        summary = summarize_candidate_data(stations, hilltop_sites, measurements, flow_sites)
        candidate = summary["candidates"]["Ashley-Rakahuri"]
        self.assertEqual(candidate["hilltop_site_count_joined"], 2)
        self.assertEqual(candidate["parameters_at_two_or_more_sites"], ["E. coli"])


if __name__ == "__main__":
    unittest.main()
