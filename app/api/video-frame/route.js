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
        { success: false, error: "No frame data received" },
        400
      );
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

    return corsJson({
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
    return corsJson(
      {
        success: false,
        error: "Frame upload failed",
        details: error.message,
      },
      500
    );
  }
}
