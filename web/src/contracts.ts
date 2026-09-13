export type Observation = {
  observationId: string;
  stationId: string;
  parameterId: string;
  observedAt: string;
  value: number | null;
  resultText: string | null;
  originalUnit: string | null;
  qualityFlag: string | null;
  censoring: string | null;
};

export type FixtureAsset = {
  contractVersion: string;
  studyAreaId: string;
  studyAreaName: string;
  station: {
    stationId: string;
    name: string;
  };
  parameter: {
    parameterId: string;
    displayName: string;
    unit: string | null;
    selectionStatus: string;
  };
  observations: readonly Observation[];
};
