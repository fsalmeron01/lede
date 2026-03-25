import fs from "fs";
import path from "path";
import shared from "@transcriber/shared";

const { getJob, getPool, getQueue, MEDIA_QUEUE_NAME, getJobDir } = shared;

export async function GET(_request, { params }) {
  try {
    const job = await getJob(params.id);
    if (!job) return Response.json({ error: "Job not found." }, { status: 404 });
    return Response.json({ job }, { status: 200 });
  } catch (error) {
    console.error("GET /api/jobs/[id] error:", error);
    return Response.json({ error: "Unable to load job." }, { status: 500 });
  }
}

// DELETE — remove job, artifacts, transcript, summary, and files from disk
export async function DELETE(_request, { params }) {
  try {
    const pool = getPool();

    // Get job first to find file path
    const jobRes = await pool.query(`SELECT id FROM jobs WHERE id = $1`, [params.id]);
    if (jobRes.rowCount === 0) {
      return Response.json({ error: "Job not found." }, { status: 404 });
    }

    // Delete files from disk
    try {
      const jobDir = getJobDir(params.id);
      if (fs.existsSync(jobDir)) {
        fs.rmSync(jobDir, { recursive: true, force: true });
      }
    } catch (fsErr) {
      console.warn(`[delete] Could not remove files for job ${params.id}:`, fsErr.message);
    }

    // Delete from DB (cascades to artifacts, transcripts, summaries, publish_log)
    await pool.query(`DELETE FROM jobs WHERE id = $1`, [params.id]);

    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("DELETE /api/jobs/[id] error:", error);
    return Response.json({ error: "Unable to delete job." }, { status: 500 });
  }
}

// PATCH — unstick a stuck job by re-queuing it
export async function PATCH(request, { params }) {
  try {
    const body = await request.json();
    const action = body?.action;

    const pool = getPool();
    const jobRes = await pool.query(`SELECT * FROM jobs WHERE id = $1`, [params.id]);
    if (jobRes.rowCount === 0) {
      return Response.json({ error: "Job not found." }, { status: 404 });
    }

    // Re-run just the LLM worker (regenerate article + social posts)
    if (action === "regenerate") {
      // Delete existing summary so LLM worker picks it up again
      await pool.query(`DELETE FROM summaries WHERE job_id = $1`, [params.id]);
      await pool.query(
        `UPDATE jobs SET status = 'generating-article', progress = 88, error_message = NULL WHERE id = $1`,
        [params.id]
      );
      return Response.json({ success: true, status: "generating-article" }, { status: 200 });
    }

    // Re-run full pipeline from scratch
    if (action === "unstick") {
      await pool.query(
        `UPDATE jobs SET status = 'queued', progress = 0, error_message = NULL WHERE id = $1`,
        [params.id]
      );
      const mediaQueue = getQueue(MEDIA_QUEUE_NAME);
      await mediaQueue.add("process-media", { jobId: params.id }, {
        removeOnComplete: 100,
        removeOnFail: 100,
      });
      return Response.json({ success: true, status: "queued" }, { status: 200 });
    }

    return Response.json({ error: "Unknown action." }, { status: 400 });
  } catch (error) {
    console.error("PATCH /api/jobs/[id] error:", error);
    return Response.json({ error: "Unable to unstick job." }, { status: 500 });
  }
}
