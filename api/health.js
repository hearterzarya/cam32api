const { handleOptions, sendJson } = require("./_lib/http.js");

module.exports = async function handler(req, res) {
  if (handleOptions(req, res)) return;

  return sendJson(res, 200, {
    success: true,
    message: "cam32api is running",
    hasBlobToken: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    time: new Date().toISOString(),
  });
};
