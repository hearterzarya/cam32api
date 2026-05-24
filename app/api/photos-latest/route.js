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
    const jpegs = blobs.filter((b) =>
      b.pathname.toLowerCase().endsWith(".jpg")
    );
    const sorted = sortBlobsNewestFirst(jpegs);
    const latest = sorted[0];

    const photo = latest
      ? (() => {
          const entry = toPhotoEntry(latest);
          return {
            file: entry.file,
            url: entry.url,
            size: entry.size,
            createdAt: entry.createdAt,
          };
        })()
      : null;

    return corsJsonNoCache({
      success: true,
      photo,
      serverTime: Date.now(),
    });
  } catch (error) {
    console.error("Get latest photo error:", error);
    const blobErr = formatBlobError(error);
    if (blobErr) return corsJsonNoCache(blobErr, 500);
    return corsJsonNoCache(
      {
        success: false,
        error: "Failed to fetch latest photo",
        details: error.message,
      },
      500
    );
  }
}
