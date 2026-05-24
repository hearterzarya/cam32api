import {
  listAllBlobs,
  sessionIdFromPath,
  basename,
  toFrameEntry,
} from "../../../lib/blob.js";
import { formatBlobError } from "../../../lib/blob-errors.js";
import { corsJsonNoCache, corsOptions } from "../../../lib/cors.js";

export async function OPTIONS() {
  return corsOptions();
}

export async function GET() {
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
      const ts =
        blob.uploadedAt instanceof Date
          ? blob.uploadedAt.getTime()
          : new Date(blob.uploadedAt).getTime();
      if (ts > session.latestUploadedAt) {
        session.latestUploadedAt = ts;
      }
    }

    if (sessions.size === 0) {
      return corsJsonNoCache({
        success: true,
        sessionId: null,
        frameCount: 0,
        fps: 5,
        frames: [],
        serverTime: Date.now(),
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

    return corsJsonNoCache({
      success: true,
      sessionId: latestSession.sessionId,
      frameCount: frames.length,
      fps: 5,
      frames,
      serverTime: Date.now(),
    });
  } catch (error) {
    console.error("Get latest video error:", error);
    const blobErr = formatBlobError(error);
    if (blobErr) return corsJsonNoCache(blobErr, 500);
    return corsJsonNoCache(
      {
        success: false,
        error: "Failed to load latest video frames",
        details: error.message,
      },
      500
    );
  }
}
