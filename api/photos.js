const { listAllBlobs, toPhotoEntry } = require("./_lib/blob.js");
const { handleOptions, methodNotAllowed, sendJson } = require("./_lib/http.js");

module.exports = async function handler(req, res) {
  if (handleOptions(req, res)) return;

  if (req.method !== "GET") {
    return methodNotAllowed(res);
  }

  try {
    const blobs = await listAllBlobs("photos/");
    const photos = blobs
      .filter((b) => b.pathname.toLowerCase().endsWith(".jpg"))
      .map(toPhotoEntry)
      .sort((a, b) => b.uploadedAt - a.uploadedAt)
      .map(({ uploadedAt, ...photo }) => photo);

    return sendJson(res, 200, {
      success: true,
      count: photos.length,
      photos,
    });
  } catch (error) {
    console.error("Get photos error:", error);
    return sendJson(res, 500, {
      success: false,
      error: "Failed to fetch photos",
      details: error.message,
    });
  }
};
