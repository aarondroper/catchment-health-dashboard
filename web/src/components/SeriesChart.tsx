import type { Observation } from "../contracts";

type SeriesChartProps = {
  observations: readonly Observation[];
  unit: string | null;
};

/** Small accessible SVG spike; table remains the authoritative text route. */
export function SeriesChart({ observations, unit }: SeriesChartProps) {
  const numeric = observations.filter((observation) => observation.value !== null);
  const max = Math.max(...numeric.map((observation) => observation.value ?? 0), 1);
  const points = numeric.map((observation, index) => {
    const x = 40 + index * 190;
    const y = 164 - ((observation.value ?? 0) / max) * 120;
    return `${x},${y}`;
  });

  return (
    <section className="panel chart-panel" aria-labelledby="series-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Analytical view spike</p>
          <h2 id="series-title">Selected-site series</h2>
        </div>
        <span className="unit-label">{unit ?? "unit pending"}</span>
      </div>
      <p className="panel-intro">Inline SVG is the initial charting approach: it keeps the first interaction surface typed, lightweight, and paired with a textual table.</p>
      <svg className="series-chart" viewBox="0 0 420 200" role="img" aria-labelledby="chart-title chart-desc">
        <title id="chart-title">Fixture observation series</title>
        <desc id="chart-desc">One numeric fixture observation is plotted. A censored fixture result is listed below but is not plotted as a numeric value.</desc>
        <line x1="40" y1="164" x2="400" y2="164" className="chart-axis" />
        <line x1="40" y1="44" x2="40" y2="164" className="chart-axis" />
        {points.length > 1 && <polyline points={points.join(" ")} className="chart-line" />}
        {numeric.map((observation, index) => {
          const x = 40 + index * 190;
          const y = 164 - ((observation.value ?? 0) / max) * 120;
          return <circle key={observation.observationId} cx={x} cy={y} r="5" className="chart-point" />;
        })}
        <text x="40" y="188" className="chart-label">{observations[0]?.observedAt.slice(0, 10)}</text>
        <text x="300" y="188" className="chart-label">{observations.at(-1)?.observedAt.slice(0, 10)}</text>
      </svg>
      <table className="observation-table">
        <caption>Fixture observations — source representation retained</caption>
        <thead><tr><th scope="col">Date</th><th scope="col">Result</th><th scope="col">Record state</th></tr></thead>
        <tbody>
          {observations.map((observation) => (
            <tr key={observation.observationId}>
              <td>{observation.observedAt.slice(0, 10)}</td>
              <td>{observation.resultText ?? "missing"} {observation.originalUnit ?? ""}</td>
              <td>{observation.censoring ?? "numeric fixture"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
