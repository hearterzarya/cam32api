import { listAllBlobs, toPhotoEntry } from "../../../lib/blob.js";
import { formatBlobError } from "../../../lib/blob-errors.js";
import { corsJsonNoCache, corsOptions } from "../../../lib/cors.js";
import { sortBlobsNewestFirst } from "../../../lib/photos.js";

export async function OPTIONS() {
  return corsOptions();
}

export async function GET() {
  try {
    const blobs = await listAllBlobs("photos/");
    const photos = sortBlobsNewestFirst(
      blobs.filter((b) => b.pathname.toLowerCase().endsWith(".jpg"))
    )
      .map(toPhotoEntry)
      .map(({ uploadedAt, ...photo }) => photo);

    return corsJsonNoCache({
      success: true,
      count: photos.length,
      photos,
      serverTime: Date.now(),
    });
  } catch (error) {
    console.error("Get photos error:", error);
    const blobErr = formatBlobError(error);
    if (blobErr) return corsJsonNoCache(blobErr, 500);
    return corsJsonNoCache(
      {
        success: false,
        error: "Failed to fetch photos",
        details: error.message,
      },
      500
    );
  }
}
