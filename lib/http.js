export function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, X-Device-ID, X-Type, X-Session-ID, X-Frame-No"
  );
}

export function handleOptions(req, res) {
  if (req.method === "OPTIONS") {
    setCors(res);
    res.status(204).end();
    return true;
  }
  return false;
}

export async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}

export function sendJson(res, statusCode, data) {
  setCors(res);
  res.status(statusCode).json(data);
}

export function methodNotAllowed(res) {
  sendJson(res, 405, { success: false, error: "Method not allowed" });
}
