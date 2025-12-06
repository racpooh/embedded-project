# Migration Guide: LINE Notify → LINE Messaging API

## ⚠️ Important Notice

**LINE Notify service ended on March 31, 2025 (31 มีนาคม พ.ศ. 2568)**

This guide will help you migrate from LINE Notify to LINE Messaging API.

## Why Migrate?

LINE recommends **LINE Messaging API** because it offers:
- ✅ **More features**: Rich messages, buttons, images, flex messages
- ✅ **Official support**: Continued updates and maintenance
- ✅ **Free quota**: 500 messages/month on Free plan (enough for fire alerts)
- ✅ **Better reliability**: Enterprise-grade infrastructure
- ✅ **Future-proof**: Won't be discontinued

## Quick Comparison

| Feature | LINE Notify (Old) | LINE Messaging API (New) |
|---------|-------------------|--------------------------|
| **Status** | ❌ Discontinued | ✅ Active |
| **Cost** | Free unlimited | 500 free/month |
| **Setup** | Simple token | Official Account + Token |
| **Messages** | Text only | Text, images, rich UI |
| **Recipients** | Individual/Group | Followers of Official Account |
| **API** | notify-api.line.me | api.line.me |

## Migration Steps

### Step 1: Create LINE Official Account

1. Visit: https://developers.line.biz/console/
2. Login with your LINE account
3. Create a provider (if needed)
4. Create a **Messaging API channel**:
   - Name: `Household Fire Detection`
   - Category: Technology & Research

### Step 2: Get Channel Access Token

1. Go to your channel's **"Messaging API"** tab
2. Find **"Channel access token"** section
3. Click **"Issue"** to generate token
4. **Copy the token** (very long string starting with `eyJ...`)

Example:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJsaW5lL...
```

### Step 3: Add Bot as Friend

1. In **"Messaging API"** tab, find **"Bot information"**
2. Scan QR code or search by ID
3. **Add the bot as friend in your LINE app**
4. This is required to receive messages!

### Step 4: Update Firebase Configuration

```bash
# Remove old LINE Notify config
firebase functions:config:unset line.token

# Set new LINE Messaging API config
firebase functions:config:set line.channel_access_token="YOUR_CHANNEL_ACCESS_TOKEN"

# Optional: Set your USER ID for direct messages
firebase functions:config:set line.user_id="YOUR_USER_ID"

# Verify
firebase functions:config:get
```

Expected output:
```json
{
  "line": {
    "channel_access_token": "eyJhbGci...",
    "user_id": "U1234567890abcdef..."
  }
}
```

### Step 5: Deploy Updated Functions

```bash
# Navigate to project root
cd /Users/POOH/Development/embedded-project/household-fire-system

# Deploy updated functions
firebase deploy --only functions
```

The functions have already been updated to use LINE Messaging API!

### Step 6: Test New Integration

```bash
# Test with HTTP function
curl https://us-central1-display-c8393.cloudfunctions.net/sendTestLineMessage

# Check your LINE app - should receive test message ✅

# Test with data
npm run create-warning-data   # Should send WARNING alert
npm run create-danger-data    # Should send DANGER alert
```

## What Changed in the Code

### Old Code (LINE Notify)
```javascript
// LINE Notify API
const url = 'https://notify-api.line.me/api/notify'
const headers = {
  'Content-Type': 'application/x-www-form-urlencoded',
  'Authorization': `Bearer ${token}`
}
const body = `message=${encodeURIComponent(message)}`
```

### New Code (LINE Messaging API)
```javascript
// LINE Messaging API
const url = 'https://api.line.me/v2/bot/message/push'
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${channelAccessToken}`
}
const body = JSON.stringify({
  to: userId,
  messages: [{ type: 'text', text: message }]
})
```

## Configuration Changes

### Old Configuration
```bash
firebase functions:config:set line.token="abc123..."
```

### New Configuration
```bash
firebase functions:config:set line.channel_access_token="eyJ..."
firebase functions:config:set line.user_id="U1234..."  # Optional
```

## Function Name Changes

| Old Function | New Function | Purpose |
|-------------|--------------|---------|
| `sendTestLineNotification` | `sendTestLineMessage` | Test integration |
| `getLineNotifyStatus` | `getLineStatus` | Check config |
| `monitorSensorLogs` | `monitorSensorLogs` | (Same) Monitor sensors |

## Message Format

**Good news:** Messages look the same! Same emojis, same formatting.

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
```

## Cost Implications

### LINE Notify (Old)
- Free: ♾️ Unlimited messages
- Cost: $0/month

### LINE Messaging API (New)
- Free plan: 500 messages/month
- Light plan: 5,000 messages/month
- Standard plan: 30,000 messages/month

**For fire detection:**
- Average usage: 2-10 alerts/day = 60-300/month
- Peak usage: 1,000 alerts/month
- **Result:** ✅ FREE (within 500/month quota)

## Troubleshooting

### Issue: No messages received after migration

**Checklist:**
1. ✅ Added bot as friend in LINE app?
2. ✅ Channel access token correct?
3. ✅ Functions redeployed?
4. ✅ Test function works?

**Debug:**
```bash
# Check config
firebase functions:config:get

# Check function logs
firebase functions:log --only monitorSensorLogs

# Test directly
curl https://us-central1-display-c8393.cloudfunctions.net/sendTestLineMessage
```

### Issue: "Invalid channel access token"

**Solution:**
1. Go to LINE Developers Console
2. Re-issue channel access token
3. Update Firebase config:
```bash
firebase functions:config:set line.channel_access_token="NEW_TOKEN"
firebase deploy --only functions
```

### Issue: Old LINE Notify still in docs

**Solution:**
- Updated docs are in: `docs/LINE_MESSAGING_API_SETUP.md`
- Old `docs/LINE_NOTIFY_SETUP.md` is deprecated
- Follow new guide for setup

## Benefits of Migration

### 1. More Reliable
- Official support from LINE
- Better uptime and performance
- Regular updates

### 2. More Features
```javascript
// Can now send images
{
  type: "image",
  originalContentUrl: "https://storage.googleapis.com/fire-image.jpg",
  previewImageUrl: "https://storage.googleapis.com/fire-preview.jpg"
}

// Can use buttons
{
  type: "text",
  text: "Fire detected!",
  quickReply: {
    items: [
      { action: { label: "Acknowledge", text: "Acknowledged" } }
    ]
  }
}
```

### 3. Future Enhancements
- Rich UI cards (Flex Messages)
- Interactive buttons
- Location sharing
- Video alerts
- Two-way communication

## Timeline

- **March 31, 2025**: LINE Notify stopped working
- **Now**: LINE Messaging API is the standard
- **Future**: More features coming to Messaging API

## Support

### LINE Messaging API Resources
- **Documentation**: https://developers.line.biz/en/docs/messaging-api/
- **Console**: https://developers.line.biz/console/
- **Support**: https://developers.line.biz/en/support/

### Our Documentation
- **Setup Guide**: `docs/LINE_MESSAGING_API_SETUP.md`
- **Quick Start**: `QUICKSTART.md`
- **Deployment**: `docs/DEPLOYMENT_CHECKLIST.md`

## Migration Checklist

- [ ] Created LINE Official Account
- [ ] Got channel access token
- [ ] Added bot as friend in LINE app
- [ ] Removed old `line.token` config
- [ ] Set `line.channel_access_token` config
- [ ] Set `line.user_id` config (optional)
- [ ] Deployed updated functions
- [ ] Tested with test function
- [ ] Tested with WARNING data
- [ ] Tested with DANGER data
- [ ] Verified messages received
- [ ] Updated team/documentation

## Quick Migration Commands

```bash
# 1. Remove old config
firebase functions:config:unset line.token

# 2. Set new config (replace with your values)
firebase functions:config:set line.channel_access_token="eyJ..."
firebase functions:config:set line.user_id="U1234..."

# 3. Deploy
firebase deploy --only functions

# 4. Test
curl https://us-central1-display-c8393.cloudfunctions.net/sendTestLineMessage
npm run create-warning-data

# 5. Verify
firebase functions:log
```

## Summary

| Step | Action | Time |
|------|--------|------|
| 1 | Create Official Account | 5 min |
| 2 | Get channel access token | 2 min |
| 3 | Add bot as friend | 1 min |
| 4 | Update Firebase config | 2 min |
| 5 | Deploy functions | 3 min |
| 6 | Test integration | 2 min |
| **Total** | | **~15 minutes** |

🎉 **Migration complete!** Your fire detection system now uses LINE Messaging API with better features and reliability!

---

**Last Updated:** December 6, 2025  
**Migration Version:** 2.0 (LINE Messaging API)  
**Status:** ✅ Production Ready

