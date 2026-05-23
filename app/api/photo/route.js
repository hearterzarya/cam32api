import { put } from "@vercel/blob";
import { corsJson, corsOptions } from "../../../lib/cors.js";

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

    const deviceId = request.headers.get("x-device-id") || "esp32cam";
    const createdAt = new Date().toISOString();
    const timestamp = Date.now();
    const file = `photo_${deviceId}_${timestamp}.jpg`;
    const pathname = `photos/${file}`;

    const blob = await put(pathname, body, {
      access: "public",
      contentType: "image/jpeg",
    });

    return corsJson({
      success: true,
      message: "Photo uploaded",
      imageUrl: blob.url,
      file,
      deviceId,
      createdAt,
    });
  } catch (error) {
    console.error("Photo upload error:", error);
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
