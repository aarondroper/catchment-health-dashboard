import type { GeoJSONSource, Map, Marker, StyleSpecification } from "maplibre-gl";
import { useEffect, useRef, useState } from "react";
import type { CatchmentGeometry, AnalyticalWindow, Station } from "../contracts";

type MapPanelProps = {
  stations: readonly Station[];
  selectedStationId: string;
  parameterId: string;
  window: AnalyticalWindow;
  catchmentGeometry: CatchmentGeometry | null;
  hasData: (stationId: string) => boolean;
  onSelectStation: (stationId: string) => void;
};

const LOCAL_STYLE = {
  version: 8,
  sources: {},
  layers: [{ id: "local-background", type: "background", paint: { "background-color": "#dceeea" } }],
} as const satisfies StyleSpecification;

function geometryBounds(geometry: CatchmentGeometry): [[number, number], [number, number]] | null {
  const points: [number, number][] = [];
  const collect = (value: unknown): void => {
    if (!Array.isArray(value)) return;
    if (value.length >= 2 && typeof value[0] === "number" && typeof value[1] === "number") {
      points.push([value[0], value[1]]);
      return;
    }
    value.forEach(collect);
  };
  collect(geometry.geometry.coordinates);
  if (points.length === 0) return null;
  const longitudes = points.map(([longitude]) => longitude);
  const latitudes = points.map(([, latitude]) => latitude);
  return [[Math.min(...longitudes), Math.min(...latitudes)], [Math.max(...longitudes), Math.max(...latitudes)]];
}

function markerOffset(station: Station, index: number, stations: readonly Station[]): [number, number] {
  const nearbyCount = stations.slice(0, index).filter((other) =>
    Math.abs(other.longitude - station.longitude) < 0.02 && Math.abs(other.latitude - station.latitude) < 0.02,
  ).length;
  if (nearbyCount === 0) return [0, 0];
  return [((nearbyCount % 3) - 1) * 12, (Math.floor(nearbyCount / 3) - 1) * 12];
}

function stationFeatureCollection(stations: readonly Station[], hasData: (stationId: string) => boolean, selectedStationId: string) {
  return {
    type: "FeatureCollection",
    features: stations.map((station) => ({
      type: "Feature",
      properties: { stationId: station.stationId, available: hasData(station.stationId), selected: station.stationId === selectedStationId },
      geometry: { type: "Point", coordinates: [station.longitude, station.latitude] },
    })),
  };
}

export function MapPanel({ stations, selectedStationId, parameterId, window, catchmentGeometry, hasData, onSelectStation }: MapPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const markerConstructorRef = useRef<typeof Marker | null>(null);
  const onSelectRef = useRef(onSelectStation);
  const [mapReady, setMapReady] = useState(false);
  onSelectRef.current = onSelectStation;

  useEffect(() => {
    if (!containerRef.current) return undefined;
    let disposed = false;
    import("maplibre-gl").then(({ Map: MapLibreMap, Marker: MarkerConstructor }) => {
      if (disposed || !containerRef.current) return;
      markerConstructorRef.current = MarkerConstructor;
      const map = new MapLibreMap({
        container: containerRef.current,
        style: LOCAL_STYLE,
        center: [171.75, -43.9],
        zoom: 7,
        attributionControl: false,
      });
      mapRef.current = map;
      map.on("load", () => {
        if (disposed) return;
        if (catchmentGeometry) {
          map.addSource("catchment-boundary", { type: "geojson", data: catchmentGeometry as never });
          map.addLayer({
            id: "catchment-fill",
            type: "fill",
            source: "catchment-boundary",
            paint: { "fill-color": "#8ccfc1", "fill-opacity": 0.26 },
          });
          map.addLayer({
            id: "catchment-outline",
            type: "line",
            source: "catchment-boundary",
            paint: { "line-color": "#277d78", "line-width": 2.5, "line-opacity": 0.9 },
          });
        }
        map.addSource("station-points", { type: "geojson", data: stationFeatureCollection(stations, hasData, selectedStationId) as never });
        map.addLayer({
          id: "station-points",
          type: "circle",
          source: "station-points",
          paint: {
            "circle-color": ["case", ["boolean", ["get", "selected"], false], "#102a43", ["boolean", ["get", "available"], false], "#d7684c", "#91a4ad"],
            "circle-radius": ["case", ["boolean", ["get", "selected"], false], 7, 5],
            "circle-stroke-color": "#ffffff",
            "circle-stroke-width": 2,
          },
        });
        map.on("click", "station-points", (event) => {
          const stationId = event.features?.[0]?.properties?.stationId;
          if (stationId) onSelectRef.current(String(stationId));
        });
        map.on("mouseenter", "station-points", () => { map.getCanvas().style.cursor = "pointer"; });
        map.on("mouseleave", "station-points", () => { map.getCanvas().style.cursor = ""; });
        const bounds = catchmentGeometry ? geometryBounds(catchmentGeometry) : null;
        if (bounds) map.fitBounds(bounds, { padding: 42, duration: 0, maxZoom: 9 });
        setMapReady(true);
      });
    });
    return () => {
      disposed = true;
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, [catchmentGeometry]);

  useEffect(() => {
    const source = mapRef.current?.getSource("station-points");
    if (source?.type === "geojson") (source as GeoJSONSource).setData(stationFeatureCollection(stations, hasData, selectedStationId) as never);
  }, [hasData, selectedStationId, stations]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return undefined;
    markersRef.current.forEach((marker) => marker.remove());
    const MarkerConstructor = markerConstructorRef.current;
    if (!MarkerConstructor) return undefined;
    markersRef.current = stations.map((station, index) => {
      const available = hasData(station.stationId);
      const selected = station.stationId === selectedStationId;
      const element = document.createElement("button");
      element.type = "button";
      element.className = `map-marker ${available ? "map-marker-available" : "map-marker-unavailable"} ${selected ? "map-marker-selected" : ""}`;
      element.dataset.stationId = station.stationId;
      element.title = `${station.name}: ${available ? "data available" : "no selected parameter data"}`;
      element.setAttribute("aria-label", `${station.name}, ${available ? "data available" : "no selected parameter data"}`);
      element.setAttribute("aria-pressed", String(selected));
      element.addEventListener("click", () => onSelectRef.current(station.stationId));
      return new MarkerConstructor({ element, anchor: "center", offset: markerOffset(station, index, stations) }).setLngLat([station.longitude, station.latitude]).addTo(map);
    });
    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
    };
  }, [hasData, mapReady, selectedStationId, stations]);

  return (
    <section className="panel map-panel" aria-labelledby="map-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Spatial context</p>
          <h2 id="map-title">Catchment map</h2>
        </div>
        <span className="status-chip">{stations.length} sites</span>
      </div>
      <div className="map-frame" role="group" aria-label="Ashburton–Hakatere monitoring site map">
        <div className="map-canvas" ref={containerRef} data-testid="catchment-map" />
        <div className="map-overlay" aria-hidden="true">
          <div className="map-label map-label-one">Ashburton River</div>
          <div className="map-label map-label-two">Ashburton–Hakatere</div>
          <div className="map-legend"><span><i className="legend-dot legend-dot-active" /> Selected parameter data</span><span><i className="legend-dot legend-dot-empty" /> No selected parameter data</span></div>
          <p className="map-note">Local MapLibre view of {stations.length} in-bound monitoring sites. Showing {parameterId.replaceAll("_", " ")} · {window.replaceAll("_", " ")}.</p>
        </div>
      </div>
      <p className="technical-note">Boundary: {catchmentGeometry ? "ECan Ashburton River major-catchment polygon · WGS84" : "boundary unavailable in fixture"}. No third-party basemap or remote tiles are requested.</p>
    </section>
  );
}
