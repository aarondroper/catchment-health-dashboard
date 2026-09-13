import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";

const assetPath = "/data/ashburton/dashboard.json";

async function openDashboard(page: Page) {
  const assetResponse = page.waitForResponse((response) => response.url().endsWith(assetPath));
  await page.goto("/");
  expect((await assetResponse).status()).toBe(200);
  await expect(page.getByRole("heading", { name: "Ashburton–Hakatere catchment" })).toBeVisible();
  await expect(page.getByText(/^Build /)).toBeVisible();
  await expect(page.getByText("Fixture fallback")).toHaveCount(0);
  await expect(page.locator(".maplibregl-canvas")).toHaveCount(1);
  await expect(page.locator(".map-marker")).toHaveCount(19);
  await expect(page.getByText(/Boundary: ECan Ashburton River major-catchment polygon/)).toBeVisible();
}

test("loads the real asset and exposes the production site network", async ({ page }) => {
  const consoleErrors: string[] = [];
  const consoleWarnings: string[] = [];
  const pageErrors: string[] = [];
  const failedRequests: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
    // Chromium's headless software compositor emits this MapLibre readback diagnostic during canvas paint; it is not an application warning.
    if (message.type() === "warning" && !message.text().includes("GL Driver Message (OpenGL, Performance, GL_CLOSE_PATH_NV")) consoleWarnings.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("requestfailed", (request) => failedRequests.push(`${request.method()} ${request.url()}`));
  await openDashboard(page);
  await expect(page.locator(".map-marker")).toHaveCount(19);
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
  await expect(page.locator(".selection-summary")).toContainText("Nitrate-N Nitrite-N · Primary · 2015–2024");
  await expect(page.getByText(/Showing nitrate n nitrite n · primary 2015 2024/)).toBeVisible();
  await expect(page.getByRole("table", { name: /Selected observations/ })).toBeVisible();
  await expect(page.locator(".insight-grid .headline-value").first()).toHaveText("0.9 mg/L");
  await window.selectOption("recent_2020_2024");
  await expect(window).toHaveValue("recent_2020_2024");
  await expect(page.locator(".selection-summary")).toContainText("Nitrate-N Nitrite-N · Recent · 2020–2024");
  await expect(page.getByText(/Showing nitrate n nitrite n · recent 2020 2024/)).toBeVisible();
  await expect(page.locator(".insight-grid .headline-value").first()).toHaveText("0.875 mg/L");
  await expect(page.getByText(/Sampled coverage describes/)).toBeVisible();
});

test("coordinates station control and map selection, including no-data state", async ({ page }) => {
  await openDashboard(page);
  const station = page.getByRole("combobox", { name: "Station" });
  const emptyPin = page.locator(".map-marker-unavailable").first();
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

test("shows a supported neutral trend when the selected series meets the rules", async ({ page }) => {
  await openDashboard(page);
  await page.getByRole("combobox", { name: "Parameter" }).selectOption("turbidity");
  await page.getByRole("combobox", { name: "Station" }).selectOption("SQ20106");
  await expect(page.getByText("increasing", { exact: true })).toBeVisible();
  await expect(page.getByText(/This is a neutral direction label/)).toBeVisible();
});

test("reports a clear fixture fallback when the local asset fails", async ({ page }) => {
  await page.route(`**${assetPath}`, (route) => route.fulfill({ status: 404, body: "missing" }));
  await page.goto("/");
  await expect(page.getByText(/Production-shaped local asset not found/)).toBeVisible();
  await expect(page.getByText("Fixture fallback")).toBeVisible();
  await expect(page.getByText(/checked-in development fixture/)).toBeVisible();
});

test("exports selected and all-site filtered records as deterministic UTF-8 CSV", async ({ page }) => {
  await openDashboard(page);
  const scope = page.getByRole("combobox", { name: "Export scope" });
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download CSV" }).click();
  const selectedDownload = await downloadPromise;
  expect(selectedDownload.suggestedFilename()).toMatch(/ashburton-hakatere-catchment_e-coli_primary-2015-2024_station-/);
  const selectedPath = await selectedDownload.path();
  const selectedCsv = await readFile(selectedPath!, "utf8");
  expect(selectedCsv).toContain("station_name,source_station_id,parameter,timestamp");
  expect(selectedCsv).toContain("quality_representation");
  const selectedRows = selectedCsv.trimEnd().split("\r\n").length;

  await scope.selectOption("all_sites");
  const allDownloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download CSV" }).click();
  const allDownload = await allDownloadPromise;
  expect(allDownload.suggestedFilename()).toContain("_all-sites.csv");
  const allPath = await allDownload.path();
  const allCsv = await readFile(allPath!, "utf8");
  expect(allCsv.trimEnd().split("\r\n").length).toBeGreaterThan(selectedRows);
  expect(allCsv).toContain("E. coli");
  await scope.selectOption("station");
});

test("exports a deliberate header-only file for a no-data station", async ({ page }) => {
  await openDashboard(page);
  const emptyPin = page.locator(".map-marker-unavailable").first();
  await emptyPin.click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download CSV" }).click();
  const download = await downloadPromise;
  const path = await download.path();
  const csv = await readFile(path!, "utf8");
  expect(csv.trimEnd().split("\r\n")).toHaveLength(1);
  await expect(page.getByText(/0 records exported as/)).toBeVisible();
});

test("keeps the station alternative keyboard-operable", async ({ page }) => {
  await openDashboard(page);
  const station = page.getByRole("combobox", { name: "Station" });
  const initialStation = await station.inputValue();
  await station.focus();
  await station.press("ArrowDown");
  expect(await station.inputValue()).not.toBe(initialStation);
  const marker = page.locator(".map-marker-unavailable").first();
  const markerId = await marker.getAttribute("data-station-id");
  await marker.focus();
  await marker.press("Enter");
  await expect(station).toHaveValue(markerId!);
});

test("has no serious accessibility violations in the real-data view", async ({ page }) => {
  await openDashboard(page);
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((violation) => violation.impact === "critical" || violation.impact === "serious")).toEqual([]);
});

test("measures the real asset transfer and browser render timing", async ({ page }) => {
  await openDashboard(page);
  const timing = await page.evaluate((path) => {
    const resources = performance.getEntriesByType("resource")
      .filter((entry) => new URL(entry.name).pathname.startsWith("/data/ashburton/"))
      .map((entry) => ({ path: new URL(entry.name).pathname, durationMs: Math.round(entry.duration), transferSize: (entry as PerformanceResourceTiming).transferSize }));
    const ready = performance.getEntriesByName("dashboard-runtime-ready")[0];
    return { resources, readyMs: ready ? Math.round(ready.duration) : null, shell: resources.find((entry) => entry.path === path) };
  }, assetPath);
  expect(timing.resources.length).toBeGreaterThanOrEqual(2);
  expect(timing.shell?.transferSize).toBeGreaterThan(0);
  expect(timing.readyMs).not.toBeNull();
  console.log(`runtime-performance ${JSON.stringify(timing)}`);
});

test("captures representative responsive views", async ({ page }) => {
  for (const [width, height, name] of [[1440, 900, "desktop"], [1024, 768, "compact"], [390, 844, "mobile"]] as const) {
    await page.setViewportSize({ width, height });
    await openDashboard(page);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    await page.screenshot({ path: `screenshots/ashburton-${name}.png`, fullPage: true });
  }
});
