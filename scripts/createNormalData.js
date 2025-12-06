/**
 * Create 50 NORMAL sensor readings in Firestore
 * All values in safe ranges, risk_level = NORMAL
 * Run: node scripts/createNormalData.js
 */

import { initializeApp } from 'firebase/app'
import { getFirestore, collection, writeBatch, doc } from 'firebase/firestore'
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

// Generate 50 NORMAL sensor readings
function generateNormalData(count = 50) {
  const logs = []
  const now = Date.now()
  const interval = (24 * 60 * 60 * 1000) / count // Distribute over 24 hours

  for (let i = 0; i < count; i++) {
    const timestamp = now - (count - i) * interval
    
    // All values in NORMAL ranges
    const temp = 22 + Math.random() * 8          // 22-30°C (normal room temp)
    const humidity = 50 + Math.random() * 20      // 50-70% (comfortable range)
    const mq_arduino = 100 + Math.random() * 100  // 100-200 PPM (safe)
    const mq_gateway = 90 + Math.random() * 90    // 90-180 PPM (safe)
    const gas_gateway = 150 + Math.random() * 100 // 150-250 PPM (safe)
    
    // Simulate day/night cycle for light sensor
    const hourOfDay = new Date(timestamp).getHours()
    const isDaytime = hourOfDay >= 6 && hourOfDay <= 18
    const light = isDaytime ? 0.6 + Math.random() * 0.3 : 0.1 + Math.random() * 0.2
    
    logs.push({
      timestamp,
      node_id: 'gw-1',
      temp: parseFloat(temp.toFixed(1)),
      humidity: parseFloat(humidity.toFixed(1)),
      mq_arduino: Math.round(mq_arduino),
      mq_gateway: Math.round(mq_gateway),
      flame: false,                    // No flame detection
      gas_gateway: Math.round(gas_gateway),
      light: parseFloat(light.toFixed(2)),
      risk_level: 'NORMAL',            // Always NORMAL
      ai_fire_detected: false,
      ai_confidence: 0.0,
      image_url: null,
      source: 'gateway'
    })
  }
  
  return logs
}

// Upload data to Firestore
async function uploadNormalData() {
  try {
    console.log('🔐 Signing in anonymously...')
    await signInAnonymously(auth)
    console.log('✅ Authentication successful\n')

    console.log('📊 Generating 50 NORMAL sensor readings...')
    const logs = generateNormalData(50)
    
    console.log(`📤 Uploading ${logs.length} records to Firestore...\n`)
    
    // Use batched writes (max 500 per batch)
    const batchSize = 500
    let uploadedCount = 0

    for (let i = 0; i < logs.length; i += batchSize) {
      const batch = writeBatch(db)
      const batchLogs = logs.slice(i, Math.min(i + batchSize, logs.length))

      batchLogs.forEach((log) => {
        const docRef = doc(collection(db, 'sensor_logs'))
        batch.set(docRef, log)
      })

      await batch.commit()
      uploadedCount += batchLogs.length
      console.log(`   ✓ Uploaded ${uploadedCount}/${logs.length} records`)
    }

    console.log('\n╔══════════════════════════════════════════╗')
    console.log('║     UPLOAD COMPLETE! ✅                  ║')
    console.log('╚══════════════════════════════════════════╝')
    console.log(`\n📊 Summary:`)
    console.log(`   • Total records: ${uploadedCount}`)
    console.log(`   • Risk level: NORMAL`)
    console.log(`   • Time range: Last 24 hours`)
    console.log(`   • Temperature: 22-30°C`)
    console.log(`   • Smoke (MQ-135): 100-200 PPM`)
    console.log(`   • Flame: No detections`)
    console.log(`\n🔄 Refresh your dashboard to see the data\n`)
    
    process.exit(0)
  } catch (error) {
    console.error('\n❌ Error uploading data:', error.message)
    process.exit(1)
  }
}

// Run the upload
console.log('╔══════════════════════════════════════════╗')
console.log('║   CREATE 50 NORMAL SENSOR READINGS       ║')
console.log('╚══════════════════════════════════════════╝\n')

uploadNormalData()

