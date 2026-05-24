# ESP32-CAM captureId firmware update

Update your ESP32 firmware so each capture uses the same `captureId` from the app through upload.

## 1. Read captureId in handlePhoto

```cpp
void handlePhoto() {
  String captureId = "";
  if (server.hasArg("captureId")) {
    captureId = server.arg("captureId");
  }

  server.send(200, "application/json",
    "{\"status\":\"capturing_photo\",\"captureId\":\"" + captureId + "\"}");

  // capture + upload in background or after response
  captureAndUploadPhoto(captureId);
}
```

## 2. Upload with X-Capture-ID header

```cpp
bool uploadImageToNode(camera_fb_t *fb, String url, String type,
                     String sessionId = "", int frameNo = -1,
                     String captureId = "") {
  // ... WiFiClientSecure + HTTPClient setup ...

  http.addHeader("Content-Type", "image/jpeg");
  http.addHeader("X-Device-ID", DEVICE_ID);

  if (captureId.length() > 0) {
    http.addHeader("X-Capture-ID", captureId);
  }

  // POST raw JPEG to https://cam32api.vercel.app/api/photo
}
```

## 3. NODE_SERVER

```cpp
const char* NODE_SERVER = "https://cam32api.vercel.app";
```

Use `WiFiClientSecure` + `client.setInsecure()` for HTTPS.

## 4. Blob path on Vercel

Backend saves:

`photos/<deviceId>/<captureId>.jpg`

App polls:

`GET /api/photo-by-capture?captureId=<sameId>`

## 5. Response timing

ESP32 may respond before upload finishes. That is OK — the app polls by `captureId`, not by immediate upload response.

Optional: return upload result only after POST completes (may slow browser trigger).
