# Mock Data Setup Guide

This guide explains how to populate your Firebase Firestore with mock sensor data for testing the dashboard.

## Quick Start

The dashboard will **automatically use mock data** if no data exists in Firestore. You'll see a message: "📊 Displaying mock data (No Firebase data found)".

## Option 1: Automatic Mock Data (Client-Side)

The dashboard automatically generates and displays 50 mock sensor readings when no Firestore data is available.

**No setup required!** Just run the dashboard:
```bash
cd web
npm run dev
```

## Option 2: Upload Mock Data to Firestore

To persist mock data in Firestore:

### Method A: Browser Console

1. Start the dashboard:
```bash
cd web
npm run dev
```

2. Open browser DevTools (F12) → Console

3. Run this command:
```javascript
uploadMockData()
```

4. Wait for confirmation: `✅ Upload complete! Added 50 documents to Firestore`

5. Refresh the page to see real Firestore data

### Method B: Firebase Console (Manual)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: `display-c8393`
3. Navigate to **Firestore Database**
4. Create collection: `sensor_logs`
5. Add documents with this structure:

```json
{
  "timestamp": 1712345678901,
  "node_id": "gw-1",
  "temp": 32.5,
  "humidity": 65.0,
  "mq_arduino": 210,
  "mq_gateway": 180,
  "flame": false,
  "gas_gateway": 320,
  "light": 0.75,
  "risk_level": "NORMAL",
  "ai_fire_detected": false,
  "ai_confidence": 0.0,
  "image_url": null,
  "source": "gateway"
}
```

### Method C: Firebase CLI

```bash
# Install Firebase tools
npm install -g firebase-tools

# Login
firebase login

# Initialize Firestore
firebase init firestore

# Use the Firebase Admin SDK to batch upload
# (Create a Node.js script with the uploadMockDataToFirestore function)
```

## Mock Data Features

The generated mock data includes:

### Sensor Readings (50 entries over 24 hours)
- **Temperature**: 28-38°C (with occasional spikes to 45-65°C)
- **Humidity**: 55-75%
- **MQ-135 (Arduino)**: 150-600 PPM
- **MQ-135 (Gateway)**: 135-580 PPM
- **Gas (Gateway)**: 200-700 PPM
- **Flame**: Occasional detections (5% of readings)
- **Light**: Day/night cycle simulation (0.1-0.9 normalized)
- **Risk Levels**: 
  - NORMAL: 80% of readings
  - WARNING: 15% of readings
  - DANGER: 5% of readings

### AI Fire Detection
- Randomly triggered during DANGER states (40% chance)
- Confidence scores: 75-100%
- Mock image URLs from GCS

### Realistic Patterns
- ✅ Gradual temperature changes
- ✅ Day/night light cycle
- ✅ Correlated sensor readings
- ✅ Occasional danger events
- ✅ Timestamp distribution over 24 hours

## Data Schema

```typescript
interface SensorLog {
  timestamp: number           // Unix timestamp in milliseconds
  node_id: string            // "gw-1" (gateway node ID)
  temp: number               // Temperature in °C
  humidity: number           // Humidity percentage (0-100)
  mq_arduino: number         // MQ-135 Arduino sensor reading (PPM)
  mq_gateway: number         // MQ-135 Gateway sensor reading (PPM)
  flame: boolean             // Flame sensor state
  gas_gateway: number        // Gateway gas sensor reading (PPM)
  light: number              // LDR light level (0-1 normalized)
  risk_level: string         // "NORMAL" | "WARNING" | "DANGER"
  ai_fire_detected: boolean  // AI detection flag
  ai_confidence: number      // AI confidence score (0-1)
  image_url: string | null   // GCS image URL (if AI detected fire)
  source: string             // "gateway" | "ai"
}
```

## Clearing Mock Data

To clear Firestore data:

### Via Firebase Console
1. Go to Firestore Database
2. Select `sensor_logs` collection
3. Delete all documents (or delete the collection)

### Via Firebase CLI
```bash
firebase firestore:delete sensor_logs --recursive
```

## Production Data

When your ESP32 gateway is running, it will:
1. Send real sensor data to Firestore
2. Override mock data automatically
3. Dashboard will switch to real-time data
4. The mock data message will disappear

## Troubleshooting

### "No data available" message
- Check Firebase connection in browser console
- Verify Firestore Security Rules allow read access
- Run `uploadMockData()` in browser console

### Charts show flat lines
- Ensure data has variance in sensor values
- Check timestamp distribution is correct
- Verify data is sorted chronologically

### AI images not loading
- Mock image URLs are examples only
- They won't load unless you have actual images in GCS
- For testing, images are optional

## Advanced: Custom Mock Data

To customize the mock data generation:

1. Edit `web/src/utils/mockData.ts`
2. Modify the `generateMockSensorLogs()` function
3. Adjust parameters:
   - Temperature ranges
   - Sensor thresholds
   - Risk level probabilities
   - Time intervals

Example:
```typescript
// Increase danger frequency
const isDangerous = Math.random() > 0.90 // 10% instead of 5%

// Higher temperature range
const baseTemp = 30 + Math.sin(i / 10) * 8 + Math.random() * 5
```

## Testing Scenarios

### Normal Operation
```javascript
// All sensors in safe ranges
temp: 25-30°C
mq_arduino: 100-200 PPM
flame: false
risk_level: "NORMAL"
```

### Warning State
```javascript
// Elevated readings
temp: 35-42°C
mq_arduino: 280-380 PPM
flame: false
risk_level: "WARNING"
```

### Danger State
```javascript
// Critical readings
temp: 45-65°C
mq_arduino: 400-600 PPM
flame: true
risk_level: "DANGER"
ai_fire_detected: true
```

## Next Steps

1. ✅ Run dashboard with automatic mock data
2. 📊 View charts and sensor readings
3. 🔥 Test different risk states
4. 🚀 Connect real ESP32 hardware
5. 📈 Monitor real-time sensor data

For more information, see:
- [TESTING_WEB_DASHBOARD.md](./TESTING_WEB_DASHBOARD.md)
- [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)

