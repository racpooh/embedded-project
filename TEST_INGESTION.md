# ESP32 Ingestion Testing Guide

This guide helps you test the ESP32 → Firestore data pipeline.

## Prerequisites

1. **Firebase configured**: Ensure `web/.env` exists with your Firebase credentials
2. **ESP32 running**: Your ESP32 should be accessible at `172.20.10.4` (or set custom host)
3. **Dependencies installed**: Run `npm install` in `household-fire-system/`

---

## Test Option 1: Test with Mock Server (No ESP32 needed)

Perfect for testing the integration without hardware.

### Step 1: Start Mock ESP32 Server

```bash
cd household-fire-system
node scripts/testEsp32Mock.js
```

You should see:
```
╔══════════════════════════════════════════╗
║   MOCK ESP32 SERVER RUNNING              ║
╚══════════════════════════════════════════╝

🌐 Server running at http://localhost:8080
```

Keep this terminal open!

### Step 2: Run Ingestion (New Terminal)

Open a **new terminal** and run:

```bash
cd household-fire-system

# Point to mock server
export ESP32_HOST=http://localhost:8080

# Start ingestion
npm run ingest-esp32
```

You should see output like:
```
🚀 Starting ESP32 ingestion
📡 Source: http://localhost:8080/api/sensors
🕒 Interval: 5000 ms
💾 Local buffer: /Users/POOH/.../data/local-buffer.ndjson
[2025-12-07T...] gw-1 -> NORMAL (T=25.5°C, MQ=150, Gas=150, Flame=false)
```

### Step 3: Verify Results

1. **Check local buffer**: 
   ```bash
   cat data/local-buffer.ndjson
   ```
   You should see JSON lines with sensor data.

2. **Check Firestore**: Open your Firebase Console → Firestore → `sensor_logs` collection
   - New documents should appear every 5 seconds
   - Verify `risk_level`, `temp`, `mq_arduino`, etc.

3. **Check Dashboard**: Open `http://localhost:3000` (if web dashboard is running)
   - New sensor readings should appear
   - Charts should update

---

## Test Option 2: Test with Real ESP32

### Step 1: Test ESP32 Connection

```bash
cd household-fire-system

# Test direct connection (optional custom host)
ESP32_HOST=http://172.20.10.4 node scripts/testEsp32Direct.js
```

This will:
- ✅ Test connection to ESP32
- 📝 Show HTML response
- 🔍 Parse and display sensor values
- ⚠️  Identify any parsing issues

Expected output:
```
╔══════════════════════════════════════════╗
║   TEST ESP32 DIRECT CONNECTION           ║
╚══════════════════════════════════════════╝

📡 Testing connection to: http://172.20.10.4

📍 Testing root endpoint (/)...
   ✅ Status: 200 OK
   📄 Content-Type: text/html
   
🔍 Parsing sensor values from HTML...
   • Temperature: 25.5°C
   • Humidity: 65.0%
   • LDR Value: 800
   • Flame DO: 1 (No flame)
   • Flame AO: 100
   • MQ Value: 150
```

### Step 2: Run Real Ingestion

If the test passed, start the ingestion:

```bash
cd household-fire-system
npm run ingest-esp32
```

Default connects to `http://172.20.10.4/api/sensors` (falls back to `/` if JSON not available).

### Step 3: Monitor Output

Watch the console for:
- ✅ Successful reads every 5 seconds
- ⚠️  Any connection errors
- 🚨 Risk level changes (NORMAL → WARNING → DANGER)

---

## Configuration Options

You can customize the ingestion via environment variables:

```bash
# Set ESP32 host (default: http://172.20.10.4)
export ESP32_HOST=http://192.168.1.100

# Set endpoint path (default: /api/sensors)
export ESP32_PATH=/api/sensors

# Set polling interval in milliseconds (default: 5000)
export ESP32_POLL_MS=2000

# Set node ID (default: gw-1)
export SENSOR_NODE_ID=kitchen-sensor-1

# Then run
npm run ingest-esp32
```

Or create a `.env` file in `household-fire-system/`:

```env
ESP32_HOST=http://172.20.10.4
ESP32_PATH=/api/sensors
ESP32_POLL_MS=5000
SENSOR_NODE_ID=gw-1
```

---

## Verify Data Quality

### Check Local Buffer

```bash
# View last 5 readings
tail -5 data/local-buffer.ndjson | jq
```

### Check Firestore

```bash
# View recent sensor logs (if you have Firebase CLI)
firebase firestore:get sensor_logs --limit 5
```

### Check Risk Levels

The script automatically computes risk levels:

- **NORMAL**: All sensors in safe range
  - Temp < 35°C
  - MQ < 350 PPM
  - Gas < 400 PPM
  - No flame

- **WARNING**: Elevated values
  - Temp 35-54°C
  - MQ 350-499 PPM
  - Gas 400-599 PPM
  - Flame AO 1500-2499

- **DANGER**: Critical values
  - Temp ≥ 55°C
  - MQ ≥ 500 PPM
  - Gas ≥ 600 PPM
  - Flame detected OR Flame AO ≥ 2500

---

## Test Risk Level Detection

### Test WARNING State

Simulate high smoke:

1. Hold a lighter or incense near MQ sensor (don't ignite)
2. Wait for reading
3. Check console: should show `WARNING`
4. Check Firestore: `risk_level: "WARNING"`
5. LINE notification should trigger!

### Test DANGER State

Simulate fire conditions:

1. Use flame sensor near a lighter flame
2. OR heat up DHT22 sensor (carefully)
3. Wait for reading
4. Check console: should show `DANGER`
5. Check Firestore: `risk_level: "DANGER"`
6. URGENT LINE notification should trigger!

---

## Troubleshooting

### Connection Failed

```
❌ Fatal error: Error: ESP32 request failed 404
```

**Solutions:**
- Check ESP32 is powered on
- Verify IP address: `ping 172.20.10.4`
- Check WiFi network (both Mac and ESP32 on same network)
- Test browser: Open `http://172.20.10.4` in browser

### Parsing Returns NaN

```
[...] gw-1 -> NORMAL (T=NaN°C, MQ=NaN, ...)
```

**Solutions:**
- Run `node scripts/testEsp32Direct.js` to see HTML format
- Check HTML matches regex patterns
- Verify ESP32 is printing values correctly

### Firebase Permission Denied

```
❌ Error: Missing or insufficient permissions
```

**Solutions:**
- Enable Anonymous Authentication in Firebase Console
- Update Firestore Security Rules (see `docs/FIRESTORE_SECURITY_RULES.md`)
- Check `web/.env` has correct Firebase credentials

### No Data in Firestore

**Check:**
1. Local buffer filling? → `ls -lh data/local-buffer.ndjson`
2. Firebase auth working? → Check console for "Authentication successful"
3. Internet connection? → `ping firebase.google.com`
4. Firestore rules? → See `docs/FIRESTORE_SECURITY_RULES.md`

---

## Stop Ingestion

Press `Ctrl+C` in the terminal running `npm run ingest-esp32`

The local buffer file persists - you can restart anytime and continue.

---

## Next Steps

After successful testing:

1. ✅ Set up as background service (systemd/pm2/docker)
2. 📊 Monitor dashboard for real-time updates
3. 🔔 Configure LINE notifications (see `docs/LINE_MESSAGING_API_SETUP.md`)
4. 🤖 Integrate AI fire detection module (see `docs/AI_MODULE.md`)
5. 🚀 Deploy to production

---

## Quick Reference Commands

```bash
# Test with mock server
node scripts/testEsp32Mock.js              # Terminal 1
npm run ingest-esp32                        # Terminal 2 (with ESP32_HOST=http://localhost:8080)

# Test real ESP32
node scripts/testEsp32Direct.js             # Test connection
npm run ingest-esp32                        # Start ingestion

# View local data
cat data/local-buffer.ndjson | jq           # Pretty print
tail -f data/local-buffer.ndjson            # Watch real-time

# Clean up old data
rm data/local-buffer.ndjson                 # Delete local buffer
npm run delete-all-data                     # Clear Firestore
```

---

## Support

- Check docs: `docs/` folder
- Firebase Console: https://console.firebase.google.com
- ESP32 dashboard: http://172.20.10.4
