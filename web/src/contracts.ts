export type Observation = {
  observationId: string;
  stationId: string;
  parameterId: string;
  observedAt: string;
  value: number | null;
  resultText: string | null;
  originalUnit: string | null;
  qualityFlag: string | null;
  qualityRepresentation: "missing_field" | "blank_field" | "nonempty_code";
  qualityDisposition: string;
  censoring: string | null;
  valueKind: "observed_numeric" | "censored" | "missing" | "non_numeric";
  analysisEligible: boolean;
};

export type AnalyticalWindow = "primary_2015_2024" | "recent_2020_2024" | "history_2007_2024";

export type ParameterOption = {
  parameterId: string;
  displayName: string;
  unit: string | null;
  selectionStatus: "core" | "secondary";
};

export type AnalyticalSummary = {
  stationId: string;
  parameterId: string;
  period: AnalyticalWindow;
  value: number | null;
  q1: number | null;
  q3: number | null;
  unit: string | null;
  status: "reported" | "indeterminate";
  indeterminateReason: string | null;
  eligibleNumericCount: number;
  eligibleCensoredCount: number;
};

export type AnalyticalTrend = {
  stationId: string;
  parameterId: string;
  period: AnalyticalWindow;
  estimatePerYear: number | null;
  direction: "increasing" | "decreasing" | "indeterminate";
  status: "reported" | "indeterminate";
  indeterminateReason: string | null;
  eligibleNumericCount: number;
  calendarYearCount: number;
};

export type AnalyticalAsset = {
  contractVersion: string;
  analyticalVersion: string;
  studyAreaId: string;
  studyAreaName: string;
  sourceTermsStatus: "local_processing_only_release_gate";
  parameterCatalog: readonly ParameterOption[];
  stationCatalog: readonly { stationId: string; name: string }[];
  observations: readonly Observation[];
  summaries: readonly AnalyticalSummary[];
  trends: readonly AnalyticalTrend[];
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
