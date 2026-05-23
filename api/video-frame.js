import { put } from "@vercel/blob";
import {
  handleOptions,
  methodNotAllowed,
  readRawBody,
  sendJson,
} from "../lib/http.js";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;

  if (req.method !== "POST") {
    return methodNotAllowed(res);
  }

  try {
    const body = await readRawBody(req);

    if (!body || body.length === 0) {
      return sendJson(res, 400, {
        success: false,
        error: "No frame data received",
      });
    }

    const deviceId = req.headers["x-device-id"] || "esp32cam";
    const sessionId =
      req.headers["x-session-id"] || `session_${Date.now()}`;
    const frameNoRaw = req.headers["x-frame-no"] || "0";
    const frameNo = Number(frameNoRaw);
    const paddedFrameNo = String(frameNo).padStart(5, "0");
    const file = `frame_${paddedFrameNo}.jpg`;
    const pathname = `videos/${sessionId}/${file}`;
    const createdAt = new Date().toISOString();

    const blob = await put(pathname, body, {
      access: "public",
      contentType: "image/jpeg",
    });

    return sendJson(res, 200, {
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
    return sendJson(res, 500, {
      success: false,
      error: "Frame upload failed",
      details: error.message,
    });
  }
}
