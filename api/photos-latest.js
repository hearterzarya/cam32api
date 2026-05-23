import { listAllBlobs, toPhotoEntry } from "../lib/blob.js";
import { handleOptions, jsonResponse, methodNotAllowed } from "../lib/http.js";

export default async function handler(request) {
  const options = handleOptions(request);
  if (options) return options;

  if (request.method !== "GET") {
    return methodNotAllowed();
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

    return jsonResponse(200, {
      success: true,
      photo,
    });
  } catch (error) {
    console.error("Get latest photo error:", error);
    return jsonResponse(500, {
      success: false,
      error: "Failed to fetch latest photo",
      details: error.message,
    });
  }
}
