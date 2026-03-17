import fs from "fs";
import shared from "@transcriber/shared";

const { getPool, getJobDir } = shared;

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "7", 10);
    if (days < 1 || days > 365) {
      return Response.json({ error: "days must be between 1 and 365." }, { status: 400 });
    }

    const pool = getPool();
    const result = await pool.query(`
      SELECT id FROM jobs
      WHERE status IN ('completed', 'failed')
        AND updated_at < NOW() - INTERVAL '${days} days'
    `);

    const jobIds = result.rows.map(r => r.id);
    let filesDeleted = 0, dbDeleted = 0, orphansDeleted = 0;

    for (const jobId of jobIds) {
      try {
        const jobDir = getJobDir(jobId);
        if (fs.existsSync(jobDir)) { fs.rmSync(jobDir, { recursive: true, force: true }); filesDeleted++; }
      } catch (err) { console.warn(`[cleanup] files ${jobId}:`, err.message); }
      await pool.query(`DELETE FROM jobs WHERE id = $1`, [jobId]);
      dbDeleted++;
    }

    try {
      const jobsDir = `${process.env.STORAGE_ROOT || "/data"}/jobs`;
      if (fs.existsSync(jobsDir)) {
        for (const dir of fs.readdirSync(jobsDir)) {
          const check = await pool.query(`SELECT id FROM jobs WHERE id = $1`, [dir]);
          if (check.rowCount === 0) {
            fs.rmSync(`${jobsDir}/${dir}`, { recursive: true, force: true });
            orphansDeleted++;
          }
        }
      }
    } catch (err) { console.warn("[cleanup] orphan error:", err.message); }

    return Response.json({
      success: true,
      jobs_deleted: dbDeleted,
      files_deleted: filesDeleted,
      orphans_deleted: orphansDeleted,
      message: `Removed ${dbDeleted} jobs older than ${days} days.`,
    }, { status: 200 });
  } catch (error) {
    console.error("Cleanup error:", error);
    return Response.json({ error: "Cleanup failed." }, { status: 500 });
  }
}
