import { basename } from "./blob.js";

const SAFE_ID_RE = /[^a-zA-Z0-9_-]/g;

export function sanitizeId(value, fallback = "unknown") {
  const cleaned = String(value || "")
    .trim()
    .replace(SAFE_ID_RE, "")
    .slice(0, 128);
  return cleaned || fallback;
}

export function generateCaptureId() {
  const rand = Math.random().toString(36).slice(2, 10);
  return `capture_${Date.now()}_${rand}`;
}

/** Deterministic blob path: photos/<deviceId>/<captureId>.jpg */
export function photoPathname(deviceId, captureId) {
  const safeDevice = sanitizeId(deviceId, "esp32cam");
  const safeCapture = sanitizeId(captureId, generateCaptureId());
  return `photos/${safeDevice}/${safeCapture}.jpg`;
}

export function pathnameTimestamp(pathname) {
  const match = String(pathname).match(/_(\d{13})\.jpg$/i);
  return match ? Number(match[1]) : 0;
}

export function blobSortTime(blob) {
  const uploaded = blob.uploadedAt;
  if (uploaded instanceof Date) return uploaded.getTime();
  if (uploaded) return new Date(uploaded).getTime();
  return pathnameTimestamp(blob.pathname);
}

export function sortBlobsNewestFirst(blobs) {
  return [...blobs].sort((a, b) => blobSortTime(b) - blobSortTime(a));
}

export function findBlobByCaptureId(blobs, captureId) {
  const safeCapture = sanitizeId(captureId, "");
  if (!safeCapture) return null;

  const matches = blobs.filter((blob) => {
    const path = blob.pathname || "";
    return (
      path.includes(`/${safeCapture}.jpg`) ||
      path.includes(`_${safeCapture}_`) ||
      path.includes(`_${safeCapture}.jpg`) ||
      basename(path).replace(/\.jpg$/i, "") === safeCapture
    );
  });

  if (!matches.length) return null;
  return sortBlobsNewestFirst(matches)[0];
}
