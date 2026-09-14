import type { GeoJSONSource, Map as MapLibreMapType, Marker, StyleSpecification } from "maplibre-gl";
import { useEffect, useRef, useState } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import type { CatchmentGeometry, Station } from "../contracts";

export type MapDisplayMode = "availability" | "median" | "trend";
export type MapDisplayRow = {
  stationId: string;
  available: boolean;
  median: number | null;
  band: "lower" | "middle" | "upper" | null;
  trendDirection: "increasing" | "decreasing" | "indeterminate";
  coverageCount: number;
};

type MapPanelProps = {
  stations: readonly Station[];
  selectedStationId: string;
  selectedStationName: string;
  catchmentGeometry: CatchmentGeometry | null;
  hasData: (stationId: string) => boolean;
  displayMode: MapDisplayMode;
  displayRows: readonly MapDisplayRow[];
  unit: string | null;
  onBasemapStatus: (status: "loading" | "openfreemap" | "fallback") => void;
  onSelectStation: (stationId: string) => void;
};

const OPENFREEMAP_STYLE = "https://tiles.openfreemap.org/styles/positron";
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

function geometryPath(geometry: CatchmentGeometry): string {
  const rings: number[][][] = geometry.geometry.type === "Polygon"
    ? geometry.geometry.coordinates as number[][][]
    : (geometry.geometry.coordinates as number[][][][]).flat();
  return rings.map((ring) => `${ring.map(([longitude, latitude], index) => `${index === 0 ? "M" : "L"}${longitude} ${-latitude}`).join(" ")} Z`).join(" ");
}

function markerOffset(station: Station, index: number, stations: readonly Station[]): [number, number] {
  const nearbyCount = stations.slice(0, index).filter((other) => Math.abs(other.longitude - station.longitude) < 0.02 && Math.abs(other.latitude - station.latitude) < 0.02).length;
  if (nearbyCount === 0) return [0, 0];
  return [((nearbyCount % 3) - 1) * 12, (Math.floor(nearbyCount / 3) - 1) * 12];
}

function stationFeatureCollection(stations: readonly Station[], rows: readonly MapDisplayRow[], selectedStationId: string) {
  const rowById = new globalThis.Map(rows.map((row) => [row.stationId, row]));
  return {
    type: "FeatureCollection",
    features: stations.map((station) => ({
      type: "Feature",
      properties: { stationId: station.stationId, available: rowById.get(station.stationId)?.available ?? false, selected: station.stationId === selectedStationId },
      geometry: { type: "Point", coordinates: [station.longitude, station.latitude] },
    })),
  };
}

function rowFor(stationId: string, rows: readonly MapDisplayRow[]): MapDisplayRow {
  return rows.find((row) => row.stationId === stationId) ?? { stationId, available: false, median: null, band: null, trendDirection: "indeterminate", coverageCount: 0 };
}

function stationLabel(station: Station): string {
  return station.name && station.name !== station.stationId ? `${station.name} (${station.stationId})` : `Monitoring station ${station.stationId}`;
}

function displayModeLabel(mode: MapDisplayMode, unit: string | null): string {
  if (mode === "median") return `Selected-window median · ${unit ?? "unit pending"} · relative range`;
  if (mode === "trend") return "Supported trend direction · neutral terminology";
  return "Data availability in the selected parameter and period";
}

function displayValue(row: MapDisplayRow, mode: MapDisplayMode, unit: string | null): string {
  if (mode === "median") return row.median === null ? "No supported median" : `${row.median.toLocaleString(undefined, { maximumFractionDigits: 3 })} ${unit ?? ""}`.trim();
  if (mode === "trend") return row.trendDirection === "indeterminate" ? "Trend indeterminate" : row.trendDirection;
  return row.available ? `${row.coverageCount.toLocaleString()} recorded rows` : "No selected-parameter data";
}

export function MapPanel({ stations, selectedStationId, selectedStationName, catchmentGeometry, hasData, displayMode, displayRows, unit, onBasemapStatus, onSelectStation }: MapPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMapType | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const markerConstructorRef = useRef<typeof Marker | null>(null);
  const onSelectRef = useRef(onSelectStation);
  const [mapReady, setMapReady] = useState(false);
  const [styleReady, setStyleReady] = useState(false);
  const [contextStatus, setContextStatus] = useState<"loading" | "openfreemap" | "fallback">("loading");
  const fallbackAppliedRef = useRef(false);
  const fittedRef = useRef(false);
  const layerListenersAttachedRef = useRef(false);
  const usingRemoteStyleRef = useRef(false);
  const remoteFetchStartedRef = useRef(false);
  onSelectRef.current = onSelectStation;

  useEffect(() => {
    if (!containerRef.current) return undefined;
    let disposed = false;
    fallbackAppliedRef.current = false;
    fittedRef.current = false;
    layerListenersAttachedRef.current = false;
    usingRemoteStyleRef.current = false;
    remoteFetchStartedRef.current = false;
    setContextStatus("loading");
    onBasemapStatus("loading");
    let remoteReadyTimeout: ReturnType<typeof globalThis.setTimeout> | undefined;
    let startupFallbackTimeout: ReturnType<typeof globalThis.setTimeout> | undefined;
    const reportBasemapStatus = (status: "loading" | "openfreemap" | "fallback") => { setContextStatus(status); onBasemapStatus(status); };
    import("maplibre-gl").then(({ Map: MapLibreMap, Marker: MarkerConstructor, NavigationControl }) => {
      if (disposed || !containerRef.current) return;
      markerConstructorRef.current = MarkerConstructor;
      const map = new MapLibreMap({ container: containerRef.current, style: LOCAL_STYLE, center: [171.75, -43.9], zoom: 7, attributionControl: { compact: true } });
      const reportRemoteReady = () => {
        if (!disposed && usingRemoteStyleRef.current && map.isStyleLoaded()) {
          if (remoteReadyTimeout !== undefined) globalThis.clearTimeout(remoteReadyTimeout);
          reportBasemapStatus("openfreemap");
        }
      };
      mapRef.current = map;
      map.addControl(new NavigationControl({ showCompass: false }), "top-left");
      startupFallbackTimeout = globalThis.setTimeout(() => {
        if (disposed || usingRemoteStyleRef.current || fallbackAppliedRef.current) return;
        fallbackAppliedRef.current = true;
        reportBasemapStatus("fallback");
        map.setStyle(LOCAL_STYLE);
      }, 3000);
      const applyLocalFallback = () => {
        if (disposed || (fallbackAppliedRef.current && !usingRemoteStyleRef.current)) return;
        fallbackAppliedRef.current = true;
        usingRemoteStyleRef.current = false;
        if (remoteReadyTimeout !== undefined) globalThis.clearTimeout(remoteReadyTimeout);
        reportBasemapStatus("fallback");
        map.setStyle(LOCAL_STYLE);
      };
      const requestRemoteStyle = () => {
        if (remoteFetchStartedRef.current || usingRemoteStyleRef.current) return;
        remoteFetchStartedRef.current = true;
        const styleController = new AbortController();
        const styleTimeout = globalThis.setTimeout(() => styleController.abort(), 2500);
        fetch(OPENFREEMAP_STYLE, { signal: styleController.signal })
          .then((response) => { if (!response.ok) throw new Error(`OpenFreeMap style request failed (${response.status})`); return response.json() as Promise<StyleSpecification>; })
          .then((style) => {
            if (disposed || fallbackAppliedRef.current) return;
            usingRemoteStyleRef.current = true;
            map.setStyle(style);
            remoteReadyTimeout = globalThis.setTimeout(() => {
              if (!disposed && usingRemoteStyleRef.current && !map.isStyleLoaded()) applyLocalFallback();
            }, 4000);
          })
          .catch(() => { if (!disposed) reportBasemapStatus("fallback"); })
          .finally(() => globalThis.clearTimeout(styleTimeout));
      };
      const addDataLayers = () => {
        if (disposed) return;
        try {
          ["catchment-fill", "catchment-outline", "station-points"].forEach((layerId) => { if (map.getLayer(layerId)) map.removeLayer(layerId); });
        if (map.getSource("catchment-boundary")) map.removeSource("catchment-boundary");
        if (catchmentGeometry) {
          map.addSource("catchment-boundary", { type: "geojson", data: catchmentGeometry as never });
          map.addLayer({ id: "catchment-fill", type: "fill", source: "catchment-boundary", paint: { "fill-color": "#6fc2b5", "fill-opacity": 0.2 } });
          map.addLayer({ id: "catchment-outline", type: "line", source: "catchment-boundary", paint: { "line-color": "#17645f", "line-width": 2.2, "line-opacity": 0.9 } });
        }
        if (map.getSource("station-points")) map.removeSource("station-points");
        map.addSource("station-points", { type: "geojson", data: stationFeatureCollection(stations, displayRows, selectedStationId) as never });
        map.addLayer({ id: "station-points", type: "circle", source: "station-points", paint: { "circle-color": ["case", ["boolean", ["get", "selected"], false], "#102a43", ["boolean", ["get", "available"], false], "#d7684c", "#91a4ad"], "circle-radius": ["case", ["boolean", ["get", "selected"], false], 7, 5], "circle-stroke-color": "#ffffff", "circle-stroke-width": 2 } });
        if (!layerListenersAttachedRef.current) {
          map.on("click", "station-points", (event) => {
            const stationId = event.features?.[0]?.properties?.stationId;
            if (stationId) onSelectRef.current(String(stationId));
          });
          map.on("mouseenter", "station-points", () => { map.getCanvas().style.cursor = "pointer"; });
          map.on("mouseleave", "station-points", () => { map.getCanvas().style.cursor = ""; });
          layerListenersAttachedRef.current = true;
        }
        if (!fittedRef.current) {
          const bounds = catchmentGeometry ? geometryBounds(catchmentGeometry) : null;
          if (bounds) map.fitBounds(bounds, { padding: 38, duration: 0, maxZoom: 10 });
          fittedRef.current = true;
        }
          setStyleReady(true);
          setMapReady(true);
          reportBasemapStatus(fallbackAppliedRef.current ? "fallback" : usingRemoteStyleRef.current && map.isStyleLoaded() ? "openfreemap" : "loading");
          requestRemoteStyle();
        } catch (error) {
          applyLocalFallback();
        }
      };
      map.on("style.load", addDataLayers);
      map.on("idle", reportRemoteReady);
      map.on("load", () => {
        setStyleReady(true);
        setMapReady(true);
        addDataLayers();
      });
      map.on("error", () => {
        if (disposed || fallbackAppliedRef.current) return;
        if (!usingRemoteStyleRef.current) return;
        applyLocalFallback();
      });
      const resizeObserver = new ResizeObserver(() => map.resize());
      resizeObserver.observe(containerRef.current);
      return () => resizeObserver.disconnect();
    }).catch(() => { if (!disposed) reportBasemapStatus("fallback"); });
    return () => {
      disposed = true;
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
      if (remoteReadyTimeout !== undefined) globalThis.clearTimeout(remoteReadyTimeout);
      if (startupFallbackTimeout !== undefined) globalThis.clearTimeout(startupFallbackTimeout);
      setMapReady(false);
      setStyleReady(false);
    };
  }, [catchmentGeometry]);

  useEffect(() => {
    const source = mapRef.current?.getSource("station-points");
    if (source?.type === "geojson") (source as GeoJSONSource).setData(stationFeatureCollection(stations, displayRows, selectedStationId) as never);
  }, [displayRows, selectedStationId, stations]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !styleReady) return undefined;
    markersRef.current.forEach((marker) => marker.remove());
    const MarkerConstructor = markerConstructorRef.current;
    if (!MarkerConstructor) return undefined;
    markersRef.current = stations.map((station, index) => {
      const row = rowFor(station.stationId, displayRows);
      const available = hasData(station.stationId);
      const selected = station.stationId === selectedStationId;
      const element = document.createElement("button");
      element.type = "button";
      element.className = `map-marker ${available ? "map-marker-available" : "map-marker-unavailable"} ${selected ? "map-marker-selected" : ""} ${row.band ? `map-marker-band-${row.band}` : ""}`;
      element.dataset.stationId = station.stationId;
      const label = stationLabel(station);
      element.title = `${label}: ${displayValue(row, displayMode, unit)}`;
      element.setAttribute("aria-label", `${label}, ${displayValue(row, displayMode, unit)}`);
      element.setAttribute("aria-pressed", String(selected));
      element.innerHTML = `<span class="map-marker-glyph" aria-hidden="true"></span>${displayMode === "median" && row.median !== null ? `<span class="map-marker-value" aria-hidden="true">${row.median.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>` : displayMode === "trend" && row.trendDirection !== "indeterminate" ? `<span class="map-marker-direction" aria-hidden="true">${row.trendDirection === "increasing" ? "↗" : "↘"}</span>` : ""}`;
      element.addEventListener("click", () => onSelectRef.current(station.stationId));
      return new MarkerConstructor({ element, anchor: "center", offset: markerOffset(station, index, stations) }).setLngLat([station.longitude, station.latitude]).addTo(map);
    });
    return () => { markersRef.current.forEach((marker) => marker.remove()); markersRef.current = []; };
  }, [displayMode, displayRows, hasData, mapReady, selectedStationId, stations, styleReady, unit]);

  const resetMap = () => {
    const bounds = catchmentGeometry ? geometryBounds(catchmentGeometry) : null;
    if (bounds) mapRef.current?.fitBounds(bounds, { padding: 38, duration: 250, maxZoom: 10 });
  };

  const boundaryBounds = catchmentGeometry ? geometryBounds(catchmentGeometry) : null;
  const boundaryPath = catchmentGeometry && boundaryBounds ? geometryPath(catchmentGeometry) : null;

  return <section className="map-panel panel" aria-labelledby="map-title">
    <div className="map-panel-header"><div><p className="eyebrow">Spatial context</p><h2 id="map-title">Ashburton–Hakatere catchment</h2><p className="panel-intro">Selected site: {selectedStationName}</p></div><div className="map-header-meta"><span className="status-chip">{stations.length} sites</span><span className="map-mode-label">{displayModeLabel(displayMode, unit)}</span></div></div>
    <div className="map-frame" role="group" aria-label="Ashburton–Hakatere monitoring site map"><div className="map-canvas" ref={containerRef} data-testid="catchment-map" />{contextStatus === "fallback" && boundaryPath && boundaryBounds && <svg className="map-boundary-fallback" viewBox={`${boundaryBounds[0][0]} ${-boundaryBounds[1][1]} ${boundaryBounds[1][0] - boundaryBounds[0][0]} ${boundaryBounds[1][1] - boundaryBounds[0][1]}`} preserveAspectRatio="none" aria-hidden="true"><path d={boundaryPath} /></svg>}<button className="map-reset" type="button" onClick={resetMap}>Reset view</button><div className="map-overlay"><div className="map-legend"><strong>{displayMode === "availability" ? "Selected scope" : displayMode === "median" ? "Relative median" : "Trend evidence"}</strong><span><i className="legend-dot legend-dot-selected" /> Selected site</span>{displayMode === "availability" && <><span><i className="legend-dot legend-dot-active" /> Data available</span><span><i className="legend-dot legend-dot-empty" /> No selected data</span></>}{displayMode === "median" && <><span><i className="legend-dot legend-dot-low" /> Lower relative values</span><span><i className="legend-dot legend-dot-high" /> Higher relative values</span></>}{displayMode === "trend" && <><span><i className="legend-symbol">↗</i> Increasing</span><span><i className="legend-symbol">↘</i> Decreasing</span><span><i className="legend-symbol">—</i> Indeterminate</span></>}</div><div className="map-attribution">OpenFreeMap · OpenMapTiles · OpenStreetMap</div><p className="map-note">{displayMode === "median" ? "Median colours are relative to supported summaries in this view; they are not health categories." : displayMode === "trend" ? "Only supported neutral directions are shown; no direction implies improvement or deterioration." : `${stations.length} reconciled monitoring sites · select a marker for station evidence.`}</p></div></div>
    <div className="map-footer"><span>{catchmentGeometry ? "Verified Ashburton River boundary · local station coordinates" : "Catchment boundary unavailable in development sample"}</span><span className="map-service-state">{contextStatus === "openfreemap" ? "Context basemap loaded" : contextStatus === "fallback" ? "Local map fallback" : "Loading map context"}</span></div>
  </section>;
}
