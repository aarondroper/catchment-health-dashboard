import { useState } from "react";
import type { Observation } from "../contracts";

type SeriesChartProps = {
  observations: readonly Observation[];
  unit: string | null;
  stationName: string;
  parameterName: string;
  loading?: boolean;
};

function chartNumber(value: number): string {
  return value.toLocaleString(undefined, { maximumFractionDigits: Math.abs(value) >= 100 ? 0 : Math.abs(value) >= 1 ? 2 : 3 });
}

function observationStatus(observation: Observation): string {
  if (!observation.analysisEligible) return `Excluded — ${observation.qualityDisposition.replaceAll("_", " ")}`;
  if (observation.valueKind === "censored") return "Censored — reporting limit retained";
  if (observation.valueKind === "missing") return "Missing — not treated as zero";
  return "Observed numeric";
}

function qualityLabel(observation: Observation): string {
  if (observation.qualityDisposition === "published_unflagged") return "Published · no source code";
  if (observation.qualityDisposition === "retained_good_quality") return "Quality coded · good";
  if (observation.qualityDisposition === "retained_fair_quality") return "Quality coded · fair";
  return observation.qualityDisposition.replaceAll("_", " ");
}

/** Accessible SVG series; the table remains the authoritative detail route. */
export function SeriesChart({ observations, unit, stationName, parameterName, loading = false }: SeriesChartProps) {
  const [inspectedPoint, setInspectedPoint] = useState<string | null>(null);
  const numeric = observations.filter((observation) => observation.value !== null && observation.analysisEligible);
  const censoredCount = observations.filter((observation) => observation.valueKind === "censored").length;
  const nonNumericCount = observations.filter((observation) => observation.valueKind === "missing" || observation.valueKind === "non_numeric" || !observation.analysisEligible).length;
  const dated = numeric.map((observation) => ({ observation, time: Date.parse(observation.observedAt) })).filter((item) => Number.isFinite(item.time));
  const minTime = dated.length > 0 ? Math.min(...dated.map((item) => item.time)) : 0;
  const maxTime = dated.length > 0 ? Math.max(...dated.map((item) => item.time)) : 1;
  const timeSpan = Math.max(maxTime - minTime, 1);
  const values = numeric.map((observation) => observation.value ?? 0);
  const minValue = Math.min(...values, 0);
  const maxValue = Math.max(...values, 1);
  const valueSpan = Math.max(maxValue - minValue, 1);
  const xFor = (observation: Observation, index: number) => {
    const time = Date.parse(observation.observedAt);
    return 58 + (Number.isFinite(time) ? ((time - minTime) / timeSpan) * 492 : (index * 492) / Math.max(numeric.length - 1, 1));
  };
  const yFor = (value: number) => 216 - ((value - minValue) / valueSpan) * 166;
  const points = numeric.map((observation, index) => `${xFor(observation, index)},${yFor(observation.value ?? 0)}`);
  const tickValues = [0, 1, 2, 3, 4].map((index) => minValue + (valueSpan * index) / 4);
  const firstDate = observations[0]?.observedAt.slice(0, 10) ?? "";
  const lastDate = observations.at(-1)?.observedAt.slice(0, 10) ?? "";

  return (
    <section className="panel chart-panel" aria-labelledby="series-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Observed history</p>
          <h2 id="series-title">{stationName}</h2>
          <p className="panel-intro chart-context">{parameterName} · {observations.length} recorded observations in this period</p>
        </div>
        <span className="unit-label">{unit ?? "unit pending"}</span>
      </div>
      <p className="chart-explainer">Points are dated observations. The connecting line is a visual guide, not continuous monitoring. Linear scale; all eligible numeric values are shown.</p>
      {loading && <p className="empty-state" role="status" aria-live="polite">Loading this parameter’s observation detail…</p>}
      {observations.length === 0 && <p className="empty-state" role="status">No observations are available for this parameter and station in the selected period.</p>}
      {observations.length > 0 && numeric.length === 0 && <p className="empty-state" role="status">No eligible numeric observations are available to plot; inspect the retained table for censored or excluded records.</p>}
      {numeric.length > 0 && <svg className="series-chart" viewBox="0 0 620 270" role="img" aria-labelledby="chart-title chart-desc">
        <title id="chart-title">{parameterName} observations at {stationName}</title>
        <desc id="chart-desc">{numeric.length} eligible numeric observations on a linear scale from {chartNumber(minValue)} to {chartNumber(maxValue)} {unit ?? ""}. Censored, missing, and excluded results remain in the detail table.</desc>
        {tickValues.map((value, index) => {
          const y = yFor(value);
          return <g key={value}><line x1="58" x2="550" y1={y} y2={y} className="chart-gridline" /><text x="48" y={y + 4} textAnchor="end" className="chart-axis-label">{chartNumber(value)}</text><title>{index === 0 ? `Minimum scale ${chartNumber(value)}` : `Scale ${chartNumber(value)}`}</title></g>;
        })}
        <line x1="58" y1="50" x2="58" y2="216" className="chart-axis" />
        <line x1="58" y1="216" x2="550" y2="216" className="chart-axis" />
        {points.length > 1 && <polyline points={points.join(" ")} className="chart-line" />}
        {numeric.map((observation, index) => {
          const value = observation.value ?? 0;
          const x = xFor(observation, index);
          const y = yFor(value);
          return <circle key={observation.observationId} cx={x} cy={y} r="5" className="chart-point"><title>{`${observation.observedAt.slice(0, 10)} · ${chartNumber(value)} ${unit ?? ""}`}</title></circle>;
        })}
        <text x="58" y="244" className="chart-label">{firstDate}</text>
        <text x="550" y="244" textAnchor="end" className="chart-label">{lastDate}</text>
        <text x="58" y="31" className="chart-unit-label">{unit ?? "Value"} · linear scale</text>
      </svg>}
      <div className="chart-legend" aria-label="Chart record legend"><span><i className="legend-dot legend-dot-active" /> Eligible numeric</span><span><i className="legend-marker-censored" /> {censoredCount} censored retained in table</span><span>{nonNumericCount} missing or excluded</span></div>
      {numeric.length > 0 && <details className="chart-inspection"><summary>Inspect numeric points with keyboard</summary><div className="point-list">{numeric.map((observation) => <button key={observation.observationId} type="button" onFocus={() => setInspectedPoint(`${observation.observedAt.slice(0, 10)} · ${chartNumber(observation.value ?? 0)} ${unit ?? ""}`)} onClick={() => setInspectedPoint(`${observation.observedAt.slice(0, 10)} · ${chartNumber(observation.value ?? 0)} ${unit ?? ""}`)}>{observation.observedAt.slice(0, 10)} · {chartNumber(observation.value ?? 0)} {unit ?? ""}</button>)}</div>{inspectedPoint && <p className="point-status" role="status" aria-live="polite">Selected point: {inspectedPoint}</p>}</details>}
      <div className="observation-table-wrap" tabIndex={0} role="region" aria-label="Selected observation detail">
        <table className="observation-table compact-observation-table">
          <caption>Recorded observations · expand a row for source detail</caption>
          <thead><tr><th scope="col">Date</th><th scope="col">Reported result{unit ? ` (${unit})` : ""}</th><th scope="col">Quality/status</th><th scope="col">Record state</th></tr></thead>
          <tbody>
            {observations.map((observation) => (
              <tr key={observation.observationId}>
                <td>{observation.observedAt.slice(0, 10)}</td>
                <td>{observation.resultText ?? observation.value ?? "Missing"}</td>
                <td>{qualityLabel(observation)}</td>
                <td><details><summary>{observationStatus(observation)}</summary><div className="row-details"><span>Original: {observation.originalValue ?? observation.resultText ?? "missing"} {observation.originalUnit ?? ""}</span><span>Reporting limit: {observation.censorLimit ?? "not supplied"}</span><span>Source ID: <code>{observation.sourceRecordId}</code></span><span>Retrieved: {observation.sourceRetrievedAt}</span></div></details></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
