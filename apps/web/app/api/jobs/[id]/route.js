import shared from "@transcriber/shared";

const { getJob } = shared;

export async function GET(_request, { params }) {
  try {
    const job = await getJob(params.id);
    if (!job) {
      return Response.json({ error: "Job not found." }, { status: 404 });
    }
    return Response.json({ job }, { status: 200 });
  } catch (error) {
    console.error("GET /api/jobs/[id] error:", error);
    return Response.json({ error: "Unable to load job." }, { status: 500 });
  }
}
