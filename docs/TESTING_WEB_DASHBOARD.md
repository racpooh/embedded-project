# Testing the Web Dashboard

Complete guide for testing and verifying your Household Fire Detection System web dashboard.

## 🚀 Quick Start Testing

### Step 1: Install Dependencies

```bash
cd household-fire-system/web
npm install
```

### Step 2: Configure Firebase

1. **Check if `.env` file exists**:
   ```bash
   ls -la .env
   ```

2. **If `.env` doesn't exist, create it from template**:
   ```bash
   cp .env.example .env
   ```

3. **Fill in Firebase configuration** (see [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)):
   ```bash
   # Edit .env file
   nano .env
   # or use your preferred editor
   ```

   Required values:
   ```
   VITE_FIREBASE_API_KEY=your_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN=display-c8393.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=display-c8393
   VITE_FIREBASE_STORAGE_BUCKET=display-c8393.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

### Step 3: Start Development Server

```bash
npm run dev
```

The dashboard will automatically open at `http://localhost:3000`

## ✅ Testing Checklist

### 1. Initial Load Test

- [ ] Dashboard loads without errors
- [ ] No console errors in browser DevTools
- [ ] "Initializing..." message appears briefly
- [ ] Dashboard displays after Firebase connection

**Expected Behavior:**
- Page shows "Initializing..." for 1-2 seconds
- Then shows dashboard with sensor panels

### 2. Firebase Connection Test

**Check Browser Console (F12 → Console tab):**

- [ ] No Firebase authentication errors
- [ ] No Firestore connection errors
- [ ] Anonymous sign-in successful

**Expected Console Output:**
```
Firebase initialized
Anonymous sign-in successful
```

**If you see errors:**
- Verify `.env` file has correct Firebase config
- Check Firebase project exists: https://console.firebase.google.com/
- Ensure Anonymous Authentication is enabled in Firebase Console

### 3. Real-time Data Test (With ESP32 Running)

If your ESP32 gateway is running and sending data:

- [ ] Sensor values update in real-time
- [ ] Risk level changes based on sensor readings
- [ ] Events appear in "Recent Events" section
- [ ] No connection errors

**Expected Behavior:**
- Sensor cards show current values (temp, humidity, etc.)
- Risk indicator changes color (green/yellow/red)
- Events list updates when new events are created

### 4. Mock Data Test (Without ESP32)

If you don't have ESP32 running, test with mock data:

#### Option A: Add Test Data via Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `display-c8393`
3. Navigate to **Firestore Database**
4. Create collections and documents:

**Collection: `sensor_logs`**
```json
{
  "timestamp": 1701936000000,
  "temp": 32.5,
  "humidity": 65,
  "mq_arduino": 210,
  "mq_gateway": 180,
  "flame": false,
  "light": 450,
  "risk_level": "NORMAL",
  "ai_fire_detected": false,
  "source": "esp32_gateway"
}
```

**Collection: `events`**
```json
{
  "timestamp": 1701936000000,
  "event_type": "WARNING",
  "reason": "High temperature detected",
  "risk_score": 5,
  "ai_fire_detected": false,
  "acknowledged": false
}
```

#### Option B: Use Firebase CLI

```bash
# Install Firebase CLI if not installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firestore (if not done)
firebase init firestore

# Add test data using Firestore emulator or direct import
```

### 5. UI/UX Testing

- [ ] **Responsive Design**: Resize browser window
  - Desktop view (1920x1080)
  - Tablet view (768x1024)
  - Mobile view (375x667)

- [ ] **Color Coding**:
  - NORMAL state = Green
  - WARNING state = Yellow/Orange
  - DANGER state = Red

- [ ] **Event Display**:
  - Events show timestamp
  - Events show event type
  - Events show reason/description
  - AI-detected events show confidence and image

- [ ] **Image Display**:
  - Fire images load from GCS URLs
  - Images are responsive
  - Images have proper alt text

### 6. Error Handling Test

Test error scenarios:

- [ ] **Missing Firebase Config**: Remove `.env` file
  - Should show error message
  - Should not crash

- [ ] **Invalid Firebase Config**: Use wrong API key
  - Should show authentication error
  - Should display error message

- [ ] **No Firestore Data**: Empty collections
  - Should show "No sensor data available"
  - Should show "No events yet"

- [ ] **Network Issues**: Disconnect internet
  - Should handle gracefully
  - Should show connection error

## 🧪 Manual Testing Steps

### Test 1: Basic Functionality

```bash
# 1. Start dev server
cd household-fire-system/web
npm run dev

# 2. Open browser to http://localhost:3000

# 3. Open DevTools (F12)
#    - Check Console for errors
#    - Check Network tab for Firebase requests
#    - Check Application tab → Storage → Firebase

# 4. Verify:
#    - Dashboard loads
#    - Firebase connection established
#    - No errors in console
```

### Test 2: Real-time Updates

1. **With ESP32 running:**
   - Watch sensor values update automatically
   - Trigger a sensor event (e.g., spray alcohol near MQ-135)
   - Verify dashboard updates in real-time

2. **With mock data:**
   - Add document to Firestore via Console
   - Watch dashboard update automatically
   - Add event document
   - Verify event appears in dashboard

### Test 3: Different Risk States

Create test documents with different risk levels:

**NORMAL State:**
```json
{
  "risk_level": "NORMAL",
  "temp": 25,
  "mq_arduino": 100,
  "flame": false
}
```

**WARNING State:**
```json
{
  "risk_level": "WARNING",
  "temp": 45,
  "mq_arduino": 350,
  "flame": false
}
```

**DANGER State:**
```json
{
  "risk_level": "DANGER",
  "temp": 60,
  "mq_arduino": 500,
  "flame": true,
  "ai_fire_detected": true,
  "image_url": "https://storage.googleapis.com/household-fire-images/test.jpg"
}
```

### Test 4: AI Fire Detection

1. Create an event with AI detection:
```json
{
  "timestamp": 1701936000000,
  "event_type": "DANGER",
  "ai_fire_detected": true,
  "ai_confidence": 0.92,
  "image_url": "https://storage.googleapis.com/household-fire-images/fire_detection_20231206_143022.jpg",
  "reason": "AI fire detection",
  "acknowledged": false
}
```

2. Verify:
   - Event shows in dashboard
   - AI confidence displayed
   - Fire image loads from GCS URL

## 🔍 Debugging Tips

### Check Browser Console

```javascript
// In browser console, check Firebase connection:
// Open DevTools → Console

// Check if Firebase is initialized
console.log(window.firebase) // Should show Firebase object

// Check Firestore connection
// Look for Firestore queries in Network tab
```

### Check Network Requests

1. Open DevTools → Network tab
2. Filter by "firestore" or "firebase"
3. Verify:
   - Firestore read requests succeed
   - No 401/403 errors
   - Real-time listeners established

### Check Firebase Console

1. Go to Firebase Console → Firestore
2. Verify:
   - Collections exist: `sensor_logs`, `events`
   - Documents are being created/updated
   - Real-time updates are working

### Common Issues and Solutions

#### Issue: "Firebase: Error (auth/configuration-not-found)"
**Solution:**
- Check `.env` file exists and has all 6 variables
- Restart dev server after changing `.env`
- Verify variables start with `VITE_`

#### Issue: "Firebase: Error (auth/api-key-not-valid)"
**Solution:**
- Verify API key in `.env` matches Firebase Console
- Check project ID is correct
- Ensure Firebase project is active

#### Issue: Dashboard shows "No sensor data available"
**Solution:**
- Check Firestore has `sensor_logs` collection
- Verify documents have `timestamp` field
- Check Firestore Security Rules allow read access

#### Issue: Real-time updates not working
**Solution:**
- Verify Firestore is enabled in Firebase Console
- Check Firestore Security Rules allow read access
- Ensure Anonymous Authentication is enabled
- Check browser console for Firestore errors

#### Issue: Images not loading
**Solution:**
- Verify GCS bucket exists: `household-fire-images`
- Check image URLs are correct in Firestore
- Verify CORS is configured for GCS bucket
- Check browser console for image load errors

## 🧪 Automated Testing (Optional)

### Install Testing Dependencies

```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom vitest @vitejs/plugin-react
```

### Create Test File

```typescript
// web/src/App.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('renders dashboard', () => {
    render(<App />)
    expect(screen.getByText(/Household Fire Detection/i)).toBeInTheDocument()
  })
})
```

## 📊 Performance Testing

### Lighthouse Audit

1. Open Chrome DevTools → Lighthouse
2. Run audit for:
   - Performance
   - Accessibility
   - Best Practices
   - SEO

### Network Performance

1. Open DevTools → Network
2. Check:
   - Initial load time
   - Firebase connection time
   - Real-time update latency

## ✅ Final Verification

Before deploying, verify:

- [ ] Dashboard loads without errors
- [ ] Firebase connection works
- [ ] Real-time updates function
- [ ] All sensor values display correctly
- [ ] Events show properly
- [ ] Images load from GCS
- [ ] Responsive design works on mobile
- [ ] No console errors
- [ ] No network errors

## 🚀 Next Steps

After testing:

1. **Build for production**:
   ```bash
   npm run build
   ```

2. **Preview production build**:
   ```bash
   npm run preview
   ```

3. **Deploy** (Firebase Hosting example):
   ```bash
   firebase init hosting
   firebase deploy --only hosting
   ```

## 📚 Related Documentation

- [WEB_DASHBOARD.md](./WEB_DASHBOARD.md) - Setup guide
- [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) - Firebase configuration
- [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) - System architecture

