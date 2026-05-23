const { put } = require("@vercel/blob");
const {
  handleOptions,
  methodNotAllowed,
  readRawBody,
  sendJson,
} = require("./_lib/http.js");

module.exports = async function handler(req, res) {
  if (handleOptions(req, res)) return;

  if (req.method !== "POST") {
    return methodNotAllowed(res);
  }

  try {
    const body = await readRawBody(req);

    if (!body || body.length === 0) {
      return sendJson(res, 400, {
        success: false,
        error: "No image data received",
      });
    }

    const deviceId = req.headers["x-device-id"] || "esp32cam";
    const createdAt = new Date().toISOString();
    const timestamp = Date.now();
    const file = `photo_${deviceId}_${timestamp}.jpg`;
    const pathname = `photos/${file}`;

    const blob = await put(pathname, body, {
      access: "public",
      contentType: "image/jpeg",
    });

    return sendJson(res, 200, {
      success: true,
      message: "Photo uploaded",
      imageUrl: blob.url,
      file,
      deviceId,
      createdAt,
    });
  } catch (error) {
    console.error("Photo upload error:", error);
    return sendJson(res, 500, {
      success: false,
      error: "Photo upload failed",
      details: error.message,
    });
  }
};
