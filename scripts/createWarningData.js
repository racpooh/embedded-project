/**
 * Create 1 WARNING sensor reading in Firestore
 * High smoke sensor value, risk_level = WARNING
 * Run: node scripts/createWarningData.js
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

// Generate WARNING sensor reading
function generateWarningData() {
  const timestamp = Date.now()
  
  // Normal values for most sensors
  const temp = 25 + Math.random() * 5          // 25-30°C (slightly elevated but not critical)
  const humidity = 50 + Math.random() * 20     // 50-70% (normal)
  
  // HIGH smoke sensor values (WARNING threshold)
  const mq_arduino = 350 + Math.random() * 100  // 350-450 PPM (elevated, WARNING)
  const mq_gateway = 320 + Math.random() * 90   // 320-410 PPM (elevated)
  const gas_gateway = 400 + Math.random() * 100 // 400-500 PPM (elevated)
  
  // Normal light
  const hourOfDay = new Date(timestamp).getHours()
  const isDaytime = hourOfDay >= 6 && hourOfDay <= 18
  const light = isDaytime ? 0.6 + Math.random() * 0.3 : 0.1 + Math.random() * 0.2
  
  return {
    timestamp,
    node_id: 'gw-1',
    temp: parseFloat(temp.toFixed(1)),
    humidity: parseFloat(humidity.toFixed(1)),
    mq_arduino: Math.round(mq_arduino),
    mq_gateway: Math.round(mq_gateway),
    flame: false,                      // No flame yet
    gas_gateway: Math.round(gas_gateway),
    light: parseFloat(light.toFixed(2)),
    risk_level: 'WARNING',             // WARNING state
    ai_fire_detected: false,
    ai_confidence: 0.0,
    image_url: null,
    source: 'gateway'
  }
}

// Upload WARNING data to Firestore
async function uploadWarningData() {
  try {
    console.log('🔐 Signing in anonymously...')
    await signInAnonymously(auth)
    console.log('✅ Authentication successful\n')

    console.log('⚠️  Generating WARNING sensor reading...')
    const warningLog = generateWarningData()
    
    console.log('📤 Uploading to Firestore...\n')
    
    const docRef = await addDoc(collection(db, 'sensor_logs'), warningLog)
    
    console.log('╔══════════════════════════════════════════╗')
    console.log('║     WARNING DATA CREATED! ⚠️             ║')
    console.log('╚══════════════════════════════════════════╝')
    console.log(`\n📊 Details:`)
    console.log(`   • Document ID: ${docRef.id}`)
    console.log(`   • Risk Level: WARNING`)
    console.log(`   • Temperature: ${warningLog.temp}°C`)
    console.log(`   • Smoke (MQ-135 Arduino): ${warningLog.mq_arduino} PPM ⚠️`)
    console.log(`   • Smoke (MQ-135 Gateway): ${warningLog.mq_gateway} PPM ⚠️`)
    console.log(`   • Gas (Gateway): ${warningLog.gas_gateway} PPM ⚠️`)
    console.log(`   • Flame: ${warningLog.flame ? 'Detected' : 'Not detected'}`)
    console.log(`   • Timestamp: ${new Date(warningLog.timestamp).toLocaleString()}`)
    console.log(`\n🔔 This should trigger a LINE notification!`)
    console.log(`🔄 Check your dashboard for the WARNING alert\n`)
    
    process.exit(0)
  } catch (error) {
    console.error('\n❌ Error uploading WARNING data:', error.message)
    process.exit(1)
  }
}

// Run the upload
console.log('╔══════════════════════════════════════════╗')
console.log('║   CREATE WARNING SENSOR READING          ║')
console.log('╚══════════════════════════════════════════╝\n')

uploadWarningData()

