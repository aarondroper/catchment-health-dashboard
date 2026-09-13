import { describe, expect, it } from "vitest";
import type { Observation, ParameterOption, Station } from "../contracts";
import { buildObservationCsv, exportFilename } from "./exportCsv";
import { decodeObservationPartition } from "./loadAsset";

const parameter: ParameterOption = {
  parameterId: "nitrate_n_nitrite_n",
  displayName: "Nitrate-N Nitrite-N",
  unit: "mg/L",
  selectionStatus: "core",
};

const stations: Station[] = [
  { stationId: "SQ2", name: "Rākaiā, \"North\"", latitude: -43.8, longitude: 171.7, membershipBasis: "fixture" },
  { stationId: "SQ1", name: "Ashburton", latitude: -43.9, longitude: 171.7, membershipBasis: "fixture" },
];

const rows: Observation[] = [
  {
    observationId: "obs-2", stationId: "SQ2", parameterId: parameter.parameterId, observedAt: "2024-02-02T10:00:00+12:00",
    value: null, originalValue: null, resultText: "<0.01, quoted", originalUnit: "g/m3", canonicalUnit: "mg/L", qualityFlag: "600",
    qualityRepresentation: "nonempty_code", qualityDisposition: "retained_good_quality", censoring: "left_censored", censorLimit: 0.01,
    duplicateDisposition: "unique", valueKind: "censored", analysisEligible: true, exclusionReason: null,
    sourceRecordId: "source/2", sourceEndpoint: "https://example.test/data?a=1,2", sourceRetrievedAt: "2026-09-13T00:00:00Z",
  },
  {
    observationId: "obs-1", stationId: "SQ1", parameterId: parameter.parameterId, observedAt: "2024-01-01T10:00:00+12:00",
    value: 0.42, originalValue: 0.42, resultText: "0.42 \"exact\"", originalUnit: "g/m3", canonicalUnit: "mg/L", qualityFlag: null,
    qualityRepresentation: "missing_field", qualityDisposition: "excluded_quality", censoring: null, censorLimit: null,
    duplicateDisposition: "unique", valueKind: "observed_numeric", analysisEligible: false, exclusionReason: "excluded_quality",
    sourceRecordId: "source/1", sourceEndpoint: "fixture", sourceRetrievedAt: "2026-09-13T00:00:00Z",
  },
];

describe("filtered CSV export", () => {
  it("preserves censored, excluded, Unicode, commas, quotes, and missing values", () => {
    const csv = buildObservationCsv(rows, stations, parameter);
    expect(csv.split("\r\n")[0]).toContain("censoring_direction");
    expect(csv).toContain('"Rākaiā, ""North"""');
    expect(csv).toContain('"<0.01, quoted"');
    expect(csv).toContain('"0.42 ""exact"""');
    expect(csv).toContain(",left_censored,0.01,censored,retained_good_quality,600,nonempty_code,true,");
    expect(csv).toContain(",observed_numeric,excluded_quality,,missing_field,false,excluded_quality,");
    expect(csv).toContain(",excluded_quality,,missing_field,false,");
  });

  it("is deterministic and supports an empty deliberate export", () => {
    expect(buildObservationCsv(rows, stations, parameter)).toBe(buildObservationCsv([...rows].reverse(), stations, parameter));
    expect(buildObservationCsv([], stations, parameter).split("\r\n")).toEqual([expect.stringContaining("station_name"), "",]);
  });

  it("creates a context-identifying filename", () => {
    expect(exportFilename("Ashburton–Hakatere catchment", parameter, "primary_2015_2024", "station", "SQ2"))
      .toBe("ashburton-hakatere-catchment_nitrate-n-nitrite-n_primary-2015-2024_station-sq2.csv");
    expect(exportFilename("Ashburton–Hakatere catchment", parameter, "recent_2020_2024", "all_sites"))
      .toBe("ashburton-hakatere-catchment_nitrate-n-nitrite-n_recent-2020-2024_all-sites.csv");
  });
});

describe("runtime observation decoding", () => {
  it("decodes lookup-backed rows without losing source semantics", () => {
    const partition = {
      contractVersion: "2.0.0",
      parameterId: parameter.parameterId,
      columns: ["observationId", "stationIndex", "observedAt", "value", "originalValue", "resultText", "originalUnit", "canonicalUnit", "qualityFlag", "qualityRepresentation", "qualityDisposition", "censoring", "censorLimit", "duplicateDisposition", "valueKind", "analysisEligible", "exclusionReason", "sourceRecordId", "sourceEndpoint", "sourceRetrievedAt"],
      lookups: {
        originalUnit: ["g/m3"], canonicalUnit: ["mg/L"], qualityFlag: ["600"], qualityRepresentation: ["nonempty_code"],
        qualityDisposition: ["retained_good_quality"], censoring: ["left_censored"], duplicateDisposition: ["unique"], valueKind: ["censored"],
        exclusionReason: [null], sourceEndpoint: ["fixture"], sourceRetrievedAt: ["2026-09-13T00:00:00Z"],
      },
      rows: [["obs-2", 0, "2024-02-02T10:00:00+12:00", null, null, "<0.01", 0, 0, 0, 0, 0, 0, 0.01, 0, 0, true, 0, "source/2", 0, 0]],
    };
    expect(decodeObservationPartition(partition, { stations })).toEqual([expect.objectContaining({ stationId: "SQ2", valueKind: "censored", censorLimit: 0.01, sourceRecordId: "source/2" })]);
  });
});
