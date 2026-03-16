"use client";

import { useState, useEffect, useCallback } from "react";

const OUTPUT_OPTIONS = [
  { id: "mp3",  label: "MP3",  desc: "Audio file" },
  { id: "txt",  label: "TXT",  desc: "Plain text" },
  { id: "docx", label: "DOCX", desc: "Word document" },
];

function statusColor(s) {
  if (s === "completed") return "var(--green)";
  if (s === "failed")    return "var(--red-err)";
  return "var(--ct-blue-light)";
}
function statusDot(s) {
  if (s === "completed") return "✓";
  if (s === "failed")    return "✕";
  return "●";
}
function relativeTime(d) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const dy = Math.floor(h / 24);
  if (dy > 0) return `${dy}d ago`;
  if (h  > 0) return `${h}h ago`;
  if (m  > 0) return `${m}m ago`;
  return "just now";
}

export default function HomePage() {
  const [sourceUrl, setSourceUrl] = useState("");
  const [outputs, setOutputs]     = useState({ mp3: false, txt: false, docx: true });
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [newJob, setNewJob]       = useState(null);
  const [jobs, setJobs]           = useState([]);
  const [jobsLoading, setJobsLoading] = useState(true);

  function toggle(name) {
    setOutputs(p => ({ ...p, [name]: !p[name] }));
  }

  const fetchJobs = useCallback(async () => {
    try {
      const res = await fetch("/api/jobs", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setJobs(data.jobs || []);
    } catch (e) { console.error(e); }
    finally { setJobsLoading(false); }
  }, []);

  useEffect(() => {
    fetchJobs();
    const t = setInterval(fetchJobs, 8000);
    return () => clearInterval(t);
  }, [fetchJobs]);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true); setError(""); setNewJob(null);
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
      fetchJobs();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const activeJobs = jobs.filter(j => j.status !== "completed" && j.status !== "failed");

  return (
    <main style={{ minHeight: "100vh" }}>

      {/* Masthead — Camden Tribune style */}
      <header style={{
        background: "var(--ct-blue-dark)",
        borderBottom: "3px solid var(--ct-red)",
        padding: "0",
      }}>
        <div style={{
          maxWidth: 860, margin: "0 auto", padding: "14px 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* Camden Tribune wordmark */}
            <div style={{ lineHeight: 1 }}>
              <div style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10, letterSpacing: 3,
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.6)",
                marginBottom: 2,
              }}>Camden</div>
              <div style={{
                fontFamily: "var(--font-display)",
                fontSize: 22, fontWeight: 900,
                color: "#fff",
                letterSpacing: "-0.01em",
                lineHeight: 1,
              }}>Tribune</div>
            </div>
            <div style={{ width: 1, height: 32, background: "rgba(255,255,255,0.2)" }} />
            {/* Lede wordmark */}
            <div style={{
              fontFamily: "var(--font-display)",
              fontSize: 20, fontWeight: 700,
              fontStyle: "italic",
              color: "rgba(255,255,255,0.9)",
              letterSpacing: "-0.01em",
            }}>Lede</div>
          </div>
          <div style={{
            fontFamily: "var(--font-mono)", fontSize: 10,
            color: "rgba(255,255,255,0.4)", letterSpacing: 1.5,
            textTransform: "uppercase",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 4, padding: "4px 10px",
          }}>V1.1</div>
        </div>
      </header>

      {/* Red rule accent */}
      <div style={{ height: 3, background: "var(--ct-red)", opacity: 0.15 }} />

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "56px 24px 80px" }}>

        {/* Hero */}
        <div className="fade-up" style={{
          fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: 2,
          textTransform: "uppercase", color: "var(--ct-blue-light)",
          marginBottom: 20, borderBottom: "1px solid var(--ct-blue-dark)",
          paddingBottom: 6, display: "inline-block",
        }}>
          YouTube &amp; Vimeo → Transcript + AI Article
        </div>

        <h1 className="fade-up fade-up-1" style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(52px, 9vw, 92px)",
          fontWeight: 900, fontStyle: "italic",
          lineHeight: 0.95, letterSpacing: "-0.03em",
          marginBottom: 8, color: "#fff",
        }}>Lede.</h1>

        <p className="fade-up fade-up-1" style={{
          fontFamily: "var(--font-display)",
          fontSize: 17, fontStyle: "italic",
          color: "var(--ct-red-light)",
          marginBottom: 24, letterSpacing: 0.1,
        }}>Don't bury the lede.</p>

        <p className="fade-up fade-up-2" style={{
          fontSize: 16, lineHeight: 1.8, color: "var(--text-dim)",
          maxWidth: 520, marginBottom: 52, fontWeight: 300,
        }}>
          Paste a public meeting, press conference, or interview URL.
          Lede downloads the media, transcribes it with Whisper, and
          generates a publication-ready article draft using Claude AI.
        </p>

        {/* Form card */}
        <div className="fade-up fade-up-3" style={{
          background: "var(--charcoal)",
          border: "1px solid var(--rule)",
          borderTop: "2px solid var(--ct-blue)",
          borderRadius: 16, padding: "32px",
          position: "relative", overflow: "hidden",
          marginBottom: 48,
        }}>
          <div style={{
            position: "absolute", top: 0, right: 0, width: 180, height: 180,
            background: "radial-gradient(circle at top right, rgba(74,109,140,0.08), transparent 65%)",
            pointerEvents: "none",
          }} />

          <form onSubmit={handleSubmit}>
            <label style={{
              display: "block", fontFamily: "var(--font-mono)",
              fontSize: 11, letterSpacing: 2, textTransform: "uppercase",
              color: "var(--ct-blue-light)", marginBottom: 10,
            }}>Source URL</label>

            <input
              type="url" value={sourceUrl}
              onChange={e => setSourceUrl(e.target.value)}
              placeholder="https://vimeo.com/... or https://youtube.com/watch?v=..."
              required
              style={{
                width: "100%", padding: "14px 18px",
                background: "var(--ink)",
                border: "1px solid var(--charcoal-light)",
                borderRadius: 10, color: "#fff", fontSize: 15,
                fontFamily: "var(--font-mono)", marginBottom: 28,
                outline: "none", transition: "border-color 0.2s",
              }}
              onFocus={e => e.target.style.borderColor = "var(--ct-blue)"}
              onBlur={e  => e.target.style.borderColor = "var(--charcoal-light)"}
            />

            <label style={{
              display: "block", fontFamily: "var(--font-mono)",
              fontSize: 11, letterSpacing: 2, textTransform: "uppercase",
              color: "var(--ct-blue-light)", marginBottom: 14,
            }}>Output Formats</label>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 32 }}>
              {OUTPUT_OPTIONS.map(({ id, label, desc }) => (
                <button key={id} type="button" onClick={() => toggle(id)} style={{
                  display: "flex", flexDirection: "column", alignItems: "flex-start",
                  padding: "12px 20px",
                  background: outputs[id] ? "rgba(74,109,140,0.15)" : "var(--ink)",
                  border: outputs[id] ? "1px solid var(--ct-blue)" : "1px solid var(--charcoal-light)",
                  borderRadius: 10, cursor: "pointer",
                  color: outputs[id] ? "var(--ct-blue-light)" : "var(--text-dim)",
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
                background: loading ? "var(--charcoal-light)" : "var(--ct-blue-dark)",
                color: loading ? "var(--muted)" : "#fff",
                border: loading ? "1px solid var(--charcoal-light)" : "1px solid var(--ct-blue)",
                borderRadius: 10, fontFamily: "var(--font-body)",
                fontSize: 15, fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                letterSpacing: 0.2, transition: "all 0.15s",
                display: "flex", alignItems: "center", gap: 8,
              }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.background = "var(--ct-blue)"; }}
                onMouseLeave={e => { if (!loading) e.currentTarget.style.background = "var(--ct-blue-dark)"; }}
              >
                {loading ? <><span className="pulsing">●</span> Filing story...</> : "→ File Story"}
              </button>
              <span style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5, fontFamily: "var(--font-mono)" }}>
                Only submit content you own<br />or are authorized to process.
              </span>
            </div>

            {error && (
              <div style={{
                marginTop: 20, padding: "12px 16px",
                background: "rgba(200,80,80,0.08)",
                border: "1px solid rgba(200,80,80,0.3)",
                borderRadius: 8, color: "var(--red-err)",
                fontSize: 13, fontFamily: "var(--font-mono)",
              }}>✕ {error}</div>
            )}
          </form>
        </div>

        {/* Story Queue */}
        <div>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginBottom: 20,
          }}>
            <span style={{
              fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: 2,
              textTransform: "uppercase", color: "var(--ct-blue-light)",
              borderBottom: "1px solid var(--ct-blue-dark)", paddingBottom: 4,
            }}>Story Queue</span>
            {activeJobs.length > 0 && (
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ct-blue-light)", letterSpacing: 1 }}>
                <span className="pulsing">● </span>{activeJobs.length} in progress
              </span>
            )}
          </div>

          {jobsLoading ? (
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--muted)", letterSpacing: 1 }}>LOADING...</p>
          ) : jobs.length === 0 ? (
            <div style={{
              padding: "40px 24px", textAlign: "center",
              border: "1px dashed var(--rule)", borderRadius: 12,
            }}>
              <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 32, color: "var(--rule)", marginBottom: 12 }}>¶</div>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)", letterSpacing: 1.5 }}>
                NO STORIES FILED YET
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {jobs.map(j => {
                const isActive = j.status !== "completed" && j.status !== "failed";
                const isNew = newJob?.id === j.id;
                return (
                  <a key={j.id} href={`/jobs/${j.id}`} style={{
                    display: "flex", alignItems: "center", gap: 16,
                    padding: "16px 20px",
                    background: isNew ? "rgba(74,109,140,0.07)" : "var(--charcoal)",
                    border: isNew ? "1px solid var(--ct-blue-dark)" : "1px solid var(--rule)",
                    borderRadius: 12, textDecoration: "none",
                    transition: "all 0.15s",
                  }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = "var(--ct-blue)";
                      e.currentTarget.style.background = "var(--charcoal-mid)";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = isNew ? "var(--ct-blue-dark)" : "var(--rule)";
                      e.currentTarget.style.background = isNew ? "rgba(74,109,140,0.07)" : "var(--charcoal)";
                    }}
                  >
                    <div style={{
                      width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                      background: "var(--ink)", border: `1px solid ${statusColor(j.status)}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: statusColor(j.status), fontSize: 14,
                    }}>
                      <span className={isActive ? "pulsing" : ""}>{statusDot(j.status)}</span>
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontFamily: j.summary?.headline ? "var(--font-display)" : "var(--font-body)",
                        fontStyle: j.summary?.headline ? "italic" : "normal",
                        fontSize: j.summary?.headline ? 15 : 14,
                        fontWeight: 600, color: "#fff",
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

                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{
                        fontFamily: "var(--font-mono)", fontSize: 12,
                        color: statusColor(j.status), fontWeight: 600, marginBottom: 3,
                      }}>
                        {j.status === "completed" ? "READY" : j.status === "failed" ? "FAILED" : `${j.progress}%`}
                      </div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", letterSpacing: 0.5 }}>
                        {relativeTime(j.created_at)}
                      </div>
                    </div>

                    <div style={{ color: "var(--muted)", fontSize: 16, flexShrink: 0 }}>→</div>
                  </a>
                );
              })}
            </div>
          )}
        </div>

        {/* Feature strip */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 16, marginTop: 64,
          borderTop: "1px solid var(--rule)", paddingTop: 40,
        }}>
          {[
            { icon: "⬇", label: "Download",     desc: "YouTube & Vimeo via yt-dlp" },
            { icon: "◎", label: "Transcribe",    desc: "Whisper speech-to-text" },
            { icon: "✦", label: "Article Draft", desc: "Claude writes the story" },
            { icon: "⬡", label: "SRT / VTT",     desc: "Subtitle files included" },
          ].map(({ icon, label, desc }) => (
            <div key={label} style={{ padding: "16px 0" }}>
              <div style={{ fontSize: 20, marginBottom: 8, color: "var(--ct-blue-light)" }}>{icon}</div>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>

      <footer style={{
        borderTop: "1px solid var(--rule)", padding: "20px 24px",
        maxWidth: 860, margin: "0 auto",
        display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 14, color: "var(--ct-blue-light)", fontWeight: 700 }}>Lede</span>
          <span style={{ color: "var(--rule)" }}>·</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", letterSpacing: 1 }}>CAMDEN TRIBUNE</span>
        </div>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", letterSpacing: 1 }}>V1.1 · EST. 2026</span>
      </footer>
    </main>
  );
}
