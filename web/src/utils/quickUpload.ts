/**
 * Quick utility to upload mock data from browser console
 * Usage: Open browser console and run: await quickUploadMockData()
 */

import { initializeFirebase, getFirestoreInstance } from '../lib/firebase'
import { collection, writeBatch, doc } from 'firebase/firestore'
import { generateMockSensorLogs } from './mockData'

export async function quickUploadMockData(count: number = 50) {
  try {
    console.log('🚀 Starting quick upload...')
    
    // Ensure Firebase is initialized
    initializeFirebase()
    const db = getFirestoreInstance()
    
    // Generate mock data
    const logs = generateMockSensorLogs(count)
    console.log(`📊 Generated ${logs.length} mock sensor readings`)
    
    // Upload in batches
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
      console.log(`📤 Uploaded ${uploadedCount}/${logs.length} records...`)
    }
    
    console.log(`✅ Successfully uploaded ${uploadedCount} records to Firestore!`)
    console.log('🔄 Refresh the page to see the data')
    
    return uploadedCount
  } catch (error) {
    console.error('❌ Error uploading mock data:', error)
    throw error
  }
}

// Make it available in browser console
if (typeof window !== 'undefined') {
  (window as any).quickUploadMockData = quickUploadMockData
  console.log('💡 To upload mock data, run: quickUploadMockData()')
}

