# LINE Messaging API Setup Guide

> **Important:** LINE Notify was discontinued on March 31, 2025. This guide uses **LINE Messaging API** as the recommended alternative.

## Overview

LINE Messaging API allows you to send messages through a **LINE Official Account**. It's more powerful than LINE Notify and supports:
- ✅ Text messages
- ✅ Images and videos
- ✅ Rich messages and flex messages
- ✅ Quick reply buttons
- ✅ Free messages quota per month

## Step 1: Create LINE Official Account

### 1.1 Visit LINE Developers Console
Go to: https://developers.line.biz/console/

### 1.2 Login
- Click "Log in"
- Use your LINE account credentials

### 1.3 Create a Provider (if you don't have one)
1. Click "Create a new provider"
2. Provider name: `Fire Detection System` (or any name)
3. Click "Create"

### 1.4 Create a Messaging API Channel
1. Click "Create a Messaging API channel"
2. Fill in the form:
   - **Channel type**: Messaging API
   - **Provider**: Select your provider
   - **Channel name**: `Household Fire Detection`
   - **Channel description**: `IoT fire detection alerts`
   - **Category**: Technology & Research
   - **Subcategory**: IoT
   - **Email**: Your email
3. Agree to terms
4. Click "Create"

## Step 2: Configure Channel Settings

### 2.1 Get Channel Access Token
1. In your channel settings, go to **"Messaging API"** tab
2. Scroll to **"Channel access token"** section
3. Click **"Issue"** button
4. **Copy the token** (starts with a very long string)
5. Save it securely - you'll need this for Firebase configuration

Example token:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...very_long_string...
```

### 2.2 Get Your User ID (Optional but Recommended)

**Method 1: Using LINE Official Account Manager**
1. Open LINE app on your phone
2. Add your Official Account as a friend
3. Send a message to it
4. Go to: https://manager.line.biz/
5. Select your Official Account
6. Go to Settings → Response settings
7. Your User ID will be visible

**Method 2: Using Webhook**
1. In channel settings, enable "Use webhooks"
2. Set webhook URL (you can use a temporary service like webhook.site)
3. Send a message to your Official Account
4. Check the webhook payload for `userId`

**Method 3: Ask user to check**
1. User opens LINE app
2. Go to Settings → Profile
3. User ID is displayed at the bottom

### 2.3 Enable Required Features
In **"Messaging API"** tab:
1. **Allow bot to join group chats**: OFF (unless you want group notifications)
2. **Auto-reply messages**: OFF (disable default auto-reply)
3. **Greeting messages**: OFF (optional)
4. **Webhooks**: OFF (not needed for push notifications)
5. **Use LINE Official Account features**: Can be ON or OFF

### 2.4 Add Your Account as Friend
1. Go to **"Messaging API"** tab
2. Scroll to **"Bot information"**
3. Click the QR code or add by ID
4. **Open LINE app and add the account as a friend**
5. This is required to receive messages!

## Step 3: Configure Firebase

### 3.1 Set Channel Access Token
```bash
firebase functions:config:set line.channel_access_token="YOUR_CHANNEL_ACCESS_TOKEN"
```

Replace `YOUR_CHANNEL_ACCESS_TOKEN` with the actual token from Step 2.1.

### 3.2 Set User ID (Optional - for Push Messages)
If you want to send to a specific user:
```bash
firebase functions:config:set line.user_id="YOUR_USER_ID"
```

**Modes:**
- **With user_id**: Sends to specific user (recommended for personal use)
- **Without user_id**: Broadcasts to all followers (uses free message quota)

### 3.3 Verify Configuration
```bash
firebase functions:config:get
```

Expected output:
```json
{
  "line": {
    "channel_access_token": "eyJhbGci...",
    "user_id": "U1234567890abcdef1234567890abcdef"
  }
}
```

## Step 4: Deploy Functions

```bash
# Navigate to project root
cd /Users/POOH/Development/embedded-project/household-fire-system

# Install dependencies (if not done)
cd functions
npm install
cd ..

# Deploy functions
firebase deploy --only functions
```

Expected output:
```
✔ functions[monitorSensorLogs]
✔ functions[sendTestLineMessage]
✔ functions[getLineStatus]
```

## Step 5: Test Integration

### Method 1: HTTP Test Function
```bash
curl https://us-central1-display-c8393.cloudfunctions.net/sendTestLineMessage
```

Check your LINE app - you should receive: "🧪 TEST MESSAGE"

### Method 2: Check Configuration
```bash
curl https://us-central1-display-c8393.cloudfunctions.net/getLineStatus
```

Expected response:
```json
{
  "configured": true,
  "channelAccessToken": "Set ✅",
  "userId": "Set ✅ (push mode)",
  "message": "LINE Messaging API is configured ✅"
}
```

### Method 3: Create Test Data
```bash
# Test WARNING alert
npm run create-warning-data

# Check LINE app for WARNING message ⚠️

# Test DANGER alert
npm run create-danger-data

# Check LINE app for DANGER message 🚨
```

## Message Quotas

LINE Messaging API has **free message quotas**:

| Plan | Free Messages/Month | Cost per Additional Message |
|------|--------------------:|----------------------------:|
| Free | 500 messages | Not available |
| Light | 5,000 messages | ¥5 per message |
| Standard | 30,000 messages | ¥3 per message |

**For fire detection system:**
- Normal use: ~2-10 alerts/day = 60-300/month ✅ FREE
- Even with 1000 alerts/month = within Light plan ✅

## Broadcast vs Push Messages

### Broadcast (No user_id configured)
**Pros:**
- Sends to ALL followers automatically
- Good for multiple users
- Free quota applies

**Cons:**
- Less control over recipients
- Uses broadcast quota

**Use case:** Multiple users monitoring the system

### Push (With user_id configured)
**Pros:**
- Sends to specific user
- More control
- Can send to multiple users with code modification

**Cons:**
- Need to know user ID

**Use case:** Personal/single-user monitoring (recommended)

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
│LINE Messaging   │
│      API        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Your Phone    │
│  LINE App 📱    │
│ (Official Acc)  │
└─────────────────┘
```

## Message Format

Same as before - formatted text messages with sensor data, emojis, and action recommendations.

Example:
```
🚨 FIRE ALERT: DANGER 🚨

━━━━━━━━━━━━━━━━━━━━━
📅 Time: 12/06/2025, 10:35:20 AM
🏠 Node: gw-1

🌡️ SENSOR READINGS:
• Temperature: 62.5°C
• Smoke: 580 PPM
• Flame: 🔥 DETECTED!

🚨 IMMEDIATE ACTION REQUIRED!
• Evacuate the area
• Call emergency services
```

## Advanced Features (Future)

LINE Messaging API supports rich messages:

### 1. Flex Messages (Card-style)
```javascript
{
  type: "flex",
  altText: "Fire Alert",
  contents: {
    // Beautiful card layout
  }
}
```

### 2. Quick Reply Buttons
```javascript
{
  type: "text",
  text: "Fire detected!",
  quickReply: {
    items: [
      { action: { type: "message", label: "Acknowledge", text: "Acknowledged" } },
      { action: { type: "message", label: "Call 911", text: "Calling emergency" } }
    ]
  }
}
```

### 3. Image Messages
```javascript
{
  type: "image",
  originalContentUrl: "https://example.com/fire.jpg",
  previewImageUrl: "https://example.com/fire_preview.jpg"
}
```

## Troubleshooting

### Issue 1: "Channel access token is not configured"

**Solution:**
```bash
firebase functions:config:set line.channel_access_token="YOUR_TOKEN"
firebase deploy --only functions
```

### Issue 2: No messages received

**Checklist:**
1. ✅ Added Official Account as friend in LINE app
2. ✅ Channel access token is correct
3. ✅ Functions deployed successfully
4. ✅ Test function works
5. ✅ Firestore has WARNING/DANGER data

**Debug:**
```bash
firebase functions:log --only monitorSensorLogs
```

### Issue 3: "Invalid reply token" or "Invalid user ID"

**Solution:**
- Verify user ID is correct
- Check that you added the bot as friend
- Try broadcast mode (remove user_id config)

### Issue 4: Quota exceeded

**Solution:**
- Check message count in LINE Developers Console
- Upgrade plan if needed
- Implement message throttling in code

## Migration from LINE Notify

If you were using LINE Notify before:

### What Changed
- ❌ `line.token` → ✅ `line.channel_access_token`
- ❌ LINE Notify API → ✅ LINE Messaging API
- ❌ notify-api.line.me → ✅ api.line.me/v2/bot/message

### Migration Steps
1. Create LINE Official Account (steps above)
2. Get channel access token
3. Update Firebase config:
```bash
# Remove old config
firebase functions:config:unset line.token

# Set new config
firebase functions:config:set line.channel_access_token="YOUR_TOKEN"
firebase functions:config:set line.user_id="YOUR_USER_ID"
```
4. Redeploy functions:
```bash
firebase deploy --only functions
```

### Code Changes
All done! The functions are already updated to use LINE Messaging API.

## Cost Comparison

### LINE Notify (Discontinued)
- ✅ Completely free
- ✅ Unlimited messages
- ❌ Service ended March 31, 2025

### LINE Messaging API
- ✅ 500 free messages/month (Free plan)
- ✅ 5,000 free messages/month (Light plan)
- ✅ More features (rich messages, buttons, etc.)
- ✅ Official support and updates

**For fire detection:** 500 free messages/month is more than enough!

## Summary Commands

```bash
# Complete setup
cd /Users/POOH/Development/embedded-project/household-fire-system

# Configure LINE
firebase functions:config:set line.channel_access_token="YOUR_TOKEN"
firebase functions:config:set line.user_id="YOUR_USER_ID"  # Optional

# Deploy
firebase deploy --only functions

# Test
curl https://us-central1-display-c8393.cloudfunctions.net/sendTestLineMessage
npm run create-warning-data
npm run create-danger-data

# Check status
curl https://us-central1-display-c8393.cloudfunctions.net/getLineStatus

# View logs
firebase functions:log
```

## Resources

- **LINE Developers Console**: https://developers.line.biz/console/
- **Messaging API Docs**: https://developers.line.biz/en/docs/messaging-api/
- **Message Types**: https://developers.line.biz/en/docs/messaging-api/message-types/
- **Free Trial**: https://www.linebiz.com/jp/service/line-official-account/

🎉 **You're all set with LINE Messaging API!** More powerful and still free for your use case!

