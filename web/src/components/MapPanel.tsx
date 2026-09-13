import { mapShellOptions } from "../map/maplibre";
import type { AnalyticalWindow, Station } from "../contracts";

type MapPanelProps = {
  stations: readonly Station[];
  selectedStationId: string;
  parameterId: string;
  window: AnalyticalWindow;
  hasData: (stationId: string) => boolean;
  onSelectStation: (stationId: string) => void;
};

export function MapPanel({ stations, selectedStationId, parameterId, window, hasData, onSelectStation }: MapPanelProps) {
  const mapOptions = mapShellOptions({
    container: "catchment-map",
    center: [171.75, -43.9],
    zoom: 7,
  });
  const center = mapOptions.center as [number, number];

  return (
    <section className="panel map-panel" aria-labelledby="map-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Spatial context</p>
          <h2 id="map-title">Catchment map</h2>
        </div>
        <span className="status-chip">MapLibre-ready</span>
      </div>
      <div className="map-placeholder" id="catchment-map" role="group" aria-label="Ashburton–Hakatere monitoring site map">
        <div className="map-grid" aria-hidden="true" />
        <div className="catchment-silhouette" aria-hidden="true" />
        <div className="map-label map-label-one">Ashburton</div>
        <div className="map-label map-label-two">Hakatere / Ashburton River</div>
        {stations.map((station) => {
          const longitude = stations.map((item) => item.longitude);
          const latitude = stations.map((item) => item.latitude);
          const left = 12 + ((station.longitude - Math.min(...longitude)) / Math.max(Math.max(...longitude) - Math.min(...longitude), 0.001)) * 76;
          const top = 18 + ((Math.max(...latitude) - station.latitude) / Math.max(Math.max(...latitude) - Math.min(...latitude), 0.001)) * 62;
          const active = hasData(station.stationId);
          return (
            <button
              className={`site-pin ${active ? "site-pin-active" : "site-pin-empty"} ${station.stationId === selectedStationId ? "site-pin-selected" : ""}`}
              key={station.stationId}
              style={{ left: `${left}%`, top: `${top}%` }}
              title={`${station.name}: ${active ? "data available" : "no selected parameter data"}`}
              aria-label={`${station.name}, ${active ? "data available" : "no selected parameter data"}`}
              onClick={() => onSelectStation(station.stationId)}
            />
          );
        })}
        <div className="map-legend" aria-label="Site data legend"><span><i className="legend-dot legend-dot-active" /> Selected parameter data</span><span><i className="legend-dot legend-dot-empty" /> No selected parameter data</span></div>
        <p className="map-note">Nineteen in-bound monitoring sites. Showing {parameterId.replaceAll("_", " ")} · {window.replaceAll("_", " ")}. Pin status reflects selected-parameter availability; this local view requests no remote tiles.</p>
      </div>
      <p className="technical-note">Prepared view: center {center.join(", ")}, zoom {mapOptions.zoom}. No remote tiles are requested by this scaffold.</p>
    </section>
  );
}
