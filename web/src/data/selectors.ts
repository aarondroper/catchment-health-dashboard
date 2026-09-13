import type { AnalyticalAsset, AnalyticalSummary, AnalyticalTrend, AnalyticalWindow, Observation } from "../contracts";

export function selectObservations(asset: AnalyticalAsset, parameterId: string, stationId: string): readonly Observation[] {
  return asset.observations.filter((row) => row.parameterId === parameterId && row.stationId === stationId);
}

export function selectSummary(asset: AnalyticalAsset, parameterId: string, stationId: string, period: AnalyticalWindow): AnalyticalSummary | undefined {
  return asset.summaries.find((row) => row.parameterId === parameterId && row.stationId === stationId && row.period === period);
}

export function selectTrend(asset: AnalyticalAsset, parameterId: string, stationId: string, period: AnalyticalWindow): AnalyticalTrend | undefined {
  return asset.trends.find((row) => row.parameterId === parameterId && row.stationId === stationId && row.period === period);
}
