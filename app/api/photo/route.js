import { put } from "@vercel/blob";
import { formatBlobError } from "../../../lib/blob-errors.js";
import { basename } from "../../../lib/blob.js";
import { corsJson, corsOptions } from "../../../lib/cors.js";
import {
  generateCaptureId,
  photoPathname,
  sanitizeId,
} from "../../../lib/photos.js";

export async function OPTIONS() {
  return corsOptions();
}

export async function POST(request) {
  try {
    const body = Buffer.from(await request.arrayBuffer());

    if (!body.length) {
      return corsJson(
        { success: false, error: "No image data received" },
        400
      );
    }

    const deviceId = sanitizeId(
      request.headers.get("x-device-id"),
      "esp32cam"
    );
    const captureId = sanitizeId(
      request.headers.get("x-capture-id"),
      generateCaptureId()
    );
    const pathname = photoPathname(deviceId, captureId);
    const createdAt = new Date().toISOString();
    const timestamp = Date.now();

    const blob = await put(pathname, body, {
      access: "public",
      contentType: "image/jpeg",
      addRandomSuffix: false,
      cacheControlMaxAge: 0,
    });

    const file = basename(pathname);

    console.log("Photo uploaded", {
      deviceId,
      captureId,
      fileName: pathname,
      size: body.length,
      url: blob.url,
      timestamp,
    });

    return corsJson({
      success: true,
      message: "Photo uploaded",
      captureId,
      deviceId,
      imageUrl: blob.url,
      url: blob.url,
      file,
      pathname,
      createdAt,
      timestamp,
    });
  } catch (error) {
    console.error("Photo upload error:", error);
    const blobErr = formatBlobError(error);
    if (blobErr) return corsJson(blobErr, 500);
    return corsJson(
      {
        success: false,
        error: "Photo upload failed",
        details: error.message,
      },
      500
    );
  }
}
