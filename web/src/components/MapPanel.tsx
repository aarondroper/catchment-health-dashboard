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
  const longitudes = stations.map((station) => station.longitude);
  const latitudes = stations.map((station) => station.latitude);
  const minLongitude = Math.min(...longitudes);
  const longitudeSpan = Math.max(Math.max(...longitudes) - minLongitude, 0.001);
  const maxLatitude = Math.max(...latitudes);
  const latitudeSpan = Math.max(maxLatitude - Math.min(...latitudes), 0.001);
  const positions = stations.map((station, index) => {
    let left = 12 + ((station.longitude - minLongitude) / longitudeSpan) * 76;
    let top = 18 + ((maxLatitude - station.latitude) / latitudeSpan) * 62;
    const occupied = stations.slice(0, index).map((previous) => {
      const previousLeft = 12 + ((previous.longitude - minLongitude) / longitudeSpan) * 76;
      const previousTop = 18 + ((maxLatitude - previous.latitude) / latitudeSpan) * 62;
      return { left: previousLeft, top: previousTop };
    }).filter((previous) => Math.abs(left - previous.left) < 3.5 && Math.abs(top - previous.top) < 3.5);
    if (occupied.length > 0) {
      const direction = occupied.length % 2 === 0 ? 1 : -1;
      left = Math.min(94, Math.max(6, left + direction * 4));
      top = Math.min(86, Math.max(10, top + direction * 3));
    }
    return { station, left, top };
  });

  return (
    <section className="panel map-panel" aria-labelledby="map-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Spatial context</p>
          <h2 id="map-title">Catchment map</h2>
        </div>
        <span className="status-chip">19 sites</span>
      </div>
      <div className="map-placeholder" id="catchment-map" role="group" aria-label="Ashburton–Hakatere monitoring site map">
        <div className="map-grid" aria-hidden="true" />
        <div className="catchment-silhouette" aria-hidden="true" />
        <div className="map-label map-label-one">Ashburton</div>
        <div className="map-label map-label-two">Hakatere / Ashburton River</div>
        {positions.map(({ station, left, top }) => {
          const active = hasData(station.stationId);
          return (
            <button
              className={`site-pin ${active ? "site-pin-active" : "site-pin-empty"} ${station.stationId === selectedStationId ? "site-pin-selected" : ""}`}
              key={station.stationId}
              style={{ left: `${left}%`, top: `${top}%` }}
              title={`${station.name}: ${active ? "data available" : "no selected parameter data"}`}
              aria-label={`${station.name}, ${active ? "data available" : "no selected parameter data"}`}
              aria-pressed={station.stationId === selectedStationId}
              data-station-id={station.stationId}
              onClick={() => onSelectStation(station.stationId)}
            />
          );
        })}
        <div className="map-legend" aria-label="Site data legend"><span><i className="legend-dot legend-dot-active" /> Selected parameter data</span><span><i className="legend-dot legend-dot-empty" /> No selected parameter data</span></div>
        <p className="map-note">Schematic local view of 19 in-bound monitoring sites. Showing {parameterId.replaceAll("_", " ")} · {window.replaceAll("_", " ")}. Pin status reflects selected-parameter availability; no remote tiles are requested.</p>
      </div>
      <p className="technical-note">Local coordinate view centered at {center.join(", ")}; a licensed basemap is intentionally not loaded.</p>
    </section>
  );
}
