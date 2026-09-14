import { describe, expect, it } from "vitest";
import { assessAssetFreshness } from "./freshness";

const now = new Date("2026-09-14T00:00:00Z");

describe("asset freshness", () => {
  it("accepts a fresh asset", () => {
    expect(assessAssetFreshness("2026-09-01T00:00:00Z", now).status).toBe("fresh");
  });

  it("labels an asset within thirty days of expiry", () => {
    const result = assessAssetFreshness("2026-05-20T00:00:00Z", now);
    expect(result.status).toBe("near_expiry");
    expect(result.expiresAt).toBe("2026-09-17T00:00:00.000Z");
  });

  it("expires an asset older than the permitted age", () => {
    const result = assessAssetFreshness("2026-05-16T00:00:00Z", now);
    expect(result.status).toBe("expired");
    expect(result.message).toContain("Rebuild");
  });

  it.each([null, "", "fixture", "not-a-date"])('rejects missing or invalid metadata: %s', (value) => {
    expect(assessAssetFreshness(value, now).status).toBe("invalid");
  });

  it("rejects implausible future metadata", () => {
    expect(assessAssetFreshness("2026-09-20T00:00:00Z", now).status).toBe("invalid");
  });
});
