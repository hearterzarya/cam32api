import { list } from "@vercel/blob";

const LIST_LIMIT = 1000;

/** List all blobs under a prefix (paginates until done). */
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

/** Extract session id from pathname like videos/session_123/frame_00001.jpg */
export function sessionIdFromPath(pathname) {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length >= 2 && parts[0] === "videos") {
    return parts[1];
  }
  return null;
}

export function toPhotoEntry(blob) {
  return {
    file: basename(blob.pathname),
    url: blob.url,
    size: blob.size,
    createdAt: blob.uploadedAt.toISOString(),
    uploadedAt: blob.uploadedAt.getTime(),
  };
}

export function toFrameEntry(blob, index) {
  return {
    index,
    file: basename(blob.pathname),
    url: blob.url,
    createdAt: blob.uploadedAt.toISOString(),
    uploadedAt: blob.uploadedAt.getTime(),
  };
}
