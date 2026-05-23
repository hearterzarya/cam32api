# ESP32-CAM + Vercel Blob Server (cam32api)

Production-ready MVP for an ESP32-CAM that captures photos and 20-second “videos” as JPEG frames, uploads them to **Vercel Blob** via serverless API routes, and plays them back in a browser control panel.

## What this project does

1. **ESP32-CAM firmware** triggers `/photo` or `/video20`, captures JPEGs, and POSTs them to your backend.
2. **Vercel serverless API** (`/api/*`) receives raw JPEG bodies and stores files in Vercel Blob (`photos/`, `videos/<sessionId>/`).
3. **Web control panel** (`/public/index.html`) triggers the ESP32 on your LAN and fetches latest media from your Vercel deployment URL.

This is **not** true MP4 video — it is **JPEG frame playback** at ~5 FPS in the browser.

## Project structure

```
/api
  photo.js
  video-frame.js
  video-complete.js
  photos.js
  photos-latest.js
  videos.js
  videos-latest.js
/lib
  http.js          # CORS, raw body, JSON helpers
  blob.js          # Blob list/group helpers
/public
  index.html       # Control panel
package.json
vercel.json
.env.example
server.js          # Legacy local Express server (optional)
```

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/photo` | Upload JPEG photo (`Content-Type: image/jpeg`, raw body) |
| POST | `/api/video-frame` | Upload one video frame (headers: `X-Session-ID`, `X-Frame-No`, `X-Device-ID`) |
| POST | `/api/video-complete` | JSON `{ deviceId, sessionId, frames }` — completion signal |
| GET | `/api/photos` | List all photos (newest first) |
| GET | `/api/photos-latest` | Latest photo |
| GET | `/api/videos` | Video sessions grouped by `sessionId` |
| GET | `/api/videos-latest` | All frames of the latest session |

### Upload headers (ESP32)

- `Content-Type: image/jpeg`
- `X-Device-ID` (optional, default `esp32cam`)
- `X-Session-ID` (video frames)
- `X-Frame-No` (video frames, zero-padded to 5 digits in blob path)

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `BLOB_READ_WRITE_TOKEN` | Yes | Vercel Blob read/write token (auto-injected when Blob store is linked) |

Copy `.env.example` to `.env.local` for local `vercel dev` if needed.

## Local development

```bash
npm install
vercel login
vercel link
```

1. In the [Vercel dashboard](https://vercel.com/dashboard), open your project → **Storage** → create a **Blob** store and connect it to this project.
2. Confirm `BLOB_READ_WRITE_TOKEN` appears under project environment variables.
3. Run:

```bash
npm run dev
```

- Control panel: `http://localhost:3000/` (or the port `vercel dev` prints)
- API: `http://localhost:3000/api/photo`, etc.

### Optional legacy local server

The original Express + filesystem server is still in `server.js` (uses `uploads/`). For local-only testing without Blob:

```bash
npm run start:local
```

Use `http://YOUR_LAN_IP:3000` as the backend URL in the old root `index.html`. **Production on Vercel must use Blob**, not local disk.

## Deploy to Vercel

```bash
npm install
vercel login
vercel link
# Create & connect Blob store in dashboard
vercel --prod
```

Or:

```bash
npm run deploy
```

After deploy:

- **Control panel:** `https://cam32api.vercel.app/`
- **API base:** `https://cam32api.vercel.app`

Set the **Backend API URL** in the control panel to your deployment URL.

## ESP32 firmware changes

### 1. Change server URL

From local Node:

```cpp
const char* NODE_SERVER = "http://192.168.31.96:3000";
```

To Vercel (HTTPS):

```cpp
const char* NODE_SERVER = "https://cam32api.vercel.app";
```

### 2. Use HTTPS client for uploads

Vercel requires HTTPS. Update upload code:

```cpp
#include <WiFiClientSecure.h>

// Inside photo/frame upload function:
WiFiClientSecure client;
client.setInsecure();  // or install a root CA for production hardening

HTTPClient http;
http.begin(client, url);
http.addHeader("Content-Type", "image/jpeg");
http.addHeader("X-Device-ID", DEVICE_ID);
// For frames:
http.addHeader("X-Session-ID", sessionId);
http.addHeader("X-Frame-No", String(frameNo));
```

Apply the same `WiFiClientSecure` pattern for **video-complete** JSON POST to `/api/video-complete`.

### 3. Endpoint paths (unchanged contract)

- Photo: `POST {NODE_SERVER}/api/photo`
- Frame: `POST {NODE_SERVER}/api/video-frame`
- Complete: `POST {NODE_SERVER}/api/video-complete`

## Testing

1. Deploy API and connect Blob store.
2. Open `https://cam32api.vercel.app/` and set **Backend API URL** to your deployment.
3. Set **ESP32-CAM IP** to your camera on WiFi.
4. Click **Capture Photo** → wait → **Load Latest Photo**.
5. Click **Record 20 Sec Video** → wait ~23s → frames auto-load and play.

### curl smoke tests

```bash
# Upload test JPEG
curl -X POST "https://cam32api.vercel.app/api/photo" \
  -H "Content-Type: image/jpeg" \
  -H "X-Device-ID: test-device" \
  --data-binary "@test.jpg"

# List photos
curl "https://cam32api.vercel.app/api/photos-latest"
```

## Limitations

- **No persistent local filesystem on Vercel** — all media must go to **Vercel Blob**.
- **Not real MP4** — JPEG frame sequence only; browser plays frames in `<img>` at 5 FPS.
- **Payload size** — keep each JPEG small (QVGA/VGA, JPEG quality ~12–15) to stay under serverless body limits.
- **No WebSocket** on this Vercel MVP — use polling/`fetch` (as the control panel does). For realtime, use Render/Railway/VPS or a dedicated realtime service.
- **True MP4 encoding** needs FFmpeg on a long-running server (Render, Railway, VPS).
- **Blob list** may paginate; this project lists up to 1000 blobs per prefix per request (see `lib/blob.js`).

## License

ISC
