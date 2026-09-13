import { mapShellOptions } from "../map/maplibre";

export function MapPanel() {
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
      <div className="map-placeholder" id="catchment-map" role="img" aria-label="Map preview placeholder for the Ashburton–Hakatere catchment">
        <div className="map-grid" aria-hidden="true" />
        <div className="map-label map-label-one">Ashburton</div>
        <div className="map-label map-label-two">Hakatere / Ashburton River</div>
        <div className="map-pin" aria-hidden="true" />
        <p className="map-note">Catchment geometry and verified station membership will be loaded after the Priority 2 source build.</p>
      </div>
      <p className="technical-note">Prepared view: center {center.join(", ")}, zoom {mapOptions.zoom}. No remote tiles are requested by this scaffold.</p>
    </section>
  );
}
