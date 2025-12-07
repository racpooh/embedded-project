# Quick Start: External Webcam + YOLO Fire Detection

## 🎯 What You Have Now

Your external camera **"Web Camera" (device index 1)** is now integrated with your fire detection system!

**Flow:**
1. Sensors detect **WARNING** (high temp/gas/flame)
2. System captures image from **external webcam**
3. **YOLO** analyzes image for fire
4. If fire detected (confidence ≥ 60%):
   - Status upgraded to **DANGER**
   - Image uploaded to **Google Cloud Storage**
   - URL stored in **Firebase Firestore**
   - Displayed in **React Dashboard**

## 🚀 Quick Setup (5 Minutes)

### 1. Install Python Dependencies

```bash
cd household-fire-system/ai
pip install -r requirements.txt
```

This installs YOLO (ultralytics) and other required packages.

### 2. Install Node.js Dependencies

```bash
cd household-fire-system
npm install
```

This installs Google Cloud Storage package.

### 3. Configure Environment

Create `web/.env` (copy from your existing Firebase config):

```bash
cd web

# Add these lines to your existing .env file:
echo "USE_WEBCAM=1" >> .env
echo "WEBCAM_DEVICE=1" >> .env
echo "YOLO_CONF=0.6" >> .env
echo "GCS_ENABLED=1" >> .env
echo "GCS_BUCKET=household-fire-images" >> .env
echo "GCS_SERVICE_ACCOUNT=../embedded-project-6f2ed-6ff292c84b10.json" >> .env
```

### 4. Test Webcam Capture

```bash
# Capture test image from external camera
ffmpeg -f avfoundation -video_size 1280x720 -framerate 30 -i "1" -frames:v 1 -y /tmp/test.jpg

# View it
open /tmp/test.jpg
```

### 5. Test YOLO Wrapper

```bash
cd ai

# Test with mock detection (for testing)
python3 yolo_fire_wrapper.py /tmp/test.jpg --mock

# Test with real YOLO (downloads model on first run)
python3 yolo_fire_wrapper.py /tmp/test.jpg
```

Expected output:
```json
{"fire": false, "confidence": 0.0}
```

### 6. Run Ingestion with Webcam

```bash
cd household-fire-system
USE_WEBCAM=1 npm run ingest-esp32
```

You should see:
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

## 📊 What Happens When WARNING is Detected

```
⚠️  [10:30:21] gw-1 -> WARNING | T=36.2°C H=52% MQ=880 | Flame=🔥 LDR=180
⚠️  WARNING detected - capturing webcam...
🔍 Running YOLO fire detection...
```

**If fire detected:**
```
🔥 FIRE DETECTED! Confidence: 87%
📤 Uploading image to Google Cloud Storage...
✓ Image uploaded to GCS: https://storage.googleapis.com/.../fire_detection_20231206_103024.jpg
🚨 [10:30:21] gw-1 -> DANGER | T=36.2°C | 🤖 AI: 87% | 📸 Image uploaded
```

**If no fire:**
```
✓ No fire detected (confidence: 15%)
⚠️  [10:30:21] gw-1 -> WARNING | T=36.2°C H=52% MQ=880 | Flame=🔥 LDR=180
```

## 🧪 Testing the Integration

### Test 1: Mock Fire Detection

Use mock mode to simulate fire detection without real YOLO:

```bash
# Edit web/.env, add:
YOLO_CMD=python3 ai/yolo_fire_wrapper.py --mock

# Any image with 'fire' in filename will be detected
cp /tmp/test.jpg /tmp/fire-test.jpg

# Run ingestion
npm run ingest-esp32
```

### Test 2: Real Fire Test

**⚠️ Safety First: Use a controlled fire source (lighter, candle)**

1. Start ingestion with webcam:
```bash
USE_WEBCAM=1 npm run ingest-esp32
```

2. Trigger WARNING status:
   - Heat sensor near hot surface (>35°C), OR
   - Flame sensor near light source, OR
   - MQ sensor near alcohol/smoke

3. Point external camera at fire source

4. System should:
   - Capture image
   - Detect fire with YOLO
   - Upgrade to DANGER
   - Upload to GCS
   - Store URL in Firestore

### Test 3: View in Dashboard

```bash
cd web
npm run dev
```

Open http://localhost:3000

- You should see DANGER events in the event list
- Image URL should be visible in sensor logs
- (Future: Image gallery will display captured fire images)

## 📝 Configuration Options

### Adjust YOLO Sensitivity

```bash
# More sensitive (detect weaker fires)
YOLO_CONF=0.4 npm run ingest-esp32

# Less sensitive (only strong fires)
YOLO_CONF=0.8 npm run ingest-esp32
```

### Use Different Camera

```bash
# Use built-in FaceTime camera
WEBCAM_DEVICE=0 npm run ingest-esp32

# Use external camera (default)
WEBCAM_DEVICE=1 npm run ingest-esp32
```

### Capture Higher Quality

```bash
# Edit web/.env:
WEBCAM_CMD=ffmpeg -f avfoundation -video_size 1920x1080 -framerate 30 -i "1" -frames:v 1 -y
```

## 🔧 Troubleshooting

### "YOLO not installed"

```bash
cd ai
pip install ultralytics
```

### "GCS upload failed: 403 Forbidden"

Check service account permissions:
```bash
# Verify service account file exists
ls -la embedded-project-6f2ed-6ff292c84b10.json

# Grant Storage Object Admin role via Console:
# https://console.cloud.google.com/storage/browser/household-fire-images
# → Permissions → Add fire-ai-uploader@... with Storage Object Admin role
```

### "Webcam capture failed"

1. Grant Terminal camera access:
   - System Settings → Privacy & Security → Camera → Terminal

2. Test direct capture:
```bash
ffmpeg -f avfoundation -video_size 1280x720 -i "1" -frames:v 1 -y /tmp/test.jpg
open /tmp/test.jpg
```

3. Try different device:
```bash
# List available devices
ffmpeg -f avfoundation -list_devices true -i ""

# Try device 0 (FaceTime)
WEBCAM_DEVICE=0 npm run ingest-esp32
```

### Camera shows black screen

- Check if camera has physical privacy shutter
- Unplug and replug USB cable
- Try different USB port
- Restart Mac

## 📚 Full Documentation

For detailed guides, see:
- **[WEBCAM_INTEGRATION.md](docs/WEBCAM_INTEGRATION.md)** - Complete integration guide
- **[ENV_CONFIG.md](ENV_CONFIG.md)** - All environment variables
- **[AI_MODULE.md](docs/AI_MODULE.md)** - Python AI module docs

## 🎉 Next Steps

1. **Train custom YOLO model** on fire dataset for better accuracy
2. **Add image gallery** to React dashboard
3. **Set up LINE Notify** for emergency alerts
4. **Configure image retention** (auto-delete old images)
5. **Deploy to production** server

## ⚡ Quick Commands Reference

```bash
# Install dependencies
npm install
cd ai && pip install -r requirements.txt

# Test camera
ffmpeg -f avfoundation -list_devices true -i ""

# Test YOLO
python3 ai/yolo_fire_wrapper.py /tmp/test.jpg --mock

# Run with webcam (development)
USE_WEBCAM=1 npm run ingest-esp32

# Run with webcam (production .env)
npm run ingest-esp32

# View dashboard
cd web && npm run dev
```

## 🆘 Need Help?

Check the logs:
- Ingestion script shows real-time status
- Check `/tmp/fire-check.jpg` for last captured image
- Check `data/local-buffer.ndjson` for all sensor readings
- Check Firebase Console for Firestore data
- Check GCS Console for uploaded images

---

**Ready to detect fires with AI! 🔥🤖📸**
