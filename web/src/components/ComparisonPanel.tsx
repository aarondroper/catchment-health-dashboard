import type { AnalyticalSummary, Station } from "../contracts";

type ComparisonPanelProps = {
  rows: readonly AnalyticalSummary[];
  stations: readonly Station[];
  parameterName: string;
  unit: string | null;
  periodLabel: string;
  selectedStationId: string;
};

function stationLabel(station: Station | undefined): string {
  if (!station) return "Unknown station";
  return station.name === station.stationId ? station.stationId : station.name;
}

function formatValue(value: number, unit: string | null): string {
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 4 })} ${unit ?? ""}`.trim();
}

export function ComparisonPanel({ rows, stations, parameterName, unit, periodLabel, selectedStationId }: ComparisonPanelProps) {
  const comparableRows = rows
    .filter((row) => row.value !== null && row.q1 !== null && row.q3 !== null)
    .map((row) => ({ ...row, value: row.value as number, q1: row.q1 as number, q3: row.q3 as number }))
    .sort((a, b) => a.value - b.value);
  const values = comparableRows.flatMap((row) => [row.q1, row.q3]);
  const maximum = Math.max(...values, 1);
  const plotWidth = 260;
  const rowHeight = 22;
  const plotHeight = Math.max(118, comparableRows.length * rowHeight + 36);
  const xFor = (value: number) => 168 + (value / maximum) * plotWidth;
  const compactRows = comparableRows.length <= 3
    ? comparableRows
    : [...new Map([
      [comparableRows[0].stationId, comparableRows[0]] as const,
      ...comparableRows.filter((row) => row.stationId === selectedStationId).map((row) => [row.stationId, row] as const),
      [comparableRows.at(-1)!.stationId, comparableRows.at(-1)!] as const,
    ]).values()].sort((a, b) => a.value - b.value);

  return (
    <section className="panel comparison-panel" aria-labelledby="comparison-title">
      <div className="panel-heading">
        <div><p className="eyebrow">Across monitoring sites</p><h2 id="comparison-title">Where site medians sit</h2><p className="panel-intro">Median points and middle-half ranges for {parameterName} in {periodLabel}. Sites are ordered from lowest to highest median.</p></div>
        <span className="unit-label">{unit ?? "unit pending"}</span>
      </div>
      {comparableRows.length > 1 ? <>
        <div className="comparison-plot-wrap" tabIndex={0} role="region" aria-label="Cross-site median and middle-half comparison">
          <svg className="comparison-plot" viewBox={`0 0 ${plotWidth + 220} ${plotHeight}`} preserveAspectRatio="xMinYMin meet">
            <title id="comparison-plot-title">{parameterName} site median and middle-half comparison</title>
            <desc id="comparison-plot-desc">{comparableRows.length} supported sites, sorted by median. The dot is the median and the line is the middle half from the first to third quartile. The selected site is outlined.</desc>
            {[0, 0.25, 0.5, 0.75, 1].map((fraction) => <g key={fraction}><line x1={xFor(maximum * fraction)} x2={xFor(maximum * fraction)} y1="24" y2={plotHeight - 22} className="comparison-gridline" /><text x={xFor(maximum * fraction)} y="15" textAnchor={fraction === 0 ? "start" : fraction === 1 ? "end" : "middle"} className="comparison-axis-label">{formatValue(maximum * fraction, unit)}</text></g>)}
            {comparableRows.map((row, index) => {
              const y = 42 + index * rowHeight;
              const isSelected = row.stationId === selectedStationId;
              return <g key={row.stationId} className={isSelected ? "comparison-row comparison-row-selected" : "comparison-row"}>
                <text x="0" y={y + 4} className="comparison-site-label">{stationLabel(stations.find((station) => station.stationId === row.stationId))}</text>
                <line x1={xFor(row.q1)} x2={xFor(row.q3)} y1={y} y2={y} className="comparison-interval" />
                <line x1={xFor(row.q1)} x2={xFor(row.q1)} y1={y - 6} y2={y + 6} className="comparison-cap" />
                <line x1={xFor(row.q3)} x2={xFor(row.q3)} y1={y - 6} y2={y + 6} className="comparison-cap" />
                <circle cx={xFor(row.value)} cy={y} r={isSelected ? 6 : 5} className="comparison-median" />
                <title>{`${stationLabel(stations.find((station) => station.stationId === row.stationId))}: median ${formatValue(row.value, unit)}, middle half ${formatValue(row.q1, unit)} to ${formatValue(row.q3, unit)}${isSelected ? "; selected station" : ""}`}</title>
              </g>;
            })}
          </svg>
        </div>
        <div className="comparison-compact" aria-label={`Compact ranked comparison showing ${compactRows.length} of ${comparableRows.length} supported sites`}>
          <p className="comparison-compact-heading">Compact ranked view · {compactRows.length} of {comparableRows.length} supported sites</p>
          {compactRows.map((row) => {
            const isSelected = row.stationId === selectedStationId;
            return <div className={isSelected ? "comparison-compact-row comparison-compact-row-selected" : "comparison-compact-row"} key={row.stationId}>
              <span>{stationLabel(stations.find((station) => station.stationId === row.stationId))}{isSelected ? " · selected" : ""}</span>
              <span>{formatValue(row.value, unit)} · IQR {formatValue(row.q1, unit)}–{formatValue(row.q3, unit)}</span>
            </div>;
          })}
          <p className="comparison-compact-note">Sorted by median. Inspect exact site values for the complete comparison.</p>
        </div>
        <div className="comparison-legend"><span><i className="comparison-legend-line" /> Middle half (IQR)</span><span><i className="comparison-legend-dot" /> Median</span><span>Selected station outlined</span></div>
        <details className="comparison-details"><summary>Inspect exact site values</summary><div className="comparison-table-wrap" tabIndex={0} role="region" aria-label="Exact cross-site values"><table className="observation-table comparison-table"><caption>Supported site summaries in {periodLabel}; other sites remain represented on the map.</caption><thead><tr><th scope="col">Monitoring site</th><th scope="col">Median ({unit ?? "unit"})</th><th scope="col">Middle half ({unit ?? "unit"})</th><th scope="col">Eligible records</th></tr></thead><tbody>{comparableRows.map((row) => <tr key={row.stationId}><td>{stationLabel(stations.find((station) => station.stationId === row.stationId))}{row.stationId === selectedStationId ? " · selected" : ""}</td><td>{formatValue(row.value, unit)}</td><td>{formatValue(row.q1, unit)}–{formatValue(row.q3, unit)}</td><td>{row.eligibleNumericCount}</td></tr>)}</tbody></table></div></details>
      </> : <p className="state-copy">Only one or no monitoring sites has a supported summary for this parameter and period. A cross-site comparison is not presented as a catchment-wide result.</p>}
    </section>
  );
}
