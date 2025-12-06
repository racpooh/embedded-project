/**
 * Standalone script to upload mock data to Firebase Firestore
 * Run: node scripts/uploadMockData.js
 */

import { initializeApp } from "firebase/app";
import { getFirestore, collection, writeBatch, doc } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Get directory path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from web/.env
dotenv.config({ path: join(__dirname, "../web/.env") });

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

// Validate configuration
const requiredVars = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_APP_ID",
];
for (const varName of requiredVars) {
  if (!process.env[varName]) {
    console.error(`❌ Missing required environment variable: ${varName}`);
    console.error(
      "💡 Make sure web/.env file exists with Firebase configuration"
    );
    process.exit(1);
  }
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Generate mock sensor data
function generateMockSensorLogs(count = 50) {
  const logs = [];
  const now = Date.now();
  const interval = (24 * 60 * 60 * 1000) / count; // Distribute over 24 hours

  for (let i = 0; i < count; i++) {
    const timestamp = now - (count - i) * interval;

    // Simulate gradual changes and occasional spikes
    const baseTemp = 28 + Math.sin(i / 10) * 5 + Math.random() * 3;
    const baseHumidity = 60 + Math.cos(i / 8) * 10 + Math.random() * 5;
    const baseMQ = 150 + Math.random() * 100;
    const baseGas = 200 + Math.random() * 150;

    // Simulate day/night cycle for light sensor
    const hourOfDay = new Date(timestamp).getHours();
    const isDaytime = hourOfDay >= 6 && hourOfDay <= 18;
    const baseLight = isDaytime
      ? 0.6 + Math.random() * 0.3
      : 0.1 + Math.random() * 0.2;

    // Occasionally simulate dangerous conditions
    const isDangerous = Math.random() > 0.95;
    const isWarning = !isDangerous && Math.random() > 0.85;

    let temp = baseTemp;
    let mq_arduino = baseMQ;
    let mq_gateway = baseMQ * 0.9;
    let gas_gateway = baseGas;
    let flame = false;
    let risk_level = "NORMAL";
    let ai_fire_detected = false;
    let ai_confidence = 0.0;
    let image_url = null;

    if (isDangerous) {
      temp = 45 + Math.random() * 20;
      mq_arduino = 400 + Math.random() * 200;
      mq_gateway = 380 + Math.random() * 180;
      gas_gateway = 500 + Math.random() * 200;
      flame = Math.random() > 0.3;
      risk_level = "DANGER";
      ai_fire_detected = Math.random() > 0.4;
      ai_confidence = 0.75 + Math.random() * 0.25;
      image_url = ai_fire_detected
        ? `https://storage.googleapis.com/household-fire-images/fire_${timestamp}.jpg`
        : null;
    } else if (isWarning) {
      temp = 35 + Math.random() * 8;
      mq_arduino = 280 + Math.random() * 100;
      mq_gateway = 260 + Math.random() * 90;
      gas_gateway = 350 + Math.random() * 100;
      flame = Math.random() > 0.8;
      risk_level = "WARNING";
    }

    logs.push({
      timestamp,
      node_id: "gw-1",
      temp: parseFloat(temp.toFixed(1)),
      humidity: parseFloat(baseHumidity.toFixed(1)),
      mq_arduino: Math.round(mq_arduino),
      mq_gateway: Math.round(mq_gateway),
      flame,
      gas_gateway: Math.round(gas_gateway),
      light: parseFloat(baseLight.toFixed(2)),
      risk_level,
      ai_fire_detected,
      ai_confidence: parseFloat(ai_confidence.toFixed(2)),
      image_url,
      source: ai_fire_detected ? "ai" : "gateway",
    });
  }

  return logs;
}

// Upload data to Firestore
async function uploadMockData() {
  try {
    console.log("🔐 Signing in anonymously...");
    await signInAnonymously(auth);
    console.log("✅ Authentication successful");

    console.log("📊 Generating 50 mock sensor logs...");
    const logs = generateMockSensorLogs(50);

    console.log(`📤 Uploading ${logs.length} records to Firestore...`);

    // Use batched writes (max 500 per batch)
    const batchSize = 500;
    let uploadedCount = 0;

    for (let i = 0; i < logs.length; i += batchSize) {
      const batch = writeBatch(db);
      const batchLogs = logs.slice(i, Math.min(i + batchSize, logs.length));

      batchLogs.forEach((log) => {
        const docRef = doc(collection(db, "sensor_logs"));
        batch.set(docRef, log);
      });

      await batch.commit();
      uploadedCount += batchLogs.length;
      console.log(`   ✓ Uploaded ${uploadedCount}/${logs.length} records`);
    }

    console.log(
      `\n✅ Successfully uploaded ${uploadedCount} documents to Firestore!`
    );
    console.log("📊 Collection: sensor_logs");
    console.log("🔄 Refresh your dashboard to see the data\n");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error uploading mock data:", error.message);

    if (error.code === "permission-denied") {
      console.error("\n🔒 Permission Error Solutions:");
      console.error("1. Enable Anonymous Authentication in Firebase Console:");
      console.error(
        "   → Authentication → Sign-in method → Anonymous → Enable"
      );
      console.error("\n2. Update Firestore Security Rules to allow writes:");
      console.error("   → Firestore → Rules → Add the following:");
      console.error(`
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /sensor_logs/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    match /events/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
      `);
    }

    process.exit(1);
  }
}

// Run the upload
console.log("🚀 Starting Firebase Mock Data Upload\n");
uploadMockData();
