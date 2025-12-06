# Data Management Scripts Guide

This guide explains how to use the 4 data management scripts for testing your fire detection system.

## Available Scripts

### 1. Delete All Data
```bash
npm run delete-all-data
```

**What it does:**
- Deletes all documents from `sensor_logs` collection
- Deletes all documents from `events` collection
- Provides deletion summary

**Use cases:**
- Clean slate before testing
- Reset database to start fresh
- Remove test data before production

**Output:**
```
🗑️  Starting data deletion...
📦 Deleting sensor_logs collection:
   ✓ Deleted 50/50 documents
📦 Deleting events collection:
   ✓ Deleted 0/0 documents
✅ Deletion complete!
```

---

### 2. Create Normal Data (50 readings)
```bash
npm run create-normal-data
```

**What it does:**
- Creates 50 sensor readings with NORMAL values
- Distributed over 24 hours
- All sensors in safe ranges
- No flame detections
- No AI alerts

**Data ranges:**
- Temperature: 22-30°C (normal room temperature)
- Humidity: 50-70% (comfortable range)
- MQ-135 Arduino: 100-200 PPM (safe)
- MQ-135 Gateway: 90-180 PPM (safe)
- Gas: 150-250 PPM (safe)
- Flame: false (no detection)
- Light: Day/night cycle (0.1-0.9)
- Risk Level: NORMAL

**Output:**
```
📊 Generating 50 NORMAL sensor readings...
📤 Uploading 50 records to Firestore...
   ✓ Uploaded 50/50 records
✅ Upload complete!
```

---

### 3. Create Warning Data (1 reading)
```bash
npm run create-warning-data
```

**What it does:**
- Creates 1 sensor reading with WARNING state
- High smoke sensor values
- Normal temperature and other sensors
- No flame detection (yet)
- Should trigger LINE notification

**Data characteristics:**
- Temperature: 25-30°C (slightly elevated)
- Humidity: 50-70% (normal)
- MQ-135 Arduino: **350-450 PPM** (elevated, WARNING)
- MQ-135 Gateway: **320-410 PPM** (elevated)
- Gas: **400-500 PPM** (elevated)
- Flame: false
- Risk Level: **WARNING**

**Output:**
```
⚠️  Generating WARNING sensor reading...
📊 Details:
   • Risk Level: WARNING
   • Smoke (MQ-135 Arduino): 380 PPM ⚠️
   • Smoke (MQ-135 Gateway): 360 PPM ⚠️
🔔 This should trigger a LINE notification!
```

---

### 4. Create Danger Data (1 reading)
```bash
npm run create-danger-data
```

**What it does:**
- Creates 1 sensor reading with DANGER state
- Critical values on multiple sensors
- Flame detection active
- AI fire detection (70% chance)
- Should trigger URGENT LINE notification

**Data characteristics:**
- Temperature: **55-70°C** (CRITICAL)
- Humidity: 30-45% (low, fire condition)
- MQ-135 Arduino: **500-700 PPM** (CRITICAL)
- MQ-135 Gateway: **480-660 PPM** (CRITICAL)
- Gas: **600-800 PPM** (CRITICAL)
- Flame: **true** (DETECTED)
- Light: 80-100% (unusual brightness)
- Risk Level: **DANGER**
- AI Fire Detection: 70% probability
- AI Confidence: 85-100%
- Image URL: Generated (if AI detected)

**Output:**
```
🚨 Generating DANGER sensor reading...
📊 Details:
   • Risk Level: DANGER 🚨
   • Temperature: 62.5°C 🔥
   • Smoke (MQ-135 Arduino): 580 PPM 💨
   • Flame: DETECTED 🔥
   • AI Fire Detection: YES 🤖
   • AI Confidence: 91.5%
🔔 This should trigger an URGENT LINE notification!
⚠️  Emergency response may be required!
```

## Recommended Testing Workflow

### Initial Setup
```bash
# 1. Clean database
npm run delete-all-data

# 2. Create baseline normal data
npm run create-normal-data

# 3. View in dashboard
# Open http://localhost:3000
# Should see normal readings, green risk badge
```

### Test WARNING State
```bash
# 1. Create warning reading
npm run create-warning-data

# 2. Check dashboard
# Should see:
# - Yellow/orange warning badge
# - Elevated smoke readings
# - Warning event in events list

# 3. Check LINE notification
# Should receive WARNING alert message
```

### Test DANGER State
```bash
# 1. Create danger reading
npm run create-danger-data

# 2. Check dashboard
# Should see:
# - Red danger badge
# - Critical sensor values
# - Flame detection alert
# - AI fire detection (if triggered)
# - Danger event in events list

# 3. Check LINE notification
# Should receive URGENT DANGER alert with all details
```

### Reset and Repeat
```bash
# Start fresh
npm run delete-all-data
npm run create-normal-data

# Test again
npm run create-warning-data
npm run create-danger-data
```

## Script Details

### Technology Stack
- **Firebase SDK**: For authentication and Firestore access
- **dotenv**: For environment variables
- **ES Modules**: Using import/export syntax

### Authentication
All scripts use:
- Anonymous sign-in
- Firebase authentication
- Environment variables from `web/.env`

### Data Schema
All scripts follow the same schema:
```javascript
{
  timestamp: number,        // Unix timestamp in milliseconds
  node_id: string,         // "gw-1"
  temp: number,            // Temperature in °C
  humidity: number,        // Humidity percentage
  mq_arduino: number,      // MQ-135 Arduino (PPM)
  mq_gateway: number,      // MQ-135 Gateway (PPM)
  flame: boolean,          // Flame sensor state
  gas_gateway: number,     // Gas sensor (PPM)
  light: number,           // Light level (0-1)
  risk_level: string,      // "NORMAL" | "WARNING" | "DANGER"
  ai_fire_detected: boolean,
  ai_confidence: number,   // 0-1
  image_url: string | null,
  source: string          // "gateway" | "ai"
}
```

## Troubleshooting

### Permission Denied Error
**Solution:**
1. Enable Anonymous Authentication in Firebase Console
2. Update Firestore Security Rules (see `docs/FIRESTORE_SECURITY_RULES.md`)
3. Wait 1-2 minutes for rules to propagate
4. Try again

### Environment Variables Not Found
**Solution:**
1. Ensure `web/.env` file exists
2. Check all 6 Firebase variables are present
3. Variables must start with `VITE_`

### Script Fails to Run
**Solution:**
1. Make sure you're in project root directory
2. Check Node.js is installed (v18+)
3. Run `npm install` first if needed

## Next Steps

After testing the data scripts:

1. ✅ Verify dashboard displays all states correctly
2. ✅ Test real-time updates
3. 🔔 Set up LINE Notify integration
4. 🔔 Create Firebase Cloud Functions for alerts
5. 🚀 Deploy to production

## LINE Notification Setup

We'll create Firebase Cloud Functions that:
- Listen to `sensor_logs` collection
- Detect WARNING and DANGER states
- Send LINE Notify messages with sensor details
- Include AI detection info and image URLs

**Coming next!** 🔔

