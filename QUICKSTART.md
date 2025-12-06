# 🚀 Quick Start Guide

Get your Household Fire Detection System up and running in minutes!

## Prerequisites

- Node.js 18+ installed
- Firebase account
- LINE account (for notifications)

## 1. Setup Firebase

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Set project
firebase use display-c8393
```

## 2. Configure Environment Variables

Create `web/.env` file:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=display-c8393.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=display-c8393
VITE_FIREBASE_STORAGE_BUCKET=display-c8393.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

See `docs/FIREBASE_SETUP.md` for detailed instructions.

## 3. Install Dependencies

```bash
# Root dependencies (for scripts)
npm install

# Web dashboard dependencies
cd web
npm install
cd ..

# Firebase Functions dependencies
cd functions
npm install
cd ..
```

## 4. Setup LINE Messaging API

> **Note:** LINE Notify was discontinued March 31, 2025. We now use LINE Messaging API.

```bash
# 1. Create LINE Official Account at https://developers.line.biz/console/
# 2. Get Channel Access Token from "Messaging API" tab
# 3. Add bot as friend in LINE app
# 4. Configure:
firebase functions:config:set line.channel_access_token="YOUR_CHANNEL_ACCESS_TOKEN"
firebase functions:config:set line.user_id="YOUR_USER_ID"  # Optional
```

See `docs/LINE_MESSAGING_API_SETUP.md` for detailed instructions.

## 5. Deploy Firebase Functions

```bash
firebase deploy --only functions
```

## 6. Start Web Dashboard

```bash
cd web
npm run dev
```

Visit: http://localhost:3000

## 7. Load Test Data

```bash
# Delete existing data
npm run delete-all-data

# Create 50 normal readings
npm run create-normal-data

# Test WARNING alert
npm run create-warning-data

# Test DANGER alert
npm run create-danger-data
```

## 🎉 You're Done!

Your dashboard should now display:
- Real-time sensor data
- Line graphs for temperature, smoke, light
- Sensor nodes status
- Recent events timeline
- Live LINE notifications for WARNING/DANGER

## Useful Commands

```bash
# Data Management
npm run delete-all-data          # Clear all data
npm run create-normal-data       # 50 normal readings
npm run create-warning-data      # 1 warning reading
npm run create-danger-data       # 1 danger reading
npm run upload-mock-data         # Upload mock data

# Development
cd web && npm run dev            # Start dashboard
cd web && npm run build          # Build for production

# Firebase
firebase deploy --only functions # Deploy Cloud Functions
firebase functions:log           # View logs
firebase emulators:start         # Local testing
```

## Project Structure

```
household-fire-system/
├── web/                    # React dashboard
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── pages/         # Dashboard page
│   │   ├── hooks/         # Custom hooks
│   │   ├── lib/           # Firebase config
│   │   └── utils/         # Utilities
│   └── package.json
├── functions/             # Cloud Functions
│   ├── index.js          # LINE Notify logic
│   └── package.json
├── scripts/              # Data management scripts
│   ├── deleteAllData.js
│   ├── createNormalData.js
│   ├── createWarningData.js
│   └── createDangerData.js
├── ai/                   # Python AI module
│   └── fire_detection.py
├── docs/                 # Documentation
└── package.json          # Root scripts
```

## Troubleshooting

### Dashboard shows "No data"
```bash
npm run create-normal-data
```

### LINE notifications not working
1. Check token: `firebase functions:config:get`
2. Redeploy: `firebase deploy --only functions`
3. Check logs: `firebase functions:log`

### Permission errors in Firestore
1. Enable Anonymous Authentication in Firebase Console
2. Update Security Rules (see `docs/FIRESTORE_SECURITY_RULES.md`)

## Next Steps

1. ✅ Test all data scripts
2. ✅ Verify LINE notifications
3. 📱 Train users on alert responses
4. 🔧 Connect real IoT sensors
5. 🚀 Deploy to production

## Documentation

- `README.md` - Project overview
- `docs/LINE_NOTIFY_SETUP.md` - LINE integration guide
- `docs/FIREBASE_SETUP.md` - Firebase configuration
- `docs/PROJECT_STRUCTURE.md` - Architecture details
- `docs/DATA_SCRIPTS_GUIDE.md` - Data management
- `docs/FIRESTORE_SECURITY_RULES.md` - Security setup

## Support

For issues or questions, check:
1. Firebase Console logs
2. Browser console (F12)
3. Documentation in `docs/` folder

🔥 **Happy monitoring!**

