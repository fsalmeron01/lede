"use client";

import { useState } from "react";

const cardStyle = {
  background: "#121933",
  border: "1px solid #24305e",
  borderRadius: 18,
  padding: 24,
  boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
};

export default function HomePage() {
  const [sourceUrl, setSourceUrl] = useState("");
  const [outputs, setOutputs] = useState({
    mp3: true,
    txt: true,
    docx: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [job, setJob] = useState(null);

  function toggle(name) {
    setOutputs((prev) => ({ ...prev, [name]: !prev[name] }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setJob(null);

    const selected = Object.entries(outputs)
      .filter(([, value]) => value)
      .map(([key]) => key);

    try {
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sourceUrl,
          outputs: selected,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Failed to create job.");
      }

      setJob(payload.job);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "48px 20px" }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{
          display: "inline-block",
          padding: "8px 12px",
          borderRadius: 999,
          border: "1px solid #2e3b72",
          background: "#10172d",
          fontSize: 12,
          letterSpacing: 0.3
        }}>
          V1 • Coolify-ready • YouTube/Vimeo → MP3/TXT/DOCX
        </div>
        <h1 style={{ fontSize: 42, marginBottom: 12 }}>Link to Transcript</h1>
        <p style={{ color: "#b5c1e2", fontSize: 18, lineHeight: 1.6 }}>
          Paste a YouTube or Vimeo link, choose your outputs, and submit a job.
          The system downloads media, extracts audio, runs transcription, and
          generates downloadable artifacts.
        </p>
      </div>

      <section style={cardStyle}>
        <form onSubmit={handleSubmit}>
          <label htmlFor="sourceUrl" style={{ display: "block", marginBottom: 10, fontWeight: 700 }}>
            Source URL
          </label>
          <input
            id="sourceUrl"
            type="url"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=... or https://vimeo.com/..."
            style={{
              width: "100%",
              padding: "14px 16px",
              borderRadius: 12,
              border: "1px solid #33447c",
              background: "#0c1326",
              color: "#fff",
              fontSize: 16,
              boxSizing: "border-box",
              marginBottom: 18,
            }}
            required
          />

          <div style={{ marginBottom: 18 }}>
            <div style={{ marginBottom: 10, fontWeight: 700 }}>Requested outputs</div>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              {["mp3", "txt", "docx"].map((name) => (
                <label
                  key={name}
                  style={{
                    border: "1px solid #33447c",
                    borderRadius: 999,
                    padding: "10px 14px",
                    cursor: "pointer",
                    background: outputs[name] ? "#1a2750" : "#0d1427",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={outputs[name]}
                    onChange={() => toggle(name)}
                    style={{ marginRight: 8 }}
                  />
                  {name.toUpperCase()}
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              border: 0,
              borderRadius: 14,
              padding: "14px 18px",
              background: "#5b7cff",
              color: "#fff",
              fontWeight: 700,
              cursor: "pointer",
              minWidth: 180
            }}
          >
            {loading ? "Creating job..." : "Create processing job"}
          </button>
        </form>

        {error ? (
          <p style={{ color: "#ff9ea8", marginTop: 18 }}>{error}</p>
        ) : null}

        <p style={{ color: "#9fb1da", marginTop: 18, lineHeight: 1.6 }}>
          Only submit content you own or are authorized to process.
        </p>
      </section>

      {job ? (
        <section style={{ ...cardStyle, marginTop: 24 }}>
          <h2 style={{ marginTop: 0 }}>Job created</h2>
          <p style={{ lineHeight: 1.7 }}>
            <strong>ID:</strong> {job.id}<br />
            <strong>Status:</strong> {job.status}<br />
            <strong>Progress:</strong> {job.progress}%
          </p>
          <a
            href={`/jobs/${job.id}`}
            style={{ color: "#8eb4ff", fontWeight: 700 }}
          >
            Open job details
          </a>
        </section>
      ) : null}
    </main>
  );
}
