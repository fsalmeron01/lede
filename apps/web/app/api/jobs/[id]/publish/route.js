import shared from "@transcriber/shared";

const { getJob, getPool } = shared;

function articleToHTML(text) {
  if (!text) return "";
  return text.split("\n\n").filter(p => p.trim())
    .map(p => `<p>${p.trim().replace(/\n/g, " ")}</p>`).join("\n");
}

export async function POST(_request, { params }) {
  try {
    const job = await getJob(params.id);
    if (!job) return Response.json({ error: "Job not found." }, { status: 404 });
    if (!job.summary?.article_draft) return Response.json({ error: "No article draft available yet." }, { status: 400 });

    const wpUrl  = process.env.WP_URL;
    const wpUser = process.env.WP_USERNAME;
    const wpPass = process.env.WP_APP_PASSWORD;

    if (!wpUrl || !wpUser || !wpPass) {
      return Response.json({
        error: "WordPress not configured. Add WP_URL, WP_USERNAME, and WP_APP_PASSWORD to your environment variables in Coolify."
      }, { status: 503 });
    }

    const s     = job.summary;
    const yoast = s.yoast_json || {};

    const postPayload = {
      title:   s.headline || job.title || "Untitled",
      content: articleToHTML(s.article_draft),
      excerpt: s.newspack_excerpt || s.summary_text || "",
      status:  "draft",
      meta: {
        _yoast_wpseo_title:    yoast.seo_title || "",
        _yoast_wpseo_metadesc: yoast.meta_description || "",
        _yoast_wpseo_focuskw:  yoast.focus_keyphrase || "",
      },
    };

    const credentials = Buffer.from(`${wpUser}:${wpPass}`).toString("base64");
    const wpRes = await fetch(`${wpUrl}/wp-json/wp/v2/posts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${credentials}`,
      },
      body: JSON.stringify(postPayload),
    });

    if (!wpRes.ok) {
      const errText = await wpRes.text();
      throw new Error(`WordPress API ${wpRes.status}: ${errText}`);
    }

    const wpPost = await wpRes.json();
    const pool = getPool();
    await pool.query(
      `INSERT INTO publish_log (job_id, target_type, status, wp_post_id, wp_post_url)
       VALUES ($1, 'wordpress', 'published', $2, $3)`,
      [params.id, wpPost.id, wpPost.link]
    );

    return Response.json({
      success: true,
      wp_post_id:  wpPost.id,
      wp_post_url: wpPost.link,
      wp_edit_url: `${wpUrl}/wp-admin/post.php?post=${wpPost.id}&action=edit`,
    }, { status: 200 });

  } catch (error) {
    console.error("WordPress publish error:", error);
    try {
      const pool = getPool();
      await pool.query(
        `INSERT INTO publish_log (job_id, target_type, status, error_message) VALUES ($1,'wordpress','failed',$2)`,
        [params.id, error.message]
      );
    } catch {}
    return Response.json({ error: error.message }, { status: 500 });
  }
}
