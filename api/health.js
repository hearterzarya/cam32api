module.exports = function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json");
  res.statusCode = 200;
  res.end(
    JSON.stringify({
      success: true,
      message: "cam32api is running",
      hasBlobToken: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
      time: new Date().toISOString(),
    })
  );
};
