import { useEffect, useMemo, useState } from "react";
import { MapPanel } from "./components/MapPanel";
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
  { value: "primary_2015_2024", label: "2015–2024" },
  { value: "recent_2020_2024", label: "2020–2024 recent" },
  { value: "history_2007_2024", label: "2007–2024 full history" },
];

function windowLabel(value: AnalyticalWindow): string {
  return windows.find((item) => item.value === value)?.label ?? value;
}

function stationLabel(station: Station | undefined): string {
  if (!station) return "No station selected";
  return station.name === station.stationId ? `Monitoring station ${station.stationId}` : `${station.name} (${station.stationId})`;
}

function reasonLabel(reason: string | null): string {
  return (reason ?? "not available").replaceAll("_", " ");
}

function statusLabel(status: "reported" | "indeterminate" | "unavailable" | undefined): string {
  if (status === "reported") return "Reported";
  if (status === "indeterminate") return "Not reported";
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
  if (preferred && asset.coverage.some((row) => row.station_id === preferred.stationId && row.parameter_id === parameterId && row.window === "primary_2015_2024" && row.raw_count > 0)) return preferred;
  return asset.stations.find((item) => asset.coverage.some((row) => row.station_id === item.stationId && row.parameter_id === parameterId && row.window === "primary_2015_2024" && row.raw_count > 0)) ?? asset.stations[0];
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
  const [window, setWindow] = useState<AnalyticalWindow>("primary_2015_2024");
  const [stationId, setStationId] = useState(analyticalFixture.stations[0].stationId);
  const [exportScope, setExportScope] = useState<"station" | "all_sites">("station");
  const [exportStatus, setExportStatus] = useState("");

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

  const parameter = asset.parameters.find((item) => item.parameterId === parameterId) ?? asset.parameters[0];
  const station = asset.stations.find((item) => item.stationId === stationId) ?? asset.stations[0];
  const parameterObservations = observationsParameterId === parameter.parameterId ? observations : [];
  const selectedObservations = station ? selectWindowObservations(parameterObservations, station.stationId, window) : [];
  const summary = station ? selectSummary(asset, parameter.parameterId, station.stationId, window) : undefined;
  const trend = station ? selectTrend(asset, parameter.parameterId, station.stationId, window) : undefined;
  const coverage = station ? selectCoverage(asset, parameter.parameterId, station.stationId, window) : undefined;
  const comparison = useMemo(
    () => asset.summaries.filter((row) => row.parameterId === parameter.parameterId && row.period === window && row.status === "reported"),
    [asset.summaries, parameter.parameterId, window],
  );
  const qualityCounts = useMemo(() => selectedObservations.reduce<Record<string, number>>((counts, row) => {
    counts[row.qualityDisposition] = (counts[row.qualityDisposition] ?? 0) + 1;
    return counts;
  }, {}), [selectedObservations]);
  const exportObservations = useMemo(() => {
    const inWindow = selectParameterWindowObservations(parameterObservations, window);
    return exportScope === "all_sites" ? inWindow : inWindow.filter((row) => row.stationId === station?.stationId);
  }, [exportScope, parameterObservations, station?.stationId, window]);
  const hasData = (candidateStationId: string) => asset.coverage.some(
    (row) => row.station_id === candidateStationId && row.parameter_id === parameter.parameterId && row.window === window && row.raw_count > 0,
  );

  function handleExport() {
    const csv = buildObservationCsv(exportObservations, asset.stations, parameter);
    const filename = exportFilename(asset.studyAreaName, parameter, window, exportScope, station?.stationId);
    downloadObservationCsv(csv, filename);
    setExportStatus(`${exportObservations.length.toLocaleString()} record${exportObservations.length === 1 ? "" : "s"} exported`);
  }

  const selectedLabel = stationLabel(station);
  const statusText = assetMode === "real" ? "Local data loaded" : assetMode === "loading" ? "Loading local data…" : "Development sample";

  return (
    <main className="app-shell">
      <header className="masthead">
        <div>
          <div className="brand-lockup"><span className="brand-mark" aria-hidden="true"><i /><i /></span><span>Freshwater monitoring · local study</span></div>
          <p className="eyebrow">Ashburton–Hakatere catchment</p>
          <h1>Water-quality monitoring evidence</h1>
          <p className="lede">Explore recorded observations across monitoring sites, with clear context for coverage, distributions, and supported changes over time.</p>
        </div>
        <div className={`data-status data-status-${assetMode}`} aria-label="Data loading status"><span className="build-dot" aria-hidden="true" />{statusText}</div>
      </header>

      {assetError && <p className="notice notice-warning" role="status">Local analytical data is unavailable, so this view is showing a development sample. Prepare the local asset first. ({assetError})</p>}
      {partitionError && <p className="notice notice-warning" role="alert">The selected parameter detail could not be loaded. Summary information remains available, but observation detail and export are unavailable. ({partitionError})</p>}

      <section className="overview-strip" aria-label="Dataset overview">
        <div><span className="metric-label">Observation rows</span><strong>{asset.counts.normalized_observations?.toLocaleString() ?? "—"}</strong></div>
        <div><span className="metric-label">Eligible rows</span><strong>{asset.counts.analysis_eligible?.toLocaleString() ?? "—"}</strong></div>
        <div><span className="metric-label">Monitoring sites</span><strong>{asset.stations.length}</strong></div>
        <div><span className="metric-label">Recorded history</span><strong>2007–2024</strong></div>
        <div className="overview-note">Sampled monitoring · current view <strong>{windowLabel(window)}</strong></div>
      </section>

      <section className="workspace-bar" aria-labelledby="controls-title">
        <div className="workspace-intro"><p className="eyebrow">Selected view</p><h2 id="controls-title">{parameter.displayName}</h2><p className="selection-summary" aria-live="polite">{selectedLabel} · {windowLabel(window)}</p></div>
        <div className="workspace-controls">
          <label>Parameter<select aria-label="Parameter" value={parameter.parameterId} onChange={(event) => setParameterId(event.target.value)}>{asset.parameters.map((item) => <option key={item.parameterId} value={item.parameterId}>{item.displayName}</option>)}</select></label>
          <label>Time period<select aria-label="Time period" value={window} onChange={(event) => setWindow(event.target.value as AnalyticalWindow)}>{windows.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
          <label>Monitoring site<select aria-label="Monitoring site" value={station?.stationId ?? ""} onChange={(event) => setStationId(event.target.value)}>{asset.stations.map((item) => <option key={item.stationId} value={item.stationId}>{stationLabel(item)}</option>)}</select></label>
        </div>
        <div className="workspace-actions"><label>Export<select aria-label="Export scope" value={exportScope} onChange={(event) => setExportScope(event.target.value as "station" | "all_sites")}><option value="station">Selected site</option><option value="all_sites">All sites</option></select></label><button className="export-button" type="button" onClick={handleExport} disabled={observationsLoading}>Export CSV</button><span className="export-status" role="status" aria-live="polite">{observationsLoading ? "Loading detail…" : exportStatus}</span></div>
      </section>

      <div className="dashboard-grid">
        <MapPanel stations={asset.stations} selectedStationId={station?.stationId ?? ""} selectedStationName={selectedLabel} catchmentGeometry={asset.catchmentGeometry} hasData={hasData} onSelectStation={setStationId} />
        <SeriesChart observations={selectedObservations} unit={parameter.unit} stationName={selectedLabel} parameterName={parameter.displayName} loading={observationsLoading} />
      </div>

      <section className="insight-grid" aria-label="Selected site evidence">
        <section className="panel insight-panel" aria-labelledby="summary-title"><div className="panel-heading"><div><p className="eyebrow">Distribution</p><h2 id="summary-title">At this monitoring site</h2></div><span className={`status-chip status-${summary?.status ?? "unavailable"}`}>{statusLabel(summary?.status)}</span></div>{summary?.status === "reported" ? <><p className="headline-value">{displayNumber(summary.value, summary.unit)}</p><p className="panel-intro">Median · middle half {displayNumber(summary.q1, summary.unit)}–{displayNumber(summary.q3, summary.unit)}</p><p className="supporting-stat">Based on {summary.eligibleNumericCount} eligible numeric records{summary.eligibleCensoredCount ? ` and ${summary.eligibleCensoredCount} censored records` : ""}.</p></> : <p className="state-copy">No summary value is shown because {reasonLabel(summary?.indeterminateReason ?? null)}. The underlying records remain available below.</p>}</section>
        <section className="panel insight-panel" aria-labelledby="trend-title"><div className="panel-heading"><div><p className="eyebrow">Change over time</p><h2 id="trend-title">Trend evidence</h2></div><span className={`status-chip trend-status status-${trend?.status ?? "unavailable"}`}>{statusLabel(trend?.status)}</span></div>{trend?.status === "reported" ? <><p className="headline-value trend-value">{trend.direction}</p><p className="panel-intro">Neutral direction from a Theil–Sen estimate across {trend.calendarYearCount} calendar years.</p><p className="supporting-stat">This is not an improvement, deterioration, causal, or compliance claim.</p></> : <p className="state-copy">No trend estimate is shown because {reasonLabel(trend?.indeterminateReason ?? null)}. Censored values are not substituted.</p>}</section>
        <section className="panel insight-panel" aria-labelledby="coverage-title"><div className="panel-heading"><div><p className="eyebrow">Monitoring coverage</p><h2 id="coverage-title">What was recorded</h2></div></div><dl className="coverage-list"><div><dt>Observation rows</dt><dd>{coverage?.raw_count ?? 0}</dd></div><div><dt>Eligible rows</dt><dd>{coverage?.eligible_count ?? 0}</dd></div><div><dt>Sampled months</dt><dd>{coverage?.sampled_calendar_month_count ?? 0}</dd></div><div><dt>Sampled years</dt><dd>{coverage?.sampled_calendar_year_count ?? 0}</dd></div></dl><p className="panel-intro">Recorded visits describe monitoring coverage, not continuous conditions.</p></section>
      </section>

      <ObservationTable observations={selectedObservations} unit={parameter.unit} />

      <ComparisonPanel rows={comparison} stations={asset.stations} parameterName={parameter.displayName} unit={parameter.unit} periodLabel={windowLabel(window)} selectedStationId={station?.stationId ?? ""} />

      <details className="data-notes" data-testid="data-notes"><summary><span><span className="eyebrow">Transparency</span><strong>Data notes and provenance</strong></span><span className="summary-hint">Quality, methods, source, and release context</span></summary><div className="notes-grid"><div><h3>How to read this view</h3><p><strong>Published observation; no source quality code supplied</strong> describes returned observations without a quality field. They are usable for this exploratory local dashboard but are not explicitly verified, QC600, or “good.” The processing disposition is <code>published_unflagged</code>. Quality-coded, censored, excluded, and missing states remain distinguishable in the table and export.</p><p>Selected records: {Object.entries(qualityCounts).map(([key, value]) => `${key.replaceAll("_", " ")} (${value})`).join(" · ") || "none"}.</p></div><div><h3>Source and method</h3><p>Environment Canterbury (ECan) public water-quality service · 2007–2024 sampled history · current window {windowLabel(window)}. Medians, interquartile ranges, and neutral trends appear only where the documented coverage and censoring rules support them. The history is not continuous monitoring and does not represent unmonitored parts of the catchment.</p><p>Local build {asset.buildId ?? "development fixture"} · analytical version {asset.analyticalVersion} · source retrieval {asset.sourceRetrievedAt ?? "development fixture"}.</p></div><div><h3>Release context</h3><p>Assets are being processed locally for review. ECan attribution, freshness responsibility, and public observation redistribution remain release gates. No ECan branding, regulatory compliance claim, causal explanation, threshold, or composite score is presented.</p></div></div></details>
    </main>
  );
}
