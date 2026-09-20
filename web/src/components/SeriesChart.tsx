import { createPortal } from "react-dom";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Observation } from "../contracts";
import { formatDate, formatNumber } from "../data/display";

type SeriesChartProps = {
  observations: readonly Observation[];
  unit: string | null;
  stationName: string;
  parameterName: string;
  periodStart: string;
  periodEnd: string;
  loading?: boolean;
};

function chartNumber(value: number): string {
  return formatNumber(value, Math.abs(value) >= 100 ? 0 : Math.abs(value) >= 1 ? 2 : 3);
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

function chartYear(time: number): string {
  return new Date(time).toISOString().slice(0, 4);
}

type ActivePoint = {
  id: string;
  element: SVGCircleElement;
};

type TooltipPosition = {
  left: number;
  top: number;
};

function tooltipPosition(anchor: DOMRect, tooltip: DOMRect, viewportWidth: number, viewportHeight: number): TooltipPosition {
  const margin = 8;
  const gap = 10;
  const maxLeft = Math.max(margin, viewportWidth - tooltip.width - margin);
  const centeredLeft = anchor.left + (anchor.width / 2) - (tooltip.width / 2);
  const left = Math.min(maxLeft, Math.max(margin, centeredLeft));
  const above = anchor.top - tooltip.height - gap;
  const below = anchor.bottom + gap;
  const top = above >= margin
    ? above
    : below + tooltip.height <= viewportHeight - margin
      ? below
      : Math.min(Math.max(margin, above), Math.max(margin, viewportHeight - tooltip.height - margin));
  return { left, top };
}

/** Accessible SVG series; the observation dialog remains the authoritative detail route. */
export function SeriesChart({ observations, unit, stationName, parameterName, periodStart, periodEnd, loading = false }: SeriesChartProps) {
  const [activePoint, setActivePoint] = useState<ActivePoint | null>(null);
  const [tooltipCoordinates, setTooltipCoordinates] = useState<TooltipPosition | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const [chartFrameElement, setChartFrameElement] = useState<HTMLDivElement | null>(null);
  const [chartSize, setChartSize] = useState({ width: 620, height: 270 });
  const numeric = observations.filter((observation) => observation.value !== null && observation.analysisEligible);
  const sortedNumeric = [...numeric].sort((first, second) => {
    const firstTime = Date.parse(first.observedAt);
    const secondTime = Date.parse(second.observedAt);
    if (Number.isFinite(firstTime) && Number.isFinite(secondTime) && firstTime !== secondTime) return firstTime - secondTime;
    if (Number.isFinite(firstTime) !== Number.isFinite(secondTime)) return Number.isFinite(firstTime) ? -1 : 1;
    return first.observationId.localeCompare(second.observationId);
  });
  const censoredCount = observations.filter((observation) => observation.valueKind === "censored").length;
  const nonNumericCount = observations.filter((observation) => observation.valueKind === "missing" || observation.valueKind === "non_numeric" || !observation.analysisEligible).length;
  const dated = sortedNumeric.map((observation) => ({ observation, time: Date.parse(observation.observedAt) })).filter((item) => Number.isFinite(item.time));
  const observedMinTime = dated.length > 0 ? Math.min(...dated.map((item) => item.time)) : 0;
  const observedMaxTime = dated.length > 0 ? Math.max(...dated.map((item) => item.time)) : 1;
  const periodStartTime = Date.parse(`${periodStart}T00:00:00Z`);
  const periodEndTime = Date.parse(`${periodEnd}T23:59:59.999Z`);
  const minTime = Number.isFinite(periodStartTime) ? Math.min(periodStartTime, observedMinTime) : observedMinTime;
  const maxTime = Number.isFinite(periodEndTime) ? Math.max(periodEndTime, observedMaxTime) : observedMaxTime;
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
  const points = sortedNumeric.map((observation, index) => `${xFor(observation, index)},${yFor(observation.value ?? 0)}`);
  const tickValues = [0, 1, 2, 3, 4].map((index) => minValue + (valueSpan * index) / 4);
  const dateTickCount = chartSize.width >= 1000 ? 6 : chartSize.width >= 500 ? 5 : 4;
  const compactDateLabels = chartSize.width < 650;
  const dateTicks = dated.length > 0 ? Array.from({ length: dateTickCount }, (_, index) => {
    const fraction = index / Math.max(dateTickCount - 1, 1);
    const time = minTime + timeSpan * fraction;
    return { x: plotLeft + fraction * plotWidth, time, label: compactDateLabels ? chartYear(time) : chartDate(time) };
  }) : [];
  const activeIndex = activePoint ? sortedNumeric.findIndex((observation) => observation.observationId === activePoint.id) : -1;
  const activeObservation = activeIndex >= 0 ? sortedNumeric[activeIndex] : undefined;

  const setChartFrameRef = useCallback((node: HTMLDivElement | null) => {
    setChartFrameElement(node);
  }, []);

  useLayoutEffect(() => {
    const frame = chartFrameElement;
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
  }, [chartFrameElement]);

  useEffect(() => {
    setActivePoint(null);
    setTooltipCoordinates(null);
  }, [observations, stationName, parameterName]);

  useEffect(() => {
    if (!activePoint || !activeObservation) {
      setTooltipCoordinates(null);
      return;
    }
    const updatePosition = () => {
      const tooltip = tooltipRef.current;
      if (!tooltip || !activePoint.element.isConnected) return;
      setTooltipCoordinates(tooltipPosition(activePoint.element.getBoundingClientRect(), tooltip.getBoundingClientRect(), globalThis.innerWidth, globalThis.innerHeight));
    };
    updatePosition();
    globalThis.window.addEventListener("resize", updatePosition);
    globalThis.window.addEventListener("scroll", updatePosition, true);
    return () => {
      globalThis.window.removeEventListener("resize", updatePosition);
      globalThis.window.removeEventListener("scroll", updatePosition, true);
    };
  }, [activePoint, activeObservation, chartSize]);

  useEffect(() => {
    if (!activePoint) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActivePoint(null);
    };
    globalThis.window.addEventListener("keydown", closeOnEscape);
    return () => globalThis.window.removeEventListener("keydown", closeOnEscape);
  }, [activePoint]);

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
      {numeric.length > 0 && <div className="series-chart-frame" ref={setChartFrameRef}>
        <svg className="series-chart" data-testid="history-chart" data-period-start={periodStart} data-period-end={periodEnd} width={chartSize.width} height={chartSize.height} viewBox={`0 0 ${chartSize.width} ${chartSize.height}`} role="group" aria-labelledby="chart-title" aria-describedby="chart-desc chart-accessibility">
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
        {sortedNumeric.map((observation, index) => {
          const value = observation.value ?? 0;
          const x = xFor(observation, index);
          const y = yFor(value);
          return <circle key={observation.observationId} cx={x} cy={y} r="5" className="chart-point" role="button" tabIndex={0} aria-describedby={activePoint?.id === observation.observationId && tooltipCoordinates ? "chart-tooltip" : undefined} aria-label={`${formatDate(observation.observedAt)} ${chartNumber(value)} ${unit ?? ""}; ${recordStateLabel(observation)}; ${qualityLabel(observation)}`} onMouseEnter={(event) => setActivePoint({ id: observation.observationId, element: event.currentTarget })} onMouseLeave={() => setActivePoint((current) => current?.id === observation.observationId ? null : current)} onFocus={(event) => setActivePoint({ id: observation.observationId, element: event.currentTarget })} onBlur={() => setActivePoint((current) => current?.id === observation.observationId ? null : current)} />;
        })}
        {dateTicks.map((tick) => <text key={tick.time} x={tick.x} y={chartSize.height - 10} textAnchor="middle" className="chart-label">{tick.label}</text>)}
        <text x={plotLeft} y="16" className="chart-unit-label">{unit ?? "Value"} · linear scale</text>
        </svg>
      </div>}
      {activeObservation && activePoint && createPortal(<div ref={tooltipRef} className="chart-tooltip" data-testid="chart-tooltip" role="tooltip" id="chart-tooltip" style={{ left: tooltipCoordinates?.left ?? 0, top: tooltipCoordinates?.top ?? 0, visibility: tooltipCoordinates ? "visible" : "hidden" }}><strong>{formatDate(activeObservation.observedAt)}</strong><span>{chartNumber(activeObservation.value ?? 0)} {unit ?? ""}</span><span>{recordStateLabel(activeObservation)}</span><span>{qualityLabel(activeObservation)}</span></div>, document.body)}
      <div className="chart-legend" aria-label="Chart record legend"><span><i className="legend-dot legend-dot-active" /> Eligible numeric</span><span><i className="legend-marker-censored" /> {censoredCount} censored retained in table</span><span>{nonNumericCount} missing or excluded</span></div>
      <p id="chart-accessibility" className="visually-hidden">Exact observation values and source quality details are available in the Recorded observations dialog opened by View all in Recent observations. The chart shows discrete sampled records; the connecting line is a visual guide.</p>
    </section>
  );
}
