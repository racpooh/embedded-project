/**
 * Delete all sensor_logs from Firestore
 * Run: node scripts/deleteAllData.js
 */

import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs, writeBatch } from 'firebase/firestore'
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

// Delete all documents in a collection
async function deleteCollection(collectionName) {
  const collectionRef = collection(db, collectionName)
  const snapshot = await getDocs(collectionRef)
  
  if (snapshot.empty) {
    console.log(`  ℹ️  Collection '${collectionName}' is already empty`)
    return 0
  }

  const totalDocs = snapshot.size
  console.log(`  📊 Found ${totalDocs} documents in '${collectionName}'`)
  
  let deletedCount = 0
  const batchSize = 500 // Firestore batch limit
  
  // Delete in batches
  while (deletedCount < totalDocs) {
    const batch = writeBatch(db)
    const docsToDelete = snapshot.docs.slice(deletedCount, deletedCount + batchSize)
    
    docsToDelete.forEach((doc) => {
      batch.delete(doc.ref)
    })
    
    await batch.commit()
    deletedCount += docsToDelete.length
    console.log(`  ✓ Deleted ${deletedCount}/${totalDocs} documents`)
  }
  
  return deletedCount
}

// Main delete function
async function deleteAllData() {
  try {
    console.log('🔐 Signing in anonymously...')
    await signInAnonymously(auth)
    console.log('✅ Authentication successful\n')

    console.log('🗑️  Starting data deletion...\n')

    // Delete sensor_logs collection
    console.log('📦 Deleting sensor_logs collection:')
    const sensorLogsDeleted = await deleteCollection('sensor_logs')
    
    // Delete events collection
    console.log('\n📦 Deleting events collection:')
    const eventsDeleted = await deleteCollection('events')

    console.log('\n╔══════════════════════════════════════════╗')
    console.log('║     DELETION COMPLETE! ✅                ║')
    console.log('╚══════════════════════════════════════════╝')
    console.log(`\n📊 Summary:`)
    console.log(`   • sensor_logs deleted: ${sensorLogsDeleted}`)
    console.log(`   • events deleted: ${eventsDeleted}`)
    console.log(`   • Total deleted: ${sensorLogsDeleted + eventsDeleted}\n`)
    
    process.exit(0)
  } catch (error) {
    console.error('\n❌ Error deleting data:', error.message)
    
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
console.log('║   DELETE ALL FIRESTORE DATA              ║')
console.log('╚══════════════════════════════════════════╝\n')
console.log('⚠️  WARNING: This will delete all data in:')
console.log('   - sensor_logs collection')
console.log('   - events collection\n')

deleteAllData()

