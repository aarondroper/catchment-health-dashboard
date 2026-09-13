import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const assetPath = "/data/ashburton/dashboard.json";

async function openDashboard(page: Page) {
  const assetResponse = page.waitForResponse((response) => response.url().endsWith(assetPath));
  await page.goto("/");
  expect((await assetResponse).status()).toBe(200);
  await expect(page.getByRole("heading", { name: "Ashburton–Hakatere catchment" })).toBeVisible();
  await expect(page.getByText(/^Build /)).toBeVisible();
  await expect(page.getByText("Fixture fallback")).toHaveCount(0);
}

test("loads the real asset and exposes the production site network", async ({ page }) => {
  const consoleErrors: string[] = [];
  const consoleWarnings: string[] = [];
  const pageErrors: string[] = [];
  const failedRequests: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
    if (message.type() === "warning") consoleWarnings.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("requestfailed", (request) => failedRequests.push(`${request.method()} ${request.url()}`));
  await openDashboard(page);
  await expect(page.locator(".site-pin")).toHaveCount(19);
  await expect(page.getByText("19", { exact: true })).toBeVisible();
  await expect(page.getByText(/Local processing only; public release remains gated/)).toBeVisible();
  expect(consoleErrors).toEqual([]);
  expect(consoleWarnings).toEqual([]);
  expect(pageErrors).toEqual([]);
  expect(failedRequests).toEqual([]);
});

test("coordinates parameter and time-window changes", async ({ page }) => {
  await openDashboard(page);
  const parameter = page.getByRole("combobox", { name: "Parameter" });
  const window = page.getByRole("combobox", { name: "Time window" });
  await parameter.selectOption("nitrate_n_nitrite_n");
  await expect(parameter).toHaveValue("nitrate_n_nitrite_n");
  await expect(page.getByText(/Nitrate-N Nitrite-N · Primary · 2015–2024/)).toBeVisible();
  await expect(page.getByText(/Showing nitrate n nitrite n · primary 2015 2024/)).toBeVisible();
  await expect(page.getByRole("table", { name: /Selected observations/ })).toBeVisible();
  await expect(page.locator(".insight-grid .headline-value").first()).toHaveText("0.9 mg/L");
  await window.selectOption("recent_2020_2024");
  await expect(window).toHaveValue("recent_2020_2024");
  await expect(page.getByText(/Nitrate-N Nitrite-N · Recent · 2020–2024/)).toBeVisible();
  await expect(page.getByText(/Showing nitrate n nitrite n · recent 2020 2024/)).toBeVisible();
  await expect(page.locator(".insight-grid .headline-value").first()).toHaveText("0.875 mg/L");
  await expect(page.getByText(/Sampled coverage describes/)).toBeVisible();
});

test("coordinates station control and map selection, including no-data state", async ({ page }) => {
  await openDashboard(page);
  const station = page.getByRole("combobox", { name: "Station" });
  const emptyPin = page.locator(".site-pin-empty").first();
  await emptyPin.click();
  await expect(page.getByText("No observations are available for this parameter and station in the selected window.")).toBeVisible();
  const selectedId = await emptyPin.getAttribute("data-station-id");
  expect(selectedId).toBeTruthy();
  await expect(station).toHaveValue(selectedId!);
  await expect(emptyPin).toHaveAttribute("aria-pressed", "true");
});

test("keeps censored observations and indeterminate reasons explicit", async ({ page }) => {
  await openDashboard(page);
  await page.getByRole("combobox", { name: "Station" }).selectOption("SQ20104");
  await expect(page.getByRole("table", { name: /Selected observations/ })).toContainText(/Censored/);
  await expect(page.getByText(/Trend indeterminate:/)).toBeVisible();
  await expect(page.getByText(/Censored values are not substituted/)).toBeVisible();
});

test("reports a clear fixture fallback when the local asset fails", async ({ page }) => {
  await page.route(`**${assetPath}`, (route) => route.fulfill({ status: 404, body: "missing" }));
  await page.goto("/");
  await expect(page.getByText(/Production-shaped local asset not found/)).toBeVisible();
  await expect(page.getByText("Fixture fallback")).toBeVisible();
  await expect(page.getByText(/checked-in development fixture/)).toBeVisible();
});

test("has no serious accessibility violations in the real-data view", async ({ page }) => {
  await openDashboard(page);
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((violation) => violation.impact === "critical" || violation.impact === "serious")).toEqual([]);
});

test("measures the real asset transfer and browser render timing", async ({ page }) => {
  await openDashboard(page);
  const timing = await page.evaluate((path) => {
    const entry = performance.getEntriesByName(new URL(path, window.location.href).href)[0] as PerformanceResourceTiming | undefined;
    return entry ? { durationMs: Math.round(entry.duration), transferSize: entry.transferSize } : null;
  }, assetPath);
  expect(timing).not.toBeNull();
  expect(timing?.transferSize).toBeGreaterThan(0);
  console.log(`asset-performance ${JSON.stringify(timing)}`);
});

test("captures representative responsive views", async ({ page }) => {
  for (const [width, height, name] of [[1440, 900, "desktop"], [1024, 768, "compact"], [390, 844, "mobile"]] as const) {
    await page.setViewportSize({ width, height });
    await openDashboard(page);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    await page.screenshot({ path: `screenshots/ashburton-${name}.png` });
  }
});
