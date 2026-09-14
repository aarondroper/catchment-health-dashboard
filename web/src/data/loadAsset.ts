import type { AnalyticalAsset, Observation, ObservationPartitionManifest } from "../contracts";
import { assessAssetFreshness, AssetFreshnessError } from "./freshness";

export const LOCAL_ASSET_PATH = "/data/ashburton/dashboard.json";

type RuntimePartition = {
  contractVersion: string;
  parameterId: string;
  columns: readonly string[];
  lookups: Readonly<Record<string, readonly (string | null)[]>>;
  rows: readonly (string | number | boolean | null)[][];
};

const EXPECTED_COLUMNS = [
  "observationId", "stationIndex", "observedAt", "value", "originalValue", "resultText",
  "originalUnit", "canonicalUnit", "qualityFlag", "qualityRepresentation", "qualityDisposition",
  "censoring", "censorLimit", "duplicateDisposition", "valueKind", "analysisEligible",
  "exclusionReason", "sourceRecordId", "sourceEndpoint", "sourceRetrievedAt",
] as const;

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(path, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`Analytical asset request failed (${response.status}) for ${path}`);
  return response.json() as Promise<T>;
}

function lookupValue(partition: RuntimePartition, field: string, index: string | number | boolean | null): string | null {
  if (typeof index !== "number") throw new Error(`Runtime observation lookup index for ${field} is invalid`);
  const values = partition.lookups[field];
  if (!values || !Number.isInteger(index) || index < 0 || index >= values.length) {
    throw new Error(`Runtime observation lookup index for ${field} is out of range`);
  }
  return values[index];
}

export function decodeObservationPartition(
  partition: RuntimePartition,
  asset: Pick<AnalyticalAsset, "stations">,
): readonly Observation[] {
  if (partition.columns.join("|") !== EXPECTED_COLUMNS.join("|")) {
    throw new Error("Runtime observation partition columns do not match contract 2.0.0");
  }
  return partition.rows.map((row) => {
    if (row.length !== EXPECTED_COLUMNS.length) throw new Error("Runtime observation row has an unexpected length");
    const stationIndex = row[1];
    if (typeof stationIndex !== "number" || !asset.stations[stationIndex]) throw new Error("Runtime observation station index is invalid");
    return {
      observationId: String(row[0]),
      stationId: asset.stations[stationIndex].stationId,
      parameterId: partition.parameterId,
      observedAt: String(row[2]),
      value: typeof row[3] === "number" ? row[3] : null,
      originalValue: typeof row[4] === "number" ? row[4] : null,
      resultText: typeof row[5] === "string" ? row[5] : null,
      originalUnit: lookupValue(partition, "originalUnit", row[6]),
      canonicalUnit: lookupValue(partition, "canonicalUnit", row[7]),
      qualityFlag: lookupValue(partition, "qualityFlag", row[8]),
      qualityRepresentation: lookupValue(partition, "qualityRepresentation", row[9]) as Observation["qualityRepresentation"],
      qualityDisposition: lookupValue(partition, "qualityDisposition", row[10]) ?? "unresolved_quality",
      censoring: lookupValue(partition, "censoring", row[11]),
      censorLimit: typeof row[12] === "number" ? row[12] : null,
      duplicateDisposition: lookupValue(partition, "duplicateDisposition", row[13]) ?? "unknown",
      valueKind: lookupValue(partition, "valueKind", row[14]) as Observation["valueKind"],
      analysisEligible: row[15] === true,
      exclusionReason: lookupValue(partition, "exclusionReason", row[16]),
      sourceRecordId: String(row[17]),
      sourceEndpoint: String(row[18]),
      sourceRetrievedAt: String(row[19]),
    };
  });
}

export async function loadObservationPartition(
  asset: Pick<AnalyticalAsset, "stations" | "observations" | "observationPartitions" | "runtimeData">,
  parameterId: string,
): Promise<readonly Observation[]> {
  const startedAt = typeof performance === "undefined" ? null : performance.now();
  const manifest: ObservationPartitionManifest | undefined = asset.observationPartitions?.[parameterId];
  if (!manifest) return asset.observations.filter((row) => row.parameterId === parameterId);
  if (asset.runtimeData?.contractVersion !== manifest.contractVersion) throw new Error("Runtime observation metadata version mismatch");
  const partition = await getJson<RuntimePartition>(manifest.path);
  if (partition.contractVersion !== manifest.contractVersion || partition.parameterId !== parameterId) {
    throw new Error(`Runtime observation partition mismatch for ${parameterId}`);
  }
  const observations = decodeObservationPartition(partition, asset);
  if (startedAt !== null) performance.measure(`dashboard-partition-${parameterId}`, { start: startedAt });
  return observations;
}

export async function loadAnalyticalAsset(initialParameterId?: string): Promise<AnalyticalAsset> {
  const startedAt = typeof performance === "undefined" ? null : performance.now();
  const shell = await getJson<AnalyticalAsset>(LOCAL_ASSET_PATH);
  if (shell.contractVersion !== "2.0.0" || !shell.observationPartitions || !shell.runtimeData) {
    throw new Error("Analytical asset does not provide runtime contract 2.0.0");
  }
  const freshness = assessAssetFreshness(shell.sourceRetrievedAt);
  if (freshness.status === "expired" || freshness.status === "invalid") {
    throw new AssetFreshnessError(freshness);
  }
  const firstParameter = shell.parameters.find((item) => item.parameterId === initialParameterId)
    ?? shell.parameters.find((item) => item.selectionStatus === "core")
    ?? shell.parameters[0];
  if (!firstParameter) throw new Error("Analytical asset has no parameters");
  const observations = await loadObservationPartition(shell, firstParameter.parameterId);
  if (startedAt !== null) performance.measure("dashboard-runtime-ready", { start: startedAt });
  return { ...shell, observations };
}
