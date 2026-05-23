import { corsJson, corsOptions } from "../../../lib/cors.js";

export async function OPTIONS() {
  return corsOptions();
}

export async function GET() {
  return corsJson({
    success: true,
    message: "cam32api is running",
    hasBlobToken: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    time: new Date().toISOString(),
  });
}
