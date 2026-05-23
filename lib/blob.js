import { list } from "@vercel/blob";

const LIST_LIMIT = 1000;

/** Verify Blob store is reachable (used by /api/health). */
export async function checkBlobStore() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return {
      ok: false,
      error: "BLOB_TOKEN_MISSING",
      message: "BLOB_READ_WRITE_TOKEN is not set",
    };
  }

  try {
    await list({ limit: 1 });
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: "BLOB_STORE_ERROR",
      message: error.message,
    };
  }
}

function blobTime(blob) {
  const t = blob.uploadedAt;
  if (t instanceof Date) return t.getTime();
  return new Date(t).getTime();
}

function blobIso(blob) {
  const t = blob.uploadedAt;
  if (t instanceof Date) return t.toISOString();
  return new Date(t).toISOString();
}

export async function listAllBlobs(prefix) {
  const blobs = [];
  let cursor;

  do {
    const result = await list({
      prefix,
      limit: LIST_LIMIT,
      cursor,
    });
    blobs.push(...result.blobs);
    cursor = result.hasMore ? result.cursor : undefined;
  } while (cursor);

  return blobs;
}

export function basename(pathname) {
  const parts = pathname.split("/").filter(Boolean);
  return parts[parts.length - 1] || pathname;
}

export function sessionIdFromPath(pathname) {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length >= 2 && parts[0] === "videos") {
    return parts[1];
  }
  return null;
}

export function toPhotoEntry(blob) {
  const uploadedAt = blobTime(blob);
  return {
    file: basename(blob.pathname),
    url: blob.url,
    size: blob.size,
    createdAt: blobIso(blob),
    uploadedAt,
  };
}

export function toFrameEntry(blob, index) {
  const uploadedAt = blobTime(blob);
  return {
    index,
    file: basename(blob.pathname),
    url: blob.url,
    createdAt: blobIso(blob),
    uploadedAt,
  };
}
