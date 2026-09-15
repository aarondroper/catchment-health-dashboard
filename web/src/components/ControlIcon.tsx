export type ControlIconName = "parameter" | "period" | "site" | "map" | "download";

/**
 * Small replaceable control glyphs. Replace the path groups here if a final
 * icon set is introduced; the viewBox, class, and sizing contract should stay
 * stable so the controls do not shift.
 */
export function ControlIcon({ name }: { name: ControlIconName }) {
  return <svg className={`control-icon control-icon-${name}`} aria-hidden="true" focusable="false" viewBox="0 0 24 24">
    {name === "parameter" && <><path d="M9 3h6" /><path d="M10 3v5L5.5 16.5A2 2 0 0 0 7.2 20h9.6a2 2 0 0 0 1.7-3.5L14 8V3" /><path d="M8 14h8" /></>}
    {name === "period" && <><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4M16 3v4M4 10h16" /><path d="M8 14h.01M12 14h.01M16 14h.01" /></>}
    {name === "site" && <><path d="M12 21s6-5.4 6-11a6 6 0 1 0-12 0c0 5.6 6 11 6 11Z" /><circle cx="12" cy="10" r="2" /></>}
    {name === "map" && <><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3Z" /><path d="M9 3v15M15 6v15" /></>}
    {name === "download" && <><path d="M12 3v11" /><path d="m8 10 4 4 4-4" /><path d="M5 19h14" /></>}
  </svg>;
}
