import { listAllBlobs, toPhotoEntry } from "../lib/blob.js";
import { handleOptions, methodNotAllowed, sendJson } from "../lib/http.js";

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;

  if (req.method !== "GET") {
    return methodNotAllowed(res);
  }

  try {
    const blobs = await listAllBlobs("photos/");
    const photos = blobs
      .filter((b) => b.pathname.toLowerCase().endsWith(".jpg"))
      .map(toPhotoEntry)
      .sort((a, b) => b.uploadedAt - a.uploadedAt);

    const latest = photos[0];
    const photo = latest
      ? {
          file: latest.file,
          url: latest.url,
          size: latest.size,
          createdAt: latest.createdAt,
        }
      : null;

    return sendJson(res, 200, {
      success: true,
      photo,
    });
  } catch (error) {
    console.error("Get latest photo error:", error);
    return sendJson(res, 500, {
      success: false,
      error: "Failed to fetch latest photo",
      details: error.message,
    });
  }
}
