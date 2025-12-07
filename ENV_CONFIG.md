# Environment Configuration Guide

## Overview
This document describes all environment variables used in the household fire detection system.

## Firebase Configuration (Required)

Copy your Firebase credentials from Firebase Console > Project Settings > General > Your Apps > Web

```bash
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

## ESP32 Gateway Configuration

```bash
# ESP32 HTTP endpoint
ESP32_HOST=http://172.20.10.4

# Endpoint path (/ for HTML, /api/sensors for JSON)
ESP32_PATH=/

# Polling interval in milliseconds
ESP32_POLL_MS=3000

# Sensor node identifier
SENSOR_NODE_ID=gw-1
```

## Webcam + AI Fire Detection (Optional)

### Enable/Disable Webcam
```bash
# Set to 1 to enable webcam capture when WARNING is detected
USE_WEBCAM=1
```

### Webcam Device Selection
```bash
# Device index for AVFoundation (macOS)
# 0 = Built-in FaceTime HD Camera
# 1 = External USB Camera (recommended for fire detection)
WEBCAM_DEVICE=1
```

To check available devices on your Mac:
```bash
ffmpeg -f avfoundation -list_devices true -i ""
```

### Capture Settings
```bash
# Temporary path for captured images
WEBCAM_CAPTURE_PATH=/tmp/fire-check.jpg

# Custom capture command (optional)
# Default: ffmpeg -f avfoundation -video_size 1280x720 -framerate 30 -i "1" -frames:v 1 -y
# WEBCAM_CMD=your-custom-command
```

### YOLO Configuration
```bash
# Confidence threshold for fire detection (0.0 - 1.0)
# Only detections above this threshold will trigger DANGER status
YOLO_CONF=0.6

# Custom YOLO wrapper command (optional)
# Default: python3 ai/yolo_fire_wrapper.py
# YOLO_CMD=python3 /path/to/your/yolo_script.py
```

## Google Cloud Storage Configuration

### Enable GCS Upload
```bash
# Set to 1 to enable GCS uploads
# Auto-enabled when USE_WEBCAM=1
GCS_ENABLED=1

# GCS bucket name
GCS_BUCKET=household-fire-images

# Path to GCS service account JSON file
GCS_SERVICE_ACCOUNT=../embedded-project-6f2ed-6ff292c84b10.json
```

### GCS Setup Checklist
- [ ] Create GCS bucket: `household-fire-images`
- [ ] Create service account with Storage Object Admin role
- [ ] Download service account JSON key
- [ ] Place JSON file at: `household-fire-system/embedded-project-6f2ed-6ff292c84b10.json`
- [ ] Add `*.json` to `.gitignore` (already done)

## Example Configurations

### Development (No AI)
```bash
# .env in web/ folder
USE_WEBCAM=0
ESP32_HOST=http://172.20.10.4
ESP32_POLL_MS=3000
```

### Production (Full AI Integration)
```bash
# .env in web/ folder
USE_WEBCAM=1
WEBCAM_DEVICE=1
YOLO_CONF=0.6
GCS_ENABLED=1
GCS_BUCKET=household-fire-images
GCS_SERVICE_ACCOUNT=../embedded-project-6f2ed-6ff292c84b10.json
ESP32_HOST=http://172.20.10.4
ESP32_POLL_MS=3000
```

### Testing (Mock YOLO)
```bash
# .env in web/ folder
USE_WEBCAM=1
WEBCAM_DEVICE=1
YOLO_CMD=python3 ai/yolo_fire_wrapper.py --mock
GCS_ENABLED=0
```

## Create Your .env File

1. Copy Firebase configuration:
```bash
cd household-fire-system/web
cp .env.example .env
```

2. Edit `.env` and add your Firebase credentials

3. Add optional features (webcam, GCS) as needed

4. Never commit `.env` or `*.json` files to git!

## Verification

Test your configuration:
```bash
# Check if ESP32 is accessible
curl $ESP32_HOST

# Check if webcam is detected
ffmpeg -f avfoundation -list_devices true -i ""

# Test YOLO wrapper (mock mode)
python3 ai/yolo_fire_wrapper.py /tmp/test.jpg --mock

# Test GCS upload (if service account is configured)
node scripts/gcsUploader.js
```
