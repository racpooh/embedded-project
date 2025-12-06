# ⚠️ DEPRECATED: LINE Notify Setup Guide

> **🔴 IMPORTANT NOTICE**  
> **LINE Notify service was discontinued on March 31, 2025**  
>   
> **Please use LINE Messaging API instead:**  
> → See `LINE_MESSAGING_API_SETUP.md` for the new setup guide  
> → See `LINE_NOTIFY_MIGRATION.md` for migration instructions  
>   
> This document is kept for historical reference only.

---

## Overview (Deprecated)

The system sends automatic LINE notifications when:
- 🔶 **WARNING** state is detected (elevated sensor values)
- 🔴 **DANGER** state is detected (critical fire conditions)

## Step 1: Get LINE Notify Token

### 1.1 Visit LINE Notify Website
Go to: https://notify-bot.line.me/

### 1.2 Login with LINE Account
- Click "Login" (ログイン)
- Use your LINE account credentials

### 1.3 Generate Access Token
1. Click your name (top right) → "My page" (マイページ)
2. Scroll to "Generate token" (トークンを発行する)
3. Click "Generate token" button
4. Fill in the form:
   - **Token name**: `Household Fire Detection` (or any name you prefer)
   - **Select chat**: Choose where to receive notifications
     - `1-on-1 chat with LINE Notify` (recommended for personal use)
     - Or select a LINE group
5. Click "Generate token" (発行する)
6. **IMPORTANT**: Copy the token immediately
   - It looks like: `abcdefghijklmnopqrstuvwxyz1234567890`
   - You won't be able to see it again!
7. Save the token securely

## Step 2: Install Firebase CLI

```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Login to Firebase
firebase login

# Verify you're logged in
firebase projects:list
```

## Step 3: Initialize Firebase Project

```bash
# Navigate to project root
cd /Users/POOH/Development/embedded-project/household-fire-system

# Verify project is linked
firebase use display-c8393

# Check status
firebase projects:list
```

## Step 4: Install Functions Dependencies

```bash
# Navigate to functions folder
cd functions

# Install dependencies
npm install

# Go back to project root
cd ..
```

## Step 5: Configure LINE Notify Token

```bash
# Set LINE token in Firebase config (replace YOUR_LINE_TOKEN with your actual token)
firebase functions:config:set line.token="YOUR_LINE_TOKEN"

# Verify configuration
firebase functions:config:get
```

**Example:**
```bash
firebase functions:config:set line.token="abcdefghijklmnopqrstuvwxyz1234567890"
```

Expected output:
```
✔ Functions config updated.
```

## Step 6: Deploy Firebase Functions

```bash
# Deploy all functions
firebase deploy --only functions

# Or deploy specific function
firebase deploy --only functions:monitorSensorLogs
```

Expected output:
```
✔ Deploy complete!

Functions:
  monitorSensorLogs(sensor_logs/{logId})
  sendTestLineNotification(us-central1)
  getLineNotifyStatus(us-central1)
```

## Step 7: Test LINE Notifications

### Method 1: Send Test Notification (HTTP)

After deployment, get the function URL:
```bash
firebase functions:list
```

Find `sendTestLineNotification` URL and visit it in your browser, or use curl:
```bash
curl https://us-central1-display-c8393.cloudfunctions.net/sendTestLineNotification
```

You should receive a test message in LINE! 🎉

### Method 2: Trigger with Test Data

```bash
# Create a WARNING reading
npm run create-warning-data

# Check LINE - you should receive a WARNING alert! ⚠️

# Create a DANGER reading
npm run create-danger-data

# Check LINE - you should receive a DANGER alert! 🚨
```

## Step 8: Verify Setup

Check if LINE token is configured:
```bash
curl https://us-central1-display-c8393.cloudfunctions.net/getLineNotifyStatus
```

Expected response:
```json
{
  "configured": true,
  "message": "LINE Notify is configured ✅"
}
```

## How It Works

### Architecture

```
┌─────────────────┐
│  Sensor Data    │
│  (ESP32/Python) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Firestore     │
│  sensor_logs    │
└────────┬────────┘
         │
         │ (onCreate trigger)
         ▼
┌─────────────────┐
│ Cloud Function  │
│ monitorSensor   │
│     Logs        │
└────────┬────────┘
         │
         │ (if WARNING/DANGER)
         ▼
┌─────────────────┐
│  LINE Notify    │
│   Send Alert    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Your Phone    │
│  LINE App 📱    │
└─────────────────┘
```

### Cloud Function Triggers

**1. monitorSensorLogs** (Firestore Trigger)
- Listens to: `sensor_logs` collection
- Triggers on: New document creation
- Condition: `risk_level === 'WARNING' || risk_level === 'DANGER'`
- Action: Sends formatted LINE notification

**2. sendTestLineNotification** (HTTP Trigger)
- URL: `https://us-central1-display-c8393.cloudfunctions.net/sendTestLineNotification`
- Purpose: Test LINE integration
- Returns: Success/error response

**3. getLineNotifyStatus** (HTTP Trigger)
- URL: `https://us-central1-display-c8393.cloudfunctions.net/getLineNotifyStatus`
- Purpose: Check configuration status
- Returns: Configuration status

## Message Format

### WARNING Alert Example
```
⚠️ FIRE ALERT: WARNING ⚠️

━━━━━━━━━━━━━━━━━━━━━
📅 Time: 12/06/2025, 10:30:45 AM
🏠 Node: gw-1

🌡️ SENSOR READINGS:
• Temperature: 28.5°C
• Humidity: 55.0%
• Smoke (Arduino): 380 PPM
• Smoke (Gateway): 360 PPM
• Gas Level: 450 PPM
• Light Level: 65%
• Flame: Not detected

⚠️ RISK LEVEL: WARNING
━━━━━━━━━━━━━━━━━━━━━

⚠️ CAUTION ADVISED:
• Monitor the situation
• Check for smoke sources
• Be prepared to evacuate
```

### DANGER Alert Example
```
🚨 FIRE ALERT: DANGER 🚨

━━━━━━━━━━━━━━━━━━━━━
📅 Time: 12/06/2025, 10:35:20 AM
🏠 Node: gw-1

🌡️ SENSOR READINGS:
• Temperature: 62.5°C
• Humidity: 35.0%
• Smoke (Arduino): 580 PPM
• Smoke (Gateway): 550 PPM
• Gas Level: 720 PPM
• Light Level: 85%
• Flame: 🔥 DETECTED!

⚠️ RISK LEVEL: DANGER
━━━━━━━━━━━━━━━━━━━━━

🤖 AI FIRE DETECTION:
• Status: FIRE DETECTED
• Confidence: 91.5%
• Image: https://storage.googleapis.com/...

🚨 IMMEDIATE ACTION REQUIRED!
• Evacuate the area
• Call emergency services
• Check fire extinguisher
```

## Troubleshooting

### Issue 1: "LINE Notify token not configured"

**Solution:**
```bash
# Set the token
firebase functions:config:set line.token="YOUR_LINE_TOKEN"

# Redeploy functions
firebase deploy --only functions
```

### Issue 2: No LINE messages received

**Checklist:**
1. ✅ TOKEN copied correctly (no spaces, complete)
2. ✅ Functions deployed successfully
3. ✅ LINE Notify added to your chat/group
4. ✅ Test notification works
5. ✅ Firestore has WARNING/DANGER data

**Debug:**
```bash
# Check function logs
firebase functions:log --only monitorSensorLogs

# Check config
firebase functions:config:get
```

### Issue 3: "Permission denied" errors

**Solution:**
1. Check Firebase Admin SDK permissions
2. Verify service account has Firestore access
3. Check Firebase Console → IAM & Admin

### Issue 4: Functions not deploying

**Solution:**
```bash
# Clear Firebase cache
rm -rf .firebase/

# Reinstall dependencies
cd functions
rm -rf node_modules package-lock.json
npm install
cd ..

# Try deploying again
firebase deploy --only functions
```

## Local Testing (Optional)

### Run Functions Locally
```bash
# Start Firebase emulators
cd functions
npm run serve
```

### Test with Emulator
```bash
# In another terminal, trigger test
curl http://localhost:5001/display-c8393/us-central1/sendTestLineNotification
```

## Cost Information

### Firebase Cloud Functions
- **Free Tier**: 2M invocations/month
- **WARNING/DANGER alerts**: ~2-10/day = 60-300/month
- **Estimated cost**: $0 (within free tier)

### LINE Notify
- **Completely FREE** ✅
- Unlimited messages
- No API limits for personal use

## Best Practices

1. **Keep Token Secret**: Never commit LINE token to git
2. **Test Regularly**: Use test function to verify integration
3. **Monitor Logs**: Check Firebase logs for errors
4. **Rate Limiting**: LINE Notify has rate limits (1000 msg/hour)
5. **Message Format**: Keep messages concise and actionable

## Next Steps

After setup:
1. ✅ Test with WARNING data
2. ✅ Test with DANGER data
3. ✅ Verify real-time alerts work
4. 🚀 Deploy to production
5. 📱 Train users on alert responses

## Support

If you encounter issues:
1. Check Firebase Console → Functions → Logs
2. Verify LINE Notify token is valid
3. Test with `sendTestLineNotification` function
4. Review function deployment status

## Summary Commands

```bash
# Complete setup flow
firebase login
cd /Users/POOH/Development/embedded-project/household-fire-system
firebase use display-c8393
cd functions && npm install && cd ..
firebase functions:config:set line.token="YOUR_LINE_TOKEN"
firebase deploy --only functions

# Test
npm run create-warning-data
npm run create-danger-data

# Check logs
firebase functions:log
```

🎉 **You're all set!** Your fire detection system will now send LINE notifications automatically!

