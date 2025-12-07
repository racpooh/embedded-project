/**
 * Test script to verify webcam capture and YOLO integration
 * Run: node scripts/testWebcamCapture.js
 */

import { exec as _exec } from 'child_process'
import { promisify } from 'util'
import { access, unlink } from 'fs/promises'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import * as dotenv from 'dotenv'

const exec = promisify(_exec)
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '../web/.env') })

const WEBCAM_DEVICE = process.env.WEBCAM_DEVICE || '0'
const WEBCAM_CAPTURE_PATH = process.env.WEBCAM_CAPTURE_PATH || '/tmp/fire-check.jpg'
const YOLO_CONF = Number(process.env.YOLO_CONF || '0.6')

console.log('╔══════════════════════════════════════════╗')
console.log('║   WEBCAM + YOLO INTEGRATION TEST         ║')
console.log('╚══════════════════════════════════════════╝\n')

console.log(`📸 Camera Device: ${WEBCAM_DEVICE}`)
console.log(`💾 Capture Path: ${WEBCAM_CAPTURE_PATH}`)
console.log(`🎯 YOLO Confidence Threshold: ${(YOLO_CONF * 100).toFixed(0)}%\n`)

async function testWebcamCapture() {
  console.log('▶ Step 1: Testing webcam capture...')
  
  try {
    // Remove old test image if exists
    try {
      await unlink(WEBCAM_CAPTURE_PATH)
    } catch {
      // File doesn't exist, that's fine
    }

    // Capture image using ffmpeg
    const captureCmd = `ffmpeg -f avfoundation -framerate 30 -video_size 640x480 -i "${WEBCAM_DEVICE}" -frames:v 1 -update 1 -y "${WEBCAM_CAPTURE_PATH}"`
    
    console.log(`  Command: ${captureCmd}`)
    await exec(captureCmd)
    
    // Verify file was created
    await access(WEBCAM_CAPTURE_PATH)
    console.log(`✅ Webcam capture successful!\n`)
    return true
  } catch (error) {
    console.error(`❌ Webcam capture failed: ${error.message}`)
    console.error('\n💡 Troubleshooting:')
    console.error('   1. Check available cameras: ffmpeg -f avfoundation -list_devices true -i ""')
    console.error('   2. Grant camera permissions: System Settings → Privacy & Security → Camera')
    console.error('   3. Try different device: WEBCAM_DEVICE=1 node scripts/testWebcamCapture.js\n')
    return false
  }
}

async function testYoloDetection() {
  console.log('▶ Step 2: Testing YOLO fire detection...')
  
  try {
    const yoloCmd = `python3 ${join(__dirname, '../ai/yolo_fire_wrapper.py')} "${WEBCAM_CAPTURE_PATH}" --conf ${YOLO_CONF}`
    
    console.log(`  Command: ${yoloCmd}`)
    const { stdout } = await exec(yoloCmd)
    
    const result = JSON.parse(stdout.trim())
    console.log(`  Result: ${JSON.stringify(result)}`)
    
    if (result.fire) {
      console.log(`🔥 FIRE DETECTED! Confidence: ${(result.confidence * 100).toFixed(0)}%\n`)
    } else {
      console.log(`✅ No fire detected (confidence: ${(result.confidence * 100).toFixed(0)}%)\n`)
    }
    
    return true
  } catch (error) {
    console.error(`❌ YOLO detection failed: ${error.message}`)
    console.error('\n💡 Troubleshooting:')
    console.error('   1. Install dependencies: cd ai && pip install -r requirements.txt')
    console.error('   2. Test YOLO wrapper: python3 ai/yolo_fire_wrapper.py /tmp/test.jpg --mock')
    console.error('   3. Check Python path: which python3\n')
    return false
  }
}

async function testGCSUpload() {
  console.log('▶ Step 3: Testing GCS upload (optional)...')
  
  const GCS_ENABLED = process.env.GCS_ENABLED === '1'
  if (!GCS_ENABLED) {
    console.log('⏭️  GCS upload disabled (set GCS_ENABLED=1 to enable)\n')
    return true
  }
  
  try {
    const { GCSUploader } = await import('./gcsUploader.js')
    
    const GCS_BUCKET = process.env.GCS_BUCKET || 'household-fire-images'
    const GCS_SERVICE_ACCOUNT = process.env.GCS_SERVICE_ACCOUNT || join(__dirname, '../embedded-project-6f2ed-6ff292c84b10.json')
    
    const uploader = new GCSUploader(GCS_SERVICE_ACCOUNT, GCS_BUCKET)
    const filename = `test_${Date.now()}.jpg`
    const url = await uploader.uploadFile(WEBCAM_CAPTURE_PATH, filename)
    
    console.log(`✅ GCS upload successful!`)
    console.log(`  URL: ${url}\n`)
    return true
  } catch (error) {
    console.error(`❌ GCS upload failed: ${error.message}`)
    console.error('\n💡 Troubleshooting:')
    console.error('   1. Check service account file exists')
    console.error('   2. Verify GCS bucket exists: gsutil ls gs://household-fire-images')
    console.error('   3. Check service account permissions')
    console.error('   Note: GCS upload is optional for testing\n')
    return false
  }
}

async function main() {
  let success = true
  
  // Test 1: Webcam capture
  const captureSuccess = await testWebcamCapture()
  if (!captureSuccess) {
    success = false
  }
  
  // Test 2: YOLO detection (only if capture succeeded)
  if (captureSuccess) {
    const yoloSuccess = await testYoloDetection()
    if (!yoloSuccess) {
      success = false
    }
  }
  
  // Test 3: GCS upload (optional)
  await testGCSUpload()
  
  // Summary
  console.log('═'.repeat(44))
  if (success) {
    console.log('✅ All tests passed! Webcam integration is ready.')
    console.log('\n🚀 Next steps:')
    console.log('   1. Set USE_WEBCAM=1 in web/.env')
    console.log('   2. Run: npm run ingest-esp32')
    console.log('   3. Trigger WARNING state (spray alcohol, high temp)')
    console.log('   4. System will auto-capture and analyze with YOLO')
  } else {
    console.log('❌ Some tests failed. Please fix the issues above.')
    console.log('\n📚 Documentation:')
    console.log('   - docs/WEBCAM_INTEGRATION.md')
    console.log('   - docs/AI_MODULE.md')
  }
  console.log('')
}

main().catch((err) => {
  console.error('❌ Fatal error:', err)
  process.exit(1)
})
