const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, X-Device-ID, X-Type, X-Session-ID, X-Frame-No",
};

export function corsHeaders(extra = {}) {
  return { ...CORS_HEADERS, ...extra };
}

export function handleOptions(request) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  return null;
}

export async function readRawBody(request) {
  const arrayBuffer = await request.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export function jsonResponse(statusCode, data) {
  return new Response(JSON.stringify(data), {
    status: statusCode,
    headers: corsHeaders({ "Content-Type": "application/json" }),
  });
}

export function methodNotAllowed() {
  return jsonResponse(405, { success: false, error: "Method not allowed" });
}
