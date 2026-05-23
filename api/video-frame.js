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
        error: "No frame data received",
      });
    }

    const deviceId = request.headers.get("x-device-id") || "esp32cam";
    const sessionId =
      request.headers.get("x-session-id") || `session_${Date.now()}`;
    const frameNoRaw = request.headers.get("x-frame-no") || "0";
    const frameNo = Number(frameNoRaw);
    const paddedFrameNo = String(frameNo).padStart(5, "0");
    const file = `frame_${paddedFrameNo}.jpg`;
    const pathname = `videos/${sessionId}/${file}`;
    const createdAt = new Date().toISOString();

    const blob = await put(pathname, body, {
      access: "public",
      contentType: "image/jpeg",
    });

    return jsonResponse(200, {
      success: true,
      message: "Frame uploaded",
      deviceId,
      sessionId,
      frameNo,
      frameUrl: blob.url,
      file,
      createdAt,
    });
  } catch (error) {
    console.error("Video frame upload error:", error);
    return jsonResponse(500, {
      success: false,
      error: "Frame upload failed",
      details: error.message,
    });
  }
}
