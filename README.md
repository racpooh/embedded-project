# Household Fire Detection System

A comprehensive IoT-based early fire detection system using ESP32, AI, and cloud integration.

## 🔥 Overview

This project implements a **Household Early Fire Detection System** that combines:
- **IoT Sensors** (Arduino UNO + ESP32 Gateway) for real-time environmental monitoring
- **AI-Powered Detection** (ESP32-CAM + Python) for visual fire detection
- **Cloud Integration** (Firebase Firestore + Google Cloud Storage) for data storage
- **Real-time Dashboard** (React + TypeScript) for monitoring and alerts
- **Emergency Notifications** (LINE Notify via Firebase Functions)

## 🏗️ System Architecture

```
Arduino UNO (Sensor Node)
  ├─ DHT22 (temperature/humidity)
  ├─ MQ-135 (smoke/gas detection)
  └─ Serial communication → ESP32 Gateway

ESP32 (Gateway Node)
  ├─ LDR (light sensor)
  ├─ Flame sensor
  ├─ Gas sensor
  ├─ Servo motor (actuator)
  ├─ Real-time risk scoring
  ├─ Immediate control actions
  ├─ Upload sensor_logs → Firebase Firestore
  └─ Trigger events → Firebase events collection

ESP32-CAM (Camera Node)
  ├─ Captures images for AI analysis
  └─ Serves images via /capture endpoint

Python AI Script
  ├─ Fetches images from ESP32-CAM
  ├─ Runs fire detection model (YOLO/FireNet)
  ├─ Uploads detected images → Google Cloud Storage
  └─ Writes DANGER events → Firebase Firestore

React Web Dashboard
  ├─ Real-time sensor data visualization
  ├─ Live Firestore updates
  ├─ Color-coded risk states (NORMAL/WARNING/DANGER)
  └─ AI-detected fire images display

LINE Notify
  └─ Emergency alerts via Firebase Cloud Functions
```

## 📁 Project Structure

```
household-fire-system/
├── README.md                    # This file
├── docs/                        # All documentation
│   ├── PROJECT_SUMMARY.md      # Detailed project overview
│   ├── WEB_DASHBOARD.md        # Web dashboard setup guide
│   ├── FIREBASE_SETUP.md       # Firebase configuration guide
│   ├── AI_MODULE.md            # AI detection module guide
│   └── SERVICE_ACCOUNT_INTEGRATION.md  # GCS service account guide
├── web/                         # React web dashboard
│   ├── src/
│   ├── package.json
│   └── ...
├── ai/                          # Python AI detection script
│   ├── fire_detection.py
│   ├── requirements.txt
│   └── ...
├── functions/                   # Firebase Cloud Functions (LINE Notify)
│   └── (to be added)
└── display-c8393-40e854cf0fda.json  # GCS service account (gitignored)
```

## 🚀 Quick Start

### 1. Web Dashboard Setup

```bash
cd web
npm install
cp .env.example .env
# Fill in Firebase config (see docs/FIREBASE_SETUP.md)
npm run dev
```

**Documentation**: [docs/WEB_DASHBOARD.md](./docs/WEB_DASHBOARD.md)

### 2. AI Detection Module Setup

```bash
cd ai
pip install -r requirements.txt
# Configure service account (see docs/SERVICE_ACCOUNT_INTEGRATION.md)
python fire_detection.py
```

**Documentation**: [docs/AI_MODULE.md](./docs/AI_MODULE.md)

### 3. Firebase Configuration

Get your Firebase configuration keys:
- Go to [Firebase Console](https://console.firebase.google.com/)
- Project: `display-c8393`
- Settings ⚙️ → Project settings → Your apps → Web app

**Detailed Guide**: [docs/FIREBASE_SETUP.md](./docs/FIREBASE_SETUP.md)

## 📊 Data Flow

### Sensor Data Flow
1. **Arduino UNO** → Serial JSON → **ESP32 Gateway**
2. **ESP32 Gateway** → Risk scoring → **Firebase Firestore** (`sensor_logs`)
3. **ESP32 Gateway** → Events → **Firebase Firestore** (`events`)

### AI Detection Flow
1. **ESP32-CAM** → Image capture → **Python AI Script**
2. **Python AI** → Fire detection → **Google Cloud Storage** (upload image)
3. **Python AI** → DANGER event → **Firebase Firestore** (`events`)

### Dashboard Flow
1. **React Dashboard** → Firebase Auth (anonymous) → **Firebase Firestore**
2. **Real-time updates** → `sensor_logs` & `events` collections
3. **Display** → Sensor values, risk levels, AI-detected images

### Notification Flow
1. **Firebase Functions** → Listen to `events` collection
2. **DANGER event detected** → **LINE Notify API** → Send alert

## 🔧 Firebase Collections

### `sensor_logs` Collection
```json
{
  "timestamp": 1712345678901,
  "temp": 32.5,
  "humidity": 65,
  "mq_arduino": 210,
  "mq_gateway": 180,
  "flame": false,
  "light": 450,
  "risk_level": "NORMAL",
  "ai_fire_detected": false,
  "source": "esp32_gateway"
}
```

### `events` Collection
```json
{
  "timestamp": 1712345678901,
  "event_type": "DANGER",
  "reason": "AI fire detection",
  "risk_score": 8,
  "ai_fire_detected": true,
  "ai_confidence": 0.92,
  "image_url": "https://storage.googleapis.com/household-fire-images/...",
  "acknowledged": false
}
```

## ☁️ Cloud Services

### Firebase
- **Project ID**: `display-c8393`
- **Firestore**: Real-time database for sensor logs and events
- **Authentication**: Anonymous sign-in for dashboard
- **Functions**: LINE Notify integration

### Google Cloud Storage
- **Bucket**: `household-fire-images`
- **Service Account**: `fire-ai-uploader@display-c8393.iam.gserviceaccount.com`
- **Purpose**: Store AI-detected fire images

## 📚 Documentation

All detailed documentation is in the [`docs/`](./docs/) folder:

- **[PROJECT_SUMMARY.md](./docs/PROJECT_SUMMARY.md)** - Complete project overview and architecture
- **[WEB_DASHBOARD.md](./docs/WEB_DASHBOARD.md)** - Web dashboard setup and usage
- **[FIREBASE_SETUP.md](./docs/FIREBASE_SETUP.md)** - Firebase configuration guide
- **[AI_MODULE.md](./docs/AI_MODULE.md)** - AI detection module setup
- **[SERVICE_ACCOUNT_INTEGRATION.md](./docs/SERVICE_ACCOUNT_INTEGRATION.md)** - GCS service account integration

## 🎯 Demo Flow

1. **Spray alcohol** → MQ-135 detects → **WARNING** event
2. **Ignite lighter** → Flame sensor + AI detects → **DANGER** event
3. **AI uploads image** → Google Cloud Storage
4. **Dashboard updates** → Real-time display
5. **LINE Notify** → Emergency alert sent

## 🔒 Security

- Service account JSON files are excluded from git (`.gitignore`)
- Environment variables for sensitive configuration
- Firebase Security Rules for Firestore access
- Anonymous authentication for dashboard (no user data stored)

## 🛠️ Technologies

- **Hardware**: Arduino UNO, ESP32, ESP32-CAM, DHT22, MQ-135, LDR, Flame sensor
- **Backend**: Python 3, Firebase Admin SDK, Google Cloud Storage
- **Frontend**: React 18, TypeScript, Vite, Firebase SDK
- **AI/ML**: YOLO, FireNet (or custom models)
- **Cloud**: Firebase (Firestore, Functions, Auth), Google Cloud Storage
- **Notifications**: LINE Notify API

## 📝 Requirements

### Web Dashboard
- Node.js 18+
- npm or yarn
- Firebase project with Firestore enabled

### AI Module
- Python 3.8+
- Google Cloud Storage service account
- Firebase Admin SDK credentials
- AI model (YOLO/FireNet) - optional

## 🤝 Contributing

1. Follow the project structure
2. Keep documentation in `docs/` folder
3. Never commit sensitive files (service accounts, `.env`)
4. Update relevant documentation when making changes

## 📄 License

[Add your license here]

## 🔗 Links

- [Firebase Console](https://console.firebase.google.com/)
- [Google Cloud Console](https://console.cloud.google.com/)
- [LINE Notify](https://notify-bot.line.me/)

---

**Need help?** Check the [documentation](./docs/) folder for detailed guides on each component.

