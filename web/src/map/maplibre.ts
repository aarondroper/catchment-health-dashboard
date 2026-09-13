import type { Map, MapOptions } from "maplibre-gl";

export type MapShellOptions = Pick<MapOptions, "container" | "center" | "zoom">;

/**
 * MapLibre boundary for the future station/catchment view.
 * Style URL and source layers remain unresolved until the selected geometry
 * and deployment-safe basemap decision are validated.
 */
export function mapShellOptions(options: MapShellOptions): MapOptions {
  return {
    ...options,
    style: { version: 8, sources: {}, layers: [] },
    attributionControl: false,
  };
}

export type MapInstance = Map;
