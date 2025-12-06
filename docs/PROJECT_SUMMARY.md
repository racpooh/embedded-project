# Household Fire Detection System – Full Project Summary

## Overview
This project implements a **Household Early Fire Detection System** using IoT + AI + Cloud integration.  
The system detects **heat, smoke, flame, and environmental changes**, and uses an **ESP32-CAM** for AI-based fire detection.  
Cloud storage includes **Firebase** (main) and **Google Cloud Storage (GCS)** (for images).  
Realtime UI is built using **React + Firebase SDK**, and emergency notifications are sent via **LINE Notify**.

## System Architecture
```
Arduino UNO (Sensor Node)
  ├─ DHT22 (temp/humidity)
  ├─ MQ-135 (smoke/gas)
  └─ Send serial → ESP32 Gateway

ESP32 (Gateway Node)
  ├─ LDR (light)
  ├─ Flame sensor
  ├─ Gas sensor
  ├─ Servo (actuator)
  ├─ Real-time risk scoring
  ├─ Immediate control (servo/buzzer)
  ├─ Upload sensor_logs → Firebase
  └─ Trigger events → Firebase events collection

ESP32-CAM (Camera Node)
  ├─ Sends images → Python AI script
  └─ Captures fire frames for ML inference

Python AI Script (PC/Mobile)
  ├─ Capture ESP32-CAM frames
  ├─ Run fire detection model
  ├─ Upload images → GCS bucket
  └─ Write events → Firebase

Cloud Storage
  ├─ Firebase Firestore
  └─ Google Cloud Storage (GCS)

React Web Dashboard
  ├─ Realtime data visualization
  ├─ Fire alerts
  ├─ Display AI-detected images
  └─ Hosted on Vercel/Firebase Hosting

LINE Notify
  └─ Triggered by Firebase Functions
```

## Data Flow Summary

### Step 1: Sensor Node → Gateway
Arduino sends:
```json
{"node": "1", "temp": 31.2, "hum": 65, "mq": 210}
```

### Step 2: Real-Time Processing (Gateway)
Risk scoring example:
```
risk = 0
if flame_detected: risk += 5
if mq > threshold: risk += 2
if temp > 50°C: risk += 3
```

### Step 3: AI Fire Detection (Python)
If fire detected:
```json
{
  "event_type": "DANGER",
  "ai_fire_detected": true,
  "ai_confidence": 0.92,
  "image_url": "https://storage.googleapis.com/..."
}
```

## Firebase Collections

### sensor_logs
```json
{
  "timestamp": 1712345678901,
  "temp": 32.5,
  "humidity": 65,
  "mq_arduino": 210,
  "flame": true,
  "risk_level": "WARNING",
  "ai_fire_detected": false
}
```

### events
```json
{
  "timestamp": 1712345678901,
  "event_type": "DANGER",
  "risk_score": 8,
  "ai_fire_detected": true,
  "image_url": "..."
}
```

## Google Cloud Storage Setup
- Bucket: `household-fire-images`
- Service Account: `fire-ai-uploader`
- Role: `Storage Object Admin`

Python upload test:
```python
blob.upload_from_filename("test.jpg")
```

## React Web Dashboard Summary
Setup:
```
npm create vite@latest web --template react-ts
npm install firebase
```

Realtime hook:
```ts
useLatestSensorLog()
```

## LINE Notify (Firebase Functions)
Trigger:
```
onCreate("events/{id}")
```

## GitHub Structure
```
household-fire-system/
  web/
  functions/
  ai/
  README.md
```

## Demo Flow
1. Spray alcohol → WARNING  
2. Lighter → AI detects → DANGER  
3. Upload → GCS  
4. UI updates → LINE notification
