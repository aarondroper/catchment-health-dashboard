import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";

const assetPath = "/data/ashburton/dashboard.json";
const basemapStyle = "https://tiles.openfreemap.org/styles/positron";

async function openDashboard(page: Page): Promise<"openfreemap" | "fallback"> {
  const assetResponse = page.waitForResponse((response) => response.url().endsWith(assetPath));
  await page.goto("/");
  expect((await assetResponse).status()).toBe(200);
  await expect(page.getByRole("heading", { name: "Controls" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Data notes", exact: true })).toBeVisible();
  const typography = await page.evaluate(async () => {
    await document.fonts.ready;
    return {
      family: getComputedStyle(document.body).fontFamily,
      sourceSansLoaded: document.fonts.check('400 14px "Source Sans 3"'),
      fontResources: performance.getEntriesByType("resource").filter((entry) => entry.name.includes("source-sans-3-latin") && entry.name.endsWith(".woff2")).length,
    };
  });
  expect(typography.family).toContain("Source Sans 3");
  expect(typography.sourceSansLoaded).toBe(true);
  expect(typography.fontResources).toBeGreaterThanOrEqual(4);
  await expect(page.locator(".eyebrow")).toHaveCount(0);
  await expect(page.getByText("Local data loaded")).toHaveCount(0);
  await expect(page.getByText("Data notes & provenance")).toHaveCount(0);
  await expect(page.getByText("Development sample")).toHaveCount(0);
  await expect(page.locator(".maplibregl-canvas")).toHaveCount(1);
  await expect(page.locator(".map-marker")).toHaveCount(19);
  await expect(page.getByText(/Verified Ashburton River boundary/)).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Reset view" })).toBeVisible();
  const serviceState = page.locator(".map-service-state");
  await expect(serviceState).toHaveText(/Context basemap loaded|Local map fallback/);
  const serviceStateVisibility = await serviceState.evaluate((element) => {
    const style = getComputedStyle(element);
    const box = element.getBoundingClientRect();
    return { clipped: style.clipPath.includes("inset"), width: box.width, height: box.height };
  });
  expect(serviceStateVisibility.clipped).toBe(true);
  expect(serviceStateVisibility.width).toBeLessThanOrEqual(1);
  expect(serviceStateVisibility.height).toBeLessThanOrEqual(1);
  await expect(page.locator(".maplibregl-ctrl-attrib")).toHaveCount(0);
  const attribution = page.locator("[data-testid=map-attribution]");
  await expect(attribution).toHaveCount(1);
  await expect(attribution).not.toHaveAttribute("open", "");
  const mapControlBoxes = await page.evaluate(() => {
    const rect = (selector: string) => {
      const element = document.querySelector<HTMLElement>(selector);
      if (!element) return null;
      const box = element.getBoundingClientRect();
      return { left: box.left, right: box.right, top: box.top, bottom: box.bottom };
    };
    return { reset: rect(".map-reset"), navigation: rect(".maplibregl-ctrl-top-right"), legend: rect(".map-legend"), attribution: rect("[data-testid=map-attribution]") };
  });
  expect(mapControlBoxes.reset).not.toBeNull();
  expect(mapControlBoxes.navigation).not.toBeNull();
  expect(mapControlBoxes.legend).not.toBeNull();
  expect(mapControlBoxes.attribution).not.toBeNull();
  const overlaps = (first: NonNullable<typeof mapControlBoxes.reset>, second: NonNullable<typeof mapControlBoxes.reset>) => first.left < second.right && first.right > second.left && first.top < second.bottom && first.bottom > second.top;
  expect(overlaps(mapControlBoxes.reset!, mapControlBoxes.navigation!)).toBe(false);
  expect(overlaps(mapControlBoxes.reset!, mapControlBoxes.legend!)).toBe(false);
  expect(overlaps(mapControlBoxes.legend!, mapControlBoxes.navigation!)).toBe(false);
  if ((page.viewportSize()?.width ?? 1440) > 760) await expect(page.locator('[data-testid="nz-inset-map"]')).toBeVisible();
  await expect(page.locator('[data-testid="nz-catchment-marker"]')).toHaveCount(1);
  await expect(page.locator(".nz-inset-label")).toContainText("Ashburton");
  if ((page.viewportSize()?.width ?? 1440) > 760) {
    const label = page.locator(".nz-inset-label");
    const inset = page.locator('[data-testid="nz-inset-map"]');
    await expect(label).toBeVisible();
    await expect(label).toHaveCSS("font-size", "11px");
    await expect(label).toHaveCSS("font-weight", "600");
    const lineDisplay = await page.locator(".nz-inset-label-line").evaluateAll((lines) => lines.map((line) => getComputedStyle(line).display));
    if ((page.viewportSize()?.width ?? 1440) <= 1100) expect(lineDisplay).toEqual(["block", "block"]);
    else expect(lineDisplay).toEqual(["inline", "inline"]);
    const labelBox = await label.boundingBox();
    const insetBox = await inset.boundingBox();
    expect(labelBox).not.toBeNull();
    expect(insetBox).not.toBeNull();
    expect(labelBox!.height).toBeGreaterThanOrEqual(12);
    expect(labelBox!.x).toBeGreaterThanOrEqual(insetBox!.x);
    expect(labelBox!.x + labelBox!.width).toBeLessThanOrEqual(insetBox!.x + insetBox!.width + 1);
  }
  return (await serviceState.textContent())?.includes("Context basemap loaded") ? "openfreemap" : "fallback";
}

async function chartLayout(page: Page) {
  return page.evaluate(() => {
    const frame = document.querySelector<HTMLElement>(".series-chart-frame");
    const chart = document.querySelector<SVGSVGElement>('[data-testid="history-chart"]');
    const plot = document.querySelector<SVGRectElement>('[data-testid="history-plot"]');
    if (!frame || !chart || !plot) return null;
    const frameBox = frame.getBoundingClientRect();
    const chartBox = chart.getBoundingClientRect();
    return {
      frameWidth: frameBox.width,
      chartWidth: chartBox.width,
      svgWidth: Number(chart.getAttribute("width")),
      plotWidth: Number(plot.getAttribute("width")),
    };
  });
}

async function waitForFullWidthChart(page: Page) {
  await expect.poll(async () => {
    const layout = await chartLayout(page);
    return Boolean(layout && layout.svgWidth >= layout.frameWidth - 3 && layout.plotWidth >= layout.frameWidth * 0.8);
  }, { timeout: 10_000 }).toBe(true);
  return (await chartLayout(page))!;
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
  await expect(page.getByRole("heading", { name: "Time series", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Selected site", exact: true })).toBeVisible();
  await expect(page.locator(".scope-metric strong")).toHaveText("0.82 mg/L");
  await expect(page.getByText(/Dated observations; the connecting line is a visual guide/)).toHaveCount(0);
  await expect(page.getByText("Inspect numeric points with keyboard", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Inspect complete observation detail" })).toHaveCount(0);
  await expect(page.locator(".chart-point title")).toHaveCount(0);
  expect(await page.locator('[data-testid="history-chart"] .chart-label').count()).toBeGreaterThanOrEqual(5);
  const point = page.locator(".chart-point").first();
  await point.hover();
  await expect(page.locator('[data-testid="chart-tooltip"]')).toContainText("mg/L");
  await expect(page.locator('[data-testid="chart-tooltip"]')).toContainText("Published observation");
});

test("uses restrained control icons and a tabular catchment summary", async ({ page }) => {
  await openDashboard(page);
  await expect(page.locator(".select-with-icon .control-icon")).toHaveCount(4);
  const controlLabels = page.locator(".rail-controls > label");
  await expect(controlLabels.nth(0)).toContainText("Parameter");
  await expect(controlLabels.nth(1)).toContainText("Monitoring period");
  await expect(controlLabels.nth(2)).toContainText("Monitoring site");
  await expect(controlLabels.nth(3)).toContainText("Map display");
  await expect(page.getByText("Sampled history", { exact: true })).toBeVisible();
  await expect(page.getByText("2007–2025", { exact: true })).toBeVisible();
  await expect(page.getByText(/published rows/)).toHaveCount(0);
});

test("fits the primary dashboard in desktop viewports without body scrolling", async ({ page }) => {
  for (const [width, height] of [[1440, 900], [1536, 864], [1920, 1080]] as const) {
    await page.setViewportSize({ width, height });
    await openDashboard(page);
    const dimensions = await page.evaluate(() => ({ scrollHeight: document.documentElement.scrollHeight, clientHeight: document.documentElement.clientHeight, scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }));
    expect(dimensions.scrollHeight - dimensions.clientHeight).toBeLessThanOrEqual(1);
    expect(dimensions.scrollWidth - dimensions.clientWidth).toBeLessThanOrEqual(1);
    const chartBox = await page.locator('[data-testid="history-chart"]').boundingBox();
    const plotBox = await page.locator('[data-testid="history-plot"]').boundingBox();
    const chartPanelBox = await page.locator('.chart-panel').boundingBox();
    const mapPanelBox = await page.locator('.map-panel').boundingBox();
    expect(chartBox).not.toBeNull();
    expect(plotBox).not.toBeNull();
    expect(chartBox!.height).toBeGreaterThan(150);
    expect(plotBox!.width).toBeGreaterThan(chartBox!.width * 0.8);
    expect(plotBox!.height).toBeGreaterThan(chartBox!.height * 0.65);
    console.log(`history-chart-layout ${JSON.stringify({ width, height, mapPanel: mapPanelBox, chartPanel: chartPanelBox, chart: chartBox, plot: plotBox })}`);
  }
});

test("keeps the history plot measured to its current frame through coordinated changes", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openDashboard(page);
  const measurements: Array<{ state: string; layout: Awaited<ReturnType<typeof chartLayout>> }> = [];
  measurements.push({ state: "initial", layout: await waitForFullWidthChart(page) });

  await page.getByRole("combobox", { name: "Monitoring site" }).selectOption("SQ20104");
  measurements.push({ state: "station control", layout: await waitForFullWidthChart(page) });

  const mapStation = page.locator(".map-marker-available:not(.map-marker-selected)").first();
  await mapStation.click({ force: true });
  await expect(page.getByRole("combobox", { name: "Monitoring site" })).not.toHaveValue("SQ20104");
  measurements.push({ state: "map station", layout: await waitForFullWidthChart(page) });

  await page.getByRole("combobox", { name: "Parameter" }).selectOption("nitrate_n_nitrite_n");
  await expect(page.locator(".chart-context")).toContainText("Nitrate-N Nitrite-N");
  measurements.push({ state: "parameter", layout: await waitForFullWidthChart(page) });

  await page.getByRole("combobox", { name: "Time period" }).selectOption("recent_2020_2025");
  measurements.push({ state: "period", layout: await waitForFullWidthChart(page) });

  await page.getByRole("combobox", { name: "Map display" }).selectOption("availability");
  measurements.push({ state: "map display", layout: await waitForFullWidthChart(page) });

  await page.getByRole("combobox", { name: "Parameter" }).selectOption("total_phosphorus");
  await page.getByRole("combobox", { name: "Parameter" }).selectOption("turbidity");
  await page.getByRole("combobox", { name: "Parameter" }).selectOption("total_nitrogen");
  await expect(page.locator(".chart-context")).toContainText("Total Nitrogen");
  measurements.push({ state: "rapid transitions", layout: await waitForFullWidthChart(page) });

  await page.setViewportSize({ width: 1536, height: 864 });
  measurements.push({ state: "resized", layout: await waitForFullWidthChart(page) });
  console.log(`history-chart-width-regression ${JSON.stringify(measurements)}`);
});

test("keeps chart tooltips in a viewport overlay at edge points and clears stale state", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openDashboard(page);
  const points = page.locator(".chart-point");
  await expect(points.first()).toBeVisible();
  const pointBoxes = await points.evaluateAll((elements) => elements.map((element) => {
    const box = element.getBoundingClientRect();
    return { x: box.x, y: box.y, right: box.right, bottom: box.bottom };
  }));
  const edgeIndices = [...new Set([
    pointBoxes.reduce((best, point, index, all) => point.x < all[best].x ? index : best, 0),
    pointBoxes.reduce((best, point, index, all) => point.right > all[best].right ? index : best, 0),
    pointBoxes.reduce((best, point, index, all) => point.y < all[best].y ? index : best, 0),
    pointBoxes.reduce((best, point, index, all) => point.bottom > all[best].bottom ? index : best, 0),
  ])];
  for (const index of edgeIndices) {
    await points.nth(index).hover();
    const tooltip = page.getByRole("tooltip");
    await expect(tooltip).toBeVisible();
    const box = await tooltip.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(1440);
    expect(box!.y + box!.height).toBeLessThanOrEqual(900);
    expect(await tooltip.evaluate((element) => ({ parent: element.parentElement?.tagName, position: getComputedStyle(element).position }))).toEqual({ parent: "BODY", position: "fixed" });
    if (index === edgeIndices[0]) await page.screenshot({ path: "screenshots/ashburton-tooltip-edge.png" });
  }

  await points.first().hover();
  await expect(page.getByRole("tooltip")).toBeVisible();
  await page.getByRole("combobox", { name: "Parameter" }).selectOption("nitrate_n_nitrite_n");
  await expect(page.getByRole("tooltip")).toHaveCount(0);
  await expect(page.locator(".chart-context")).toContainText("Nitrate-N Nitrite-N");
  await waitForFullWidthChart(page);
  await page.locator(".chart-point").first().focus();
  await expect(page.getByRole("tooltip")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("tooltip")).toHaveCount(0);
});

test("presents comparison values as a sorted interval plot and keeps exact inspection later", async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await openDashboard(page);
  await expect(page.locator(".comparison-plot")).toBeVisible();
  await expect(page.locator(".comparison-row").first()).toBeVisible();
  await expect(page.locator(".comparison-row-selected")).toHaveCount(1);
  await expect(page.getByRole("heading", { name: "Site comparison", exact: true })).toBeVisible();
  await expect(page.locator("#comparison-description")).toHaveText(/Sites are ordered from lowest to highest median/);
  await expect(page.locator(".comparison-panel .panel-intro")).toHaveCount(0);
  await page.locator(".comparison-details summary").click();
  await expect(page.locator(".comparison-details .comparison-table")).toBeVisible();
});

test("uses a readable ranked comparison at compact desktop height", async ({ page }) => {
  await page.setViewportSize({ width: 1536, height: 864 });
  await openDashboard(page);
  await expect(page.locator(".comparison-plot")).toBeHidden();
  await expect(page.locator(".comparison-compact")).toBeVisible();
  await expect(page.getByText(/Compact ranked view · 3 of .* supported sites/)).toBeVisible();
  await expect(page.locator(".comparison-compact-row:visible")).toHaveCount(3);
  await expect(page.locator(".comparison-compact-row-selected")).toBeVisible();
  await page.locator(".comparison-details summary").click();
  await expect(page.locator(".comparison-details .comparison-table")).toBeVisible();
});

test("coordinates parameter, time period, and map display changes", async ({ page }) => {
  await openDashboard(page);
  const parameter = page.getByRole("combobox", { name: "Parameter" });
  const period = page.getByRole("combobox", { name: "Time period" });
  const mapDisplay = page.getByRole("combobox", { name: "Map display" });
  await parameter.selectOption("nitrate_n_nitrite_n");
  await expect(page.locator(".chart-context")).toContainText("Nitrate-N Nitrite-N");
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
  await expect(page.getByText(/Local analytical data is unavailable/).first()).toContainText(/development sample/i);
});

test("exports selected and all-site filtered records as deterministic UTF-8 CSV", async ({ page }) => {
  await openDashboard(page);
  await page.getByRole("button", { name: "Export data (CSV)" }).click();
  const dialog = page.getByRole("dialog", { name: "Export data (CSV)" });
  await expect(dialog).toBeVisible();
  const scope = dialog.getByRole("combobox", { name: "Export scope" });
  const downloadPromise = page.waitForEvent("download");
  await dialog.getByRole("button", { name: "Download CSV" }).click();
  const selectedDownload = await downloadPromise;
  expect(selectedDownload.suggestedFilename()).toMatch(/ashburton-hakatere-catchment_total-nitrogen_primary-2016-2025_station-sq35874/);
  const selectedPath = await selectedDownload.path();
  const selectedCsv = await readFile(selectedPath!, "utf8");
  expect(selectedCsv).toContain("station_name,source_station_id,parameter,timestamp");
  expect(selectedCsv).toContain("quality_representation");
  const selectedRows = selectedCsv.trimEnd().split("\r\n").length;
  await page.getByRole("button", { name: "Export data (CSV)" }).click();
  const allDialog = page.getByRole("dialog", { name: "Export data (CSV)" });
  const allScope = allDialog.getByRole("combobox", { name: "Export scope" });
  await allScope.selectOption("all_sites");
  const allDownloadPromise = page.waitForEvent("download");
  await allDialog.getByRole("button", { name: "Download CSV" }).click();
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
  await page.getByRole("button", { name: "Export data (CSV)" }).click();
  const dialog = page.getByRole("dialog", { name: "Export data (CSV)" });
  const downloadPromise = page.waitForEvent("download");
  await dialog.getByRole("button", { name: "Download CSV" }).click();
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
  await expect(page.locator(".maplibregl-ctrl-attrib")).toHaveCount(0);
  const attribution = page.locator("[data-testid=map-attribution]");
  await expect(attribution).not.toHaveAttribute("open", "");
  await attribution.locator("summary").click();
  await expect(attribution).toHaveAttribute("open", "");
  await expect(attribution).toContainText("Local context fallback; no remote basemap was loaded.");
  await expect(attribution.getByRole("link", { name: "OpenFreeMap" })).toHaveCount(0);
  await expect(attribution.getByRole("link", { name: "Environment Canterbury monitoring sites" })).toBeVisible();
});

test("provides one keyboard-operable, complete collapsed attribution control", async ({ page }) => {
  for (const [width, height] of [[1440, 900], [1536, 864], [1920, 1080], [1024, 768], [390, 844]] as const) {
    await page.setViewportSize({ width, height });
    const context = await openDashboard(page);
    const attribution = page.locator("[data-testid=map-attribution]");
    const summary = attribution.locator("summary");
    await expect(summary).toHaveText("Map sources");
    await summary.focus();
    await page.keyboard.press("Enter");
    await expect(attribution).toHaveAttribute("open", "");
    if (context === "openfreemap") {
      await expect(attribution.getByRole("link", { name: "OpenFreeMap" })).toBeVisible();
      await expect(attribution.getByRole("link", { name: "OpenMapTiles" })).toBeVisible();
      await expect(attribution.getByRole("link", { name: /OpenStreetMap contributors/ })).toBeVisible();
    } else {
      await expect(attribution).toContainText("Local context fallback; no remote basemap was loaded.");
      await expect(attribution.getByRole("link", { name: "OpenFreeMap" })).toHaveCount(0);
    }
    await expect(attribution.getByRole("link", { name: "Environment Canterbury monitoring sites" })).toBeVisible();
    await expect(attribution.getByRole("link", { name: "Major Catchment Boundaries" })).toBeVisible();
    const panel = attribution.locator(".map-attribution-content");
    const frameBox = await page.locator(".map-frame").boundingBox();
    const panelBox = await panel.boundingBox();
    expect(frameBox).not.toBeNull();
    expect(panelBox).not.toBeNull();
    expect(panelBox!.x).toBeGreaterThanOrEqual(frameBox!.x);
    expect(panelBox!.x + panelBox!.width).toBeLessThanOrEqual(frameBox!.x + frameBox!.width + 1);
    expect(panelBox!.y).toBeGreaterThanOrEqual(frameBox!.y);
  }
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
  for (const [width, height, name] of [[1440, 900, "desktop"], [1536, 864, "wide"], [1920, 1080, "ultrawide"], [1024, 768, "compact"], [390, 844, "mobile"]] as const) {
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
