import type { AnalyticalTrend } from "../contracts";

export function formatNumber(value: number, maximumFractionDigits = 4): string {
  return value.toLocaleString(undefined, { maximumFractionDigits });
}

export function formatNumberWithUnit(value: number, unit: string | null, maximumFractionDigits = 4): string {
  return `${formatNumber(value, maximumFractionDigits)} ${unit ?? ""}`.trim();
}

export function formatCount(value: number): string {
  return value.toLocaleString();
}

/** Preserve the source timestamp's displayed calendar date without timezone conversion. */
export function formatDate(value: string): string {
  return value.slice(0, 10);
}

export type TrendDisplayStatus = "reported" | "indeterminate" | "unavailable" | "loading";

export type TrendDisplay = {
  status: TrendDisplayStatus;
  result: string;
  explanation: string;
  reasonCode: string | null;
};

const REASON_COPY: Record<string, { result: string; explanation: string }> = {
  screened_not_significant: {
    result: "No supported trend",
    explanation: "No statistically supported direction was detected.",
  },
  censored_values_present_censor_aware_trend_not_implemented: {
    result: "Indeterminate",
    explanation: "Trend unavailable: censored observations require a censor-aware method.",
  },
  censored_values_present_no_substitution_applied: {
    result: "Indeterminate",
    explanation: "Trend unavailable: censored observations require a censor-aware method.",
  },
  insufficient_eligible_observations: {
    result: "Indeterminate",
    explanation: "Not enough eligible observations for trend analysis.",
  },
  insufficient_temporal_span: {
    result: "Indeterminate",
    explanation: "The monitoring record is too short for trend analysis.",
  },
};

export function trendDisplay(trend: AnalyticalTrend | undefined, hasObservedRecords: boolean, loading = false): TrendDisplay {
  if (trend?.status === "reported") {
    return {
      status: "reported",
      result: trend.direction === "increasing" ? "Increasing" : "Decreasing",
      explanation: `Neutral direction across ${trend.calendarYearCount} sampled calendar years.`,
      reasonCode: null,
    };
  }
  if (trend?.indeterminateReason && REASON_COPY[trend.indeterminateReason]) {
    return { status: "indeterminate", ...REASON_COPY[trend.indeterminateReason], reasonCode: trend.indeterminateReason };
  }
  if (loading) {
    return { status: "loading", result: "Loading", explanation: "Loading trend evidence for this selection.", reasonCode: null };
  }
  if (!trend && !hasObservedRecords) {
    return { status: "unavailable", result: "No supported trend", explanation: "No observations are available for this selection.", reasonCode: "no_observations" };
  }
  return { status: "indeterminate", result: "Indeterminate", explanation: "Trend is unavailable for this selection.", reasonCode: trend?.indeterminateReason ?? "unavailable" };
}
