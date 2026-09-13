import { MapPanel } from "./components/MapPanel";
import { SeriesChart } from "./components/SeriesChart";
import { fixtureAsset } from "./data/fixture";

export function App() {
  return (
    <main className="app-shell">
      <header className="masthead">
        <div>
          <p className="eyebrow">Catchment Health Dashboard · foundation preview</p>
          <h1>{fixtureAsset.studyAreaName}</h1>
          <p className="lede">A coordinated freshwater-monitoring workspace for spatial context, observations, and careful source transparency.</p>
        </div>
        <div className="build-badge" aria-label="Application foundation status">
          <span className="build-dot" aria-hidden="true" />
          <span>Contract {fixtureAsset.contractVersion}</span>
        </div>
      </header>

      <section className="control-strip" aria-labelledby="controls-title">
        <div>
          <p className="eyebrow">Shared analytical state</p>
          <h2 id="controls-title">Controls will coordinate the dashboard</h2>
        </div>
        <label>
          Parameter
          <select defaultValue="pending" disabled>
            <option value="pending">Selection pending observation profile</option>
          </select>
        </label>
        <label>
          Time range
          <select defaultValue="pending" disabled>
            <option value="pending">Window pending data build</option>
          </select>
        </label>
      </section>

      <div className="dashboard-grid">
        <MapPanel />
        <SeriesChart observations={fixtureAsset.observations} unit={fixtureAsset.parameter.unit} />
      </div>

      <section className="panel provenance-panel" aria-labelledby="provenance-title">
        <div>
          <p className="eyebrow">Fixture contract preview</p>
          <h2 id="provenance-title">{fixtureAsset.station.name}</h2>
        </div>
        <div className="provenance-copy">
          <p><strong>{fixtureAsset.parameter.displayName}</strong> · {fixtureAsset.parameter.selectionStatus.replaceAll("_", " ")}</p>
          <p>Values are illustrative test records only. Production source identifiers, units, quality flags, censoring, coverage, and method metadata will remain visible in the prepared assets.</p>
        </div>
      </section>
    </main>
  );
}
