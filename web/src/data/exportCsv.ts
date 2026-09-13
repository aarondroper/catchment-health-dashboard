import type { AnalyticalWindow, Observation, ParameterOption, Station } from "../contracts";

export const EXPORT_COLUMNS = [
  "station_name",
  "source_station_id",
  "parameter",
  "timestamp",
  "display_value",
  "parsed_value",
  "canonical_unit",
  "original_result_text",
  "original_value",
  "original_unit",
  "censoring_direction",
  "reporting_limit",
  "value_kind",
  "quality_disposition",
  "raw_quality_code",
  "quality_representation",
  "analytical_eligibility",
  "exclusion_reason",
  "source_observation_id",
  "source_endpoint",
  "source_retrieved_at",
] as const;

function csvCell(value: string | number | boolean | null | undefined): string {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function observationDisplayValue(observation: Observation): string | number | null {
  if (observation.valueKind === "censored" || observation.censoring) return observation.resultText;
  return observation.value;
}

export function buildObservationCsv(
  observations: readonly Observation[],
  stations: readonly Station[],
  parameter: ParameterOption,
): string {
  const stationNames = new Map(stations.map((station) => [station.stationId, station.name]));
  const rows = [...observations].sort((left, right) =>
    `${stationNames.get(left.stationId) ?? left.stationId}\u0000${left.stationId}\u0000${left.observedAt}\u0000${left.observationId}`
      .localeCompare(`${stationNames.get(right.stationId) ?? right.stationId}\u0000${right.stationId}\u0000${right.observedAt}\u0000${right.observationId}`),
  );
  const lines = [EXPORT_COLUMNS.join(",")];
  for (const observation of rows) {
    lines.push([
      stationNames.get(observation.stationId) ?? observation.stationId,
      observation.stationId,
      parameter.displayName,
      observation.observedAt,
      observationDisplayValue(observation),
      observation.value,
      observation.canonicalUnit,
      observation.resultText,
      observation.originalValue,
      observation.originalUnit,
      observation.censoring,
      observation.censorLimit,
      observation.valueKind,
      observation.qualityDisposition,
      observation.qualityFlag,
      observation.qualityRepresentation,
      observation.analysisEligible,
      observation.exclusionReason,
      observation.observationId,
      observation.sourceEndpoint,
      observation.sourceRetrievedAt,
    ].map(csvCell).join(","));
  }
  return `${lines.join("\r\n")}\r\n`;
}

function filenamePart(value: string): string {
  return value.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function exportFilename(
  catchmentName: string,
  parameter: ParameterOption,
  window: AnalyticalWindow,
  scope: "station" | "all_sites",
  stationId?: string,
): string {
  const windowName = window.replace("primary_", "primary-").replace("recent_", "recent-").replace("history_", "history-").replaceAll("_", "-");
  const stationPart = scope === "all_sites" ? "all-sites" : `station-${filenamePart(stationId ?? "selected")}`;
  return `${filenamePart(catchmentName)}_${filenamePart(parameter.parameterId)}_${windowName}_${stationPart}.csv`;
}

export function downloadObservationCsv(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
