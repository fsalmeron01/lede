import shared from "@transcriber/shared";

const { createJob, detectSourceType, getQueue, MEDIA_QUEUE_NAME, validateSourceUrl } = shared;

export async function POST(request) {
  try {
    const body = await request.json();
    const sourceUrl = body?.sourceUrl?.trim();
    const outputs = Array.isArray(body?.outputs) ? body.outputs : [];

    const allowedOutputs = ["mp3", "txt", "docx"];
    const requestedOutputs = outputs.filter((value) => allowedOutputs.includes(value));

    if (requestedOutputs.length === 0) {
      return Response.json({ error: "Select at least one output." }, { status: 400 });
    }

    const validationError = validateSourceUrl(sourceUrl);
    if (validationError) {
      return Response.json({ error: validationError }, { status: 400 });
    }

    const sourceType = detectSourceType(sourceUrl);
    const job = await createJob({ sourceUrl, sourceType, requestedOutputs });

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
