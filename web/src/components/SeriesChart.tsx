import { useEffect, useRef, useState } from "react";
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

function recordStateLabel(observation: Observation): string {
  if (observation.valueKind === "censored") return "Censored; reporting limit retained";
  if (observation.valueKind === "missing") return "Missing; not treated as zero";
  if (!observation.analysisEligible) return `Excluded; ${observation.exclusionReason ?? "not analytically eligible"}`;
  return "Observed numeric";
}

function qualityLabel(observation: Observation): string {
  if (observation.qualityDisposition === "published_unflagged") return "Published observation; no source quality code supplied";
  if (observation.qualityFlag) return `Quality code ${observation.qualityFlag}`;
  return observation.qualityDisposition.replaceAll("_", " ");
}

function chartDate(time: number): string {
  return new Date(time).toISOString().slice(0, 7);
}

/** Accessible SVG series; the observation dialog remains the authoritative detail route. */
export function SeriesChart({ observations, unit, stationName, parameterName, loading = false }: SeriesChartProps) {
  const [activePointId, setActivePointId] = useState<string | null>(null);
  const chartFrameRef = useRef<HTMLDivElement | null>(null);
  const [chartSize, setChartSize] = useState({ width: 620, height: 270 });
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
  const plotLeft = Math.max(42, Math.min(58, chartSize.width * 0.06));
  const plotRight = Math.max(14, Math.min(22, chartSize.width * 0.02));
  const plotTop = 22;
  const plotBottom = 28;
  const plotWidth = Math.max(chartSize.width - plotLeft - plotRight, 1);
  const plotHeight = Math.max(chartSize.height - plotTop - plotBottom, 1);
  const xFor = (observation: Observation, index: number) => {
    const time = Date.parse(observation.observedAt);
    return plotLeft + (Number.isFinite(time) ? ((time - minTime) / timeSpan) * plotWidth : (index * plotWidth) / Math.max(numeric.length - 1, 1));
  };
  const yFor = (value: number) => plotTop + plotHeight - ((value - minValue) / valueSpan) * plotHeight;
  const points = numeric.map((observation, index) => `${xFor(observation, index)},${yFor(observation.value ?? 0)}`);
  const tickValues = [0, 1, 2, 3, 4].map((index) => minValue + (valueSpan * index) / 4);
  const dateTickCount = chartSize.width >= 1000 ? 6 : chartSize.width >= 650 ? 5 : 4;
  const dateTicks = dated.length > 0 ? Array.from({ length: dateTickCount }, (_, index) => {
    const fraction = index / Math.max(dateTickCount - 1, 1);
    const time = minTime + (maxTime - minTime) * fraction;
    return { x: plotLeft + fraction * plotWidth, label: chartDate(time) };
  }) : [];
  const activeIndex = activePointId ? numeric.findIndex((observation) => observation.observationId === activePointId) : -1;
  const activeObservation = activeIndex >= 0 ? numeric[activeIndex] : undefined;
  const activeX = activeObservation ? xFor(activeObservation, activeIndex) : 0;
  const activeY = activeObservation ? yFor(activeObservation.value ?? 0) : 0;
  const tooltipPosition = activeObservation ? {
    left: `${Math.min(90, Math.max(10, (activeX / chartSize.width) * 100))}%`,
    top: `${Math.max(35, (activeY / chartSize.height) * 100)}%`,
  } : undefined;

  useEffect(() => {
    const frame = chartFrameRef.current;
    if (!frame) return;
    const measure = () => {
      const bounds = frame.getBoundingClientRect();
      const next = { width: Math.max(320, Math.round(bounds.width)), height: Math.max(150, Math.round(bounds.height)) };
      setChartSize((current) => current.width === next.width && current.height === next.height ? current : next);
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="panel chart-panel" aria-labelledby="series-title">
      <div className="panel-heading">
        <div>
          <h2 id="series-title">Time series</h2>
          <p className="chart-station">{stationName}</p>
          <p className="panel-intro chart-context">{parameterName} · {observations.length} recorded observations in this period</p>
        </div>
      </div>
      {loading && <p className="empty-state" role="status" aria-live="polite">Loading this parameter’s observation detail…</p>}
      {observations.length === 0 && <p className="empty-state" role="status">No observations are available for this parameter and station in the selected period.</p>}
      {observations.length > 0 && numeric.length === 0 && <p className="empty-state" role="status">No eligible numeric observations are available to plot; inspect the retained table for censored or excluded records.</p>}
      {numeric.length > 0 && <div className="series-chart-frame" ref={chartFrameRef}>
        <svg className="series-chart" data-testid="history-chart" width={chartSize.width} height={chartSize.height} viewBox={`0 0 ${chartSize.width} ${chartSize.height}`} role="img" aria-labelledby="chart-title" aria-describedby="chart-desc chart-accessibility">
        <title id="chart-title">{parameterName} observations at {stationName}</title>
        <desc id="chart-desc">{numeric.length} eligible numeric observations on a linear scale from {chartNumber(minValue)} to {chartNumber(maxValue)} {unit ?? ""}. Censored, missing, and excluded results remain in the detail table.</desc>
        <rect data-testid="history-plot" className="chart-plot-area" x={plotLeft} y={plotTop} width={plotWidth} height={plotHeight} rx="3" />
        {tickValues.map((value, index) => {
          const y = yFor(value);
          return <g key={value}><line x1={plotLeft} x2={plotLeft + plotWidth} y1={y} y2={y} className="chart-gridline" /><text x={plotLeft - 9} y={y + 4} textAnchor="end" className="chart-axis-label">{chartNumber(value)}</text><title>{index === 0 ? `Minimum scale ${chartNumber(value)}` : `Scale ${chartNumber(value)}`}</title></g>;
        })}
        <line x1={plotLeft} y1={plotTop} x2={plotLeft} y2={plotTop + plotHeight} className="chart-axis" />
        <line x1={plotLeft} y1={plotTop + plotHeight} x2={plotLeft + plotWidth} y2={plotTop + plotHeight} className="chart-axis" />
        {points.length > 1 && <polyline points={points.join(" ")} className="chart-line" />}
        {numeric.map((observation, index) => {
          const value = observation.value ?? 0;
          const x = xFor(observation, index);
          const y = yFor(value);
          return <circle key={observation.observationId} cx={x} cy={y} r="5" className="chart-point" onMouseEnter={() => setActivePointId(observation.observationId)} onMouseLeave={() => setActivePointId(null)} />;
        })}
        {dateTicks.map((tick) => <text key={tick.label} x={tick.x} y={chartSize.height - 10} textAnchor="middle" className="chart-label">{tick.label}</text>)}
        <text x={plotLeft} y="16" className="chart-unit-label">{unit ?? "Value"} · linear scale</text>
        </svg>
        {activeObservation && tooltipPosition && <div className="chart-tooltip" data-testid="chart-tooltip" role="tooltip" style={tooltipPosition}><strong>{activeObservation.observedAt.slice(0, 10)}</strong><span>{chartNumber(activeObservation.value ?? 0)} {unit ?? ""}</span><span>{recordStateLabel(activeObservation)}</span><span>{qualityLabel(activeObservation)}</span></div>}
      </div>}
      <div className="chart-legend" aria-label="Chart record legend"><span><i className="legend-dot legend-dot-active" /> Eligible numeric</span><span><i className="legend-marker-censored" /> {censoredCount} censored retained in table</span><span>{nonNumericCount} missing or excluded</span></div>
      <p id="chart-accessibility" className="visually-hidden">Exact observation values and source quality details are available in the Recorded observations dialog opened by View all in Recent observations. The chart shows discrete sampled records; the connecting line is a visual guide.</p>
    </section>
  );
}
