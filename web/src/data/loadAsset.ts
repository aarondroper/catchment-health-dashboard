import type { AnalyticalAsset } from "../contracts";

export const LOCAL_ASSET_PATH = "/data/ashburton/dashboard.json";

export async function loadAnalyticalAsset(): Promise<AnalyticalAsset> {
  const response = await fetch(LOCAL_ASSET_PATH, { headers: { Accept: "application/json" } });
  if (!response.ok) {
    throw new Error(`Analytical asset request failed (${response.status})`);
  }
  return response.json() as Promise<AnalyticalAsset>;
}
