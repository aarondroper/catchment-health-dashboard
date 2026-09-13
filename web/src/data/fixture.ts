import type { FixtureAsset } from "../contracts";

export const fixtureAsset: FixtureAsset = {
  contractVersion: "0.1.0",
  studyAreaId: "ashburton_hakatere",
  studyAreaName: "Ashburton–Hakatere catchment",
  station: {
    stationId: "station-ash-001",
    name: "Ashburton River test station",
  },
  parameter: {
    parameterId: "nitrate_nitrite",
    displayName: "Nitrate-N Nitrite-N",
    unit: "g/m³",
    selectionStatus: "candidate_pending_owner_review",
  },
  observations: [
    {
      observationId: "obs-001",
      stationId: "station-ash-001",
      parameterId: "nitrate_nitrite",
      observedAt: "2024-01-15T10:00:00+12:00",
      value: 0.42,
      resultText: "0.42",
      originalUnit: "g/m3",
      qualityFlag: null,
      censoring: null,
    },
    {
      observationId: "obs-002",
      stationId: "station-ash-001",
      parameterId: "nitrate_nitrite",
      observedAt: "2024-02-15T10:00:00+12:00",
      value: null,
      resultText: "<0.01",
      originalUnit: "g/m3",
      qualityFlag: "reported_censored_fixture",
      censoring: "left_censored",
    },
  ],
};
