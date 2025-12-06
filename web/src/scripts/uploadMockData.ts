/**
 * Script to upload mock data to Firestore
 * Run this from browser console or as a Node script
 */

import { initializeFirebase, getFirestoreInstance } from '../lib/firebase'
import { uploadMockDataToFirestore } from '../utils/mockData'

export async function runMockDataUpload() {
  try {
    console.log('🚀 Starting mock data upload...')
    
    // Initialize Firebase
    initializeFirebase()
    const db = getFirestoreInstance()
    
    // Upload 50 mock records
    const results = await uploadMockDataToFirestore(db, 50)
    
    console.log(`✅ Upload complete! Added ${results.length} documents to Firestore`)
    console.log('📊 You can now refresh your dashboard to see the data')
    
    return results
  } catch (error) {
    console.error('❌ Error uploading mock data:', error)
    throw error
  }
}

// For browser console usage
if (typeof window !== 'undefined') {
  (window as any).uploadMockData = runMockDataUpload
  console.log('💡 To upload mock data, run: uploadMockData()')
}

