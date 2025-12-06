/**
 * Firebase Cloud Functions for LINE Messaging API Integration
 * Sends alerts when WARNING or DANGER sensor readings are detected
 * 
 * NOTE: LINE Notify is discontinued as of March 31, 2025
 * This uses LINE Messaging API as the recommended alternative
 */

const functions = require('firebase-functions')
const admin = require('firebase-admin')
const fetch = require('node-fetch')

// Initialize Firebase Admin
admin.initializeApp()

/**
 * Send LINE message using Messaging API
 * @param {string} channelAccessToken - LINE Channel Access Token
 * @param {string} userId - LINE User ID to send message to
 * @param {string} message - Message to send
 */
async function sendLineMessage(channelAccessToken, userId, message) {
  const url = 'https://api.line.me/v2/bot/message/push'
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${channelAccessToken}`
    },
    body: JSON.stringify({
      to: userId,
      messages: [
        {
          type: 'text',
          text: message
        }
      ]
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`LINE Messaging API error: ${response.status} ${errorText}`)
  }

  return response.json()
}

/**
 * Broadcast LINE message to all users (using broadcast endpoint)
 * @param {string} channelAccessToken - LINE Channel Access Token
 * @param {string} message - Message to send
 */
async function broadcastLineMessage(channelAccessToken, message) {
  const url = 'https://api.line.me/v2/bot/message/broadcast'
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${channelAccessToken}`
    },
    body: JSON.stringify({
      messages: [
        {
          type: 'text',
          text: message
        }
      ]
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`LINE Messaging API error: ${response.status} ${errorText}`)
  }

  return response.json()
}

/**
 * Format sensor data for LINE message
 * @param {Object} data - Sensor log data
 * @returns {string} Formatted message
 */
function formatSensorMessage(data) {
  const { risk_level, temp, humidity, mq_arduino, mq_gateway, gas_gateway, flame, light, timestamp, ai_fire_detected, ai_confidence, image_url } = data
  
  const date = new Date(timestamp).toLocaleString('en-US', { 
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })

  let emoji = '⚠️'
  let alertLevel = 'WARNING'
  
  if (risk_level === 'DANGER') {
    emoji = '🚨'
    alertLevel = 'DANGER'
  }

  let message = `
${emoji} FIRE ALERT: ${alertLevel} ${emoji}

━━━━━━━━━━━━━━━━━━━━━
📅 Time: ${date}
🏠 Node: ${data.node_id || 'gw-1'}

🌡️ SENSOR READINGS:
• Temperature: ${temp}°C
• Humidity: ${humidity}%
• Smoke (Arduino): ${mq_arduino} PPM
• Smoke (Gateway): ${mq_gateway} PPM
• Gas Level: ${gas_gateway} PPM
• Light Level: ${(light * 100).toFixed(0)}%
• Flame: ${flame ? '🔥 DETECTED!' : 'Not detected'}

⚠️ RISK LEVEL: ${risk_level}
━━━━━━━━━━━━━━━━━━━━━`

  // Add AI detection info if available
  if (ai_fire_detected) {
    message += `

🤖 AI FIRE DETECTION:
• Status: FIRE DETECTED
• Confidence: ${(ai_confidence * 100).toFixed(1)}%`
    
    if (image_url) {
      message += `
• Image: ${image_url}`
    }
  }

  // Add action recommendations
  if (risk_level === 'DANGER') {
    message += `

🚨 IMMEDIATE ACTION REQUIRED!
• Evacuate the area
• Call emergency services
• Check fire extinguisher`
  } else if (risk_level === 'WARNING') {
    message += `

⚠️ CAUTION ADVISED:
• Monitor the situation
• Check for smoke sources
• Be prepared to evacuate`
  }

  return message
}

/**
 * Cloud Function: Monitor sensor_logs for WARNING/DANGER
 * Triggers on new documents in sensor_logs collection
 */
exports.monitorSensorLogs = functions.firestore
  .document('sensor_logs/{logId}')
  .onCreate(async (snap, context) => {
    const data = snap.data()
    const riskLevel = data.risk_level

    // Only send alerts for WARNING or DANGER
    if (riskLevel !== 'WARNING' && riskLevel !== 'DANGER') {
      console.log(`Risk level is ${riskLevel}, no alert needed`)
      return null
    }

    try {
      // Get LINE configuration from Firebase config
      const lineConfig = functions.config().line
      
      if (!lineConfig || !lineConfig.channel_access_token) {
        console.error('LINE Messaging API not configured!')
        console.error('Run: firebase functions:config:set line.channel_access_token="YOUR_CHANNEL_ACCESS_TOKEN"')
        console.error('Optional: firebase functions:config:set line.user_id="YOUR_USER_ID"')
        return null
      }

      const channelAccessToken = lineConfig.channel_access_token
      const userId = lineConfig.user_id // Optional: specific user ID

      // Format message
      const message = formatSensorMessage(data)
      console.log('Sending LINE message:', message)
      
      let result
      if (userId) {
        // Send to specific user
        result = await sendLineMessage(channelAccessToken, userId, message)
        console.log('LINE message sent to user:', result)
      } else {
        // Broadcast to all followers
        result = await broadcastLineMessage(channelAccessToken, message)
        console.log('LINE message broadcasted:', result)
      }

      // Log the alert in Firestore events collection
      await admin.firestore().collection('events').add({
        event_type: riskLevel,
        reason: riskLevel === 'DANGER' ? 'Critical sensor values detected' : 'Elevated sensor values detected',
        risk_score: data.mq_arduino || 0,
        ai_fire_detected: data.ai_fire_detected || false,
        ai_confidence: data.ai_confidence || 0,
        image_url: data.image_url || null,
        timestamp: data.timestamp,
        node_id: data.node_id || 'gw-1',
        acknowledged: false,
        line_notified: true
      })

      return result
    } catch (error) {
      console.error('Error sending LINE notification:', error)
      return null
    }
  })

/**
 * Cloud Function: Send test LINE message
 * Can be triggered manually for testing
 * Usage: Call this function from Firebase Console or via HTTP
 */
exports.sendTestLineMessage = functions.https.onRequest(async (req, res) => {
  try {
    const lineConfig = functions.config().line
    
    if (!lineConfig || !lineConfig.channel_access_token) {
      return res.status(500).send({
        error: 'LINE Messaging API not configured',
        help: 'Run: firebase functions:config:set line.channel_access_token="YOUR_CHANNEL_ACCESS_TOKEN"'
      })
    }

    const testMessage = `🧪 TEST MESSAGE

This is a test message from your Household Fire Detection System.

If you received this, LINE Messaging API is working correctly! ✅

Time: ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Bangkok' })}`

    const channelAccessToken = lineConfig.channel_access_token
    const userId = lineConfig.user_id

    let result
    if (userId) {
      result = await sendLineMessage(channelAccessToken, userId, testMessage)
    } else {
      result = await broadcastLineMessage(channelAccessToken, testMessage)
    }
    
    res.status(200).send({
      success: true,
      message: 'Test message sent successfully',
      method: userId ? 'push to user' : 'broadcast',
      result: result
    })
  } catch (error) {
    console.error('Error sending test message:', error)
    res.status(500).send({
      error: error.message
    })
  }
})

/**
 * Cloud Function: Get LINE Messaging API configuration status
 * Check if LINE channel access token is configured
 */
exports.getLineStatus = functions.https.onRequest(async (req, res) => {
  const lineConfig = functions.config().line
  
  const hasChannelToken = !!(lineConfig && lineConfig.channel_access_token)
  const hasUserId = !!(lineConfig && lineConfig.user_id)
  
  res.status(200).send({
    configured: hasChannelToken,
    channelAccessToken: hasChannelToken ? 'Set ✅' : 'Not set ❌',
    userId: hasUserId ? 'Set ✅ (push mode)' : 'Not set (broadcast mode)',
    message: hasChannelToken 
      ? 'LINE Messaging API is configured ✅' 
      : 'LINE Messaging API not configured. See docs/LINE_MESSAGING_API_SETUP.md',
    note: 'LINE Notify was discontinued on March 31, 2025. This system now uses LINE Messaging API.'
  })
})

