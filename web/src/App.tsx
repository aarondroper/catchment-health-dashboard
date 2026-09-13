import { useEffect, useMemo, useState } from "react";
import { MapPanel } from "./components/MapPanel";
import { SeriesChart } from "./components/SeriesChart";
import { analyticalFixture } from "./data/analyticalFixture";
import { loadAnalyticalAsset, loadObservationPartition } from "./data/loadAsset";
import { buildObservationCsv, downloadObservationCsv, exportFilename } from "./data/exportCsv";
import { selectCoverage, selectParameterWindowObservations, selectSummary, selectTrend, selectWindowObservations } from "./data/selectors";
import type { AnalyticalAsset, AnalyticalWindow } from "./contracts";

const windows: readonly { value: AnalyticalWindow; label: string }[] = [
  { value: "primary_2015_2024", label: "Primary · 2015–2024" },
  { value: "recent_2020_2024", label: "Recent · 2020–2024" },
  { value: "history_2007_2024", label: "History · 2007–2024" },
];

function windowLabel(value: AnalyticalWindow): string {
  return windows.find((item) => item.value === value)?.label ?? value;
}

function reasonLabel(reason: string | null): string {
  return (reason ?? "not available").replaceAll("_", " ");
}

function displayNumber(value: number | null, unit: string | null): string {
  return value === null ? "Not reported" : `${value.toLocaleString(undefined, { maximumFractionDigits: 4 })} ${unit ?? ""}`.trim();
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
    loadAnalyticalAsset()
      .then((loaded) => {
        if (cancelled) return;
        setAsset(loaded);
        const firstParameter = loaded.parameters.find((item) => item.selectionStatus === "core") ?? loaded.parameters[0];
        setParameterId(firstParameter.parameterId);
        const firstPopulatedStation = loaded.stations.find((item) => loaded.coverage.some((row) => row.station_id === item.stationId && row.parameter_id === firstParameter.parameterId && row.window === "primary_2015_2024" && row.raw_count > 0));
        setStationId(firstPopulatedStation?.stationId ?? loaded.stations[0]?.stationId ?? "");
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
    setExportStatus(`${exportObservations.length.toLocaleString()} record${exportObservations.length === 1 ? "" : "s"} exported as ${filename}`);
  }

  return (
    <main className="app-shell">
      <header className="masthead">
        <div>
          <div className="brand-lockup"><span className="brand-mark" aria-hidden="true"><i /><i /></span><span>Field monitoring view · local study</span></div>
          <p className="eyebrow">Catchment Health Dashboard · local analytical build</p>
          <h1>{asset.studyAreaName}</h1>
          <p className="lede">A coordinated freshwater-monitoring workspace for observed history, distributions, coverage, and carefully qualified trend evidence.</p>
        </div>
        <div className="build-badge" aria-label="Analytical asset status"><span className="build-dot" aria-hidden="true" /><span>{assetMode === "real" ? `Build ${asset.buildId ?? "local"}` : assetMode === "loading" ? "Loading local assets" : "Fixture fallback"}</span></div>
      </header>

      {assetError && <p className="notice notice-warning" role="status">Production-shaped local asset not found. Showing the checked-in development fixture. Run <code>python3 tools/prepare_dashboard_assets.py</code> first. ({assetError})</p>}
      {partitionError && <p className="notice notice-warning" role="alert">The selected parameter detail could not be loaded. Summaries remain available, but observation detail and export are unavailable. ({partitionError})</p>}

      <section className="overview-strip" aria-label="Dataset overview">
        <div><span className="metric-label">Observations</span><strong>{asset.counts.normalized_observations?.toLocaleString() ?? "—"}</strong></div>
        <div><span className="metric-label">Eligible</span><strong>{asset.counts.analysis_eligible?.toLocaleString() ?? "—"}</strong></div>
        <div><span className="metric-label">Stations</span><strong>{asset.stations.length}</strong></div>
        <div><span className="metric-label">Trend records</span><strong>{asset.trends.length}</strong></div>
        <div className="overview-note">Policy: <strong>{asset.qualityPolicy ?? "fixture"}</strong><br />Local processing only; public release remains gated.</div>
      </section>

      <section className="control-strip" aria-labelledby="controls-title">
        <div className="control-heading"><p className="eyebrow">Shared analytical state</p><h2 id="controls-title">Explore monitoring evidence</h2><p className="selection-summary" aria-live="polite"><span>Selected</span> {parameter.displayName} · {windowLabel(window)} · {station?.name ?? "No station"}</p></div>
        <label>Parameter<select value={parameter.parameterId} onChange={(event) => setParameterId(event.target.value)}>{asset.parameters.map((item) => <option key={item.parameterId} value={item.parameterId}>{item.displayName} · {item.selectionStatus}</option>)}</select></label>
        <label>Time window<select value={window} onChange={(event) => setWindow(event.target.value as AnalyticalWindow)}>{windows.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
        <label>Station<select value={station?.stationId ?? ""} onChange={(event) => setStationId(event.target.value)}>{asset.stations.map((item) => <option key={item.stationId} value={item.stationId}>{item.name}</option>)}</select></label>
      </section>

      <section className="export-strip" aria-labelledby="export-title">
        <div><p className="eyebrow">Inspect / export</p><h2 id="export-title">Download filtered records</h2><p className="panel-intro">UTF-8 CSV · {parameter.displayName} · {windowLabel(window)} · {exportScope === "all_sites" ? "all in-bound sites" : station?.name ?? "selected station"}</p></div>
        <label>Export scope<select value={exportScope} onChange={(event) => setExportScope(event.target.value as "station" | "all_sites")}><option value="station">Selected station</option><option value="all_sites">All sites</option></select></label>
        <button className="export-button" type="button" onClick={handleExport} disabled={observationsLoading}>Download CSV</button>
        <p className="export-status" role="status" aria-live="polite">{observationsLoading ? `Loading ${parameter.displayName} observations…` : exportStatus || "Censored results retain their source text and reporting limit; excluded rows remain labelled."}</p>
      </section>

      <div className="dashboard-grid">
        <MapPanel stations={asset.stations} selectedStationId={station?.stationId ?? ""} parameterId={parameter.parameterId} window={window} catchmentGeometry={asset.catchmentGeometry} hasData={hasData} onSelectStation={setStationId} />
        <SeriesChart observations={selectedObservations} unit={parameter.unit} loading={observationsLoading} />
      </div>

      <section className="insight-grid" aria-label="Selected station analytical context">
        <section className="panel" aria-labelledby="summary-title"><div className="panel-heading"><div><p className="eyebrow">Distribution</p><h2 id="summary-title">Selected-site summary</h2></div><span className="status-chip">{summary?.status ?? "unavailable"}</span></div>{summary?.status === "reported" ? <><p className="headline-value">{displayNumber(summary.value, summary.unit)}</p><p className="panel-intro">Median with interquartile range {displayNumber(summary.q1, summary.unit)}–{displayNumber(summary.q3, summary.unit)}. {summary.eligibleNumericCount} eligible numeric observations; censored count {summary.eligibleCensoredCount}.</p></> : <p className="empty-state">Summary indeterminate: {reasonLabel(summary?.indeterminateReason ?? null)}. No replacement value is shown.</p>}</section>
        <section className="panel" aria-labelledby="trend-title"><div className="panel-heading"><div><p className="eyebrow">Neutral trend view</p><h2 id="trend-title">Supported trend evidence</h2></div><span className="status-chip">{trend?.status ?? "unavailable"}</span></div>{trend?.status === "reported" ? <><p className="headline-value">{trend.direction}</p><p className="panel-intro">Theil–Sen estimate {displayNumber(trend.estimatePerYear, `${parameter.unit ?? "value"}/year`)} across {trend.calendarYearCount} calendar years. This is a neutral direction label, not an improvement, deterioration, causal, or compliance claim.</p></> : <p className="empty-state">Trend indeterminate: {reasonLabel(trend?.indeterminateReason ?? null)}. Censored values are not substituted.</p>}</section>
        <section className="panel" aria-labelledby="coverage-title"><div className="panel-heading"><div><p className="eyebrow">Monitoring coverage</p><h2 id="coverage-title">Selected scope</h2></div></div><dl className="coverage-list"><div><dt>Raw observations</dt><dd>{coverage?.raw_count ?? 0}</dd></div><div><dt>Eligible observations</dt><dd>{coverage?.eligible_count ?? 0}</dd></div><div><dt>Sampled months</dt><dd>{coverage?.sampled_calendar_month_count ?? 0}</dd></div><div><dt>Sampled years</dt><dd>{coverage?.sampled_calendar_year_count ?? 0}</dd></div></dl><p className="panel-intro">Sampled coverage describes recorded visits, not continuous monitoring.</p></section>
      </section>

      <section className="panel comparison-panel" aria-labelledby="comparison-title"><div className="panel-heading"><div><p className="eyebrow">Cross-site comparison</p><h2 id="comparison-title">Reported medians in the selected window</h2></div><span className="unit-label">{parameter.unit ?? "unit pending"}</span></div>{comparison.length > 0 ? <div className="comparison-table-wrap" tabIndex={0} role="region" aria-label="Cross-site reported medians"><table className="observation-table"><caption>Only supported summaries are listed; unavailable sites remain represented on the map.</caption><thead><tr><th scope="col">Station</th><th scope="col">Median</th><th scope="col">IQR</th><th scope="col">Eligible numeric</th></tr></thead><tbody>{comparison.map((row) => <tr key={row.stationId}><td>{asset.stations.find((item) => item.stationId === row.stationId)?.name ?? row.stationId}</td><td>{displayNumber(row.value, row.unit)}</td><td>{displayNumber(row.q1, row.unit)}–{displayNumber(row.q3, row.unit)}</td><td>{row.eligibleNumericCount}</td></tr>)}</tbody></table></div> : <p className="empty-state">No supported numeric summaries are available for this parameter and window.</p>}</section>

      <section className="panel provenance-panel" aria-labelledby="provenance-title"><div><p className="eyebrow">Quality and provenance</p><h2 id="provenance-title">How to read this view</h2></div><div className="provenance-copy"><p><strong>Published observation; no source quality code supplied</strong> is the adopted exploratory disposition for returned observations without a quality field. It is not explicitly verified, QC600, or “good.” QC500, QC600, censored, excluded, and missing states remain distinguishable in the detail table and export.</p><p>Selected observations: {Object.entries(qualityCounts).map(([key, value]) => `${key.replaceAll("_", " ")} (${value})`).join(" · ") || "none"}.</p><p>Data source: Environment Canterbury (ECan) public water-quality service. Build {asset.buildId ?? "fixture"}; source retrieval {asset.sourceRetrievedAt ?? "fixture"}; analytical version {asset.analyticalVersion}. The 2007–2024 observation history is sampled monitoring, not continuous catchment-wide condition. ECan terms, attribution, freshness, and public observation release remain separate gates.</p></div></section>
    </main>
  );
}
