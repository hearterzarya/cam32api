const express = require("express");
const cors = require("cors");
const fs = require("fs-extra");
const path = require("path");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);

// ----------------------------------------------------
// CONFIG
// ----------------------------------------------------
const PORT = 3000;

const UPLOAD_ROOT = path.join(__dirname, "uploads");
const PHOTOS_DIR = path.join(UPLOAD_ROOT, "photos");
const VIDEOS_DIR = path.join(UPLOAD_ROOT, "videos");

// ----------------------------------------------------
// MIDDLEWARE
// ----------------------------------------------------
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "X-Device-ID",
    "X-Type",
    "X-Session-ID",
    "X-Frame-No"
  ]
}));

app.use(express.json({ limit: "50mb" }));

// Serve uploaded files publicly
app.use("/uploads", express.static(UPLOAD_ROOT));

// ----------------------------------------------------
// ENSURE FOLDERS
// ----------------------------------------------------
fs.ensureDirSync(PHOTOS_DIR);
fs.ensureDirSync(VIDEOS_DIR);

// ----------------------------------------------------
// WEBSOCKET SERVER
// ----------------------------------------------------
const wss = new WebSocket.Server({ server });

function broadcast(data) {
  const message = JSON.stringify(data);

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

wss.on("connection", (ws) => {
  console.log("✅ WebSocket client connected");

  ws.send(JSON.stringify({
    type: "connected",
    message: "Connected to ESP32-CAM Node Server",
    createdAt: new Date().toISOString()
  }));

  ws.on("close", () => {
    console.log("❌ WebSocket client disconnected");
  });
});

// ----------------------------------------------------
// HEALTH CHECK
// ----------------------------------------------------
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "ESP32-CAM Node.js Server Running",
    endpoints: {
      photoUpload: "/api/photo",
      videoFrameUpload: "/api/video-frame",
      videoComplete: "/api/video-complete",
      photos: "/api/photos",
      latestVideo: "/api/videos/latest",
      uploads: "/uploads"
    }
  });
});

// ----------------------------------------------------
// ESP32 PHOTO UPLOAD API
// ----------------------------------------------------
app.post(
  "/api/photo",
  express.raw({ type: "image/jpeg", limit: "15mb" }),
  async (req, res) => {
    try {
      if (!req.body || req.body.length === 0) {
        return res.status(400).json({
          success: false,
          error: "No image data received"
        });
      }

      const deviceId = req.header("X-Device-ID") || "unknown-device";

      const fileName = `photo_${deviceId}_${Date.now()}.jpg`;
      const filePath = path.join(PHOTOS_DIR, fileName);

      await fs.writeFile(filePath, req.body);

      const imageUrl = `/uploads/photos/${fileName}`;

      console.log("📸 Photo uploaded:", imageUrl);

      const payload = {
        type: "photo",
        success: true,
        deviceId,
        fileName,
        imageUrl,
        size: req.body.length,
        createdAt: new Date().toISOString()
      };

      broadcast(payload);

      res.json({
        success: true,
        message: "Photo uploaded successfully",
        ...payload
      });

    } catch (error) {
      console.error("Photo upload error:", error);

      res.status(500).json({
        success: false,
        error: "Photo upload failed"
      });
    }
  }
);

// ----------------------------------------------------
// ESP32 VIDEO FRAME UPLOAD API
// ----------------------------------------------------
app.post(
  "/api/video-frame",
  express.raw({ type: "image/jpeg", limit: "15mb" }),
  async (req, res) => {
    try {
      if (!req.body || req.body.length === 0) {
        return res.status(400).json({
          success: false,
          error: "No frame data received"
        });
      }

      const deviceId = req.header("X-Device-ID") || "unknown-device";
      const sessionId = req.header("X-Session-ID") || `session_${Date.now()}`;
      const frameNoRaw = req.header("X-Frame-No") || "0";
      const frameNo = Number(frameNoRaw);

      const sessionDir = path.join(VIDEOS_DIR, sessionId);
      await fs.ensureDir(sessionDir);

      const paddedFrameNo = String(frameNo).padStart(5, "0");
      const fileName = `frame_${paddedFrameNo}.jpg`;
      const filePath = path.join(sessionDir, fileName);

      await fs.writeFile(filePath, req.body);

      const frameUrl = `/uploads/videos/${sessionId}/${fileName}`;

      console.log(`🎞️ Frame uploaded: session=${sessionId}, frame=${frameNo}`);

      const payload = {
        type: "video_frame",
        success: true,
        deviceId,
        sessionId,
        frameNo,
        fileName,
        frameUrl,
        size: req.body.length,
        createdAt: new Date().toISOString()
      };

      broadcast(payload);

      res.json({
        success: true,
        message: "Frame uploaded successfully",
        ...payload
      });

    } catch (error) {
      console.error("Video frame upload error:", error);

      res.status(500).json({
        success: false,
        error: "Frame upload failed"
      });
    }
  }
);

// ----------------------------------------------------
// ESP32 VIDEO COMPLETE API
// ----------------------------------------------------
app.post("/api/video-complete", async (req, res) => {
  try {
    const { deviceId, sessionId, frames } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: "sessionId is required"
      });
    }

    const sessionDir = path.join(VIDEOS_DIR, sessionId);

    let frameFiles = [];

    if (await fs.pathExists(sessionDir)) {
      frameFiles = await fs.readdir(sessionDir);
      frameFiles = frameFiles
        .filter(file => file.toLowerCase().endsWith(".jpg"))
        .sort();
    }

    const payload = {
      type: "video_complete",
      success: true,
      deviceId: deviceId || "unknown-device",
      sessionId,
      frames: Number(frames || frameFiles.length),
      savedFrames: frameFiles.length,
      createdAt: new Date().toISOString()
    };

    console.log("✅ Video recording complete:", payload);

    broadcast(payload);

    res.json({
      success: true,
      message: "Video recording completed",
      ...payload
    });

  } catch (error) {
    console.error("Video complete error:", error);

    res.status(500).json({
      success: false,
      error: "Video complete failed"
    });
  }
});

// ----------------------------------------------------
// GET ALL PHOTOS
// ----------------------------------------------------
app.get("/api/photos", async (req, res) => {
  try {
    await fs.ensureDir(PHOTOS_DIR);

    const files = await fs.readdir(PHOTOS_DIR);

    const photos = [];

    for (const file of files) {
      if (!file.toLowerCase().endsWith(".jpg")) continue;

      const filePath = path.join(PHOTOS_DIR, file);
      const stat = await fs.stat(filePath);

      photos.push({
        file,
        url: `/uploads/photos/${file}`,
        size: stat.size,
        createdAt: stat.mtime.toISOString(),
        timestamp: stat.mtimeMs
      });
    }

    photos.sort((a, b) => b.timestamp - a.timestamp);

    res.json({
      success: true,
      count: photos.length,
      photos
    });

  } catch (error) {
    console.error("Get photos error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to fetch photos"
    });
  }
});

// ----------------------------------------------------
// GET LATEST PHOTO
// ----------------------------------------------------
app.get("/api/photos/latest", async (req, res) => {
  try {
    await fs.ensureDir(PHOTOS_DIR);

    const files = await fs.readdir(PHOTOS_DIR);

    const photos = [];

    for (const file of files) {
      if (!file.toLowerCase().endsWith(".jpg")) continue;

      const filePath = path.join(PHOTOS_DIR, file);
      const stat = await fs.stat(filePath);

      photos.push({
        file,
        url: `/uploads/photos/${file}`,
        size: stat.size,
        createdAt: stat.mtime.toISOString(),
        timestamp: stat.mtimeMs
      });
    }

    photos.sort((a, b) => b.timestamp - a.timestamp);

    res.json({
      success: true,
      photo: photos[0] || null
    });

  } catch (error) {
    console.error("Get latest photo error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to fetch latest photo"
    });
  }
});

// ----------------------------------------------------
// GET VIDEO SESSIONS
// ----------------------------------------------------
app.get("/api/videos", async (req, res) => {
  try {
    await fs.ensureDir(VIDEOS_DIR);

    const sessions = await fs.readdir(VIDEOS_DIR);

    const videoSessions = [];

    for (const sessionId of sessions) {
      const sessionPath = path.join(VIDEOS_DIR, sessionId);

      const stat = await fs.stat(sessionPath);

      if (!stat.isDirectory()) continue;

      const files = await fs.readdir(sessionPath);
      const frames = files
        .filter(file => file.toLowerCase().endsWith(".jpg"))
        .sort();

      videoSessions.push({
        sessionId,
        frameCount: frames.length,
        createdAt: stat.mtime.toISOString(),
        timestamp: stat.mtimeMs,
        firstFrame: frames.length
          ? `/uploads/videos/${sessionId}/${frames[0]}`
          : null,
        lastFrame: frames.length
          ? `/uploads/videos/${sessionId}/${frames[frames.length - 1]}`
          : null
      });
    }

    videoSessions.sort((a, b) => b.timestamp - a.timestamp);

    res.json({
      success: true,
      count: videoSessions.length,
      videos: videoSessions
    });

  } catch (error) {
    console.error("Get videos error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to fetch videos"
    });
  }
});

// ----------------------------------------------------
// GET LATEST VIDEO FRAMES
// ----------------------------------------------------
app.get("/api/videos/latest", async (req, res) => {
  try {
    await fs.ensureDir(VIDEOS_DIR);

    const sessions = await fs.readdir(VIDEOS_DIR);

    if (!sessions || sessions.length === 0) {
      return res.json({
        success: true,
        sessionId: null,
        frameCount: 0,
        frames: []
      });
    }

    const sessionStats = [];

    for (const sessionId of sessions) {
      const sessionPath = path.join(VIDEOS_DIR, sessionId);

      const stat = await fs.stat(sessionPath);

      if (!stat.isDirectory()) continue;

      sessionStats.push({
        sessionId,
        timestamp: stat.mtimeMs
      });
    }

    if (sessionStats.length === 0) {
      return res.json({
        success: true,
        sessionId: null,
        frameCount: 0,
        frames: []
      });
    }

    sessionStats.sort((a, b) => b.timestamp - a.timestamp);

    const latestSessionId = sessionStats[0].sessionId;
    const latestSessionPath = path.join(VIDEOS_DIR, latestSessionId);

    const files = await fs.readdir(latestSessionPath);

    const frames = files
      .filter(file => file.toLowerCase().endsWith(".jpg"))
      .sort()
      .map((file, index) => ({
        index,
        file,
        url: `/uploads/videos/${latestSessionId}/${file}`
      }));

    res.json({
      success: true,
      sessionId: latestSessionId,
      frameCount: frames.length,
      fps: 5,
      frames
    });

  } catch (error) {
    console.error("Get latest video error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to load latest video frames"
    });
  }
});

// ----------------------------------------------------
// GET SPECIFIC VIDEO SESSION FRAMES
// ----------------------------------------------------
app.get("/api/videos/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;

    const sessionPath = path.join(VIDEOS_DIR, sessionId);

    if (!(await fs.pathExists(sessionPath))) {
      return res.status(404).json({
        success: false,
        error: "Video session not found"
      });
    }

    const files = await fs.readdir(sessionPath);

    const frames = files
      .filter(file => file.toLowerCase().endsWith(".jpg"))
      .sort()
      .map((file, index) => ({
        index,
        file,
        url: `/uploads/videos/${sessionId}/${file}`
      }));

    res.json({
      success: true,
      sessionId,
      frameCount: frames.length,
      fps: 5,
      frames
    });

  } catch (error) {
    console.error("Get video session error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to load video session"
    });
  }
});

// ----------------------------------------------------
// DELETE ALL UPLOADS — OPTIONAL DEV RESET
// ----------------------------------------------------
app.delete("/api/uploads", async (req, res) => {
  try {
    await fs.emptyDir(PHOTOS_DIR);
    await fs.emptyDir(VIDEOS_DIR);

    broadcast({
      type: "uploads_cleared",
      createdAt: new Date().toISOString()
    });

    res.json({
      success: true,
      message: "All uploads cleared"
    });

  } catch (error) {
    console.error("Clear uploads error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to clear uploads"
    });
  }
});

// ----------------------------------------------------
// 404 HANDLER
// ----------------------------------------------------
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
    path: req.path
  });
});

// ----------------------------------------------------
// START SERVER
// ----------------------------------------------------
server.listen(PORT, "0.0.0.0", () => {
  console.log("🚀 ESP32-CAM Node.js Server Started");
  console.log(`✅ Local:   http://192.168.31.96:${PORT}`);
  console.log(`✅ Network: http://192.168.31.96:${PORT}`);
  console.log("📁 Uploads folder:", UPLOAD_ROOT);
});