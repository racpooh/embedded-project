# Webcam + YOLO Fire Detection Integration Guide

## Overview

This guide explains how to integrate an external USB webcam with YOLO fire detection into the household fire detection system. When a WARNING status is detected by sensors, the system will:

1. **Capture image** from external webcam
2. **Run YOLO fire detection** on the captured image
3. **Upgrade to DANGER** if fire is confirmed (confidence ≥ threshold)
4. **Upload image** to Google Cloud Storage
5. **Store image URL** in Firebase Firestore

## Architecture

```
WARNING Detected (Sensors)
    ↓
Capture Image (External Webcam)
    ↓
Run YOLO Fire Detection
    ↓
Fire Detected? (confidence ≥ 60%)
    ↓ YES                    ↓ NO
Upgrade to DANGER        Keep as WARNING
    ↓
Upload to GCS
    ↓
Store URL in Firestore
    ↓
Display in Dashboard + LINE Notify
```

## Prerequisites

### 1. Hardware
- ✅ External USB webcam (detected as "Web Camera" on macOS)
- ✅ Mac with USB hub (if needed)
- ✅ ESP32 gateway for sensor data

### 2. Software
- ✅ macOS with ffmpeg installed (`/opt/homebrew/bin/ffmpeg`)
- ✅ Node.js 18+ for ingestion script
- ✅ Python 3.8+ for YOLO wrapper
- ✅ Firebase project with Firestore
- ✅ Google Cloud Storage bucket

## Setup Instructions

### Step 1: Verify External Camera

Check that your external webcam is detected:

```bash
system_profiler SPCameraDataType
```

Expected output:
```
Camera:
    FaceTime HD Camera:
      Model ID: FaceTime HD Camera
      ...
    
    Web Camera:
      Model ID: UVC Camera VendorID_7532 ProductID_4728
      Unique ID: 0x21300001d6c1278
```

List camera device indices for ffmpeg:
```bash
ffmpeg -f avfoundation -list_devices true -i ""
```

Expected output:
```
[0] FaceTime HD Camera    # Built-in
[1] Web Camera            # External (use this!)
```

### Step 2: Install Node.js Dependencies

```bash
cd household-fire-system
npm install
```

This installs:
- `@google-cloud/storage` - GCS upload
- `firebase` - Firestore integration
- `dotenv` - Environment configuration

### Step 3: Install Python Dependencies

```bash
cd ai
pip install -r requirements.txt
```

This installs:
- `ultralytics` - YOLO model
- `google-cloud-storage` - GCS Python client
- `firebase-admin` - Firebase Admin SDK
- `Pillow`, `numpy` - Image processing

**Note:** First run will download YOLOv8 model (~6MB).

### Step 4: Configure Google Cloud Storage

#### 4.1 Create GCS Bucket

```bash
# Option 1: Using gcloud CLI
gcloud storage buckets create gs://household-fire-images \
  --location=asia-southeast1 \
  --uniform-bucket-level-access

# Option 2: Using Google Cloud Console
# 1. Go to https://console.cloud.google.com/storage
# 2. Create bucket: household-fire-images
# 3. Location: asia-southeast1 (or nearest region)
# 4. Access control: Uniform
```

#### 4.2 Service Account Setup

You already have:
- Service account JSON: `embedded-project-6f2ed-6ff292c84b10.json`
- Service account email: `fire-ai-uploader@display-c8393.iam.gserviceaccount.com`

Grant Storage Object Admin role:
```bash
gcloud projects add-iam-policy-binding display-c8393 \
  --member="serviceAccount:fire-ai-uploader@display-c8393.iam.gserviceaccount.com" \
  --role="roles/storage.objectAdmin" \
  --condition=None
```

Or via Console:
1. Go to GCS bucket → Permissions
2. Add principal: `fire-ai-uploader@display-c8393.iam.gserviceaccount.com`
3. Role: **Storage Object Admin**

### Step 5: Configure Environment Variables

Create/update `web/.env`:

```bash
cd web
cp .env.example .env
```

Add these variables:
```bash
# Enable webcam integration
USE_WEBCAM=1

# External camera device index
WEBCAM_DEVICE=1

# YOLO confidence threshold (0.0 - 1.0)
YOLO_CONF=0.6

# GCS configuration
GCS_ENABLED=1
GCS_BUCKET=household-fire-images
GCS_SERVICE_ACCOUNT=../embedded-project-6f2ed-6ff292c84b10.json

# Webcam capture path
WEBCAM_CAPTURE_PATH=/tmp/fire-check.jpg
```

See [ENV_CONFIG.md](../ENV_CONFIG.md) for all configuration options.

### Step 6: Test Components

#### Test 1: Webcam Capture
```bash
# Capture single frame from external camera (device 1)
ffmpeg -f avfoundation -video_size 1280x720 -framerate 30 -i "1" -frames:v 1 -y /tmp/test.jpg

# Verify image
open /tmp/test.jpg
```

#### Test 2: YOLO Wrapper (Mock Mode)
```bash
cd ai
python3 yolo_fire_wrapper.py /tmp/test.jpg --mock
```

Expected output:
```json
{"fire": false, "confidence": 0.15}
```

#### Test 3: YOLO Wrapper (Real Detection)
```bash
# First run downloads YOLOv8 model
python3 yolo_fire_wrapper.py /tmp/test.jpg
```

Expected output:
```json
{"fire": false, "confidence": 0.0}
```

#### Test 4: GCS Upload
```bash
cd ../scripts
node gcsUploader.js
```

Update `gcsUploader.js` test function:
```javascript
async function testUpload() {
  const uploader = new GCSUploader(
    '../embedded-project-6f2ed-6ff292c84b10.json',
    'household-fire-images'
  )
  
  // Upload test image
  const url = await uploader.uploadFile('/tmp/test.jpg')
  console.log('Uploaded URL:', url)
}
```

Run:
```bash
node gcsUploader.js
```

Expected output:
```
✓ Image uploaded to GCS: https://storage.googleapis.com/household-fire-images/test.jpg
```

### Step 7: Run Ingestion with Webcam

Start the ingestion script with webcam enabled:

```bash
cd household-fire-system
USE_WEBCAM=1 npm run ingest-esp32
```

Expected startup output:
```
╔══════════════════════════════════════════╗
║   ESP32 → FIRESTORE INGESTION LOOP       ║
╚══════════════════════════════════════════╝

🚀 Starting continuous data collection
📡 ESP32 Source: http://172.20.10.4/
🕒 Poll Interval: 3s
💾 Local Buffer: ../data/local-buffer.ndjson
☁️  Firestore: sensor_logs collection

📸 Webcam Integration: ENABLED
   Device: 1 (0=FaceTime, 1=External)
   YOLO Confidence Threshold: 60%
   GCS Bucket: household-fire-images

⏸️  Press Ctrl+C to stop ingestion
```

## Usage Flow

### Normal Operation
```
✅ [10:30:15] gw-1 -> NORMAL | T=28.5°C H=55% MQ=180 Gas=200 | Flame=✓ LDR=3200 Light=22%
✅ [10:30:18] gw-1 -> NORMAL | T=28.6°C H=55% MQ=182 Gas=201 | Flame=✓ LDR=3198 Light=22%
```

### WARNING Detected (No Fire)
```
⚠️  [10:30:21] gw-1 -> WARNING | T=36.2°C H=52% MQ=880 Gas=850 | Flame=✓ LDR=3100 Light=24%
⚠️  WARNING detected - capturing webcam...
🔍 Running YOLO fire detection...
✓ No fire detected (confidence: 15%)
⚠️  [10:30:21] gw-1 -> WARNING | T=36.2°C H=52% MQ=880 Gas=850 | Flame=✓ LDR=3100 Light=24%
```

### WARNING → DANGER (Fire Confirmed)
```
⚠️  [10:30:24] gw-1 -> WARNING | T=38.1°C H=50% MQ=920 Gas=900 | Flame=🔥 LDR=180 Light=95%
⚠️  WARNING detected - capturing webcam...
🔍 Running YOLO fire detection...
🔥 FIRE DETECTED! Confidence: 87%
📤 Uploading image to Google Cloud Storage...
✓ Image uploaded to GCS: https://storage.googleapis.com/.../fire_detection_20231206_103024_456.jpg
🚨 [10:30:24] gw-1 -> DANGER | T=38.1°C H=50% MQ=920 Gas=900 | Flame=🔥 LDR=180 Light=95% | 🤖 AI: 87% | 📸 Image uploaded
```

## Firestore Schema

### sensor_logs Collection

```json
{
  "timestamp": 1701849024456,
  "node_id": "gw-1",
  "temp": 38.1,
  "humidity": 50.0,
  "mq_arduino": 920,
  "mq_gateway": 900,
  "flame": true,
  "gas_gateway": 900,
  "light": 0.95,
  "risk_level": "DANGER",
  "ai_fire_detected": true,
  "ai_confidence": 0.87,
  "image_url": "https://storage.googleapis.com/household-fire-images/fire_detection_20231206_103024_456.jpg",
  "source": "ai"
}
```

## Troubleshooting

### Camera Not Detected

**Problem:** `system_profiler SPCameraDataType` only shows FaceTime camera

**Solutions:**
1. Unplug and replug the USB webcam
2. Try different USB port (bypass hub if possible)
3. Restart Mac
4. Check USB hub power supply

### Webcam Capture Fails

**Problem:** `Error: Webcam capture failed`

**Check:**
```bash
# Test direct capture
ffmpeg -f avfoundation -video_size 1280x720 -framerate 30 -i "1" -frames:v 1 -y /tmp/test.jpg
```

**Solutions:**
- Grant Terminal camera access: System Settings → Privacy & Security → Camera
- Try device "0" instead of "1"
- Reduce video size: `-video_size 640x480`

### YOLO Not Found

**Problem:** `YOLO not installed`

**Solution:**
```bash
cd ai
pip install ultralytics
```

### GCS Upload Fails

**Problem:** `GCS upload failed: 403 Forbidden`

**Check permissions:**
```bash
# List service account roles
gcloud projects get-iam-policy display-c8393 \
  --flatten="bindings[].members" \
  --filter="bindings.members:fire-ai-uploader@display-c8393.iam.gserviceaccount.com"
```

**Grant permission:**
```bash
gcloud projects add-iam-policy-binding display-c8393 \
  --member="serviceAccount:fire-ai-uploader@display-c8393.iam.gserviceaccount.com" \
  --role="roles/storage.objectAdmin"
```

### YOLO Detection Too Sensitive/Insensitive

**Adjust confidence threshold:**
```bash
# More sensitive (detect weaker fires)
YOLO_CONF=0.4 npm run ingest-esp32

# Less sensitive (only strong fire signals)
YOLO_CONF=0.8 npm run ingest-esp32
```

## Advanced Configuration

### Custom YOLO Model

Train your own fire detection model:

1. Collect fire images dataset
2. Annotate with LabelImg or Roboflow
3. Train YOLOv8:
```bash
from ultralytics import YOLO
model = YOLO('yolov8n.pt')
model.train(data='fire-dataset.yaml', epochs=100)
```

4. Use custom model:
```bash
YOLO_CMD="python3 ai/yolo_fire_wrapper.py --model ai/fire_model.pt" npm run ingest-esp32
```

### Multiple Cameras

Support multiple camera nodes:

```bash
# Node 1: Kitchen camera (device 1)
WEBCAM_DEVICE=1 SENSOR_NODE_ID=kitchen npm run ingest-esp32

# Node 2: Living room camera (device 2)
WEBCAM_DEVICE=2 SENSOR_NODE_ID=living-room npm run ingest-esp32
```

### Capture Higher Quality Images

```bash
# 1920x1080 at 30fps
WEBCAM_CMD="ffmpeg -f avfoundation -video_size 1920x1080 -framerate 30 -i \"1\" -frames:v 1 -y" npm run ingest-esp32
```

## Performance Tips

1. **Reduce capture resolution** for faster processing:
   ```bash
   -video_size 640x480  # Faster
   -video_size 1280x720 # Balanced (default)
   -video_size 1920x1080 # High quality
   ```

2. **Adjust polling interval** to reduce load:
   ```bash
   ESP32_POLL_MS=5000  # Check every 5 seconds
   ```

3. **Use YOLOv8n (nano)** for speed:
   - Already default in wrapper script
   - For better accuracy, use `yolov8s.pt` or `yolov8m.pt`

4. **Cache YOLO model** in memory (for Python continuous mode)

## Security Considerations

⚠️ **Important:**

1. **Never commit** service account JSON files
2. **Add to .gitignore**: `*.json`, `.env`
3. **Restrict GCS permissions** to specific bucket only
4. **Use Firebase Security Rules** for Firestore
5. **Consider encryption** for sensitive images
6. **Set image retention policy** (auto-delete after 30 days)

## Next Steps

- [ ] Set up Firebase Cloud Functions for LINE Notify
- [ ] Add image display in React dashboard
- [ ] Implement image gallery for past fire events
- [ ] Add email notifications
- [ ] Set up automated testing with mock data
- [ ] Deploy to production server

## References

- [Firebase Setup Guide](./FIREBASE_SETUP.md)
- [GCS Service Account Guide](./SERVICE_ACCOUNT_INTEGRATION.md)
- [Environment Configuration](../ENV_CONFIG.md)
- [YOLO Ultralytics Docs](https://docs.ultralytics.com/)
- [Google Cloud Storage Docs](https://cloud.google.com/storage/docs)
