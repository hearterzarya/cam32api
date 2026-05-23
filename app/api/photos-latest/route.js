import { listAllBlobs, toPhotoEntry } from "../../../lib/blob.js";
import { formatBlobError } from "../../../lib/blob-errors.js";
import { corsJson, corsOptions } from "../../../lib/cors.js";

export async function OPTIONS() {
  return corsOptions();
}

export async function GET() {
  try {
    const blobs = await listAllBlobs("photos/");
    const photos = blobs
      .filter((b) => b.pathname.toLowerCase().endsWith(".jpg"))
      .map(toPhotoEntry)
      .sort((a, b) => b.uploadedAt - a.uploadedAt);

    const latest = photos[0];
    const photo = latest
      ? {
          file: latest.file,
          url: latest.url,
          size: latest.size,
          createdAt: latest.createdAt,
        }
      : null;

    return corsJson({ success: true, photo });
  } catch (error) {
    console.error("Get latest photo error:", error);
    const blobErr = formatBlobError(error);
    if (blobErr) return corsJson(blobErr, 500);
    return corsJson(
      {
        success: false,
        error: "Failed to fetch latest photo",
        details: error.message,
      },
      500
    );
  }
}
