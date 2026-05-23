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
      .sort((a, b) => b.uploadedAt - a.uploadedAt)
      .map(({ uploadedAt, ...photo }) => photo);

    return corsJson({ success: true, count: photos.length, photos });
  } catch (error) {
    console.error("Get photos error:", error);
    const blobErr = formatBlobError(error);
    if (blobErr) return corsJson(blobErr, 500);
    return corsJson(
      {
        success: false,
        error: "Failed to fetch photos",
        details: error.message,
      },
      500
    );
  }
}
