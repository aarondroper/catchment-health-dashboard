import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";

const assetPath = "/data/ashburton/dashboard.json";
const basemapStyle = "https://tiles.openfreemap.org/styles/positron";

async function openDashboard(page: Page) {
  const assetResponse = page.waitForResponse((response) => response.url().endsWith(assetPath));
  await page.goto("/");
  expect((await assetResponse).status()).toBe(200);
  await expect(page.getByRole("heading", { name: "Monitoring view" })).toBeVisible();
  await expect(page.getByText("Local data loaded")).toBeVisible();
  await expect(page.getByText("Development sample")).toHaveCount(0);
  await expect(page.locator(".maplibregl-canvas")).toHaveCount(1);
  await expect(page.locator(".map-marker")).toHaveCount(19);
  await expect(page.getByText(/Verified Ashburton River boundary/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Reset view" })).toBeVisible();
  await expect(page.locator(".map-service-state")).toHaveText(/Context basemap loaded|Local map fallback/);
}

test("loads real data, contextual basemap, and production-only visitor requests", async ({ page }) => {
  const consoleErrors: string[] = [];
  const consoleWarnings: string[] = [];
  const pageErrors: string[] = [];
  const failedRequests: string[] = [];
  const ecanRequests: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
    if (message.type() === "warning" && !message.text().includes("GL Driver Message (OpenGL, Performance, GL_CLOSE_PATH_NV")) consoleWarnings.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("requestfailed", (request) => failedRequests.push(`${request.method()} ${request.url()}`));
  page.on("request", (request) => {
    if (request.url().includes("ecan.govt.nz") || request.url().includes("wateruse.ecan.govt.nz")) ecanRequests.push(request.url());
  });
  await openDashboard(page);
  expect(consoleErrors).toEqual([]);
  expect(consoleWarnings).toEqual([]);
  expect(pageErrors).toEqual([]);
  expect(failedRequests.filter((request) => !request.includes("openfreemap.org"))).toEqual([]);
  expect(ecanRequests).toEqual([]);
});

test("lands on a representative coverage-led default", async ({ page }) => {
  await openDashboard(page);
  await expect(page.getByRole("combobox", { name: "Parameter" })).toHaveValue("total_nitrogen");
  await expect(page.getByRole("combobox", { name: "Monitoring site" })).toHaveValue("SQ35874");
  await expect(page.getByText("Selected scope", { exact: true })).toBeVisible();
  await expect(page.locator(".scope-metric strong")).toHaveText("0.82 mg/L");
  await expect(page.getByText(/Linear scale; all eligible numeric values are shown/)).toBeVisible();
});

test("fits the primary dashboard in desktop viewports without body scrolling", async ({ page }) => {
  for (const [width, height] of [[1440, 900], [1536, 864], [1920, 1080]] as const) {
    await page.setViewportSize({ width, height });
    await openDashboard(page);
    const dimensions = await page.evaluate(() => ({ scrollHeight: document.documentElement.scrollHeight, clientHeight: document.documentElement.clientHeight, scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }));
    expect(dimensions.scrollHeight - dimensions.clientHeight).toBeLessThanOrEqual(1);
    expect(dimensions.scrollWidth - dimensions.clientWidth).toBeLessThanOrEqual(1);
  }
});

test("presents comparison values as a sorted interval plot and keeps exact inspection later", async ({ page }) => {
  await openDashboard(page);
  await expect(page.locator(".comparison-plot")).toBeVisible();
  await expect(page.locator(".comparison-row").first()).toBeVisible();
  await expect(page.locator(".comparison-row-selected")).toHaveCount(1);
  await expect(page.getByText(/Sites are ordered from lowest to highest median/)).toBeVisible();
  await page.getByText("Inspect exact site values").click();
  await expect(page.locator(".comparison-details .comparison-table")).toBeVisible();
});

test("coordinates parameter, time period, and map display changes", async ({ page }) => {
  await openDashboard(page);
  const parameter = page.getByRole("combobox", { name: "Parameter" });
  const period = page.getByRole("combobox", { name: "Time period" });
  const mapDisplay = page.getByRole("combobox", { name: "Map display" });
  await parameter.selectOption("nitrate_n_nitrite_n");
  await expect(page.getByRole("heading", { name: "Nitrate-N Nitrite-N" })).toBeVisible();
  await expect(page.locator(".scope-metric strong")).toHaveText("0.74 mg/L");
  await period.selectOption("recent_2020_2025");
  await expect(page.locator(".scope-metric strong")).toHaveText("0.76 mg/L");
  await mapDisplay.selectOption("availability");
  await expect(page.getByText("Data availability in the selected parameter and period")).toBeVisible();
  await mapDisplay.selectOption("trend");
  await expect(page.getByText("Supported trend direction · neutral terminology")).toBeVisible();
});

test("coordinates station control and map selection, including no-data state", async ({ page }) => {
  await openDashboard(page);
  const station = page.getByRole("combobox", { name: "Monitoring site" });
  const emptyPin = page.locator(".map-marker-unavailable").first();
  await emptyPin.click();
  await expect(page.getByText("No observations are available for this parameter and station in the selected period.")).toBeVisible();
  const selectedId = await emptyPin.getAttribute("data-station-id");
  expect(selectedId).toBeTruthy();
  await expect(station).toHaveValue(selectedId!);
  await expect(emptyPin).toHaveAttribute("aria-pressed", "true");
});

test("keeps censored observations and indeterminate reasons explicit in the detail surface", async ({ page }) => {
  await openDashboard(page);
  await page.getByRole("combobox", { name: "Parameter" }).selectOption("e_coli");
  await page.getByRole("combobox", { name: "Monitoring site" }).selectOption("SQ20104");
  await expect(page.getByText(/Indeterminate ·/)).toBeVisible();
  await page.getByRole("button", { name: "View all →" }).click();
  await expect(page.getByRole("dialog", { name: "Recorded observations" })).toContainText("Censored");
  await expect(page.getByRole("dialog")).toContainText("Censored — reporting limit retained");
});

test("shows a supported neutral trend without health-signalling colour", async ({ page }) => {
  await openDashboard(page);
  await page.getByRole("combobox", { name: "Parameter" }).selectOption("turbidity");
  await page.getByRole("combobox", { name: "Monitoring site" }).selectOption("SQ35874");
  await expect(page.getByText("decreasing", { exact: true })).toBeVisible();
  await expect(page.getByText(/Directional evidence is not a health/)).toBeVisible();
  await expect(page.locator(".trend-direction")).toHaveCSS("color", "rgb(16, 42, 67)");
});

test("reports fixture fallback when the local asset fails", async ({ page }) => {
  await page.route(`**${assetPath}`, (route) => route.fulfill({ status: 404, body: "missing" }));
  await page.goto("/");
  await expect(page.getByText(/Local analytical data is unavailable/)).toBeVisible();
  await expect(page.getByLabel("Data loading status")).toHaveText(/Development sample/);
});

test("exports selected and all-site filtered records as deterministic UTF-8 CSV", async ({ page }) => {
  await openDashboard(page);
  const scope = page.getByRole("combobox", { name: "Export scope" });
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export CSV" }).click();
  const selectedDownload = await downloadPromise;
  expect(selectedDownload.suggestedFilename()).toMatch(/ashburton-hakatere-catchment_total-nitrogen_primary-2016-2025_station-sq35874/);
  const selectedPath = await selectedDownload.path();
  const selectedCsv = await readFile(selectedPath!, "utf8");
  expect(selectedCsv).toContain("station_name,source_station_id,parameter,timestamp");
  expect(selectedCsv).toContain("quality_representation");
  const selectedRows = selectedCsv.trimEnd().split("\r\n").length;
  await scope.selectOption("all_sites");
  const allDownloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export CSV" }).click();
  const allDownload = await allDownloadPromise;
  expect(allDownload.suggestedFilename()).toContain("_all-sites.csv");
  const allPath = await allDownload.path();
  const allCsv = await readFile(allPath!, "utf8");
  expect(allCsv.trimEnd().split("\r\n").length).toBeGreaterThan(selectedRows);
  expect(allCsv).toContain("Total Nitrogen");
});

test("exports a deliberate header-only file for a no-data station", async ({ page }) => {
  await openDashboard(page);
  await page.locator(".map-marker-unavailable").first().click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export CSV" }).click();
  const download = await downloadPromise;
  const path = await download.path();
  const csv = await readFile(path!, "utf8");
  expect(csv.trimEnd().split("\r\n")).toHaveLength(5);
  await expect(page.getByText(/0 records exported/)).toBeVisible();
});

test("keeps station selection keyboard-operable and observation detail modal accessible", async ({ page }) => {
  await openDashboard(page);
  const station = page.getByRole("combobox", { name: "Monitoring site" });
  const initialStation = await station.inputValue();
  await station.focus();
  await station.press("ArrowDown");
  expect(await station.inputValue()).not.toBe(initialStation);
  const marker = page.locator(".map-marker-unavailable").first();
  const markerId = await marker.getAttribute("data-station-id");
  await marker.focus();
  await marker.press("Enter");
  await expect(station).toHaveValue(markerId!);
  await page.getByRole("button", { name: "View all →" }).click();
  await expect(page.getByRole("dialog", { name: "Recorded observations" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Close Recorded observations" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Recorded observations" })).toHaveCount(0);
});

test("keeps technical context behind Data notes", async ({ page }) => {
  await openDashboard(page);
  await page.getByRole("button", { name: "Data notes", exact: true }).click();
  const notes = page.getByRole("dialog", { name: "Data notes and provenance" });
  await expect(notes).toContainText("published_unflagged");
  await expect(notes).toContainText("analytical version");
  await expect(notes).toContainText("CC BY 4.0");
  await expect(notes).toContainText("OpenFreeMap");
});

test("uses local geometry when the contextual basemap fails", async ({ page }) => {
  await page.route("**tiles.openfreemap.org/**", (route) => route.abort());
  await openDashboard(page);
  await expect(page.locator(".map-service-state")).toHaveText("Local map fallback");
  await expect(page.locator(".map-marker")).toHaveCount(19);
  await expect(page.locator(".map-boundary-fallback")).toHaveCount(1);
  await expect(page.getByText(/verified catchment boundary/i)).toBeVisible();
});

test("has no serious accessibility violations in the real-data view", async ({ page }) => {
  await openDashboard(page);
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((violation) => violation.impact === "critical" || violation.impact === "serious")).toEqual([]);
});

test("measures real asset and basemap resources without visitor ECan calls", async ({ page }) => {
  const ecanRequests: string[] = [];
  page.on("request", (request) => { if (request.url().includes("ecan.govt.nz") || request.url().includes("wateruse.ecan.govt.nz")) ecanRequests.push(request.url()); });
  await openDashboard(page);
  const timing = await page.evaluate((path) => {
    const resources = performance.getEntriesByType("resource").filter((entry) => new URL(entry.name).pathname.startsWith("/data/ashburton/") || entry.name.startsWith("https://tiles.openfreemap.org/")).map((entry) => ({ path: entry.name, durationMs: Math.round(entry.duration), transferSize: (entry as PerformanceResourceTiming).transferSize }));
    const ready = performance.getEntriesByName("dashboard-runtime-ready")[0];
    return { resources, readyMs: ready ? Math.round(ready.duration) : null, shell: resources.find((entry) => entry.path.endsWith(path)) };
  }, assetPath);
  expect(timing.resources.length).toBeGreaterThanOrEqual(2);
  expect(timing.shell?.transferSize).toBeGreaterThan(0);
  expect(timing.readyMs).not.toBeNull();
  expect(ecanRequests).toEqual([]);
  console.log(`runtime-performance ${JSON.stringify(timing)}`);
});

test("captures owner-review viewports without horizontal overflow", async ({ page }) => {
  for (const [width, height, name] of [[1440, 900, "desktop"], [1536, 864, "wide"], [1024, 768, "compact"], [390, 844, "mobile"]] as const) {
    await page.setViewportSize({ width, height });
    await openDashboard(page);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    if (width >= 1440) {
      const verticalOverflow = await page.evaluate(() => document.documentElement.scrollHeight - document.documentElement.clientHeight);
      expect(verticalOverflow).toBeLessThanOrEqual(1);
    }
    await page.screenshot({ path: `screenshots/ashburton-${name}.png`, fullPage: true });
  }
});
