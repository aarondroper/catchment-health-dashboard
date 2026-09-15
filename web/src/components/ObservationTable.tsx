import type { Observation } from "../contracts";

type ObservationTableProps = {
  observations: readonly Observation[];
  unit: string | null;
};

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

export function ObservationTable({ observations, unit }: ObservationTableProps) {
  return (
    <section className="panel observation-panel" aria-labelledby="observation-title">
      <div className="panel-heading">
        <div>
          <h2 id="observation-title">Recorded observations</h2>
          <p className="panel-intro">Concise results are shown here; expand a row or use CSV export for source detail.</p>
        </div>
        <span className="unit-label">{unit ?? "unit pending"}</span>
      </div>
      <div className="observation-table-wrap" tabIndex={0} role="region" aria-label="Selected observation detail">
        <table className="observation-table compact-observation-table">
          <caption>Recorded observations for the selected station · {observations.length.toLocaleString()} rows · reported result unit: {unit ?? "not supplied"}</caption>
          <thead><tr><th scope="col">Date</th><th scope="col">Reported result</th><th scope="col">Quality/status</th><th scope="col">Record state</th></tr></thead>
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
