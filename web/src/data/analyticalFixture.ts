import type { AnalyticalAsset } from "../contracts";

/** Small checked-in fixture; ignored production observation assets are not bundled. */
export const analyticalFixture: AnalyticalAsset = {
  contractVersion: "1.0.0",
  analyticalVersion: "ashburton-analytical-v3-published-unflagged",
  studyAreaId: "ashburton_hakatere",
  studyAreaName: "Ashburton–Hakatere catchment",
  sourceTermsStatus: "local_processing_only_release_gate",
  qualityPolicy: "published_unflagged",
  sourceRetrievedAt: "fixture",
  buildId: "fixture",
  catchmentGeometry: null,
  parameters: [
    { parameterId: "e_coli", displayName: "E. coli", unit: "MPN/100 mL", selectionStatus: "core" },
    { parameterId: "nitrate_n_nitrite_n", displayName: "Nitrate-N Nitrite-N", unit: "mg/L", selectionStatus: "core" },
    { parameterId: "dissolved_reactive_phosphorus", displayName: "Dissolved Reactive Phosphorus", unit: "mg/L", selectionStatus: "core" },
    { parameterId: "total_nitrogen", displayName: "Total Nitrogen", unit: "mg/L", selectionStatus: "core" },
    { parameterId: "turbidity", displayName: "Turbidity", unit: "NTU", selectionStatus: "core" },
    { parameterId: "dissolved_oxygen", displayName: "Dissolved Oxygen", unit: "mg/L", selectionStatus: "core" },
    { parameterId: "total_phosphorus", displayName: "Total Phosphorus", unit: "mg/L", selectionStatus: "secondary" },
    { parameterId: "water_temperature_field", displayName: "Water Temperature", unit: "C", selectionStatus: "secondary" },
  ],
  stations: [{ stationId: "station-ash-001", name: "Ashburton River test station", latitude: -43.91, longitude: 171.74, membershipBasis: "fixture" }],
  observations: [
    {
      observationId: "obs-001", stationId: "station-ash-001", parameterId: "nitrate_n_nitrite_n", observedAt: "2024-01-15T10:00:00+12:00",
      value: 0.42, originalValue: 0.42, resultText: "0.42", originalUnit: "g/m3", canonicalUnit: "mg/L", qualityFlag: null, qualityRepresentation: "missing_field",
      qualityDisposition: "published_unflagged", censoring: null, valueKind: "observed_numeric", analysisEligible: true, exclusionReason: null,
      censorLimit: null, duplicateDisposition: "unique", sourceRecordId: "fixture/obs-001", sourceEndpoint: "fixture", sourceRetrievedAt: "fixture",
    },
    {
      observationId: "obs-002", stationId: "station-ash-001", parameterId: "nitrate_n_nitrite_n", observedAt: "2024-02-15T10:00:00+12:00",
      value: null, originalValue: null, resultText: "<0.01", originalUnit: "g/m3", canonicalUnit: "mg/L", qualityFlag: "600", qualityRepresentation: "nonempty_code",
      qualityDisposition: "retained_good_quality", censoring: "left_censored", valueKind: "censored", analysisEligible: true, exclusionReason: null,
      censorLimit: 0.01, duplicateDisposition: "unique", sourceRecordId: "fixture/obs-002", sourceEndpoint: "fixture", sourceRetrievedAt: "fixture",
    },
  ],
  coverage: [],
  summaries: [
    { stationId: "station-ash-001", parameterId: "nitrate_n_nitrite_n", period: "primary_2015_2024", value: null, q1: null, q3: null, unit: "mg/L", status: "indeterminate", indeterminateReason: "censored_values_present_no_substitution_applied", eligibleNumericCount: 1, eligibleCensoredCount: 1 },
    { stationId: "station-ash-001", parameterId: "nitrate_n_nitrite_n", period: "recent_2020_2024", value: null, q1: null, q3: null, unit: "mg/L", status: "indeterminate", indeterminateReason: "censored_values_present_no_substitution_applied", eligibleNumericCount: 1, eligibleCensoredCount: 1 },
  ],
  trends: [
    { stationId: "station-ash-001", parameterId: "nitrate_n_nitrite_n", period: "primary_2015_2024", estimatePerYear: null, direction: "indeterminate", status: "indeterminate", indeterminateReason: "censored_values_present_censor_aware_trend_not_implemented", eligibleNumericCount: 1, calendarYearCount: 1 },
  ],
  counts: { normalized_observations: 2, analysis_eligible: 1 },
  warnings: ["Checked-in fixture only; local generated analytical assets are preferred."],
};
