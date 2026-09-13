import type { AnalyticalAsset, AnalyticalSummary, AnalyticalTrend, AnalyticalWindow, Observation } from "../contracts";

export function selectObservations(observations: readonly Observation[], stationId: string): readonly Observation[] {
  return observations.filter((row) => row.stationId === stationId);
}

const WINDOW_BOUNDS: Record<AnalyticalWindow, readonly [string, string]> = {
  primary_2015_2024: ["2015-01-01", "2024-12-31"],
  recent_2020_2024: ["2020-01-01", "2024-12-31"],
  history_2007_2024: ["2007-01-01", "2024-12-31"],
};

export function selectParameterWindowObservations(observations: readonly Observation[], window: AnalyticalWindow): readonly Observation[] {
  const [start, end] = WINDOW_BOUNDS[window];
  return observations.filter((row) => row.observedAt.slice(0, 10) >= start && row.observedAt.slice(0, 10) <= end);
}

export function selectWindowObservations(observations: readonly Observation[], stationId: string, window: AnalyticalWindow): readonly Observation[] {
  return selectObservations(selectParameterWindowObservations(observations, window), stationId);
}


export function selectSummary(asset: AnalyticalAsset, parameterId: string, stationId: string, period: AnalyticalWindow): AnalyticalSummary | undefined {
  return asset.summaries.find((row) => row.parameterId === parameterId && row.stationId === stationId && row.period === period);
}

export function selectTrend(asset: AnalyticalAsset, parameterId: string, stationId: string, period: AnalyticalWindow): AnalyticalTrend | undefined {
  return asset.trends.find((row) => row.parameterId === parameterId && row.stationId === stationId && row.period === period);
}

export function selectCoverage(asset: AnalyticalAsset, parameterId: string, stationId: string, window: AnalyticalWindow) {
  return asset.coverage.find((row) => row.parameter_id === parameterId && row.station_id === stationId && row.window === window);
}
