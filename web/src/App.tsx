import { useState } from "react";
import { MapPanel } from "./components/MapPanel";
import { SeriesChart } from "./components/SeriesChart";
import { analyticalFixture } from "./data/analyticalFixture";
import { selectObservations, selectSummary, selectTrend } from "./data/selectors";
import type { AnalyticalWindow } from "./contracts";

const windows: readonly { value: AnalyticalWindow; label: string }[] = [
  { value: "primary_2015_2024", label: "Primary · 2015–2024" },
  { value: "recent_2020_2024", label: "Recent · 2020–2024" },
  { value: "history_2007_2024", label: "History · 2007–2024" },
];

function reasonLabel(reason: string | null): string {
  return (reason ?? "Not available").replaceAll("_", " ");
}

export function App() {
  const [parameterId, setParameterId] = useState(analyticalFixture.parameterCatalog[0].parameterId);
  const [window, setWindow] = useState<AnalyticalWindow>("primary_2015_2024");
  const [stationId, setStationId] = useState(analyticalFixture.stationCatalog[0].stationId);
  const parameter = analyticalFixture.parameterCatalog.find((item) => item.parameterId === parameterId) ?? analyticalFixture.parameterCatalog[0];
  const observations = selectObservations(analyticalFixture, parameterId, stationId);
  const summary = selectSummary(analyticalFixture, parameterId, stationId, window);
  const trend = selectTrend(analyticalFixture, parameterId, stationId, window);

  return (
    <main className="app-shell">
      <header className="masthead">
        <div>
          <p className="eyebrow">Catchment Health Dashboard · local analytical preview</p>
          <h1>{analyticalFixture.studyAreaName}</h1>
          <p className="lede">A coordinated freshwater-monitoring workspace for spatial context, observations, and careful source transparency.</p>
        </div>
        <div className="build-badge" aria-label="Application foundation status">
          <span className="build-dot" aria-hidden="true" />
          <span>Assets {analyticalFixture.analyticalVersion}</span>
        </div>
      </header>

      <section className="control-strip" aria-labelledby="controls-title">
        <div>
          <p className="eyebrow">Shared analytical state</p>
          <h2 id="controls-title">Explore the prepared analytical shape</h2>
        </div>
        <label>
          Parameter
          <select value={parameterId} onChange={(event) => setParameterId(event.target.value)}>
            {analyticalFixture.parameterCatalog.map((item) => <option key={item.parameterId} value={item.parameterId}>{item.displayName}</option>)}
          </select>
        </label>
        <label>
          Time range
          <select value={window} onChange={(event) => setWindow(event.target.value as AnalyticalWindow)}>
            {windows.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </label>
        <label>
          Station
          <select value={stationId} onChange={(event) => setStationId(event.target.value)}>
            {analyticalFixture.stationCatalog.map((item) => <option key={item.stationId} value={item.stationId}>{item.name}</option>)}
          </select>
        </label>
      </section>

      <div className="dashboard-grid">
        <MapPanel />
        <SeriesChart observations={observations} unit={parameter.unit} />
      </div>

      <section className="panel provenance-panel" aria-labelledby="provenance-title">
        <div>
          <p className="eyebrow">Summary and method state</p>
          <h2 id="provenance-title">{parameter.displayName}</h2>
        </div>
        <div className="provenance-copy">
          <p><strong>Summary:</strong> {summary?.status === "reported" ? `${summary.value} ${summary.unit ?? ""} (median)` : `Indeterminate — ${reasonLabel(summary?.indeterminateReason ?? null)}`}</p>
          <p><strong>Trend:</strong> {trend?.status === "reported" ? `${trend.direction} (${trend.estimatePerYear} per year)` : `Indeterminate — ${reasonLabel(trend?.indeterminateReason ?? null)}`}</p>
          <p>Values are a small checked-in fixture for local UI development. Production observation assets remain ignored pending ECan dataset-specific terms, attribution, freshness, and release review.</p>
        </div>
      </section>
    </main>
  );
}
