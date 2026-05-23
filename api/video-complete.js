import { handleOptions, jsonResponse, methodNotAllowed } from "../lib/http.js";

export default async function handler(request) {
  const options = handleOptions(request);
  if (options) return options;

  if (request.method !== "POST") {
    return methodNotAllowed();
  }

  try {
    const payload = await request.json();
    const { deviceId, sessionId, frames } = payload;

    if (!sessionId) {
      return jsonResponse(400, {
        success: false,
        error: "sessionId is required",
      });
    }

    const createdAt = new Date().toISOString();

    console.log("Video recording complete:", {
      deviceId: deviceId || "esp32cam",
      sessionId,
      frames,
      createdAt,
    });

    return jsonResponse(200, {
      success: true,
      message: "Video recording completed",
      deviceId: deviceId || "esp32cam",
      sessionId,
      frames: Number(frames || 0),
      createdAt,
    });
  } catch (error) {
    console.error("Video complete error:", error);
    return jsonResponse(500, {
      success: false,
      error: "Video complete failed",
      details: error.message,
    });
  }
}
