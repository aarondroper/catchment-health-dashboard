// Derived from Natural Earth 1:110m Admin 0 – Countries (public domain).
// Source: https://www.naturalearthdata.com/downloads/110m-cultural-vectors/
// Terms: https://www.naturalearthdata.com/about/terms-of-use/
// This compact locator is intentionally static; replace these paths if the
// source geometry is refreshed, keeping the source note and licence current.
const NEW_ZEALAND_PATHS = [
  "M142.63 108.34 L138.10 116.61 L132.15 127.11 L122.87 133.22 L120.81 129.20 L115.81 126.99 L122.73 114.37 L118.80 105.94 L105.89 99.80 L106.23 94.25 L114.90 88.90 L116.92 77.09 L116.36 67.18 L111.50 56.90 L111.83 54.20 L106.09 47.87 L96.65 34.30 L91.63 23.45 L96.08 22.24 L102.62 30.76 L111.95 34.74 L115.34 48.40 L124.04 64.54 L124.29 54.07 L129.71 58.25 L131.50 69.85 L141.16 74.85 L149.27 76.07 L156.12 70.22 L162.21 72.00 L159.30 85.60 L155.65 94.55 L146.48 94.24 L143.28 98.90 L144.40 105.49 L142.63 108.34 Z",
  "M56.01 161.85 L66.30 153.82 L73.50 145.86 L78.84 134.43 L83.38 130.55 L85.17 121.99 L93.58 114.91 L96.24 121.43 L98.97 127.76 L107.50 121.54 L110.97 128.02 L110.98 134.47 L106.52 141.58 L98.67 152.87 L92.53 159.04 L96.96 166.42 L87.70 166.61 L77.44 172.39 L74.22 182.42 L67.40 197.94 L57.98 204.79 L51.99 209.17 L40.94 208.84 L33.16 203.78 L20.12 202.71 L18.11 197.07 L24.56 185.70 L39.65 170.57 L47.39 167.68 L56.01 161.85 Z",
] as const;

export function NewZealandInset() {
  return <svg className="nz-inset-map" data-testid="nz-inset-map" role="img" aria-labelledby="nz-inset-title nz-inset-description" viewBox="0 0 180 230">
    <title id="nz-inset-title">New Zealand geographic context</title>
    <desc id="nz-inset-description">Simplified New Zealand outline with the Ashburton–Hakatere catchment marked in Canterbury.</desc>
    {NEW_ZEALAND_PATHS.map((path) => <path className="nz-island" key={path} d={path} />)}
    <path className="nz-inset-leader" d="M81 167 104 177" />
    <circle className="nz-catchment-marker" data-testid="nz-catchment-marker" cx="81" cy="167" r="4.5" />
    <text className="nz-inset-label" x="107" y="180">Ashburton–Hakatere</text>
  </svg>;
}
