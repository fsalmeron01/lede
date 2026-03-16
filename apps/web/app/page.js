"use client";

import { useState, useEffect, useCallback } from "react";

const OUTPUT_OPTIONS = [
  { id: "mp3",  label: "MP3",  desc: "Audio file" },
  { id: "txt",  label: "TXT",  desc: "Plain text" },
  { id: "docx", label: "DOCX", desc: "Word document" },
];

function statusColor(status) {
  if (status === "completed") return "var(--green)";
  if (status === "failed")    return "var(--red)";
  return "var(--amber-light)";
}

function statusDot(status) {
  if (status === "completed") return "✓";
  if (status === "failed")    return "✕";
  return "●";
}

function relativeTime(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ago`;
  if (m > 0) return `${m}m ago`;
  return "just now";
}

export default function HomePage() {
  const [sourceUrl, setSourceUrl]   = useState("");
  const [outputs, setOutputs]       = useState({ mp3: false, txt: false, docx: true });
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  const [newJob, setNewJob]         = useState(null);
  const [jobs, setJobs]             = useState([]);
  const [jobsLoading, setJobsLoading] = useState(true);

  function toggle(name) {
    setOutputs((prev) => ({ ...prev, [name]: !prev[name] }));
  }

  const fetchJobs = useCallback(async () => {
    try {
      const res = await fetch("/api/jobs", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setJobs(data.jobs || []);
    } catch (e) {
      console.error(e);
    } finally {
      setJobsLoading(false);
    }
  }, []);

  // Load jobs on mount and poll every 8s
  useEffect(() => {
    fetchJobs();
    const t = setInterval(fetchJobs, 8000);
    return () => clearInterval(t);
  }, [fetchJobs]);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setNewJob(null);
    const selected = Object.entries(outputs).filter(([, v]) => v).map(([k]) => k);
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceUrl, outputs: selected }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Failed to create job.");
      setNewJob(payload.job);
      setSourceUrl("");
      // Immediately refresh the queue
      fetchJobs();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const activeJobs = jobs.filter(j => j.status !== "completed" && j.status !== "failed");
  const doneJobs   = jobs.filter(j => j.status === "completed" || j.status === "failed");

  return (
    <main style={{ minHeight: "100vh" }}>

      {/* Masthead */}
      <header style={{ borderBottom: "1px solid var(--rule)", padding: "18px 0" }}>
        <div style={{
          maxWidth: 860, margin: "0 auto", padding: "0 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{
              width: 36, height: 36, background: "var(--amber)", borderRadius: 4,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 18, color: "var(--ink)",
            }}>T</div>
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, letterSpacing: 0.3 }}>Camden Tribune</div>
              <div style={{ fontSize: 11, color: "var(--muted)", letterSpacing: 1, textTransform: "uppercase" }}>Media Intelligence</div>
            </div>
          </div>
          <div style={{
            fontSize: 11, color: "var(--muted)", letterSpacing: 1,
            textTransform: "uppercase", fontFamily: "var(--font-mono)",
            border: "1px solid var(--rule)", borderRadius: 4, padding: "4px 10px",
          }}>V1.1</div>
        </div>
      </header>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "64px 24px 80px" }}>

        {/* Hero */}
        <div className="fade-up" style={{
          fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: 2,
          textTransform: "uppercase", color: "var(--amber)",
          marginBottom: 20, borderBottom: "1px solid var(--amber-dim)",
          paddingBottom: 6, display: "inline-block",
        }}>
          YouTube &amp; Vimeo → Transcript + AI Article
        </div>

        <h1 className="fade-up fade-up-1" style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(42px, 7vw, 72px)",
          fontWeight: 900, lineHeight: 1.05,
          letterSpacing: "-0.02em", marginBottom: 20, color: "#fff",
        }}>
          Link to<br /><span style={{ color: "var(--amber)" }}>Transcript.</span>
        </h1>

        <p className="fade-up fade-up-2" style={{
          fontSize: 17, lineHeight: 1.7, color: "var(--text-dim)",
          maxWidth: 560, marginBottom: 48, fontWeight: 300,
        }}>
          Paste a public meeting, press conference, or interview URL.
          The system downloads the media, transcribes it, and generates
          a publication-ready article draft — automatically.
        </p>

        {/* Form */}
        <div className="fade-up fade-up-3" style={{
          background: "var(--charcoal)", border: "1px solid var(--rule)",
          borderRadius: 16, padding: "32px", position: "relative", overflow: "hidden",
          marginBottom: 48,
        }}>
          <div style={{
            position: "absolute", top: 0, right: 0, width: 120, height: 120,
            background: "radial-gradient(circle at top right, rgba(200,130,26,0.06), transparent 70%)",
            pointerEvents: "none",
          }} />

          <form onSubmit={handleSubmit}>
            <label style={{
              display: "block", fontFamily: "var(--font-mono)",
              fontSize: 11, letterSpacing: 2, textTransform: "uppercase",
              color: "var(--amber)", marginBottom: 10,
            }}>Source URL</label>

            <input
              type="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://vimeo.com/... or https://youtube.com/watch?v=..."
              required
              style={{
                width: "100%", padding: "14px 18px",
                background: "var(--ink)", border: "1px solid var(--charcoal-light)",
                borderRadius: 10, color: "#fff", fontSize: 15,
                fontFamily: "var(--font-mono)", marginBottom: 28,
                outline: "none", transition: "border-color 0.2s",
              }}
              onFocus={(e) => e.target.style.borderColor = "var(--amber)"}
              onBlur={(e) => e.target.style.borderColor = "var(--charcoal-light)"}
            />

            <label style={{
              display: "block", fontFamily: "var(--font-mono)",
              fontSize: 11, letterSpacing: 2, textTransform: "uppercase",
              color: "var(--amber)", marginBottom: 14,
            }}>Output Formats</label>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 32 }}>
              {OUTPUT_OPTIONS.map(({ id, label, desc }) => (
                <button key={id} type="button" onClick={() => toggle(id)} style={{
                  display: "flex", flexDirection: "column", alignItems: "flex-start",
                  padding: "12px 20px",
                  background: outputs[id] ? "rgba(200,130,26,0.12)" : "var(--ink)",
                  border: outputs[id] ? "1px solid var(--amber)" : "1px solid var(--charcoal-light)",
                  borderRadius: 10, cursor: "pointer",
                  color: outputs[id] ? "var(--amber-light)" : "var(--text-dim)",
                  transition: "all 0.15s", minWidth: 90,
                }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 14, fontWeight: 500, letterSpacing: 1, marginBottom: 2 }}>
                    {outputs[id] ? "✓ " : ""}{label}
                  </span>
                  <span style={{ fontSize: 11, color: "var(--muted)" }}>{desc}</span>
                </button>
              ))}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
              <button type="submit" disabled={loading} style={{
                padding: "14px 32px",
                background: loading ? "var(--charcoal-light)" : "var(--amber)",
                color: loading ? "var(--muted)" : "var(--ink)",
                border: "none", borderRadius: 10,
                fontFamily: "var(--font-body)", fontSize: 15, fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                letterSpacing: 0.3, transition: "all 0.15s",
                display: "flex", alignItems: "center", gap: 8,
              }}>
                {loading ? <><span className="pulsing">●</span> Creating job...</> : "→ Create Processing Job"}
              </button>
              <span style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5 }}>
                Only submit content you own<br />or are authorized to process.
              </span>
            </div>

            {error && (
              <div style={{
                marginTop: 20, padding: "12px 16px",
                background: "rgba(217,96,96,0.1)", border: "1px solid rgba(217,96,96,0.3)",
                borderRadius: 8, color: "var(--red)", fontSize: 14,
                fontFamily: "var(--font-mono)",
              }}>✕ {error}</div>
            )}
          </form>
        </div>

        {/* Job Queue */}
        <div>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginBottom: 20,
          }}>
            <span style={{
              fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: 2,
              textTransform: "uppercase", color: "var(--amber)",
              borderBottom: "1px solid var(--amber-dim)", paddingBottom: 4,
            }}>
              Job Queue
            </span>
            {activeJobs.length > 0 && (
              <span style={{
                fontFamily: "var(--font-mono)", fontSize: 11,
                color: "var(--amber-light)", letterSpacing: 1,
              }}>
                <span className="pulsing">●</span> {activeJobs.length} active
              </span>
            )}
          </div>

          {jobsLoading ? (
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--muted)", letterSpacing: 1 }}>
              LOADING...
            </p>
          ) : jobs.length === 0 ? (
            <div style={{
              padding: "32px 24px", textAlign: "center",
              border: "1px dashed var(--rule)", borderRadius: 12,
            }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--muted)", letterSpacing: 1 }}>
                NO JOBS YET — SUBMIT A URL ABOVE
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {jobs.map((j) => {
                const isActive = j.status !== "completed" && j.status !== "failed";
                const isNew = newJob?.id === j.id;
                return (
                  <a
                    key={j.id}
                    href={`/jobs/${j.id}`}
                    style={{
                      display: "flex", alignItems: "center", gap: 16,
                      padding: "16px 20px",
                      background: isNew ? "rgba(200,130,26,0.06)" : "var(--charcoal)",
                      border: isNew ? "1px solid var(--amber-dim)" : "1px solid var(--rule)",
                      borderRadius: 12,
                      textDecoration: "none",
                      transition: "border-color 0.15s, background 0.15s",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "var(--charcoal-light)";
                      e.currentTarget.style.background = "var(--charcoal-mid)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = isNew ? "var(--amber-dim)" : "var(--rule)";
                      e.currentTarget.style.background = isNew ? "rgba(200,130,26,0.06)" : "var(--charcoal)";
                    }}
                  >
                    {/* Status dot */}
                    <div style={{
                      width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                      background: "var(--ink)",
                      border: `1px solid ${statusColor(j.status)}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: statusColor(j.status),
                      fontSize: 14,
                    }}>
                      <span className={isActive ? "pulsing" : ""}>{statusDot(j.status)}</span>
                    </div>

                    {/* Title + URL */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontFamily: j.summary?.headline ? "var(--font-display)" : "var(--font-body)",
                        fontSize: j.summary?.headline ? 15 : 14,
                        fontWeight: 600,
                        color: "#fff",
                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                        marginBottom: 3,
                      }}>
                        {j.summary?.headline || j.title || j.source_url}
                      </div>
                      <div style={{
                        fontFamily: "var(--font-mono)", fontSize: 11,
                        color: "var(--muted)", letterSpacing: 0.5,
                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                      }}>
                        {j.source_type.toUpperCase()} · {(j.requested_outputs || []).join(", ").toUpperCase()}
                      </div>
                    </div>

                    {/* Progress + time */}
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{
                        fontFamily: "var(--font-mono)", fontSize: 12,
                        color: statusColor(j.status),
                        fontWeight: 600, marginBottom: 3,
                      }}>
                        {j.status === "completed" ? "DONE" : j.status === "failed" ? "FAILED" : `${j.progress}%`}
                      </div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", letterSpacing: 0.5 }}>
                        {relativeTime(j.created_at)}
                      </div>
                    </div>

                    {/* Arrow */}
                    <div style={{ color: "var(--muted)", fontSize: 16, flexShrink: 0 }}>→</div>
                  </a>
                );
              })}
            </div>
          )}
        </div>

        {/* Feature row */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 16, marginTop: 64,
          borderTop: "1px solid var(--rule)", paddingTop: 40,
        }}>
          {[
            { icon: "⬇", label: "Auto-download",  desc: "YouTube & Vimeo via yt-dlp" },
            { icon: "◎", label: "Transcription",   desc: "Whisper speech-to-text" },
            { icon: "✦", label: "AI Article Draft",desc: "Claude generates the story" },
            { icon: "⬡", label: "SRT / VTT",       desc: "Subtitle files included" },
          ].map(({ icon, label, desc }) => (
            <div key={label} style={{ padding: "16px 0" }}>
              <div style={{ fontSize: 20, marginBottom: 8, color: "var(--amber)" }}>{icon}</div>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>

      <footer style={{
        borderTop: "1px solid var(--rule)", padding: "20px 24px",
        maxWidth: 860, margin: "0 auto",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        flexWrap: "wrap", gap: 8,
      }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)", letterSpacing: 1 }}>CAMDEN TRIBUNE MEDIA TOOLS</span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)", letterSpacing: 1 }}>LINK-TO-TRANSCRIPT V1.1</span>
      </footer>
    </main>
  );
}
