"use strict";

const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const POLL_INTERVAL = 15000;

const CONTENT_MODES = {
  "camden-tribune": {
    label: "Camden Tribune",
    instruction: "You are writing for Camden Tribune, an independent local news outlet covering Camden County, NC. Apply AP style. Focus on taxpayer impact, government accountability, and local community stakes. The audience is Camden County residents, voters, and taxpayers.",
  },
  "meeting": {
    label: "Public Meeting",
    instruction: "This is a public meeting recording. Focus on decisions made, votes taken, dollar amounts, and public impact. Document who said what. AP style.",
  },
  "interview": {
    label: "Interview",
    instruction: "This is an interview. Extract the key narrative, most compelling quotes, and main takeaways. Structure as a profile or Q&A-inspired article.",
  },
  "podcast": {
    label: "Podcast",
    instruction: "This is a podcast episode. Summarize the main topics discussed, key insights, and notable quotes. Tone: engaging and accessible.",
  },
  "news": {
    label: "News",
    instruction: "This is general news content. Apply standard AP style journalism. Lead with the most newsworthy fact. Attribute all claims.",
  },
  "generic": {
    label: "Generic",
    instruction: "Produce a clean, accurate summary and article draft from this content. Use clear, professional language.",
  },
};

async function getPendingJob() {
  const result = await pool.query(`
    SELECT j.id, j.title, j.content_mode, t.clean_text, t.language
    FROM jobs j
    JOIN transcripts t ON t.job_id = j.id
    LEFT JOIN summaries s ON s.job_id = j.id
    WHERE j.status = 'generating-article'
      AND t.clean_text IS NOT NULL
      AND t.clean_text != ''
      AND s.id IS NULL
    ORDER BY j.updated_at ASC
    LIMIT 1
  `);
  return result.rows[0] || null;
}

function buildPrompt(job) {
  const mode = CONTENT_MODES[job.content_mode] || CONTENT_MODES["generic"];
  return `You are the Camden Tribune Smart Mode v2 AI editor — a veteran local newsroom editor.

CONTENT MODE: ${mode.label}
${mode.instruction}

VIDEO TITLE: ${job.title || "Unknown"}

TRANSCRIPT:
${job.clean_text.substring(0, 7000)}

---

INSTRUCTIONS:

1. Detect the story mode:
   breaking_news | government_watch | investigative | public_safety | education_beat |
   election_campaign | community_event | seasonal_feature | restaurant_feature |
   human_interest | obituary_memorial | hidden_gem

2. Apply the 7-point writing audit before finalizing the article:
   - No explanation addiction — report, don't lecture
   - No talking heads — quotes grounded in events
   - No POV drift — every sentence traces to fact
   - Stakes landed within 3 paragraphs
   - Two-sentence paragraph cap
   - Start at impact, not background
   - No overwriting — strong verbs, earned adjectives

3. Return ONLY a valid JSON object with EXACTLY these fields. No markdown, no code fences:

{
  "mode": "government_watch",
  "mode_emoji": "🏛️",
  "mode_label": "Government Watch",
  "headline": "Compelling headline under 12 words",
  "subtitle": "Supporting subheadline under 20 words",
  "summary": "3-4 sentence factual summary of what happened and why it matters.",
  "newspack_excerpt": "1-2 sentence homepage preview under 160 characters.",
  "article": "Full AP-style article. Each paragraph separated by blank line. Two-sentence cap. Lead with action. Include named sources, dollar amounts, vote counts. 600-1000 words for government/education, 300-500 for breaking/safety.",
  "key_quotes": ["Exact verbatim quote 1", "Exact verbatim quote 2", "Exact verbatim quote 3"],
  "categories": ["Local & Regional News", "Government", "Camden County"],
  "tags": ["Camden County", "Board of Commissioners"],
  "yoast": {
    "seo_title": "Under 60 chars",
    "slug": "keyword-rich-slug",
    "meta_description": "Under 155 chars",
    "focus_keyphrase": "primary keyphrase",
    "keyphrase_in_intro": true,
    "keyphrase_in_meta": true,
    "keyphrase_in_slug": true
  },
  "headline_heat_score": 82,
  "headline_heat_label": "⚡ Strong",
  "seo_strength_score": 8,
  "legal_risk_level": "low",
  "legal_flags": [],
  "readability": {
    "two_sentence_cap": true,
    "active_voice": true,
    "no_speculation": true,
    "attribution_present": true,
    "pacing": "Good",
    "grade_level": "Grade 10",
    "tone": "Firm, factual, taxpayer-focused"
  },
  "photo_guidance": "Suggested photo description, framing, mood, and credit guidance."
}`;
}

async function callClaude(job) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [{ role: "user", content: buildPrompt(job) }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Anthropic API ${response.status}: ${err}`);
  }

  const data = await response.json();
  const text = data.content[0].text.trim()
    .replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
  return JSON.parse(text);
}

async function saveSummary(jobId, r) {
  await pool.query(`
    INSERT INTO summaries (
      job_id, mode, mode_emoji,
      headline, subtitle, summary_text, newspack_excerpt, article_draft, key_quotes_json,
      categories_json, tags_json, yoast_json,
      headline_heat_score, headline_heat_label, seo_strength_score,
      legal_risk_level, legal_flags_json, readability_json, photo_guidance
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10::jsonb,$11::jsonb,$12::jsonb,$13,$14,$15,$16,$17::jsonb,$18::jsonb,$19)
    ON CONFLICT (job_id) DO UPDATE SET
      mode=EXCLUDED.mode, mode_emoji=EXCLUDED.mode_emoji,
      headline=EXCLUDED.headline, subtitle=EXCLUDED.subtitle,
      summary_text=EXCLUDED.summary_text, newspack_excerpt=EXCLUDED.newspack_excerpt,
      article_draft=EXCLUDED.article_draft, key_quotes_json=EXCLUDED.key_quotes_json,
      categories_json=EXCLUDED.categories_json, tags_json=EXCLUDED.tags_json,
      yoast_json=EXCLUDED.yoast_json,
      headline_heat_score=EXCLUDED.headline_heat_score, headline_heat_label=EXCLUDED.headline_heat_label,
      seo_strength_score=EXCLUDED.seo_strength_score,
      legal_risk_level=EXCLUDED.legal_risk_level, legal_flags_json=EXCLUDED.legal_flags_json,
      readability_json=EXCLUDED.readability_json, photo_guidance=EXCLUDED.photo_guidance,
      updated_at=NOW()
  `, [
    jobId,
    r.mode || "generic", r.mode_emoji || "📰",
    r.headline, r.subtitle,
    r.summary, r.newspack_excerpt,
    r.article,
    JSON.stringify(r.key_quotes || []),
    JSON.stringify(r.categories || []),
    JSON.stringify(r.tags || []),
    JSON.stringify(r.yoast || {}),
    r.headline_heat_score, r.headline_heat_label,
    r.seo_strength_score,
    r.legal_risk_level || "unknown",
    JSON.stringify(r.legal_flags || []),
    JSON.stringify(r.readability || {}),
    r.photo_guidance,
  ]);

  // Mark job completed
  await pool.query(
    `UPDATE jobs SET status = 'completed', progress = 100 WHERE id = $1`,
    [jobId]
  );
}

async function processJob(job) {
  console.log(`[llm] Job ${job.id} — mode: ${job.content_mode} — "${job.title}"`);
  if (!ANTHROPIC_API_KEY) {
    console.warn("[llm] ANTHROPIC_API_KEY not set — marking complete without analysis.");
    await pool.query(`UPDATE jobs SET status='completed', progress=100 WHERE id=$1`, [job.id]);
    return;
  }
  try {
    const result = await callClaude(job);
    await saveSummary(job.id, result);
    console.log(`[llm] ✓ ${job.id} — "${result.headline}" Heat:${result.headline_heat_score} SEO:${result.seo_strength_score}/9 Legal:${result.legal_risk_level}`);
  } catch (err) {
    console.error(`[llm] ✕ ${job.id}:`, err.message);
    await pool.query(
      `INSERT INTO summaries (job_id, headline, mode) VALUES ($1,'Analysis unavailable','error') ON CONFLICT (job_id) DO NOTHING`,
      [job.id]
    );
    await pool.query(`UPDATE jobs SET status='completed', progress=100 WHERE id=$1`, [job.id]);
  }
}

async function poll() {
  try {
    const job = await getPendingJob();
    if (job) await processJob(job);
  } catch (err) {
    console.error("[llm] Poll error:", err.message);
  }
  setTimeout(poll, POLL_INTERVAL);
}

async function boot() {
  let retries = 15;
  while (retries > 0) {
    try { await pool.query("SELECT 1"); break; }
    catch {
      retries--;
      if (retries === 0) { process.exit(1); }
      await new Promise(r => setTimeout(r, 3000));
    }
  }
  console.log(`[llm] Smart Mode v2 active. Modes: ${Object.keys(CONTENT_MODES).join(", ")}`);
  poll();
}

boot();
