const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const { Worker } = require("bullmq");
const { createClient } = require("redis");
const {
  MEDIA_QUEUE_NAME,
  getDownloadsDir,
  getJob,
  getPool,
  getRedisConnection,
  getWorkingDir,
  insertArtifact,
  updateJob,
} = require("@transcriber/shared");

const TRANSCRIBE_LIST_KEY = "transcribe:jobs";

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ["ignore", "pipe", "pipe"],
      ...options,
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`${command} exited with ${code}\n${stderr}`));
        return;
      }
      resolve({ stdout, stderr });
    });
  });
}

async function detectTitleAndFilename(sourceUrl, outputTemplate) {
  const result = await runCommand("yt-dlp", [
    "--print",
    "%(title)s",
    "--get-filename",
    "-o",
    outputTemplate,
    sourceUrl,
  ]);
  const lines = result.stdout.trim().split("\n").filter(Boolean);
  const title = lines[0] || null;
  const filename = lines[1] || null;
  return { title, filename };
}

async function enqueueTranscriptionJob(payload) {
  const client = createClient({ url: process.env.REDIS_URL || "redis://redis:6379" });
  await client.connect();
  try {
    await client.lPush(TRANSCRIBE_LIST_KEY, JSON.stringify(payload));
  } finally {
    await client.quit();
  }
}

async function processMediaJob(jobPayload) {
  const { jobId } = jobPayload.data;
  const job = await getJob(jobId);
  if (!job) throw new Error(`Job ${jobId} not found.`);

  const workDir = getWorkingDir(jobId);
  const downloadsDir = getDownloadsDir(jobId);

  try {
    await updateJob(jobId, { status: "fetching", progress: 10 });

    const outputTemplate = path.join(workDir, "source.%(ext)s");
    const { title } = await detectTitleAndFilename(job.source_url, outputTemplate);
    await updateJob(jobId, { title });

    await runCommand("yt-dlp", [
      "-f",
      process.env.YTDLP_FORMAT || "bestaudio/best",
      "-o",
      outputTemplate,
      job.source_url,
    ]);

    const downloadedFiles = fs.readdirSync(workDir).map((name) => path.join(workDir, name));
    const sourcePath = downloadedFiles.find((file) => fs.statSync(file).isFile());
    if (!sourcePath) {
      throw new Error("No source media file was downloaded.");
    }

    await updateJob(jobId, { status: "extracting-audio", progress: 45 });

    const mp3Path = path.join(downloadsDir, `${jobId}.mp3`);
    await runCommand("ffmpeg", [
      "-y",
      "-i",
      sourcePath,
      "-vn",
      "-acodec",
      "libmp3lame",
      "-ab",
      "128k",
      mp3Path,
    ]);

    const mp3Stat = fs.statSync(mp3Path);
    if ((job.requested_outputs || []).includes("mp3")) {
      await insertArtifact({
        jobId,
        artifactType: "mp3",
        filePath: mp3Path,
        fileName: path.basename(mp3Path),
        mimeType: "audio/mpeg",
        sizeBytes: mp3Stat.size,
      });
    }

    await updateJob(jobId, { status: "queued-for-transcription", progress: 60 });

    await enqueueTranscriptionJob({ jobId, mp3Path });
  } catch (error) {
    await updateJob(jobId, {
      status: "failed",
      progress: 100,
      error_message: error.message,
    });
    throw error;
  }
}

async function boot() {
  await getPool().query("SELECT 1");
  console.log("Media worker connected to PostgreSQL.");

  const worker = new Worker(MEDIA_QUEUE_NAME, processMediaJob, {
    connection: getRedisConnection(),
    concurrency: 2,
  });

  worker.on("completed", (job) => {
    console.log(`Media job ${job.id} completed.`);
  });

  worker.on("failed", (job, err) => {
    console.error(`Media job ${job?.id || "unknown"} failed:`, err.message);
  });

  console.log("Media worker is listening...");
}

boot().catch((error) => {
  console.error("Media worker failed to start:", error);
  process.exit(1);
});
