async function fetchJob(id) {
  const base = process.env.APP_URL || "http://localhost:3000";
  const response = await fetch(`${base}/api/jobs/${id}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    return null;
  }
  const payload = await response.json();
  return payload.job;
}

function statusColor(status) {
  switch (status) {
    case "completed":
      return "#7df0ac";
    case "failed":
      return "#ff9ea8";
    default:
      return "#ffd479";
  }
}

export default async function JobPage({ params }) {
  const job = await fetchJob(params.id);

  if (!job) {
    return (
      <main style={{ maxWidth: 900, margin: "0 auto", padding: 40 }}>
        <h1>Job not found</h1>
        <p>The requested job does not exist.</p>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: 40 }}>
      <a href="/" style={{ color: "#8eb4ff" }}>← Back</a>
      <h1 style={{ fontSize: 36, marginBottom: 10 }}>Job {job.id}</h1>
      <p style={{ color: statusColor(job.status), fontWeight: 700 }}>
        {job.status.toUpperCase()} • {job.progress}%
      </p>

      <section style={{
        background: "#121933",
        border: "1px solid #24305e",
        borderRadius: 18,
        padding: 24,
        marginBottom: 24
      }}>
        <h2>Request</h2>
        <p><strong>Source type:</strong> {job.source_type}</p>
        <p><strong>Source URL:</strong> {job.source_url}</p>
        <p><strong>Requested outputs:</strong> {(job.requested_outputs || []).join(", ")}</p>
        {job.title ? <p><strong>Detected title:</strong> {job.title}</p> : null}
        {job.error_message ? <p style={{ color: "#ff9ea8" }}><strong>Error:</strong> {job.error_message}</p> : null}
      </section>

      <section style={{
        background: "#121933",
        border: "1px solid #24305e",
        borderRadius: 18,
        padding: 24,
        marginBottom: 24
      }}>
        <h2>Downloads</h2>
        {job.artifacts?.length ? (
          <ul>
            {job.artifacts.map((artifact) => (
              <li key={artifact.id} style={{ marginBottom: 8 }}>
                <a style={{ color: "#8eb4ff" }} href={`/api/jobs/${job.id}/download?path=${encodeURIComponent(artifact.file_path)}`}>
                  {artifact.file_name}
                </a>{" "}
                <span style={{ color: "#9fb1da" }}>({artifact.artifact_type}, {artifact.mime_type})</span>
              </li>
            ))}
          </ul>
        ) : (
          <p>No artifacts yet.</p>
        )}
      </section>

      <section style={{
        background: "#121933",
        border: "1px solid #24305e",
        borderRadius: 18,
        padding: 24
      }}>
        <h2>Transcript preview</h2>
        {job.transcript?.clean_text ? (
          <pre style={{
            whiteSpace: "pre-wrap",
            lineHeight: 1.6,
            color: "#dbe5ff",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace"
          }}>
            {job.transcript.clean_text}
          </pre>
        ) : (
          <p>Transcript not ready yet.</p>
        )}
      </section>
    </main>
  );
}
