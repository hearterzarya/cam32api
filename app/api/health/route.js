import { checkBlobStore } from "../../../lib/blob.js";
import { corsJson, corsOptions } from "../../../lib/cors.js";

export async function OPTIONS() {
  return corsOptions();
}

export async function GET() {
  const blob = await checkBlobStore();

  return corsJson({
    success: true,
    message: "cam32api is running",
    hasBlobToken: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    blobOk: blob.ok,
    blob,
    time: new Date().toISOString(),
  });
}
