import {
  listAllBlobs,
  sessionIdFromPath,
  basename,
  toFrameEntry,
} from "../lib/blob.js";
import { handleOptions, jsonResponse, methodNotAllowed } from "../lib/http.js";

export default async function handler(request) {
  const options = handleOptions(request);
  if (options) return options;

  if (request.method !== "GET") {
    return methodNotAllowed();
  }

  try {
    const blobs = await listAllBlobs("videos/");
    const sessions = new Map();

    for (const blob of blobs) {
      if (!blob.pathname.toLowerCase().endsWith(".jpg")) continue;

      const sessionId = sessionIdFromPath(blob.pathname);
      if (!sessionId) continue;

      if (!sessions.has(sessionId)) {
        sessions.set(sessionId, {
          sessionId,
          frames: [],
          latestUploadedAt: 0,
        });
      }

      const session = sessions.get(sessionId);
      session.frames.push(blob);
      const ts = blob.uploadedAt instanceof Date
        ? blob.uploadedAt.getTime()
        : new Date(blob.uploadedAt).getTime();
      if (ts > session.latestUploadedAt) {
        session.latestUploadedAt = ts;
      }
    }

    if (sessions.size === 0) {
      return jsonResponse(200, {
        success: true,
        sessionId: null,
        frameCount: 0,
        fps: 5,
        frames: [],
      });
    }

    const latestSession = [...sessions.values()].sort(
      (a, b) => b.latestUploadedAt - a.latestUploadedAt
    )[0];

    const sortedFrames = latestSession.frames.sort((a, b) =>
      basename(a.pathname).localeCompare(basename(b.pathname))
    );

    const frames = sortedFrames.map((blob, index) => {
      const entry = toFrameEntry(blob, index);
      const { uploadedAt, ...frame } = entry;
      return frame;
    });

    return jsonResponse(200, {
      success: true,
      sessionId: latestSession.sessionId,
      frameCount: frames.length,
      fps: 5,
      frames,
    });
  } catch (error) {
    console.error("Get latest video error:", error);
    return jsonResponse(500, {
      success: false,
      error: "Failed to load latest video frames",
      details: error.message,
    });
  }
}
