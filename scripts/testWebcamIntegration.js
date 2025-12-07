/**
 * Test script for Webcam + YOLO + GCS integration
 * Tests each component individually before running full integration
 */

import { exec as _exec } from 'child_process'
import { promisify } from 'util'
import { access, unlink } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { GCSUploader } from './gcsUploader.js'

const exec = promisify(_exec)

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Configuration
const WEBCAM_DEVICE = process.env.WEBCAM_DEVICE || '1'
const TEST_IMAGE_PATH = '/tmp/fire-test.jpg'
const GCS_BUCKET = 'household-fire-images'
const GCS_SERVICE_ACCOUNT = join(__dirname, '../embedded-project-6f2ed-6ff292c84b10.json')
const YOLO_WRAPPER = join(__dirname, '../ai/yolo_fire_wrapper.py')

// Test results
const results = {
  camera_detection: false,
  camera_capture: false,
  yolo_mock: false,
  yolo_real: false,
  gcs_upload: false,
}

console.log('╔═══════════════════════════════════════════════════╗')
console.log('║  WEBCAM + YOLO + GCS INTEGRATION TEST             ║')
console.log('╚═══════════════════════════════════════════════════╝\n')

// Test 1: Check if external camera is detected
async function testCameraDetection() {
  console.log('📹 Test 1: Camera Detection')
  console.log('─'.repeat(50))
  
  try {
    const { stdout } = await exec('system_profiler SPCameraDataType')
    
    const hasExternal = stdout.includes('Web Camera') || stdout.includes('UVC Camera')
    
    if (hasExternal) {
      console.log('✅ External camera detected!')
      console.log('\nCamera details:')
      const lines = stdout.split('\n')
      let inCamera = false
      for (const line of lines) {
        if (line.includes('Web Camera') || line.includes('UVC Camera')) {
          inCamera = true
        }
        if (inCamera && line.trim()) {
          console.log('   ' + line.trim())
        }
        if (inCamera && line.includes('Unique ID')) {
          break
        }
      }
      results.camera_detection = true
    } else {
      console.log('❌ External camera NOT detected')
      console.log('   Only built-in FaceTime camera found')
      console.log('   Please connect your external USB camera')
    }
  } catch (error) {
    console.log('❌ Error checking camera:', error.message)
  }
  
  console.log()
}

// Test 2: List available video devices with ffmpeg
async function testFFmpegDevices() {
  console.log('🎥 Test 2: FFmpeg Video Devices')
  console.log('─'.repeat(50))
  
  try {
    const { stderr } = await exec('ffmpeg -f avfoundation -list_devices true -i "" 2>&1 || true')
    
    const lines = stderr.split('\n')
    const videoDevices = []
    let inVideoSection = false
    
    for (const line of lines) {
      if (line.includes('AVFoundation video devices:')) {
        inVideoSection = true
        continue
      }
      if (line.includes('AVFoundation audio devices:')) {
        break
      }
      if (inVideoSection && line.includes('[') && line.includes(']')) {
        videoDevices.push(line.trim())
      }
    }
    
    console.log('Available video devices:')
    videoDevices.forEach(device => {
      const isExternal = device.toLowerCase().includes('web camera')
      const marker = isExternal ? '👉' : '  '
      console.log(`${marker} ${device}`)
    })
    
    const hasDevice = videoDevices.some(d => d.includes(`[${WEBCAM_DEVICE}]`))
    if (hasDevice) {
      console.log(`\n✅ Device [${WEBCAM_DEVICE}] is available`)
    } else {
      console.log(`\n❌ Device [${WEBCAM_DEVICE}] not found`)
      console.log(`   Update WEBCAM_DEVICE environment variable`)
    }
  } catch (error) {
    console.log('❌ Error listing devices:', error.message)
  }
  
  console.log()
}

// Test 3: Capture image from webcam
async function testWebcamCapture() {
  console.log('📸 Test 3: Webcam Capture')
  console.log('─'.repeat(50))
  
  try {
    // Remove old test image if exists
    try {
      await unlink(TEST_IMAGE_PATH)
    } catch {}
    
    console.log(`Capturing from device [${WEBCAM_DEVICE}]...`)
    const captureCmd = `ffmpeg -f avfoundation -video_size 1280x720 -framerate 30 -i "${WEBCAM_DEVICE}" -frames:v 1 -y "${TEST_IMAGE_PATH}" 2>&1`
    
    await exec(captureCmd)
    
    // Verify file exists
    await access(TEST_IMAGE_PATH)
    
    console.log(`✅ Image captured successfully!`)
    console.log(`   Saved to: ${TEST_IMAGE_PATH}`)
    console.log(`   Opening image... (close preview to continue)`)
    
    // Open image for user to verify
    await exec(`open "${TEST_IMAGE_PATH}"`)
    
    results.camera_capture = true
  } catch (error) {
    console.log('❌ Webcam capture failed:', error.message)
    console.log('\nTroubleshooting:')
    console.log('1. Grant Terminal camera access:')
    console.log('   System Settings → Privacy & Security → Camera → Terminal')
    console.log('2. Try device 0 instead: WEBCAM_DEVICE=0')
    console.log('3. Check if camera is being used by another app')
  }
  
  console.log()
}

// Test 4: Test YOLO wrapper (mock mode)
async function testYoloMock() {
  console.log('🤖 Test 4: YOLO Mock Detection')
  console.log('─'.repeat(50))
  
  try {
    const { stdout } = await exec(`python3 "${YOLO_WRAPPER}" "${TEST_IMAGE_PATH}" --mock`)
    const result = JSON.parse(stdout.trim())
    
    console.log('Mock detection result:', JSON.stringify(result, null, 2))
    
    if (result.hasOwnProperty('fire') && result.hasOwnProperty('confidence')) {
      console.log('✅ YOLO wrapper working correctly!')
      results.yolo_mock = true
    } else {
      console.log('❌ Unexpected output format')
    }
  } catch (error) {
    console.log('❌ YOLO mock test failed:', error.message)
    console.log('\nInstall YOLO:')
    console.log('   cd ai && pip install -r requirements.txt')
  }
  
  console.log()
}

// Test 5: Test YOLO with real model
async function testYoloReal() {
  console.log('🔥 Test 5: YOLO Real Detection')
  console.log('─'.repeat(50))
  
  try {
    console.log('Running YOLO inference (may download model on first run)...')
    const { stdout } = await exec(`python3 "${YOLO_WRAPPER}" "${TEST_IMAGE_PATH}"`)
    const result = JSON.parse(stdout.trim())
    
    console.log('Detection result:', JSON.stringify(result, null, 2))
    
    if (result.fire) {
      console.log(`🔥 Fire detected with ${(result.confidence * 100).toFixed(0)}% confidence!`)
    } else {
      console.log(`✅ No fire detected (confidence: ${(result.confidence * 100).toFixed(0)}%)`)
    }
    
    results.yolo_real = true
  } catch (error) {
    console.log('❌ YOLO real test failed:', error.message)
    
    if (error.message.includes('YOLO not installed')) {
      console.log('\nInstall YOLO:')
      console.log('   cd ai && pip install ultralytics')
    }
  }
  
  console.log()
}

// Test 6: Test GCS upload
async function testGCSUpload() {
  console.log('☁️  Test 6: Google Cloud Storage Upload')
  console.log('─'.repeat(50))
  
  try {
    // Check if service account exists
    await access(GCS_SERVICE_ACCOUNT)
    console.log('✅ Service account file found')
    
    // Initialize uploader
    const uploader = new GCSUploader(GCS_SERVICE_ACCOUNT, GCS_BUCKET)
    console.log(`✅ GCS client initialized`)
    
    // Upload test image
    console.log('Uploading test image...')
    const filename = `test_${Date.now()}.jpg`
    const url = await uploader.uploadFile(TEST_IMAGE_PATH, filename)
    
    console.log('✅ Upload successful!')
    console.log(`   URL: ${url}`)
    
    results.gcs_upload = true
  } catch (error) {
    console.log('❌ GCS upload failed:', error.message)
    
    if (error.message.includes('not found')) {
      console.log('\nService account file not found:')
      console.log(`   Expected at: ${GCS_SERVICE_ACCOUNT}`)
      console.log('   Download from Firebase Console → Project Settings → Service Accounts')
    } else if (error.message.includes('403') || error.message.includes('permission')) {
      console.log('\nPermission denied. Grant Storage Object Admin role:')
      console.log('   https://console.cloud.google.com/storage/browser/' + GCS_BUCKET)
      console.log('   → Permissions → Add service account with Storage Object Admin role')
    }
  }
  
  console.log()
}

// Summary
function printSummary() {
  console.log('╔═══════════════════════════════════════════════════╗')
  console.log('║  TEST SUMMARY                                     ║')
  console.log('╚═══════════════════════════════════════════════════╝\n')
  
  const tests = [
    { name: 'Camera Detection', result: results.camera_detection },
    { name: 'Webcam Capture', result: results.camera_capture },
    { name: 'YOLO Mock', result: results.yolo_mock },
    { name: 'YOLO Real', result: results.yolo_real },
    { name: 'GCS Upload', result: results.gcs_upload },
  ]
  
  tests.forEach(test => {
    const icon = test.result ? '✅' : '❌'
    console.log(`${icon} ${test.name}`)
  })
  
  const passedCount = Object.values(results).filter(Boolean).length
  const totalCount = Object.values(results).length
  
  console.log(`\nPassed: ${passedCount}/${totalCount}`)
  
  if (passedCount === totalCount) {
    console.log('\n🎉 All tests passed! You\'re ready to run the full integration.')
    console.log('\nNext steps:')
    console.log('1. Configure environment: Edit web/.env')
    console.log('2. Run ingestion: USE_WEBCAM=1 npm run ingest-esp32')
    console.log('3. Trigger WARNING status (heat sensor, flame, etc.)')
    console.log('4. Watch for automatic fire detection!')
  } else {
    console.log('\n⚠️  Some tests failed. Fix issues above before proceeding.')
  }
  
  console.log()
}

// Run all tests
async function runAllTests() {
  await testCameraDetection()
  await testFFmpegDevices()
  await testWebcamCapture()
  
  // Only proceed with YOLO/GCS tests if image was captured
  if (results.camera_capture) {
    await testYoloMock()
    await testYoloReal()
    await testGCSUpload()
  } else {
    console.log('⏭️  Skipping YOLO and GCS tests (no image captured)')
  }
  
  printSummary()
}

// Main
runAllTests().catch(error => {
  console.error('\n❌ Fatal error:', error)
  process.exit(1)
})
