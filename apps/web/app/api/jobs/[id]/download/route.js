import fs from "fs";
import path from "path";
import shared from "@transcriber/shared";

const { getJobDir, getMimeTypeForFile } = shared;

export async function GET(request, { params }) {
  try {
    const { searchParams } = new URL(request.url);
    const relPath = searchParams.get("path");

    if (!relPath) {
      return Response.json({ error: "Missing file path." }, { status: 400 });
    }

    const jobDir = getJobDir(params.id);
    const normalized = path.normalize(relPath);
    const absolutePath = path.resolve(normalized);

    if (!absolutePath.startsWith(jobDir)) {
      return Response.json({ error: "Invalid path." }, { status: 400 });
    }

    if (!fs.existsSync(absolutePath)) {
      return Response.json({ error: "File not found." }, { status: 404 });
    }

    const data = fs.readFileSync(absolutePath);
    const fileName = path.basename(absolutePath);

    return new Response(data, {
      status: 200,
      headers: {
        "Content-Type": getMimeTypeForFile(absolutePath),
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error("Download error:", error);
    return Response.json({ error: "Unable to download file." }, { status: 500 });
  }
}
