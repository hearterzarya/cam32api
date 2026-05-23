import {
  listAllBlobs,
  sessionIdFromPath,
  basename,
} from "../../../lib/blob.js";
import { corsJson, corsOptions } from "../../../lib/cors.js";

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

    const videos = [...sessions.values()]
      .map((session) => {
        const sorted = session.frames.sort((a, b) =>
          basename(a.pathname).localeCompare(basename(b.pathname))
        );
        const first = sorted[0];
        const last = sorted[sorted.length - 1];

        return {
          sessionId: session.sessionId,
          frameCount: sorted.length,
          firstFrame: first?.url || null,
          lastFrame: last?.url || null,
          createdAt: new Date(session.latestUploadedAt).toISOString(),
          uploadedAt: session.latestUploadedAt,
        };
      })
      .sort((a, b) => b.uploadedAt - a.uploadedAt)
      .map(({ uploadedAt, ...video }) => video);

    return corsJson({ success: true, count: videos.length, videos });
  } catch (error) {
    console.error("Get videos error:", error);
    return corsJson(
      {
        success: false,
        error: "Failed to fetch videos",
        details: error.message,
      },
      500
    );
  }
}
