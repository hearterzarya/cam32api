import { listAllBlobs, toPhotoEntry } from "../../../lib/blob.js";
import { formatBlobError } from "../../../lib/blob-errors.js";
import { corsJsonNoCache, corsOptions } from "../../../lib/cors.js";
import { findBlobByCaptureId, sanitizeId } from "../../../lib/photos.js";

export async function OPTIONS() {
  return corsOptions();
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const captureId = sanitizeId(searchParams.get("captureId"), "");

    if (!captureId) {
      return corsJsonNoCache(
        { success: false, error: "captureId query parameter is required" },
        400
      );
    }

    const blobs = await listAllBlobs("photos/");
    const jpegs = blobs.filter((b) =>
      b.pathname.toLowerCase().endsWith(".jpg")
    );
    const match = findBlobByCaptureId(jpegs, captureId);

    if (!match) {
      return corsJsonNoCache({
        success: true,
        found: false,
        captureId,
        photo: null,
        serverTime: Date.now(),
      });
    }

    const entry = toPhotoEntry(match);

    return corsJsonNoCache({
      success: true,
      found: true,
      captureId,
      photo: {
        url: entry.url,
        file: entry.file,
        createdAt: entry.createdAt,
        size: entry.size,
        captureId,
      },
      serverTime: Date.now(),
    });
  } catch (error) {
    console.error("Photo by capture error:", error);
    const blobErr = formatBlobError(error);
    if (blobErr) return corsJsonNoCache(blobErr, 500);
    return corsJsonNoCache(
      {
        success: false,
        error: "Failed to fetch photo by captureId",
        details: error.message,
      },
      500
    );
  }
}
