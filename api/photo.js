import { put } from "@vercel/blob";
import {
  handleOptions,
  jsonResponse,
  methodNotAllowed,
  readRawBody,
} from "../lib/http.js";

export default async function handler(request) {
  const options = handleOptions(request);
  if (options) return options;

  if (request.method !== "POST") {
    return methodNotAllowed();
  }

  try {
    const body = await readRawBody(request);

    if (!body || body.length === 0) {
      return jsonResponse(400, {
        success: false,
        error: "No image data received",
      });
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

    return jsonResponse(200, {
      success: true,
      message: "Photo uploaded",
      imageUrl: blob.url,
      file,
      deviceId,
      createdAt,
    });
  } catch (error) {
    console.error("Photo upload error:", error);
    return jsonResponse(500, {
      success: false,
      error: "Photo upload failed",
      details: error.message,
    });
  }
}
