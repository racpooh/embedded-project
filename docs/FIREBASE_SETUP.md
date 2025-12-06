# Firebase Configuration Setup Guide

This guide shows you exactly where to find all the Firebase configuration keys needed for your `.env` file.

## Required Environment Variables

Your `.env` file needs these 6 Firebase configuration values:

```
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## Step-by-Step: Finding Your Firebase Keys

### Method 1: Firebase Console (Recommended)

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/
   - Sign in with your Google account

2. **Select Your Project**
   - If you don't have a project yet, click "Add project" and create one
   - Your project ID should be: `display-c8393` (based on your service account)

3. **Get Web App Configuration**
   - Click the **gear icon (⚙️)** next to "Project Overview" in the left sidebar
   - Select **"Project settings"**

4. **Scroll to "Your apps" section**
   - You'll see a section titled "Your apps" with different platform icons
   - If you don't have a web app yet:
     - Click the **`</>` (Web)** icon
     - Register your app with a nickname (e.g., "Fire Detection Dashboard")
     - Click "Register app"

5. **Copy the Firebase Configuration**
   - You'll see a code block that looks like this:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
     authDomain: "display-c8393.firebaseapp.com",
     projectId: "display-c8393",
     storageBucket: "display-c8393.appspot.com",
     messagingSenderId: "123456789012",
     appId: "1:123456789012:web:abcdef1234567890"
   };
   ```

6. **Map to Your .env File**
   - Copy each value to your `.env` file:
   ```
   VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   VITE_FIREBASE_AUTH_DOMAIN=display-c8393.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=display-c8393
   VITE_FIREBASE_STORAGE_BUCKET=display-c8393.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
   VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890
   ```

### Method 2: From Existing Firebase Project

If you already have a Firebase project set up:

1. Go to **Firebase Console** → Your Project
2. Click **⚙️ Settings** → **Project settings**
3. Scroll to **"Your apps"** section
4. Click on your web app (or create one if it doesn't exist)
5. The config object will be displayed - copy the values

## Detailed Field Explanations

### 1. `VITE_FIREBASE_API_KEY`
- **What it is**: Your Firebase API key (public, safe to expose in client-side code)
- **Where to find**: In the `apiKey` field of the Firebase config
- **Example**: `AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`

### 2. `VITE_FIREBASE_AUTH_DOMAIN`
- **What it is**: Your Firebase authentication domain
- **Where to find**: In the `authDomain` field
- **Format**: `{project-id}.firebaseapp.com`
- **Example**: `display-c8393.firebaseapp.com`

### 3. `VITE_FIREBASE_PROJECT_ID`
- **What it is**: Your Firebase project ID
- **Where to find**: In the `projectId` field
- **Note**: This should match your GCS project ID (`display-c8393`)
- **Example**: `display-c8393`

### 4. `VITE_FIREBASE_STORAGE_BUCKET`
- **What it is**: Your Firebase Storage bucket name
- **Where to find**: In the `storageBucket` field
- **Format**: `{project-id}.appspot.com`
- **Example**: `display-c8393.appspot.com`

### 5. `VITE_FIREBASE_MESSAGING_SENDER_ID`
- **What it is**: Your Firebase Cloud Messaging sender ID
- **Where to find**: In the `messagingSenderId` field
- **Format**: Numeric string
- **Example**: `123456789012`

### 6. `VITE_FIREBASE_APP_ID`
- **What it is**: Your Firebase app ID
- **Where to find**: In the `appId` field
- **Format**: `{messagingSenderId}:web:{app-specific-id}`
- **Example**: `1:123456789012:web:abcdef1234567890`

## Quick Setup Steps

1. **Create `.env` file**:
   ```bash
   cd household-fire-system/web
   cp .env.example .env
   ```

2. **Open Firebase Console**:
   - Go to: https://console.firebase.google.com/
   - Select project: `display-c8393`

3. **Get Config**:
   - Settings ⚙️ → Project settings
   - Scroll to "Your apps"
   - Click on web app (or create one)
   - Copy the config values

4. **Fill `.env` file**:
   ```bash
   # Edit the .env file with your values
   nano .env
   # or use your preferred editor
   ```

5. **Verify**:
   ```bash
   npm run dev
   # Should connect to Firebase without errors
   ```

## Visual Guide (Firebase Console Navigation)

```
Firebase Console
├── Project Overview
│   └── ⚙️ Settings (gear icon)
│       └── Project settings
│           ├── General tab
│           │   └── Project ID: display-c8393
│           └── Your apps section
│               └── Web app (</> icon)
│                   └── Config object with all 6 values
```

## Troubleshooting

### "Firebase: Error (auth/configuration-not-found)"
- **Cause**: Missing or incorrect Firebase config
- **Solution**: Verify all 6 values are in `.env` file and start with `VITE_`

### "Firebase: Error (auth/api-key-not-valid)"
- **Cause**: Invalid API key
- **Solution**: Re-copy the API key from Firebase Console

### "Firebase: Error (auth/project-not-found)"
- **Cause**: Wrong project ID
- **Solution**: Verify project ID matches your Firebase project

### Environment variables not loading
- **Cause**: Vite requires `VITE_` prefix
- **Solution**: Ensure all variables start with `VITE_`
- **Note**: Restart dev server after changing `.env` file

## Security Notes

⚠️ **Important**:
- The Firebase config is **safe to expose** in client-side code (it's public by design)
- However, still use `.env` file for organization and to avoid hardcoding
- The `.env` file is excluded from git (via `.gitignore`)
- Never commit your `.env` file to version control

## Additional Firebase Setup

### Enable Anonymous Authentication

1. Go to Firebase Console → Your Project
2. **Authentication** → **Sign-in method**
3. Enable **"Anonymous"** provider
4. Click **Save**

### Enable Firestore

1. Go to Firebase Console → Your Project
2. **Firestore Database** → **Create database**
3. Start in **test mode** (for development)
4. Select a location (choose closest to your users)
5. Click **Enable**

### Set Up Firestore Collections

Your ESP32 gateway and Python script will create these automatically, but you can verify:

- **Collection**: `sensor_logs` - for real-time sensor data
- **Collection**: `events` - for fire detection events

## Example Complete `.env` File

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSyDxK8vX9YzA1B2C3D4E5F6G7H8I9J0K1L2M
VITE_FIREBASE_AUTH_DOMAIN=display-c8393.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=display-c8393
VITE_FIREBASE_STORAGE_BUCKET=display-c8393.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890abcdef
```

## Need Help?

If you're still having trouble finding the keys:

1. **Check your Firebase project exists**: https://console.firebase.google.com/
2. **Verify you have access** to the project
3. **Create a web app** if you haven't already (Settings → Your apps → Add app → Web)
4. **Double-check the project ID** matches `display-c8393` (from your service account)

