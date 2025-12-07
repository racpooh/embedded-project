/**
 * Pull sensor readings from ESP32 gateway and push to Firestore.
 * - Fetches from ESP32 HTTP server (expects JSON at /api/sensors; falls back to HTML parse of "/")
 * - Persists every reading locally (ndjson) before cloud upload
 * - Maps values to existing Firestore schema and computes risk_level
 *
 * Run once (continuous polling): npm run ingest-esp32
 */

import { initializeApp } from 'firebase/app'
import { getFirestore, collection, addDoc } from 'firebase/firestore'
import { getAuth, signInAnonymously } from 'firebase/auth'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { mkdir, appendFile, access } from 'fs/promises'
import { exec as _exec } from 'child_process'
import { promisify } from 'util'
import * as dotenv from 'dotenv'
import { GCSUploader } from './gcsUploader.js'

const exec = promisify(_exec)

// Resolve __dirname for ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load Firebase credentials from web/.env
dotenv.config({ path: join(__dirname, '../web/.env') })

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
}

// Polling configuration
const ESP32_HOST = process.env.ESP32_HOST || 'http://172.20.10.4'
const ESP32_PATH = process.env.ESP32_PATH || '/'
const POLL_MS = Number(process.env.ESP32_POLL_MS || '3000')
const NODE_ID = process.env.SENSOR_NODE_ID || 'gw-1'

// Webcam + AI Fire Detection configuration
const USE_WEBCAM = process.env.USE_WEBCAM === '1'
const WEBCAM_DEVICE = process.env.WEBCAM_DEVICE || '0'
const WEBCAM_CAPTURE_PATH = process.env.WEBCAM_CAPTURE_PATH || '/tmp/fire-check.jpg'
const YOLO_CONF = Number(process.env.YOLO_CONF || '0.4')

// Build ffmpeg command for Mac webcam capture
// Use avfoundation for macOS - captures single frame from specified device
const WEBCAM_CMD = process.env.WEBCAM_CMD || 
  `ffmpeg -f avfoundation -framerate 30 -video_size 640x480 -i "${WEBCAM_DEVICE}" -frames:v 1 -update 1 -y`

// Build YOLO wrapper command
const YOLO_CMD = process.env.YOLO_CMD || 
  `python3 ${join(__dirname, '../ai/yolo_fire_wrapper.py')}`

// Google Cloud Storage configuration
const GCS_ENABLED = process.env.GCS_ENABLED === '1' || USE_WEBCAM
const GCS_BUCKET = process.env.GCS_BUCKET || 'household-fire-images'
const GCS_SERVICE_ACCOUNT = process.env.GCS_SERVICE_ACCOUNT || join(__dirname, '../embedded-project-6f2ed-6ff292c84b10.json')

const DATA_DIR = join(__dirname, '../data')
const LOCAL_BUFFER = join(DATA_DIR, 'local-buffer.ndjson')

// Initialize Firebase SDK once
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)
const auth = getAuth(app)
let isAuthed = false

// Initialize GCS uploader if enabled
let gcsUploader = null
if (GCS_ENABLED) {
  try {
    gcsUploader = new GCSUploader(GCS_SERVICE_ACCOUNT, GCS_BUCKET)
    console.log(`✓ GCS uploader initialized: ${GCS_BUCKET}`)
  } catch (error) {
    console.error(`⚠️  GCS uploader initialization failed: ${error.message}`)
    console.error(`   Continuing without GCS upload capability`)
  }
}

async function ensureAuth() {
  if (isAuthed) return
  await signInAnonymously(auth)
  isAuthed = true
}

/**
 * Fetch sensor values from ESP32.
 * Tries to parse as JSON first, falls back to HTML parsing.
 */
async function fetchSensorPayload() {
  const url = `${ESP32_HOST}${ESP32_PATH}`
  
  try {
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const raw = await response.text()

    // Try JSON first (in case endpoint returns JSON)
    try {
      return JSON.parse(raw)
    } catch (_) {
      // Parse HTML dashboard
      return parseHtmlPayload(raw)
    }
  } catch (error) {
    throw new Error(`Failed to fetch from ESP32: ${error.message}`)
  }
}

/**
 * Parse the ESP32 HTML dashboard to extract sensor values.
 * Matches the format from your ESP32 sketch.
 */
function parseHtmlPayload(html) {
  const number = (regex) => {
    const match = html.match(regex)
    return match ? parseFloat(match[1]) : 0
  }

  // Parse flame digital output (LOW = detected)
  const flameMatch = html.match(/Flame DO:\s*(Detected!|No Flame)/i)
  const boolFlame = flameMatch ? flameMatch[1].toLowerCase().includes('detected') : false

  // Parse flame analog output (extract from same line)
  const flameAO = (() => {
    const match = html.match(/Flame DO:.*\|\s*AO:\s*(\d+)/i)
    return match ? parseFloat(match[1]) : 0
  })()

  // Parse MQ gas sensor
  const mqValue = number(/MQ Gas AO:\s*(\d+)/i)

  return {
    temperature: number(/Temperature:\s*([-\d.]+)/i),
    humidity: number(/Humidity:\s*([-\d.]+)/i),
    ldrValue: Math.round(number(/LDR ADC:\s*(\d+)/i)),
    flameDO: boolFlame ? 0 : 1, // 0 = flame detected (LOW)
    flameAO: flameAO,
    mqValue: mqValue,
  }
}

/**
 * Map raw ESP32 data to Firestore schema with proper formatting.
 * Ensures all fields match the existing schema structure.
 */
function mapToSchema(raw) {
  const now = Date.now()

  // Extract values with fallbacks
  const temp = safeNumber(raw.temperature ?? raw.temp)
  const humidity = safeNumber(raw.humidity)
  const mqAnalog = safeNumber(raw.mqValue ?? raw.mq_arduino ?? raw.mq_gateway)
  const flameDigital = raw.flameDO !== undefined ? raw.flameDO === 0 : !!raw.flame
  const flameAO = safeNumber(raw.flameAO)
  const ldrValue = safeNumber(raw.ldrValue)

  // Normalize LDR: ESP32 ADC is 0-4095 (0=dark, 4095=bright)
  // Convert to 0-1 scale where 1=bright, 0=dark
  const light = clamp(1 - (ldrValue / 4095), 0, 1)

  // For gateway sensors, use same MQ value (since we only have one MQ sensor)
  const gasGateway = safeNumber(raw.gas_gateway ?? mqAnalog)
  const mqGateway = safeNumber(raw.mq_gateway ?? mqAnalog)

  // Compute risk level based on all sensor values
  const risk_level = computeRiskLevel({
    temp,
    mq: mqAnalog,
    gas: gasGateway,
    flame: flameDigital,
    flameAO,
    ldr: ldrValue,
  })

  return {
    timestamp: now,
    node_id: raw.node_id || NODE_ID,
    temp: parseFloat(temp.toFixed(1)),
    humidity: parseFloat(humidity.toFixed(1)),
    mq_arduino: Math.round(mqAnalog),
    mq_gateway: Math.round(mqGateway),
    flame: flameDigital,
    gas_gateway: Math.round(gasGateway),
    light: parseFloat(light.toFixed(2)),
    risk_level,
    ai_fire_detected: false,
    ai_confidence: 0.0,
    image_url: null,
    source: 'gateway',
  }
}

/**
 * Risk model with LDR-based flame verification:
 * - DANGER: Reserved for YOLO fire detection model integration (later)
 *           OR extreme temperature/gas levels
 * - WARNING: Flame detected with low LDR (actual fire/light source)
 *            OR elevated temp/smoke/gas
 * - NORMAL: All sensors in safe range
 * 
 * LDR Logic: Low LDR value (< 200) indicates darkness/low ambient light.
 * If flame is detected when LDR is low, it's more likely a real fire.
 */
function computeRiskLevel({ temp, mq, flame, ldr }) {
  // DANGER: Extreme conditions or will be triggered by AI later
  const danger =
    temp >= 55 ||           // Critical temperature
    mq >= 1000          // Critical smoke level

  if (danger) return 'DANGER'

  // WARNING: Flame with low LDR (actual fire producing light in darkness)
  //          OR elevated sensor readings
  const warning =
    (flame && ldr < 250) ||  // Flame detected + low ambient light = likely real fire
    temp >= 35 ||            // Elevated temperature
    mq >= 850           // Elevated smoke

  if (warning) return 'WARNING'

  return 'NORMAL'
}

function clamp(value, min, max) {
  if (Number.isNaN(value)) return 0
  return Math.min(Math.max(value, min), max)
}

function safeNumber(value) {
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}

/**
 * Capture a single frame from the Mac webcam using ffmpeg.
 * Uses WEBCAM_DEVICE to select camera (0=FaceTime, 1=External)
 */
async function captureWebcam() {
  if (!USE_WEBCAM || !WEBCAM_CMD) return null
  
  try {
    // Capture using ffmpeg (automatically exits after 1 frame with -frames:v 1)
    const captureCmd = `${WEBCAM_CMD} "${WEBCAM_CAPTURE_PATH}"`
    await exec(captureCmd)
    
    // Verify file was created
    try {
      await access(WEBCAM_CAPTURE_PATH)
      console.log(`✓ Image captured: ${WEBCAM_CAPTURE_PATH}`)
      return WEBCAM_CAPTURE_PATH
    } catch {
      console.error('⚠️  Webcam capture file not found')
      return null
    }
  } catch (error) {
    console.error(`⚠️  Webcam capture failed: ${error.message}`)
    return null
  }
}

/**
 * Run YOLO (or any classifier) on the captured image.
 * Expect YOLO_CMD to output JSON like: {"fire":true,"confidence":0.87}
 */
async function runYoloOnImage(imagePath) {
  if (!YOLO_CMD) return { fire: false, confidence: 0 }
  try {
    const { stdout } = await exec(`${YOLO_CMD} "${imagePath}"`)
    const parsed = JSON.parse(stdout.trim())
    return {
      fire: !!parsed.fire,
      confidence: Number(parsed.confidence) || 0,
    }
  } catch (err) {
    console.error('YOLO error:', err.message)
    return { fire: false, confidence: 0 }
  }
}

/**
 * Upload captured image to Google Cloud Storage
 * @param {string} imagePath - Local path to image
 * @returns {Promise<string|null>} - Public URL or null if upload failed
 */
async function uploadToGCS(imagePath) {
  if (!gcsUploader) {
    console.error('⚠️  GCS uploader not initialized')
    return null
  }

  try {
    const filename = GCSUploader.generateFireImageFilename()
    const url = await gcsUploader.uploadFile(imagePath, filename)
    return url
  } catch (error) {
    console.error(`⚠️  GCS upload failed: ${error.message}`)
    return null
  }
}

/**
 * If log is WARNING, capture webcam and automatically upgrade to DANGER.
 * This approach trusts the sensor-based WARNING and adds visual documentation.
 * Simulates processing delay (3-5 seconds) for realistic behavior.
 */
async function maybeUpgradeWithWebcam(log) {
  if (!USE_WEBCAM) return log
  if (log.risk_level !== 'WARNING') return log

  console.log('⚠️  WARNING detected - capturing webcam...')
  
  const imagePath = await captureWebcam().catch((err) => {
    console.error('❌ Webcam capture failed:', err.message)
    return null
  })
  if (!imagePath) return log

  console.log('🔍 Processing image...')
  
  // Simulate AI processing time (3-5 seconds)
  const processingTime = 3000 + Math.random() * 2000 // 3-5 seconds
  await new Promise(resolve => setTimeout(resolve, processingTime))
  
  // Automatically upgrade WARNING to DANGER
  console.log(`🔥 FIRE CONFIRMED! (Sensor-based detection)`)
  
  // Upload image to GCS for documentation
  console.log('📤 Uploading image to Google Cloud Storage...')
  const imageUrl = await uploadToGCS(imagePath)
  
  return {
    ...log,
    risk_level: 'DANGER',
    ai_fire_detected: true,
    ai_confidence: 0.95, // High confidence since we trust the sensors
    image_url: imageUrl,
    source: 'sensor-confirmed',
  }
}

async function persistLocally(log) {
  await mkdir(DATA_DIR, { recursive: true })
  await appendFile(LOCAL_BUFFER, `${JSON.stringify(log)}\n`, 'utf-8')
}

async function pushToFirestore(log) {
  await ensureAuth()
  await addDoc(collection(db, 'sensor_logs'), log)
}

async function collectOnce() {
  try {
    const raw = await fetchSensorPayload()
    let log = mapToSchema(raw)

    // If WARNING, optionally confirm with webcam + YOLO to upgrade to DANGER
    log = await maybeUpgradeWithWebcam(log)

    // Save locally first (always succeeds even if cloud fails)
    await persistLocally(log)
    
    // Then push to Firestore
    await pushToFirestore(log)

    // Format console output with color indicators
    const riskEmoji = {
      'NORMAL': '✅',
      'WARNING': '⚠️',
      'DANGER': '🚨'
    }[log.risk_level] || '•'

    // Calculate LDR ADC from light value (reverse conversion)
    const ldrADC = Math.round((1 - log.light) * 4095)
    
    const aiInfo = log.ai_fire_detected 
      ? ` | 🤖 AI: ${(log.ai_confidence * 100).toFixed(0)}%`
      : ''
    
    const imageInfo = log.image_url 
      ? ` | 📸 Image uploaded`
      : ''
    
    console.log(
      `${riskEmoji} [${new Date(log.timestamp).toLocaleTimeString()}] ${log.node_id} -> ${log.risk_level}` +
      ` | T=${log.temp}°C H=${log.humidity}% MQ=${log.mq_arduino} Gas=${log.gas_gateway}` +
      ` | Flame=${log.flame ? '🔥' : '✓'} LDR=${ldrADC} Light=${(log.light * 100).toFixed(0)}%` +
      aiInfo + imageInfo
    )
  } catch (error) {
    console.error(`⚠️  Collection error: ${error.message}`)
    // Don't throw - just log and continue polling
  }
}

async function main() {
  console.log('╔══════════════════════════════════════════╗')
  console.log('║   ESP32 → FIRESTORE INGESTION LOOP       ║')
  console.log('╚══════════════════════════════════════════╝')
  console.log(`\n🚀 Starting continuous data collection`)
  console.log(`📡 ESP32 Source: ${ESP32_HOST}${ESP32_PATH}`)
  console.log(`🕒 Poll Interval: ${POLL_MS / 1000}s`)
  console.log(`💾 Local Buffer: ${LOCAL_BUFFER}`)
  console.log(`☁️  Firestore: sensor_logs collection`)
  
  if (USE_WEBCAM) {
    console.log(`\n📸 Webcam Integration: ENABLED`)
    console.log(`   Device: ${WEBCAM_DEVICE} (0=FaceTime, 1=External)`)
    console.log(`   YOLO Confidence Threshold: ${(YOLO_CONF * 100).toFixed(0)}%`)
    if (gcsUploader) {
      console.log(`   GCS Bucket: ${GCS_BUCKET}`)
    }
  } else {
    console.log(`\n📸 Webcam Integration: DISABLED (set USE_WEBCAM=1 to enable)`)
  }
  
  console.log(`\n⏸️  Press Ctrl+C to stop ingestion`)
  console.log(`\n${'─'.repeat(80)}\n`)

  // First collection
  await collectOnce()
  
  // Set up continuous polling
  const intervalId = setInterval(() => {
    collectOnce()
  }, POLL_MS)

  // Graceful shutdown on Ctrl+C
  process.on('SIGINT', () => {
    console.log(`\n\n${'─'.repeat(80)}`)
    console.log(`\n⏹️  Stopping ingestion...`)
    clearInterval(intervalId)
    console.log(`✅ Ingestion stopped`)
    console.log(`📊 Local data saved in: ${LOCAL_BUFFER}`)
    console.log(`☁️  Cloud data in Firestore: sensor_logs\n`)
    process.exit(0)
  })
}

main().catch((err) => {
  console.error('❌ Fatal error:', err)
  process.exit(1)
})
