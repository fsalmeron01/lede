"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";

const POLL_INTERVAL = 5000;

function statusLabel(status) {
  const map = { queued: "QUEUED", fetching: "FETCHING", transcribing: "TRANSCRIBING", completed: "COMPLETE", failed: "FAILED" };
  return map[status] || status.toUpperCase();
}
function statusColor(status) {
  if (status === "completed") return "var(--green)";
  if (status === "failed") return "var(--red-err)";
  return "var(--ct-blue-light)";
}

function Rule() {
  return <div style={{ borderTop: "1px solid var(--rule)", margin: "28px 0" }} />;
}

function Tag({ children, color = "var(--muted)" }) {
  return (
    <span style={{
      fontFamily: "var(--font-mono)",
      fontSize: 10, letterSpacing: 2,
      textTransform: "uppercase",
      color,
      borderBottom: `1px solid ${color}`,
      paddingBottom: 3,
      display: "inline-block",
      marginBottom: 16,
      opacity: 0.9,
    }}>{children}</span>
  );
}

function DownloadPill({ href, label, ext }) {
  const colors = {
    mp3: "#e87e4a", txt: "#6db888", docx: "#6b9ae8",
    srt: "var(--ct-blue-light)", vtt: "var(--ct-blue-light)",
  };
  const c = colors[ext] || "var(--text-dim)";
  return (
    <a href={href} style={{
      display: "inline-flex", alignItems: "center", gap: 8,
      padding: "8px 16px",
      background: "var(--ink)",
      border: `1px solid ${c}`,
      borderRadius: 8,
      color: c,
      fontSize: 13,
      fontFamily: "var(--font-mono)",
      fontWeight: 500,
      textDecoration: "none",
      marginRight: 10, marginBottom: 10,
      transition: "background 0.15s",
    }}>
      ↓ {label}
    </a>
  );
}

function CopyBtn({ text, label = "Copy" }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      style={{
        background: "transparent", border: "1px solid var(--rule)",
        color: copied ? "var(--green)" : "var(--muted)",
        borderRadius: 6, padding: "4px 12px",
        cursor: "pointer", fontSize: 12,
        fontFamily: "var(--font-mono)", letterSpacing: 0.5,
        transition: "all 0.15s",
      }}
    >
      {copied ? "✓ Copied" : label}
    </button>
  );
}

function Tab({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      background: "none", border: "none",
      borderBottom: active ? "2px solid var(--ct-blue-light)" : "2px solid transparent",
      color: active ? "var(--ct-blue-light)" : "var(--text-dim)",
      padding: "10px 20px",
      cursor: "pointer",
      fontFamily: "var(--font-body)",
      fontSize: 14, fontWeight: active ? 600 : 400,
      transition: "all 0.15s",
    }}>{label}</button>
  );
}

export default function JobPage() {
  const params = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("transcript");

  const fetchJob = useCallback(async () => {
    try {
      const res = await fetch(`/api/jobs/${params.id}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setJob(data.job);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [params.id]);

  useEffect(() => { fetchJob(); }, [fetchJob]);

  useEffect(() => {
    if (!job) return;
    const done = (job.status === "completed" || job.status === "failed") && job.summary;
    if (done) return;
    const t = setInterval(fetchJob, POLL_INTERVAL);
    return () => clearInterval(t);
  }, [job, fetchJob]);

  if (loading) return (
    <main style={{ maxWidth: 860, margin: "0 auto", padding: "80px 24px" }}>
      <p style={{ fontFamily: "var(--font-mono)", color: "var(--muted)", letterSpacing: 1 }}>LOADING...</p>
    </main>
  );

  if (!job) return (
    <main style={{ maxWidth: 860, margin: "0 auto", padding: "80px 24px" }}>
      <a href="/" style={{ color: "var(--ct-blue-light)", fontFamily: "var(--font-mono)", fontSize: 13 }}>← Back</a>
      <h1 style={{ fontFamily: "var(--font-display)", marginTop: 24 }}>Job not found</h1>
    </main>
  );

  const isActive = job.status !== "completed" && job.status !== "failed";
  const hasSRT = Array.isArray(job.transcript?.segments_json) && job.transcript.segments_json.length > 0;
  const hasSummary = !!job.summary?.headline;

  return (
    <main style={{ maxWidth: 860, margin: "0 auto", padding: "0 24px 80px" }}>

      {/* Header bar */}
      <div style={{
        borderBottom: "1px solid var(--rule)",
        padding: "18px 0",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 48,
      }}>
        <a href="/" style={{
          fontFamily: "var(--font-mono)", fontSize: 12,
          letterSpacing: 1, color: "var(--muted)",
          textDecoration: "none",
        }}>← LEDE</a>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{
            fontFamily: "var(--font-mono)", fontSize: 11,
            color: statusColor(job.status),
            letterSpacing: 2,
          }}>
            {isActive && <span className="pulsing">● </span>}
            {statusLabel(job.status)} {job.progress}%
          </span>
          {isActive && (
            <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--muted)", letterSpacing: 1 }}>
              AUTO-REFRESH ON
            </span>
          )}
        </div>
      </div>

      {/* Headline block */}
      <div style={{ marginBottom: 48, animation: "fadeUp 0.5s ease both" }}>
        {hasSummary ? (
          <>
            <Tag color="var(--ct-blue-light)">AI Analysis Complete</Tag>
            <h1 style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(28px, 5vw, 52px)",
              fontWeight: 900, lineHeight: 1.1,
              letterSpacing: "-0.02em",
              color: "#fff",
              marginBottom: 12,
            }}>{job.summary.headline}</h1>
            {job.summary.subtitle && (
              <p style={{ fontSize: 18, color: "var(--text-dim)", fontWeight: 300, lineHeight: 1.5 }}>
                {job.summary.subtitle}
              </p>
            )}
          </>
        ) : (
          <>
            <Tag>{job.source_type.toUpperCase()} JOB</Tag>
            <h1 style={{
              fontFamily: "var(--font-display)",
              fontSize: 32, fontWeight: 700,
              color: "var(--text-dim)",
              marginBottom: 8,
            }}>
              {job.title || `Job ${job.id.slice(0, 8)}...`}
            </h1>
            {isActive && (
              <p style={{ fontSize: 14, color: "var(--muted)", fontFamily: "var(--font-mono)", letterSpacing: 0.5 }}>
                {job.status === "fetching" && "Downloading media..."}
                {job.status === "transcribing" && "Running Whisper transcription..."}
                {job.status === "queued" && "Waiting in queue..."}
              </p>
            )}
            {!hasSummary && job.status === "completed" && (
              <p style={{ fontSize: 13, color: "var(--ct-blue-light)", fontFamily: "var(--font-mono)", letterSpacing: 0.5 }}>
                ✦ AI analysis in progress...
              </p>
            )}
          </>
        )}
      </div>

      {/* SEO blurb */}
      {job.summary?.seo_description && (
        <div style={{
          padding: "14px 20px",
          background: "var(--charcoal)",
          border: "1px solid var(--rule)",
          borderLeft: "3px solid var(--ct-blue-dark)",
          borderRadius: "0 10px 10px 0",
          marginBottom: 32,
          display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16,
        }}>
          <p style={{ fontSize: 14, color: "var(--text-dim)", lineHeight: 1.6, margin: 0 }}>
            {job.summary.seo_description}
          </p>
          <CopyBtn text={job.summary.seo_description} label="Copy SEO" />
        </div>
      )}

      {/* Source info */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: 16, marginBottom: 36,
      }}>
        {[
          { label: "Source", value: job.source_type.toUpperCase() },
          { label: "Outputs", value: (job.requested_outputs || []).join(", ").toUpperCase() },
          { label: "Language", value: job.transcript?.language?.toUpperCase() || "—" },
        ].map(({ label, value }) => (
          <div key={label} style={{
            padding: "16px 20px",
            background: "var(--charcoal)",
            border: "1px solid var(--rule)",
            borderRadius: 10,
          }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: 2, color: "var(--muted)", marginBottom: 6, textTransform: "uppercase" }}>{label}</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 14, color: "var(--text)" }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Downloads */}
      {(job.artifacts?.length > 0 || hasSRT) && (
        <>
          <Tag>Downloads</Tag>
          <div style={{ marginBottom: 36 }}>
            {job.artifacts?.map((a) => {
              const ext = a.file_name.split(".").pop().toLowerCase();
              return (
                <DownloadPill
                  key={a.id}
                  href={`/api/jobs/${job.id}/download?path=${encodeURIComponent(a.file_path)}`}
                  label={a.file_name}
                  ext={ext}
                />
              );
            })}
            {hasSRT && (
              <>
                <DownloadPill href={`/api/jobs/${job.id}/download?format=srt`} label="transcript.srt" ext="srt" />
                <DownloadPill href={`/api/jobs/${job.id}/download?format=vtt`} label="transcript.vtt" ext="vtt" />
              </>
            )}
          </div>
        </>
      )}

      {/* Tabbed content */}
      {(job.transcript || job.summary) && (
        <>
          <div style={{ borderBottom: "1px solid var(--rule)", marginBottom: 28, display: "flex", gap: 0 }}>
            <Tab label="Transcript" active={tab === "transcript"} onClick={() => setTab("transcript")} />
            <Tab
              label={hasSummary ? "✦ Article Draft" : "Article Draft"}
              active={tab === "article"}
              onClick={() => setTab("article")}
            />
            <Tab
              label={`Key Quotes${job.summary?.key_quotes_json?.length ? ` (${job.summary.key_quotes_json.length})` : ""}`}
              active={tab === "quotes"}
              onClick={() => setTab("quotes")}
            />
          </div>

          {/* TRANSCRIPT */}
          {tab === "transcript" && (
            <div>
              {job.transcript?.clean_text ? (
                <>
                  <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
                    <CopyBtn text={job.transcript.clean_text} label="Copy transcript" />
                  </div>
                  <pre style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 13,
                    lineHeight: 1.9,
                    color: "var(--text-dim)",
                    whiteSpace: "pre-wrap",
                    background: "var(--charcoal)",
                    border: "1px solid var(--rule)",
                    borderRadius: 12,
                    padding: 24,
                    maxHeight: 600,
                    overflowY: "auto",
                  }}>
                    {job.transcript.clean_text}
                  </pre>
                </>
              ) : (
                <p style={{ color: "var(--muted)", fontFamily: "var(--font-mono)", fontSize: 13 }}>
                  {isActive ? "Transcript will appear here once processing completes..." : "No transcript available."}
                </p>
              )}
            </div>
          )}

          {/* ARTICLE DRAFT */}
          {tab === "article" && (
            <div>
              {job.summary?.article_draft ? (
                <>
                  <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
                    <CopyBtn text={job.summary.article_draft} label="Copy article" />
                  </div>
                  {job.summary.summary_text && (
                    <div style={{
                      padding: "16px 20px",
                      background: "rgba(200,130,26,0.05)",
                      borderLeft: "3px solid var(--ct-blue-dark)",
                      borderRadius: "0 10px 10px 0",
                      marginBottom: 28,
                    }}>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: 2, color: "var(--ct-blue-dark)", marginBottom: 8, textTransform: "uppercase" }}>Summary</div>
                      <p style={{ color: "var(--text-dim)", lineHeight: 1.7, fontSize: 15, margin: 0 }}>{job.summary.summary_text}</p>
                    </div>
                  )}
                  <div style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 16, lineHeight: 1.85,
                    color: "var(--text)",
                    columns: "1",
                    maxWidth: 680,
                  }}>
                    {job.summary.article_draft.split("\n\n").filter(Boolean).map((para, i) => (
                      <p key={i} style={{ marginBottom: 20, textAlign: "justify" }}>{para}</p>
                    ))}
                  </div>
                </>
              ) : (
                <p style={{ color: "var(--muted)", fontFamily: "var(--font-mono)", fontSize: 13 }}>
                  {job.status === "completed"
                    ? "✦ AI article draft is being generated... check back in a moment."
                    : "Article draft will be generated after transcription completes."}
                </p>
              )}
            </div>
          )}

          {/* KEY QUOTES */}
          {tab === "quotes" && (
            <div>
              {job.summary?.key_quotes_json?.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {job.summary.key_quotes_json.map((quote, i) => (
                    <div key={i} style={{
                      padding: "20px 24px",
                      background: "var(--charcoal)",
                      borderLeft: "3px solid var(--green)",
                      borderRadius: "0 12px 12px 0",
                      display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16,
                    }}>
                      <p style={{
                        fontFamily: "var(--font-display)",
                        fontSize: 17, lineHeight: 1.6,
                        color: "var(--text)",
                        fontStyle: "italic",
                        margin: 0, flex: 1,
                      }}>
                        "{quote}"
                      </p>
                      <CopyBtn text={`"${quote}"`} />
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: "var(--muted)", fontFamily: "var(--font-mono)", fontSize: 13 }}>
                  {job.status === "completed"
                    ? "Key quotes are being extracted..."
                    : "Key quotes will appear after transcription completes."}
                </p>
              )}
            </div>
          )}
        </>
      )}

      {/* Error state */}
      {job.error_message && (
        <>
          <Rule />
          <div style={{
            padding: "14px 20px",
            background: "rgba(217,96,96,0.06)",
            border: "1px solid rgba(217,96,96,0.2)",
            borderRadius: 10,
            color: "var(--red-err)",
            fontFamily: "var(--font-mono)",
            fontSize: 13,
          }}>
            ✕ {job.error_message}
          </div>
        </>
      )}

      {/* Footer */}
      <Rule />
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", letterSpacing: 1 }}>
          JOB ID: {job.id}
        </span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", letterSpacing: 1 }}>
          LEDE · CAMDEN TRIBUNE
        </span>
      </div>
    </main>
  );
}
