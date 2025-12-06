/**
 * Create 1 DANGER sensor reading in Firestore
 * High values on multiple sensors, risk_level = DANGER
 * Run: node scripts/createDangerData.js
 */

import { initializeApp } from 'firebase/app'
import { getFirestore, collection, addDoc } from 'firebase/firestore'
import { getAuth, signInAnonymously } from 'firebase/auth'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Get directory path for ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables from web/.env
dotenv.config({ path: join(__dirname, '../web/.env') })

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)
const auth = getAuth(app)

// Generate DANGER sensor reading
function generateDangerData() {
  const timestamp = Date.now()
  
  // HIGH values for most sensors (DANGER thresholds)
  const temp = 55 + Math.random() * 15          // 55-70°C (CRITICAL)
  const humidity = 30 + Math.random() * 15      // 30-45% (low, fire condition)
  
  // VERY HIGH smoke and gas values (DANGER threshold)
  const mq_arduino = 500 + Math.random() * 200  // 500-700 PPM (CRITICAL)
  const mq_gateway = 480 + Math.random() * 180  // 480-660 PPM (CRITICAL)
  const gas_gateway = 600 + Math.random() * 200 // 600-800 PPM (CRITICAL)
  
  // High light (possible fire)
  const light = 0.8 + Math.random() * 0.2       // 80-100% (unusual brightness)
  
  // Flame detected
  const flame = true
  
  // Possible AI detection
  const ai_fire_detected = Math.random() > 0.3  // 70% chance AI detected
  const ai_confidence = ai_fire_detected ? 0.85 + Math.random() * 0.15 : 0.0
  const image_url = ai_fire_detected 
    ? `https://storage.googleapis.com/household-fire-images/fire_${timestamp}.jpg`
    : null
  
  return {
    timestamp,
    node_id: 'gw-1',
    temp: parseFloat(temp.toFixed(1)),
    humidity: parseFloat(humidity.toFixed(1)),
    mq_arduino: Math.round(mq_arduino),
    mq_gateway: Math.round(mq_gateway),
    flame: flame,                      // FLAME DETECTED
    gas_gateway: Math.round(gas_gateway),
    light: parseFloat(light.toFixed(2)),
    risk_level: 'DANGER',              // DANGER state
    ai_fire_detected: ai_fire_detected,
    ai_confidence: parseFloat(ai_confidence.toFixed(2)),
    image_url: image_url,
    source: ai_fire_detected ? 'ai' : 'gateway'
  }
}

// Upload DANGER data to Firestore
async function uploadDangerData() {
  try {
    console.log('🔐 Signing in anonymously...')
    await signInAnonymously(auth)
    console.log('✅ Authentication successful\n')

    console.log('🚨 Generating DANGER sensor reading...')
    const dangerLog = generateDangerData()
    
    console.log('📤 Uploading to Firestore...\n')
    
    const docRef = await addDoc(collection(db, 'sensor_logs'), dangerLog)
    
    console.log('╔══════════════════════════════════════════╗')
    console.log('║     DANGER DATA CREATED! 🚨              ║')
    console.log('╚══════════════════════════════════════════╝')
    console.log(`\n📊 Details:`)
    console.log(`   • Document ID: ${docRef.id}`)
    console.log(`   • Risk Level: DANGER 🚨`)
    console.log(`   • Temperature: ${dangerLog.temp}°C 🔥`)
    console.log(`   • Humidity: ${dangerLog.humidity}% 💧`)
    console.log(`   • Smoke (MQ-135 Arduino): ${dangerLog.mq_arduino} PPM 💨`)
    console.log(`   • Smoke (MQ-135 Gateway): ${dangerLog.mq_gateway} PPM 💨`)
    console.log(`   • Gas (Gateway): ${dangerLog.gas_gateway} PPM ☠️`)
    console.log(`   • Flame: ${dangerLog.flame ? 'DETECTED 🔥' : 'Not detected'}`)
    console.log(`   • Light Level: ${(dangerLog.light * 100).toFixed(0)}% ✨`)
    if (dangerLog.ai_fire_detected) {
      console.log(`   • AI Fire Detection: YES 🤖`)
      console.log(`   • AI Confidence: ${(dangerLog.ai_confidence * 100).toFixed(1)}%`)
      console.log(`   • Image URL: ${dangerLog.image_url}`)
    }
    console.log(`   • Timestamp: ${new Date(dangerLog.timestamp).toLocaleString()}`)
    console.log(`\n🔔 This should trigger an URGENT LINE notification!`)
    console.log(`🚨 Check your dashboard for the DANGER alert`)
    console.log(`⚠️  Emergency response may be required!\n`)
    
    process.exit(0)
  } catch (error) {
    console.error('\n❌ Error uploading DANGER data:', error.message)
    process.exit(1)
  }
}

// Run the upload
console.log('╔══════════════════════════════════════════╗')
console.log('║   CREATE DANGER SENSOR READING           ║')
console.log('╚══════════════════════════════════════════╝\n')
console.log('⚠️  WARNING: This simulates a FIRE EMERGENCY')
console.log('   This will trigger critical alerts!\n')

uploadDangerData()

