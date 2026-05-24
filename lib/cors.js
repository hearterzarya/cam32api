import { NextResponse } from "next/server";

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
  "Surrogate-Control": "no-store",
};

function applyCorsHeaders(res) {
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, X-Device-ID, X-Capture-ID, X-Type, X-Session-ID, X-Frame-No"
  );
}

function applyNoCacheHeaders(res) {
  for (const [key, value] of Object.entries(NO_CACHE_HEADERS)) {
    res.headers.set(key, value);
  }
}

export function corsJson(data, status = 200) {
  const res = NextResponse.json(data, { status });
  applyCorsHeaders(res);
  return res;
}

/** JSON + CORS + no-cache (for media listing GET endpoints). */
export function corsJsonNoCache(data, status = 200) {
  const res = NextResponse.json(data, { status });
  applyCorsHeaders(res);
  applyNoCacheHeaders(res);
  return res;
}

export function corsOptions() {
  const res = new NextResponse(null, { status: 204 });
  applyCorsHeaders(res);
  return res;
}
