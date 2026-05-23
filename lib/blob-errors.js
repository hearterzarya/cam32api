export function formatBlobError(error) {
  const details = error?.message || String(error);

  if (details.includes("store does not exist")) {
    return {
      success: false,
      error: "BLOB_STORE_NOT_LINKED",
      message:
        "Vercel Blob store does not exist or is disconnected from this project.",
      details,
      fixSteps: [
        "Open https://vercel.com → project cam32api → Storage",
        "Create a new Blob store (or open your store)",
        "Connect store to the cam32api project",
        "Settings → Environment Variables: delete any old manual BLOB_READ_WRITE_TOKEN",
        "Deployments → Redeploy Production",
        "Test https://cam32api.vercel.app/api/health (blobOk should be true)",
      ],
    };
  }

  if (details.includes("No token found")) {
    return {
      success: false,
      error: "BLOB_TOKEN_MISSING",
      message: "BLOB_READ_WRITE_TOKEN is not set for this deployment.",
      details,
      fixSteps: [
        "Project → Storage → Connect Blob store to cam32api",
        "Redeploy after connecting",
      ],
    };
  }

  return null;
}
