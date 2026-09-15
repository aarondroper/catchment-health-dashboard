import { describe, expect, it } from "vitest";
import { decodeObservationPartition, validateAnalyticalShell } from "./loadAsset";

const columns = [
  "observationId", "stationIndex", "observedAt", "value", "originalValue", "resultText",
  "originalUnit", "canonicalUnit", "qualityFlag", "qualityRepresentation", "qualityDisposition",
  "censoring", "censorLimit", "duplicateDisposition", "valueKind", "analysisEligible",
  "exclusionReason", "sourceRecordId", "sourceEndpoint", "sourceRetrievedAt",
];

const validPartition = {
  contractVersion: "2.0.0",
  parameterId: "nitrate_n_nitrite_n",
  columns,
  lookups: {
    originalUnit: ["g/m3"], canonicalUnit: ["mg/L"], qualityFlag: [null], qualityRepresentation: ["missing_field"],
    qualityDisposition: ["published_unflagged"], censoring: [null], duplicateDisposition: ["unique"],
    valueKind: ["observed_numeric"], exclusionReason: [null], sourceEndpoint: ["fixture"], sourceRetrievedAt: ["fixture"],
  },
  rows: [["obs-001", 0, "2024-01-15T10:00:00+12:00", 0.42, 0.42, "0.42", 0, 0, 0, 0, 0, 0, 0, 0, 0, true, 0, "fixture/obs-001", 0, 0]],
};

const stationAsset = { stations: [{ stationId: "station-ash-001", name: "Fixture", latitude: -43.9, longitude: 171.75, membershipBasis: "fixture" }] };

describe("runtime analytical asset validation", () => {
  it("decodes a valid partition without changing source-preserving values", () => {
    expect(decodeObservationPartition(validPartition, stationAsset)[0]).toMatchObject({
      observationId: "obs-001",
      stationId: "station-ash-001",
      value: 0.42,
      originalValue: 0.42,
      originalUnit: "g/m3",
      canonicalUnit: "mg/L",
      qualityRepresentation: "missing_field",
      qualityDisposition: "published_unflagged",
    });
  });

  it.each([
    ["row length", { rows: [["obs-001"]] }],
    ["station index", { rows: [["obs-001", 1, ...validPartition.rows[0].slice(2)] as typeof validPartition.rows[0]] }],
    ["quality representation", { lookups: { ...validPartition.lookups, qualityRepresentation: ["unrecognised"] } }],
    ["non-finite value", { rows: [["obs-001", 0, "2024-01-15T10:00:00+12:00", Number.NaN, ...validPartition.rows[0].slice(4)] as typeof validPartition.rows[0]] }],
  ])("rejects malformed %s runtime data", (_label, change) => {
    expect(() => decodeObservationPartition({ ...validPartition, ...change }, stationAsset)).toThrow(/Invalid analytical runtime data|invalid|unexpected length/);
  });

  it("rejects a shell with the wrong contract before selectors use it", () => {
    expect(() => validateAnalyticalShell({ contractVersion: "1.0.0" })).toThrow(/contractVersion/);
  });
});
