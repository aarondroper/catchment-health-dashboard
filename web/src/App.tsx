import { useEffect, useMemo, useRef, useState } from "react";
import { MapPanel, type MapDisplayMode, type MapDisplayRow } from "./components/MapPanel";
import { SeriesChart } from "./components/SeriesChart";
import { ObservationTable } from "./components/ObservationTable";
import { ComparisonPanel } from "./components/ComparisonPanel";
import { analyticalFixture } from "./data/analyticalFixture";
import { loadAnalyticalAsset, loadObservationPartition } from "./data/loadAsset";
import { buildObservationCsv, downloadObservationCsv, exportFilename } from "./data/exportCsv";
import { selectCoverage, selectParameterWindowObservations, selectSummary, selectTrend, selectWindowObservations } from "./data/selectors";
import type { AnalyticalAsset, AnalyticalWindow, ParameterOption, Station } from "./contracts";

const DEFAULT_PARAMETER_ID = "total_nitrogen";
const DEFAULT_STATION_ID = "SQ35874";

const windows: readonly { value: AnalyticalWindow; label: string }[] = [
  { value: "primary_2016_2025", label: "2016–2025" },
  { value: "recent_2020_2025", label: "2020–2025 recent" },
  { value: "history_2007_2025", label: "2007–2025 full history" },
];

function windowLabel(value: AnalyticalWindow): string {
  return windows.find((item) => item.value === value)?.label ?? value;
}

function stationName(station: Station | undefined): string {
  return station?.name && station.name !== station.stationId ? station.name : `Monitoring station ${station?.stationId ?? "—"}`;
}

function stationOptionLabel(station: Station): string {
  return station.name && station.name !== station.stationId ? `${station.name} · ${station.stationId}` : `Monitoring station ${station.stationId}`;
}

function reasonLabel(reason: string | null): string {
  return (reason ?? "not available").replaceAll("_", " ");
}

function statusLabel(status: "reported" | "indeterminate" | "unavailable" | undefined): string {
  if (status === "reported") return "Reported";
  if (status === "indeterminate") return "Indeterminate";
  return "Unavailable";
}

function displayNumber(value: number | null, unit: string | null): string {
  return value === null ? "Not reported" : `${value.toLocaleString(undefined, { maximumFractionDigits: 4 })} ${unit ?? ""}`.trim();
}

function preferredParameter(asset: AnalyticalAsset): ParameterOption {
  return asset.parameters.find((item) => item.parameterId === DEFAULT_PARAMETER_ID)
    ?? asset.parameters.find((item) => item.selectionStatus === "core")
    ?? asset.parameters[0];
}

function preferredStation(asset: AnalyticalAsset, parameterId: string): Station | undefined {
  const preferred = asset.stations.find((item) => item.stationId === DEFAULT_STATION_ID);
  if (preferred && asset.coverage.some((row) => row.station_id === preferred.stationId && row.parameter_id === parameterId && row.window === "primary_2016_2025" && row.raw_count > 0)) return preferred;
  return asset.stations.find((item) => asset.coverage.some((row) => row.station_id === item.stationId && row.parameter_id === parameterId && row.window === "primary_2016_2025" && row.raw_count > 0)) ?? asset.stations[0];
}

function formatRecentResult(result: string | null, value: number | null, censoring: string | null): string {
  if (result) return result;
  if (value !== null) return value.toLocaleString(undefined, { maximumFractionDigits: 4 });
  return censoring ? "Censored" : "Missing";
}

type DetailSurface = "observations" | "notes" | null;

function DataNotes({ asset, parameter, window, qualityCounts }: { asset: AnalyticalAsset; parameter: ParameterOption; window: AnalyticalWindow; qualityCounts: Record<string, number> }) {
  return <div className="notes-grid">
    <div><p className="eyebrow">Reading the evidence</p><h2>Quality and interpretation</h2><p><strong>Published observation; no source quality code supplied</strong> describes returned observations without a quality field. They are usable for this exploratory dashboard but are not explicitly verified, QC600, or “good.” Quality-coded, censored, excluded, and missing states remain distinguishable in the detail surface and export.</p><p>Processing policy: <code>published_unflagged</code>; strict eligibility is retained as a sensitivity mode.</p><p className="notes-counts">Selected records: {Object.entries(qualityCounts).map(([key, value]) => `${key.replaceAll("_", " ")} (${value})`).join(" · ") || "none"}.</p></div>
    <div><p className="eyebrow">Source and method</p><h2>Provenance</h2><p>Environment Canterbury public water-quality service · 2007–2025 sampled history · current view {windowLabel(window)}. Medians, middle-half ranges, and neutral trends appear only where the documented coverage and censoring rules support them. This is not continuous monitoring and does not represent unmonitored parts of the catchment.</p><p><a href="https://www.ecan.govt.nz/data/water-quality-data" target="_blank" rel="noreferrer">Water-quality data source</a> · <a href="https://www.ecan.govt.nz/data/document/download?uri=3957205" target="_blank" rel="noreferrer">water-quality Terms of Use</a> · <a href="https://data.ecan.govt.nz/Catalogue/Agreement?AgreementFile=Agreement.htm&amp;AgreementRequirements=General" target="_blank" rel="noreferrer">general ECan open-data agreement</a>.</p><p>Local build {asset.buildId ?? "development fixture"} · analytical version {asset.analyticalVersion} · source retrieval {asset.sourceRetrievedAt ?? "development fixture"}.</p></div>
    <div><p className="eyebrow">Release context</p><h2>Data notes</h2><p>This work uses material sourced from Water Quality Data, which is licensed under a Creative Commons Attribution 4.0 International licence by Environment Canterbury.</p><p>Water Quality Data is reused under the dataset-specific CC BY 4.0 terms with attribution and accompanying terms. The local build applies a 120-day freshness gate. No ECan branding, regulatory compliance claim, causal explanation, threshold, or composite score is presented.</p><p className="map-source-note">Basemap: OpenFreeMap · OpenMapTiles · OpenStreetMap. The map uses a no-key public vector style and falls back to the verified local catchment geometry if that service is unavailable.</p><p>Selected parameter: {parameter.displayName} ({parameter.unit ?? "unit pending"}).</p></div>
  </div>;
}

function SurfaceDialog({ title, onClose, children, closeRef }: { title: string; onClose: () => void; children: React.ReactNode; closeRef: React.RefObject<HTMLButtonElement | null> }) {
  return <div className="surface-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="surface-dialog" role="dialog" aria-modal="true" aria-labelledby="surface-title"><div className="surface-dialog-header"><div><p className="eyebrow">Details</p><h2 id="surface-title">{title}</h2></div><button ref={closeRef} className="icon-button" type="button" onClick={onClose} aria-label={`Close ${title}`}>×</button></div><div className="surface-dialog-body">{children}</div></section></div>;
}

export function App() {
  const [asset, setAsset] = useState<AnalyticalAsset>(analyticalFixture);
  const [assetMode, setAssetMode] = useState<"loading" | "real" | "fixture">("loading");
  const [assetError, setAssetError] = useState<string | null>(null);
  const [partitionError, setPartitionError] = useState<string | null>(null);
  const [observations, setObservations] = useState(analyticalFixture.observations);
  const [observationsParameterId, setObservationsParameterId] = useState(analyticalFixture.parameters[0].parameterId);
  const [observationsLoading, setObservationsLoading] = useState(false);
  const [parameterId, setParameterId] = useState(analyticalFixture.parameters[0].parameterId);
  const [window, setWindow] = useState<AnalyticalWindow>("primary_2016_2025");
  const [stationId, setStationId] = useState(analyticalFixture.stations[0].stationId);
  const [mapDisplayMode, setMapDisplayMode] = useState<MapDisplayMode>("median");
  const [exportScope, setExportScope] = useState<"station" | "all_sites">("station");
  const [exportStatus, setExportStatus] = useState("");
  const [detailSurface, setDetailSurface] = useState<DetailSurface>(null);
  const [basemapStatus, setBasemapStatus] = useState<"loading" | "openfreemap" | "fallback">("loading");
  const dialogCloseRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let cancelled = false;
    loadAnalyticalAsset(DEFAULT_PARAMETER_ID)
      .then((loaded) => {
        if (cancelled) return;
        const firstParameter = preferredParameter(loaded);
        const firstStation = preferredStation(loaded, firstParameter.parameterId);
        setAsset(loaded);
        setParameterId(firstParameter.parameterId);
        setStationId(firstStation?.stationId ?? "");
        setObservations(loaded.observations);
        setObservationsParameterId(firstParameter.parameterId);
        setAssetMode("real");
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setAssetError(error instanceof Error ? error.message : "Local analytical asset unavailable");
        setAssetMode("fixture");
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (assetMode !== "real" || parameterId === observationsParameterId) return undefined;
    let cancelled = false;
    setObservationsLoading(true);
    setPartitionError(null);
    setExportStatus("");
    loadObservationPartition(asset, parameterId)
      .then((loadedObservations) => {
        if (cancelled) return;
        setObservations(loadedObservations);
        setObservationsParameterId(parameterId);
        setObservationsLoading(false);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setObservations([]);
        setObservationsParameterId(parameterId);
        setPartitionError(error instanceof Error ? error.message : "Observation partition unavailable");
        setObservationsLoading(false);
      });
    return () => { cancelled = true; };
  }, [asset, assetMode, observationsParameterId, parameterId]);

  useEffect(() => {
    if (!detailSurface) return undefined;
    dialogCloseRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setDetailSurface(null); };
    globalThis.window.addEventListener("keydown", onKeyDown);
    return () => globalThis.window.removeEventListener("keydown", onKeyDown);
  }, [detailSurface]);

  const parameter = asset.parameters.find((item) => item.parameterId === parameterId) ?? asset.parameters[0];
  const station = asset.stations.find((item) => item.stationId === stationId) ?? asset.stations[0];
  const parameterObservations = observationsParameterId === parameter.parameterId ? observations : [];
  const selectedObservations = station ? selectWindowObservations(parameterObservations, station.stationId, window) : [];
  const summary = station ? selectSummary(asset, parameter.parameterId, station.stationId, window) : undefined;
  const trend = station ? selectTrend(asset, parameter.parameterId, station.stationId, window) : undefined;
  const coverage = station ? selectCoverage(asset, parameter.parameterId, station.stationId, window) : undefined;
  const comparison = useMemo(() => asset.summaries.filter((row) => row.parameterId === parameter.parameterId && row.period === window && row.status === "reported"), [asset.summaries, parameter.parameterId, window]);
  const qualityCounts = useMemo(() => selectedObservations.reduce<Record<string, number>>((counts, row) => { counts[row.qualityDisposition] = (counts[row.qualityDisposition] ?? 0) + 1; return counts; }, {}), [selectedObservations]);
  const exportObservations = useMemo(() => { const inWindow = selectParameterWindowObservations(parameterObservations, window); return exportScope === "all_sites" ? inWindow : inWindow.filter((row) => row.stationId === station?.stationId); }, [exportScope, parameterObservations, station?.stationId, window]);
  const hasData = (candidateStationId: string) => asset.coverage.some((row) => row.station_id === candidateStationId && row.parameter_id === parameter.parameterId && row.window === window && row.raw_count > 0);
  const parameterSiteCount = asset.stations.filter((candidate) => hasData(candidate.stationId)).length;
  const mapValues = comparison.map((row) => row.value).filter((value): value is number => value !== null);
  const mapMin = Math.min(...mapValues, 0);
  const mapMax = Math.max(...mapValues, 1);
  const mapRows: MapDisplayRow[] = asset.stations.map((candidate) => {
    const candidateSummary = asset.summaries.find((row) => row.stationId === candidate.stationId && row.parameterId === parameter.parameterId && row.period === window && row.status === "reported");
    const candidateTrend = asset.trends.find((row) => row.stationId === candidate.stationId && row.parameterId === parameter.parameterId && row.period === window);
    const candidateCoverage = asset.coverage.find((row) => row.station_id === candidate.stationId && row.parameter_id === parameter.parameterId && row.window === window);
    const value = candidateSummary?.value ?? null;
    const normalized = value === null || mapMax === mapMin ? 0.5 : (value - mapMin) / (mapMax - mapMin);
    const band = value === null ? null : normalized < 0.34 ? "lower" : normalized < 0.67 ? "middle" : "upper";
    return { stationId: candidate.stationId, available: Boolean(candidateCoverage?.raw_count), median: value, band, trendDirection: candidateTrend?.status === "reported" ? candidateTrend.direction : "indeterminate", coverageCount: candidateCoverage?.raw_count ?? 0 };
  });

  function handleExport() {
    const csv = buildObservationCsv(exportObservations, asset.stations, parameter);
    const filename = exportFilename(asset.studyAreaName, parameter, window, exportScope, station?.stationId);
    downloadObservationCsv(csv, filename);
    setExportStatus(`${exportObservations.length.toLocaleString()} record${exportObservations.length === 1 ? "" : "s"} exported`);
  }

  const statusText = assetMode === "real" ? "Local data loaded" : assetMode === "loading" ? "Loading local data…" : "Development sample";
  const recentObservations = [...selectedObservations].sort((a, b) => b.observedAt.localeCompare(a.observedAt)).slice(0, 5);

  return <main className="app-shell">
    <header className="app-header">
      <div className="header-identity"><span className="brand-mark" aria-hidden="true"><i /><i /></span><div><p className="product-name">Catchment Health Dashboard</p><p className="catchment-name">Ashburton–Hakatere <span>·</span> freshwater monitoring</p></div></div>
      <div className="header-actions"><span className={`data-status data-status-${assetMode}`} aria-label="Data loading status"><span className="build-dot" aria-hidden="true" />{statusText}</span><button className="header-link" type="button" onClick={() => setDetailSurface("notes")}>Data notes</button></div>
    </header>

    {assetError && <p className="notice notice-warning" role="status">Local analytical data is unavailable; this view is showing a development sample. Prepare the local asset first. ({assetError})</p>}
    {partitionError && <p className="notice notice-warning" role="alert">The selected parameter detail could not be loaded. Summary information remains available, but observation detail and export are unavailable. ({partitionError})</p>}

    <div className="dashboard-workspace">
      <aside className="control-rail" aria-label="Dashboard controls and catchment context">
        <section className="rail-section rail-controls" aria-labelledby="controls-title"><div className="rail-heading"><p className="eyebrow">Explore</p><h1 id="controls-title">Monitoring view</h1></div><label>Parameter<select aria-label="Parameter" value={parameter.parameterId} onChange={(event) => setParameterId(event.target.value)}>{asset.parameters.map((item) => <option key={item.parameterId} value={item.parameterId}>{item.displayName}</option>)}</select></label><label>Monitoring period<select aria-label="Time period" value={window} onChange={(event) => setWindow(event.target.value as AnalyticalWindow)}>{windows.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label><label>Monitoring site<select aria-label="Monitoring site" value={station?.stationId ?? ""} onChange={(event) => setStationId(event.target.value)}>{asset.stations.map((item) => <option key={item.stationId} value={item.stationId}>{stationOptionLabel(item)}</option>)}</select></label><label>Map display<select aria-label="Map display" value={mapDisplayMode} onChange={(event) => setMapDisplayMode(event.target.value as MapDisplayMode)}><option value="availability">Data availability</option><option value="median">Selected-window median</option><option value="trend">Supported trend direction</option></select></label><div className="rail-actions"><label>Export scope<select aria-label="Export scope" value={exportScope} onChange={(event) => setExportScope(event.target.value as "station" | "all_sites")}><option value="station">Selected site</option><option value="all_sites">All applicable sites</option></select></label><button className="export-button" type="button" onClick={handleExport} disabled={observationsLoading}>Export CSV</button><span className="export-status" role="status" aria-live="polite">{observationsLoading ? "Loading detail…" : exportStatus}</span></div></section>
        <section className="rail-section glance-section" aria-labelledby="glance-title"><p className="eyebrow">Catchment at a glance</p><h2 id="glance-title">Ashburton–Hakatere</h2><dl className="glance-list"><div><dt>Reconciled sites</dt><dd>{asset.stations.length}</dd></div><div><dt>Sites with {parameter.displayName}</dt><dd>{parameterSiteCount}</dd></div><div><dt>Core parameters</dt><dd>6</dd></div><div><dt>Recorded observations</dt><dd>{asset.counts.normalized_observations?.toLocaleString() ?? "—"}</dd></div></dl><p className="rail-note">{asset.counts.normalized_observations?.toLocaleString() ?? "—"} published rows · sampled history 2007–2025.</p></section>
        <section className="rail-section rail-status" aria-label="Map legend and source status"><p className="eyebrow">Map context</p><div className="basemap-status"><span className={`status-dot status-dot-${basemapStatus}`} />{basemapStatus === "openfreemap" ? "Context basemap loaded" : basemapStatus === "fallback" ? "Local map fallback" : "Loading map context"}</div><p className="rail-note">{basemapStatus === "fallback" ? "The verified catchment boundary and stations remain usable; contextual tiles were unavailable." : "OpenFreeMap vector context · attribution shown on map."}</p><button type="button" className="text-button" onClick={() => setDetailSurface("notes")}>About data, methods, and licences →</button></section>
      </aside>

      <section className="primary-column" aria-label="Map and selected-site history">
        <MapPanel stations={asset.stations} selectedStationId={station?.stationId ?? ""} selectedStationName={stationName(station)} catchmentGeometry={asset.catchmentGeometry} hasData={hasData} displayMode={mapDisplayMode} displayRows={mapRows} unit={parameter.unit} onBasemapStatus={setBasemapStatus} onSelectStation={setStationId} />
        <SeriesChart observations={selectedObservations} unit={parameter.unit} stationName={stationName(station)} parameterName={parameter.displayName} loading={observationsLoading} />
      </section>

      <aside className="insights-rail" aria-label="Selected analytical evidence">
        <section className="rail-panel selected-scope" aria-labelledby="scope-title"><div className="panel-heading"><div><p className="eyebrow">Selected scope</p><h2 id="scope-title">{parameter.displayName}</h2><p className="panel-intro">{stationName(station)} · {windowLabel(window)}</p></div><span className="unit-label">{parameter.unit ?? "unit pending"}</span></div><div className="scope-metric"><span>Median</span><strong>{displayNumber(summary?.status === "reported" ? summary.value : null, summary?.unit ?? parameter.unit)}</strong><small>{summary?.status === "reported" ? `Middle half ${displayNumber(summary.q1, summary.unit)}–${displayNumber(summary.q3, summary.unit)}` : `Unavailable · ${reasonLabel(summary?.indeterminateReason ?? null)}`}</small></div><div className="scope-grid"><div><span>Records</span><strong>{coverage?.raw_count ?? 0}</strong></div><div><span>Eligible</span><strong>{coverage?.eligible_count ?? 0}</strong></div><div><span>Sampled years</span><strong>{coverage?.sampled_calendar_year_count ?? 0}</strong></div></div></section>
        <section className="rail-panel trend-panel" aria-labelledby="trend-title"><div className="panel-heading"><div><p className="eyebrow">Change over time</p><h2 id="trend-title">Trend evidence</h2></div><span className="status-chip trend-status status-neutral">{statusLabel(trend?.status)}</span></div>{trend?.status === "reported" ? <><p className="trend-direction">{trend.direction}</p><p className="panel-intro">Neutral direction across {trend.calendarYearCount} sampled calendar years.</p></> : <p className="state-copy">Indeterminate · {reasonLabel(trend?.indeterminateReason ?? null)}. Censored values are not substituted.</p>}<p className="neutral-disclaimer">Directional evidence is not a health, improvement, deterioration, causal, or compliance claim.</p></section>
        <ComparisonPanel rows={comparison} stations={asset.stations} parameterName={parameter.displayName} unit={parameter.unit} periodLabel={windowLabel(window)} selectedStationId={station?.stationId ?? ""} />
        <section className="rail-panel recent-panel" aria-labelledby="recent-title"><div className="panel-heading"><div><p className="eyebrow">Latest selected records</p><h2 id="recent-title">Recent observations</h2></div><button className="text-button" type="button" onClick={() => setDetailSurface("observations")}>View all →</button></div>{recentObservations.length > 0 ? <div className="recent-list">{recentObservations.map((observation) => <div className="recent-row" key={observation.observationId}><time dateTime={observation.observedAt}>{observation.observedAt.slice(0, 10)}</time><strong>{formatRecentResult(observation.resultText, observation.value, observation.censoring)}</strong><span className={observation.valueKind === "censored" ? "record-tag record-tag-censored" : "record-tag"}>{observation.valueKind === "censored" ? "censored" : observation.analysisEligible ? "observed" : "excluded"}</span></div>)}</div> : <p className="state-copy">No observations for this selection.</p>}<button className="detail-button" type="button" onClick={() => setDetailSurface("observations")}>Inspect complete observation detail</button></section>
      </aside>
    </div>

    <div className="workspace-footer"><span>Sampled monitoring · current view <strong>{windowLabel(window)}</strong> · retrieved {asset.sourceRetrievedAt?.slice(0, 10) ?? "fixture"}</span><button className="text-button" type="button" onClick={() => setDetailSurface("notes")}>Data notes &amp; provenance</button></div>

    {detailSurface === "observations" && <SurfaceDialog title="Recorded observations" closeRef={dialogCloseRef} onClose={() => setDetailSurface(null)}><ObservationTable observations={selectedObservations} unit={parameter.unit} /></SurfaceDialog>}
    {detailSurface === "notes" && <SurfaceDialog title="Data notes and provenance" closeRef={dialogCloseRef} onClose={() => setDetailSurface(null)}><DataNotes asset={asset} parameter={parameter} window={window} qualityCounts={qualityCounts} /></SurfaceDialog>}
  </main>;
}
