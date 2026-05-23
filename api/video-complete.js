const {
  handleOptions,
  methodNotAllowed,
  readJsonBody,
  sendJson,
} = require("../lib/http");

module.exports = async function handler(req, res) {
  if (handleOptions(req, res)) return;

  if (req.method !== "POST") {
    return methodNotAllowed(res);
  }

  try {
    const payload = await readJsonBody(req);
    const { deviceId, sessionId, frames } = payload;

    if (!sessionId) {
      return sendJson(res, 400, {
        success: false,
        error: "sessionId is required",
      });
    }

    const createdAt = new Date().toISOString();

    return sendJson(res, 200, {
      success: true,
      message: "Video recording completed",
      deviceId: deviceId || "esp32cam",
      sessionId,
      frames: Number(frames || 0),
      createdAt,
    });
  } catch (error) {
    console.error("Video complete error:", error);
    return sendJson(res, 500, {
      success: false,
      error: "Video complete failed",
      details: error.message,
    });
  }
};
