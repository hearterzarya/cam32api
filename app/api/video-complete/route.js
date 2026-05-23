import { corsJson, corsOptions } from "../../../lib/cors.js";

export async function OPTIONS() {
  return corsOptions();
}

export async function POST(request) {
  try {
    const payload = await request.json();
    const { deviceId, sessionId, frames } = payload;

    if (!sessionId) {
      return corsJson({ success: false, error: "sessionId is required" }, 400);
    }

    return corsJson({
      success: true,
      message: "Video recording completed",
      deviceId: deviceId || "esp32cam",
      sessionId,
      frames: Number(frames || 0),
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Video complete error:", error);
    return corsJson(
      {
        success: false,
        error: "Video complete failed",
        details: error.message,
      },
      500
    );
  }
}
