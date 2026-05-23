import { NextResponse } from "next/server";

function applyCorsHeaders(res) {
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, X-Device-ID, X-Type, X-Session-ID, X-Frame-No"
  );
}

export function corsJson(data, status = 200) {
  const res = NextResponse.json(data, { status });
  applyCorsHeaders(res);
  return res;
}

export function corsOptions() {
  const res = new NextResponse(null, { status: 204 });
  applyCorsHeaders(res);
  return res;
}
