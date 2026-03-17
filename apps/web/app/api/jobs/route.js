import shared from "@transcriber/shared";

const { createJob, detectSourceType, getQueue, MEDIA_QUEUE_NAME, validateSourceUrl, getPool } = shared;

export async function GET() {
  try {
    const pool = getPool();
    const result = await pool.query(`
      SELECT j.id, j.title, j.source_url, j.source_type, j.status, j.progress,
             j.content_mode, j.requested_outputs, j.error_message, j.created_at,
             s.headline
      FROM jobs j
      LEFT JOIN summaries s ON s.job_id = j.id
      ORDER BY j.created_at DESC
      LIMIT 50
    `);
    return Response.json({ jobs: result.rows }, { status: 200 });
  } catch (error) {
    console.error("GET /api/jobs error:", error);
    return Response.json({ error: "Unable to load jobs." }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const sourceUrl = body?.sourceUrl?.trim();
    const outputs = Array.isArray(body?.outputs) ? body.outputs : [];
    const contentMode = body?.contentMode || "camden-tribune";

    const allowedOutputs = ["mp3", "txt", "docx"];
    const requestedOutputs = outputs.filter(v => allowedOutputs.includes(v));

    if (requestedOutputs.length === 0) {
      return Response.json({ error: "Select at least one output." }, { status: 400 });
    }

    const validationError = validateSourceUrl(sourceUrl);
    if (validationError) {
      return Response.json({ error: validationError }, { status: 400 });
    }

    const sourceType = detectSourceType(sourceUrl);
    const job = await createJob({ sourceUrl, sourceType, requestedOutputs, contentMode });

    const mediaQueue = getQueue(MEDIA_QUEUE_NAME);
    await mediaQueue.add("process-media", { jobId: job.id }, {
      removeOnComplete: 100,
      removeOnFail: 100,
    });

    return Response.json({ job }, { status: 201 });
  } catch (error) {
    console.error("POST /api/jobs error:", error);
    return Response.json({ error: "Unable to create job." }, { status: 500 });
  }
}
