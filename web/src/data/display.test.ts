import { describe, expect, it } from "vitest";
import { formatDate, formatNumber, formatNumberWithUnit, trendDisplay } from "./display";

const baseTrend = {
  stationId: "SQ35874",
  parameterId: "total_nitrogen",
  period: "primary_2016_2025" as const,
  estimatePerYear: null,
  direction: "indeterminate" as const,
  status: "indeterminate" as const,
  indeterminateReason: null,
  eligibleNumericCount: 0,
  calendarYearCount: 0,
};

describe("trend display copy", () => {
  it.each([
    ["screened_not_significant", "No supported trend", "No statistically supported direction was detected."],
    ["censored_values_present_censor_aware_trend_not_implemented", "Indeterminate", "Trend unavailable: censored observations require a censor-aware method."],
    ["insufficient_eligible_observations", "Indeterminate", "Not enough eligible observations for trend analysis."],
    ["insufficient_temporal_span", "Indeterminate", "The monitoring record is too short for trend analysis."],
  ])("maps %s to concise reason-specific copy", (reason, result, explanation) => {
    const display = trendDisplay({ ...baseTrend, indeterminateReason: reason }, true);
    expect(display).toMatchObject({ status: "indeterminate", result, explanation, reasonCode: reason });
  });

  it("distinguishes reported direction, no data, and loading", () => {
    expect(trendDisplay({ ...baseTrend, direction: "increasing", status: "reported", calendarYearCount: 10 }, true).result).toBe("Increasing");
    expect(trendDisplay(undefined, false)).toMatchObject({ status: "unavailable", result: "No supported trend", explanation: "No observations are available for this selection." });
    expect(trendDisplay(undefined, false, true)).toMatchObject({ status: "loading", result: "Loading" });
  });
});

describe("recurring display formatting", () => {
  it("preserves the existing number, unit, date, and censored-result rules", () => {
    expect(formatNumber(1234.56789)).toBe("1,234.5679");
    expect(formatNumberWithUnit(0.123456, "mg/L")).toBe("0.1235 mg/L");
    expect(formatDate("2024-01-15T10:00:00+12:00")).toBe("2024-01-15");
  });
});
