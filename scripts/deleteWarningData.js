/**
 * Delete the most recent WARNING sensor reading from Firestore
 * Run: node scripts/deleteWarningData.js
 */

import { initializeApp } from 'firebase/app'
import { getFirestore, collection, query, where, orderBy, limit, getDocs, deleteDoc } from 'firebase/firestore'
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

// Validate configuration
const requiredVars = ['VITE_FIREBASE_API_KEY', 'VITE_FIREBASE_PROJECT_ID', 'VITE_FIREBASE_APP_ID']
for (const varName of requiredVars) {
  if (!process.env[varName]) {
    console.error(`❌ Missing required environment variable: ${varName}`)
    console.error('💡 Make sure web/.env file exists with Firebase configuration')
    process.exit(1)
  }
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)
const auth = getAuth(app)

// Delete most recent WARNING reading
async function deleteWarningData() {
  try {
    console.log('🔐 Signing in anonymously...')
    await signInAnonymously(auth)
    console.log('✅ Authentication successful\n')

    console.log('🔍 Searching for most recent WARNING reading...')
    
    // Query for the most recent WARNING reading
    const warningQuery = query(
      collection(db, 'sensor_logs'),
      where('risk_level', '==', 'WARNING'),
      orderBy('timestamp', 'desc'),
      limit(1)
    )

    const snapshot = await getDocs(warningQuery)

    if (snapshot.empty) {
      console.log('\n❌ No WARNING readings found in database')
      console.log('💡 Create one with: npm run create-warning-data\n')
      process.exit(0)
    }

    const doc = snapshot.docs[0]
    const data = doc.data()

    console.log('\n📊 Found WARNING reading:')
    console.log(`   • Document ID: ${doc.id}`)
    console.log(`   • Temperature: ${data.temp}°C`)
    console.log(`   • Smoke (Arduino): ${data.mq_arduino} PPM`)
    console.log(`   • Smoke (Gateway): ${data.mq_gateway} PPM`)
    console.log(`   • Timestamp: ${new Date(data.timestamp).toLocaleString()}`)

    console.log('\n🗑️  Deleting WARNING reading...')
    await deleteDoc(doc.ref)

    console.log('\n╔══════════════════════════════════════════╗')
    console.log('║     DELETION COMPLETE! ✅                ║')
    console.log('╚══════════════════════════════════════════╝')
    console.log(`\n✅ Deleted WARNING reading: ${doc.id}`)
    console.log('🔄 Dashboard will update automatically\n')
    
    process.exit(0)
  } catch (error) {
    console.error('\n❌ Error deleting WARNING data:', error.message)
    
    if (error.code === 'permission-denied') {
      console.error('\n🔒 Permission Error: Make sure:')
      console.error('1. Anonymous Authentication is enabled in Firebase Console')
      console.error('2. Firestore Security Rules allow delete operations')
    }
    
    process.exit(1)
  }
}

// Run the deletion
console.log('╔══════════════════════════════════════════╗')
console.log('║   DELETE MOST RECENT WARNING READING     ║')
console.log('╚══════════════════════════════════════════╝\n')

deleteWarningData()

