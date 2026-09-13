# Frontend foundation

This is the Priority 1 React/TypeScript/Vite scaffold. It uses MapLibre as an explicit type/runtime dependency and keeps the map boundary in `src/map/maplibre.ts`; the current screen does not request remote tiles or claim that production station membership is complete.

Prerequisite: Node.js 22 or newer and npm.

The initial charting spike uses typed inline SVG plus an HTML table. This keeps the first analytical view small, supports accessible text fallback, and avoids choosing a large chart library before observation volume and interaction needs are measured. It is a technical rendering choice, not an analytical methodology decision.

From this directory:

```text
npm ci
npm run typecheck
npm run build
```

The displayed records are synthetic fixture data only. Production assets and source attribution are not present yet.
