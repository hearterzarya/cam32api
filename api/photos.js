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
      .sort((a, b) => b.uploadedAt - a.uploadedAt)
      .map(({ uploadedAt, ...photo }) => photo);

    return jsonResponse(200, {
      success: true,
      count: photos.length,
      photos,
    });
  } catch (error) {
    console.error("Get photos error:", error);
    return jsonResponse(500, {
      success: false,
      error: "Failed to fetch photos",
      details: error.message,
    });
  }
}
