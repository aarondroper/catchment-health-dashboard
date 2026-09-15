export type Observation = {
  observationId: string;
  stationId: string;
  parameterId: string;
  observedAt: string;
  value: number | null;
  originalValue: number | null;
  resultText: string | null;
  originalUnit: string | null;
  canonicalUnit: string | null;
  qualityFlag: string | null;
  qualityRepresentation: "missing_field" | "blank_field" | "nonempty_code";
  qualityDisposition: string;
  censoring: string | null;
  censorLimit: number | null;
  duplicateDisposition: string;
  valueKind: "observed_numeric" | "censored" | "missing" | "non_numeric";
  analysisEligible: boolean;
  exclusionReason: string | null;
  sourceRecordId: string;
  sourceEndpoint: string;
  sourceRetrievedAt: string;
};

export type CatchmentGeometry = {
  type: "Feature";
  id?: string | number | null;
  properties: Readonly<Record<string, string | number | null>>;
  geometry: {
    type: "Polygon" | "MultiPolygon";
    coordinates: number[][][] | number[][][][];
  };
};

export type ObservationPartitionManifest = {
  path: string;
  contractVersion: string;
  rowCount: number;
  byteCount: number;
  sha256: string;
};

export type RuntimeDataMetadata = {
  contractVersion: string;
  detailLoading: "parameter_partitioned";
  observationColumns: readonly string[];
  lookupFields: readonly string[];
  encoding: string;
};

export type AnalyticalWindow = "primary_2016_2025" | "recent_2020_2025" | "history_2007_2025";

export type ParameterOption = {
  parameterId: string;
  displayName: string;
  unit: string | null;
  selectionStatus: "core" | "secondary";
};

export type AnalyticalSummary = {
  stationId: string;
  parameterId: string;
  period: string;
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
  sourceTermsStatus: "local_processing_only_release_gate" | "public_cc_by_attribution_freshness";
  qualityPolicy: string | null;
  sourceRetrievedAt: string | null;
  buildId: string | null;
  parameters: readonly ParameterOption[];
  stations: readonly Station[];
  catchmentGeometry: CatchmentGeometry | null;
  observationPartitions?: Readonly<Record<string, ObservationPartitionManifest>>;
  runtimeData?: RuntimeDataMetadata;
  observations: readonly Observation[];
  coverage: readonly CoverageRecord[];
  summaries: readonly AnalyticalSummary[];
  trends: readonly AnalyticalTrend[];
  counts: Readonly<Record<string, number>>;
  warnings: readonly string[];
};

export type Station = {
  stationId: string;
  name: string;
  latitude: number;
  longitude: number;
  membershipBasis: string | null;
};

export type CoverageRecord = {
  station_id: string;
  parameter_id: string;
  window: AnalyticalWindow;
  raw_count: number;
  eligible_count: number;
  eligible_numeric_count: number;
  eligible_censored_count: number;
  sampled_calendar_month_count: number;
  sampled_calendar_year_count: number;
  summary_eligibility: string;
  trend_eligibility: string;
};
