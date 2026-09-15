import type { AnalyticalAsset, Observation, ObservationPartitionManifest } from "../contracts";
import { assessAssetFreshness, AssetFreshnessError } from "./freshness";

export const LOCAL_ASSET_PATH = "/data/ashburton/dashboard.json";
const RUNTIME_CONTRACT_VERSION = "2.0.0";

type RuntimeCell = string | number | boolean | null;
type RuntimePartition = {
  contractVersion: string;
  parameterId: string;
  columns: readonly string[];
  lookups: Readonly<Record<string, readonly (string | null)[]>>;
  rows: readonly (readonly RuntimeCell[])[];
};

type RuntimeShell = Omit<AnalyticalAsset, "observations"> & { observations?: readonly Observation[] };

const EXPECTED_COLUMNS = [
  "observationId", "stationIndex", "observedAt", "value", "originalValue", "resultText",
  "originalUnit", "canonicalUnit", "qualityFlag", "qualityRepresentation", "qualityDisposition",
  "censoring", "censorLimit", "duplicateDisposition", "valueKind", "analysisEligible",
  "exclusionReason", "sourceRecordId", "sourceEndpoint", "sourceRetrievedAt",
] as const;

const LOOKUP_FIELDS = [
  "originalUnit", "canonicalUnit", "qualityFlag", "qualityRepresentation", "qualityDisposition",
  "censoring", "duplicateDisposition", "valueKind", "exclusionReason", "sourceEndpoint", "sourceRetrievedAt",
] as const;

const QUALITY_REPRESENTATIONS = ["missing_field", "blank_field", "nonempty_code"] as const;
const VALUE_KINDS = ["observed_numeric", "censored", "missing", "non_numeric"] as const;
const SELECTION_STATUSES = ["core", "secondary"] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function fail(message: string): never {
  throw new Error(`Invalid analytical runtime data: ${message}`);
}

function requiredString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.length === 0) fail(`${field} must be a non-empty string`);
  return value;
}

function nullableString(value: unknown, field: string): string | null {
  if (value !== null && typeof value !== "string") fail(`${field} must be a string or null`);
  return value;
}

function finiteNumber(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) fail(`${field} must be a finite number`);
  return value;
}

function nullableFiniteNumber(value: unknown, field: string): number | null {
  if (value === null) return null;
  return finiteNumber(value, field);
}

function nonnegativeInteger(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) fail(`${field} must be a non-negative integer`);
  return value;
}

function stringArray(value: unknown, field: string): readonly string[] {
  if (!Array.isArray(value) || !value.every((item): item is string => typeof item === "string")) fail(`${field} must be an array of strings`);
  return value;
}

function nullableStringArray(value: unknown, field: string): readonly (string | null)[] {
  if (!Array.isArray(value) || !value.every((item): item is string | null => item === null || typeof item === "string")) {
    fail(`${field} must be an array of strings or nulls`);
  }
  return value;
}

function runtimeCell(value: unknown): value is RuntimeCell {
  return value === null || typeof value === "string" || typeof value === "boolean" || (typeof value === "number" && Number.isFinite(value));
}

function knownReference(value: unknown, field: string, known: ReadonlySet<string>): string {
  const reference = requiredString(value, field);
  if (!known.has(reference)) fail(`${field} refers to an unknown ID: ${reference}`);
  return reference;
}

function isIncluded<T extends string>(values: readonly T[], value: string | null): value is T {
  return value !== null && values.includes(value as T);
}

function validateAnalyticalRows(shell: Record<string, unknown>, stationIds: ReadonlySet<string>, parameterIds: ReadonlySet<string>): void {
  const coverage = shell.coverage;
  if (!Array.isArray(coverage)) fail("coverage must be an array");
  coverage.forEach((row, index) => {
    if (!isRecord(row)) fail(`coverage[${index}] must be an object`);
    knownReference(row.station_id, `coverage[${index}].station_id`, stationIds);
    knownReference(row.parameter_id, `coverage[${index}].parameter_id`, parameterIds);
    requiredString(row.window, `coverage[${index}].window`);
    ["raw_count", "eligible_count", "eligible_numeric_count", "eligible_censored_count", "sampled_calendar_month_count", "sampled_calendar_year_count"].forEach((field) => nonnegativeInteger(row[field], `coverage[${index}].${field}`));
    requiredString(row.summary_eligibility, `coverage[${index}].summary_eligibility`);
    requiredString(row.trend_eligibility, `coverage[${index}].trend_eligibility`);
  });

  const summaries = shell.summaries;
  if (!Array.isArray(summaries)) fail("summaries must be an array");
  summaries.forEach((row, index) => {
    if (!isRecord(row)) fail(`summaries[${index}] must be an object`);
    knownReference(row.stationId, `summaries[${index}].stationId`, stationIds);
    knownReference(row.parameterId, `summaries[${index}].parameterId`, parameterIds);
    requiredString(row.period, `summaries[${index}].period`);
    nullableFiniteNumber(row.value, `summaries[${index}].value`);
    nullableFiniteNumber(row.q1, `summaries[${index}].q1`);
    nullableFiniteNumber(row.q3, `summaries[${index}].q3`);
    nullableString(row.unit, `summaries[${index}].unit`);
    if (row.status !== "reported" && row.status !== "indeterminate") fail(`summaries[${index}].status is invalid`);
    nullableString(row.indeterminateReason, `summaries[${index}].indeterminateReason`);
    nonnegativeInteger(row.eligibleNumericCount, `summaries[${index}].eligibleNumericCount`);
    nonnegativeInteger(row.eligibleCensoredCount, `summaries[${index}].eligibleCensoredCount`);
  });

  const trends = shell.trends;
  if (!Array.isArray(trends)) fail("trends must be an array");
  trends.forEach((row, index) => {
    if (!isRecord(row)) fail(`trends[${index}] must be an object`);
    knownReference(row.stationId, `trends[${index}].stationId`, stationIds);
    knownReference(row.parameterId, `trends[${index}].parameterId`, parameterIds);
    requiredString(row.period, `trends[${index}].period`);
    nullableFiniteNumber(row.estimatePerYear, `trends[${index}].estimatePerYear`);
    if (!["increasing", "decreasing", "indeterminate"].includes(row.direction as string)) fail(`trends[${index}].direction is invalid`);
    if (row.status !== "reported" && row.status !== "indeterminate") fail(`trends[${index}].status is invalid`);
    nullableString(row.indeterminateReason, `trends[${index}].indeterminateReason`);
    nonnegativeInteger(row.eligibleNumericCount, `trends[${index}].eligibleNumericCount`);
    nonnegativeInteger(row.calendarYearCount, `trends[${index}].calendarYearCount`);
  });
}

export function validateAnalyticalShell(value: unknown): asserts value is RuntimeShell {
  if (!isRecord(value)) fail("shell must be an object");
  if (value.contractVersion !== RUNTIME_CONTRACT_VERSION) fail(`shell contractVersion must be ${RUNTIME_CONTRACT_VERSION}`);
  requiredString(value.analyticalVersion, "analyticalVersion");
  requiredString(value.studyAreaId, "studyAreaId");
  requiredString(value.studyAreaName, "studyAreaName");
  if (value.sourceTermsStatus !== "local_processing_only_release_gate" && value.sourceTermsStatus !== "public_cc_by_attribution_freshness") fail("sourceTermsStatus is invalid");
  nullableString(value.qualityPolicy, "qualityPolicy");
  nullableString(value.sourceRetrievedAt, "sourceRetrievedAt");
  nullableString(value.buildId, "buildId");

  if (!Array.isArray(value.parameters) || value.parameters.length === 0) fail("parameters must be a non-empty array");
  const parameterIds = new Set<string>();
  value.parameters.forEach((item, index) => {
    if (!isRecord(item)) fail(`parameters[${index}] must be an object`);
    const parameterId = requiredString(item.parameterId, `parameters[${index}].parameterId`);
    if (parameterIds.has(parameterId)) fail(`parameters contains duplicate ID: ${parameterId}`);
    parameterIds.add(parameterId);
    requiredString(item.displayName, `parameters[${index}].displayName`);
    nullableString(item.unit, `parameters[${index}].unit`);
    if (!SELECTION_STATUSES.includes(item.selectionStatus as typeof SELECTION_STATUSES[number])) fail(`parameters[${index}].selectionStatus is invalid`);
  });

  if (!Array.isArray(value.stations) || value.stations.length === 0) fail("stations must be a non-empty array");
  const stationIds = new Set<string>();
  value.stations.forEach((item, index) => {
    if (!isRecord(item)) fail(`stations[${index}] must be an object`);
    const stationId = requiredString(item.stationId, `stations[${index}].stationId`);
    if (stationIds.has(stationId)) fail(`stations contains duplicate ID: ${stationId}`);
    stationIds.add(stationId);
    requiredString(item.name, `stations[${index}].name`);
    const latitude = finiteNumber(item.latitude, `stations[${index}].latitude`);
    const longitude = finiteNumber(item.longitude, `stations[${index}].longitude`);
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) fail(`stations[${index}] coordinates are outside WGS84 bounds`);
    nullableString(item.membershipBasis, `stations[${index}].membershipBasis`);
  });

  if (value.catchmentGeometry !== null && !isRecord(value.catchmentGeometry)) fail("catchmentGeometry must be an object or null");
  validateAnalyticalRows(value, stationIds, parameterIds);
  if (!isRecord(value.counts)) fail("counts must be an object");
  Object.entries(value.counts).forEach(([field, count]) => nonnegativeInteger(count, `counts.${field}`));
  if (!Array.isArray(value.warnings) || !value.warnings.every((warning) => typeof warning === "string")) fail("warnings must be an array of strings");

  if (!isRecord(value.runtimeData)) fail("runtimeData must be an object");
  if (value.runtimeData.contractVersion !== RUNTIME_CONTRACT_VERSION || value.runtimeData.detailLoading !== "parameter_partitioned") fail("runtimeData identity is invalid");
  if (stringArray(value.runtimeData.observationColumns, "runtimeData.observationColumns").join("|") !== EXPECTED_COLUMNS.join("|")) fail("runtimeData observation columns do not match the contract");
  if (stringArray(value.runtimeData.lookupFields, "runtimeData.lookupFields").join("|") !== LOOKUP_FIELDS.join("|")) fail("runtimeData lookup fields do not match the contract");
  requiredString(value.runtimeData.encoding, "runtimeData.encoding");

  if (!isRecord(value.observationPartitions)) fail("observationPartitions must be an object");
  const partitionIds = Object.keys(value.observationPartitions);
  if (partitionIds.some((parameterId) => !parameterIds.has(parameterId)) || partitionIds.length !== parameterIds.size) fail("observationPartitions do not match the declared parameters");
  Object.entries(value.observationPartitions).forEach(([parameterId, manifest], index) => {
    if (!isRecord(manifest)) fail(`observationPartitions[${index}] must be an object`);
    requiredString(manifest.path, `observationPartitions.${parameterId}.path`);
    if (manifest.contractVersion !== RUNTIME_CONTRACT_VERSION) fail(`observationPartitions.${parameterId}.contractVersion is invalid`);
    nonnegativeInteger(manifest.rowCount, `observationPartitions.${parameterId}.rowCount`);
    nonnegativeInteger(manifest.byteCount, `observationPartitions.${parameterId}.byteCount`);
    requiredString(manifest.sha256, `observationPartitions.${parameterId}.sha256`);
  });
  if (value.observations !== undefined && !Array.isArray(value.observations)) fail("observations must be an array when present");
}

function validateRuntimePartition(value: unknown, expectedContractVersion: string, expectedParameterId: string): RuntimePartition {
  if (!isRecord(value)) fail("observation partition must be an object");
  if (value.contractVersion !== expectedContractVersion) fail("observation partition contractVersion does not match its manifest");
  if (value.parameterId !== expectedParameterId) fail(`observation partition parameterId does not match ${expectedParameterId}`);
  if (stringArray(value.columns, "observation partition columns").join("|") !== EXPECTED_COLUMNS.join("|")) fail("observation partition columns do not match the contract");
  if (!isRecord(value.lookups)) fail("observation partition lookups must be an object");
  const lookupObject = value.lookups;
  const lookups: Record<string, readonly (string | null)[]> = {};
  LOOKUP_FIELDS.forEach((field) => { lookups[field] = nullableStringArray(lookupObject[field], `observation partition lookups.${field}`); });
  if (!Array.isArray(value.rows) || !value.rows.every((row) => Array.isArray(row) && row.every(runtimeCell))) fail("observation partition rows must contain only JSON runtime values");
  return { contractVersion: requiredString(value.contractVersion, "observation partition contractVersion"), parameterId: requiredString(value.parameterId, "observation partition parameterId"), columns: stringArray(value.columns, "observation partition columns"), lookups, rows: value.rows as readonly (readonly RuntimeCell[])[] };
}

async function getJson(path: string): Promise<unknown> {
  const response = await fetch(path, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`Analytical asset request failed (${response.status}) for ${path}`);
  return response.json();
}

function lookupValue(partition: RuntimePartition, field: string, index: RuntimeCell): string | null {
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
    if (typeof stationIndex !== "number" || !Number.isInteger(stationIndex) || stationIndex < 0 || !asset.stations[stationIndex]) throw new Error("Runtime observation station index is invalid");
    const observationId = requiredString(row[0], "observationId");
    const observedAt = requiredString(row[2], "observedAt");
    if (!Number.isFinite(Date.parse(observedAt))) fail("observedAt must be a valid date");
    const value = nullableFiniteNumber(row[3], "value");
    const originalValue = nullableFiniteNumber(row[4], "originalValue");
    const resultText = nullableString(row[5], "resultText");
    const qualityRepresentation = lookupValue(partition, "qualityRepresentation", row[9]);
    if (!isIncluded(QUALITY_REPRESENTATIONS, qualityRepresentation)) fail("qualityRepresentation is invalid");
    const qualityDisposition = lookupValue(partition, "qualityDisposition", row[10]);
    const duplicateDisposition = lookupValue(partition, "duplicateDisposition", row[13]);
    const valueKind = lookupValue(partition, "valueKind", row[14]);
    if (!qualityDisposition || !duplicateDisposition || !isIncluded(VALUE_KINDS, valueKind)) fail("required observation disposition is invalid");
    if (typeof row[15] !== "boolean") fail("analysisEligible must be a boolean");
    const sourceRecordId = requiredString(row[17], "sourceRecordId");
    const sourceEndpoint = lookupValue(partition, "sourceEndpoint", row[18]);
    const sourceRetrievedAt = lookupValue(partition, "sourceRetrievedAt", row[19]);
    if (!sourceRecordId || !sourceEndpoint || !sourceRetrievedAt) fail("source provenance fields must be non-empty");
    return {
      observationId,
      stationId: asset.stations[stationIndex].stationId,
      parameterId: partition.parameterId,
      observedAt,
      value,
      originalValue,
      resultText,
      originalUnit: lookupValue(partition, "originalUnit", row[6]),
      canonicalUnit: lookupValue(partition, "canonicalUnit", row[7]),
      qualityFlag: lookupValue(partition, "qualityFlag", row[8]),
      qualityRepresentation,
      qualityDisposition,
      censoring: lookupValue(partition, "censoring", row[11]),
      censorLimit: nullableFiniteNumber(row[12], "censorLimit"),
      duplicateDisposition,
      valueKind,
      analysisEligible: row[15],
      exclusionReason: lookupValue(partition, "exclusionReason", row[16]),
      sourceRecordId,
      sourceEndpoint,
      sourceRetrievedAt,
    };
  });
}

export async function loadObservationPartition(
  asset: Pick<AnalyticalAsset, "stations" | "observationPartitions" | "runtimeData"> & { observations?: readonly Observation[] },
  parameterId: string,
): Promise<readonly Observation[]> {
  const startedAt = typeof performance === "undefined" ? null : performance.now();
  const manifest: ObservationPartitionManifest | undefined = asset.observationPartitions?.[parameterId];
  if (!manifest) return asset.observations?.filter((row) => row.parameterId === parameterId) ?? [];
  if (asset.runtimeData?.contractVersion !== manifest.contractVersion) throw new Error("Runtime observation metadata version mismatch");
  const partition = validateRuntimePartition(await getJson(manifest.path), manifest.contractVersion, parameterId);
  if (partition.rows.length !== manifest.rowCount) throw new Error(`Runtime observation partition row count mismatch for ${parameterId}`);
  const observations = decodeObservationPartition(partition, asset);
  if (startedAt !== null) performance.measure(`dashboard-partition-${parameterId}`, { start: startedAt });
  return observations;
}

export async function loadAnalyticalAsset(initialParameterId?: string): Promise<AnalyticalAsset> {
  const startedAt = typeof performance === "undefined" ? null : performance.now();
  const shell = await getJson(LOCAL_ASSET_PATH);
  validateAnalyticalShell(shell);
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
