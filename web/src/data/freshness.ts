export const MAX_ASSET_AGE_DAYS = 120;
export const NEAR_EXPIRY_DAYS = 30;

export type AssetFreshnessStatus = "fresh" | "near_expiry" | "expired" | "invalid";

export type AssetFreshness = {
  status: AssetFreshnessStatus;
  retrievedAt: string | null;
  ageDays: number | null;
  expiresAt: string | null;
  message: string;
};

function invalidFreshness(message: string): AssetFreshness {
  return { status: "invalid", retrievedAt: null, ageDays: null, expiresAt: null, message };
}

export function assessAssetFreshness(
  sourceRetrievedAt: string | null | undefined,
  now: Date = new Date(),
  maxAgeDays = MAX_ASSET_AGE_DAYS,
): AssetFreshness {
  if (!sourceRetrievedAt || sourceRetrievedAt === "fixture") {
    return invalidFreshness("The analytical asset has no valid source retrieval date. Rebuild the local or public asset.");
  }
  const retrieved = new Date(sourceRetrievedAt);
  if (!Number.isFinite(retrieved.getTime())) {
    return invalidFreshness("The analytical asset source retrieval date is invalid. Rebuild the local or public asset.");
  }
  const ageDays = (now.getTime() - retrieved.getTime()) / 86_400_000;
  if (ageDays < -1) {
    return invalidFreshness("The analytical asset source retrieval date is in the future. Rebuild the local or public asset.");
  }
  const expiresAt = new Date(retrieved.getTime() + maxAgeDays * 86_400_000).toISOString();
  if (ageDays > maxAgeDays) {
    return {
      status: "expired",
      retrievedAt: sourceRetrievedAt,
      ageDays,
      expiresAt,
      message: `The analytical asset expired ${Math.max(0, ageDays - maxAgeDays).toFixed(0)} day(s) ago. Rebuild it from the documented source before using this view.`,
    };
  }
  if (ageDays >= maxAgeDays - NEAR_EXPIRY_DAYS) {
    return {
      status: "near_expiry",
      retrievedAt: sourceRetrievedAt,
      ageDays,
      expiresAt,
      message: `The analytical asset is within ${Math.max(0, maxAgeDays - ageDays).toFixed(0)} day(s) of its refresh limit.`,
    };
  }
  return { status: "fresh", retrievedAt: sourceRetrievedAt, ageDays, expiresAt, message: "The analytical asset is within its permitted freshness period." };
}

export class AssetFreshnessError extends Error {
  readonly freshness: AssetFreshness;

  constructor(freshness: AssetFreshness) {
    super(freshness.message);
    this.name = "AssetFreshnessError";
    this.freshness = freshness;
  }
}
