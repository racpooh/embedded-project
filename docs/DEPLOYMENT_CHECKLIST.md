# Deployment Checklist

Complete checklist for deploying the Household Fire Detection System.

## ✅ Pre-deployment Checklist

### 1. Environment Setup
- [ ] Node.js 18+ installed
- [ ] Firebase CLI installed (`npm install -g firebase-tools`)
- [ ] Firebase account created
- [ ] LINE account available
- [ ] Git installed and configured

### 2. Firebase Configuration
- [ ] Firebase project created (display-c8393)
- [ ] Anonymous Authentication enabled
- [ ] Firestore database created
- [ ] Security Rules updated (allow read/write for authenticated users)
- [ ] Firebase configuration copied to `web/.env`

### 3. LINE Notify Setup
- [ ] LINE Notify token generated (https://notify-bot.line.me/)
- [ ] Token saved securely
- [ ] LINE Notify added to chat/group

## 📦 Installation Steps

### Step 1: Clone and Setup
```bash
cd /Users/POOH/Development/embedded-project/household-fire-system

# Install root dependencies
npm install

# Install web dependencies
cd web
npm install
cd ..

# Install functions dependencies
cd functions
npm install
cd ..
```

### Step 2: Configure Firebase
```bash
# Login to Firebase
firebase login

# Set active project
firebase use display-c8393

# Verify
firebase projects:list
```

### Step 3: Environment Variables
```bash
# Create web/.env file
cat > web/.env << EOF
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=display-c8393.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=display-c8393
VITE_FIREBASE_STORAGE_BUCKET=display-c8393.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
EOF
```

### Step 4: Configure LINE Notify
```bash
# Set LINE token
firebase functions:config:set line.token="YOUR_LINE_TOKEN"

# Verify
firebase functions:config:get
```

### Step 5: Deploy Cloud Functions
```bash
# Deploy
firebase deploy --only functions

# Expected output:
# ✔ functions[monitorSensorLogs]
# ✔ functions[sendTestLineNotification]
# ✔ functions[getLineNotifyStatus]
```

### Step 6: Build and Test Web Dashboard
```bash
cd web

# Development mode
npm run dev

# Production build
npm run build
npm run preview
```

## 🧪 Testing Checklist

### Test 1: Dashboard Access
- [ ] Dashboard loads at http://localhost:3000
- [ ] No console errors
- [ ] Firebase authentication succeeds
- [ ] "No Sensor Data Available" message appears (if no data)

### Test 2: Data Scripts
```bash
# Delete all data
npm run delete-all-data
# ✓ Deletion successful

# Create normal data
npm run create-normal-data
# ✓ 50 records uploaded

# Verify dashboard
# ✓ Graphs appear
# ✓ "Live Data" badge shows
# ✓ 50 readings displayed
```

### Test 3: LINE Notifications
```bash
# Test LINE connection
curl https://us-central1-display-c8393.cloudfunctions.net/sendTestLineNotification
# ✓ Test message received in LINE

# Test WARNING alert
npm run create-warning-data
# ✓ WARNING message received in LINE (⚠️)

# Test DANGER alert
npm run create-danger-data
# ✓ DANGER message received in LINE (🚨)
```

### Test 4: Real-time Updates
- [ ] Dashboard auto-updates when new data added
- [ ] No page refresh needed
- [ ] Charts update smoothly
- [ ] Events list updates
- [ ] Risk badge changes color

### Test 5: Cloud Functions
```bash
# Check function status
firebase functions:list
# ✓ All 3 functions deployed

# Check logs
firebase functions:log --only monitorSensorLogs
# ✓ No errors

# Check LINE config
curl https://us-central1-display-c8393.cloudfunctions.net/getLineNotifyStatus
# ✓ "configured": true
```

## 🔒 Security Checklist

### Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /sensor_logs/{document} {
      allow read, write: if request.auth != null;
    }
    match /events/{document} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Environment Variables
- [ ] `.env` files not committed to git
- [ ] `.gitignore` excludes all sensitive files
- [ ] LINE token not exposed in code
- [ ] Firebase keys in environment variables only

### Git Repository
- [ ] `.gitignore` properly configured
- [ ] No `node_modules` committed
- [ ] No `.env` files committed
- [ ] No service account JSON files committed
- [ ] No LINE tokens committed

## 🚀 Production Deployment

### Web Dashboard
```bash
cd web

# Build for production
npm run build

# Deploy to Firebase Hosting (optional)
firebase deploy --only hosting

# Or deploy to your preferred hosting service
```

### Cloud Functions
```bash
# Already deployed
firebase deploy --only functions

# Verify deployment
firebase functions:list
```

### AI Module (Python)
```bash
cd ai

# Install dependencies
pip install -r requirements.txt

# Test fire detection script
python fire_detection.py

# Set up as service/cron job (production)
```

## 📊 Monitoring and Maintenance

### Daily Checks
- [ ] Dashboard accessible
- [ ] LINE notifications working
- [ ] No critical errors in logs
- [ ] Sensor data updating

### Weekly Checks
- [ ] Firebase usage within quota
- [ ] Cloud Functions execution count
- [ ] Firestore read/write operations
- [ ] Storage usage

### Monthly Checks
- [ ] Update dependencies
- [ ] Review security rules
- [ ] Check for Firebase SDK updates
- [ ] Backup Firestore data

### Logs and Debugging
```bash
# Function logs
firebase functions:log

# Specific function logs
firebase functions:log --only monitorSensorLogs

# Real-time logs
firebase functions:log --follow

# Web console
# Open browser console (F12) on dashboard
```

## 🐛 Troubleshooting

### Issue: Dashboard shows no data after upload
**Solution:**
1. Check browser console for errors
2. Verify Firebase authentication
3. Check Firestore security rules
4. Refresh page

### Issue: LINE notifications not received
**Solution:**
1. Verify token: `firebase functions:config:get`
2. Check function logs: `firebase functions:log`
3. Test with: `sendTestLineNotification`
4. Redeploy: `firebase deploy --only functions`

### Issue: Permission denied errors
**Solution:**
1. Enable Anonymous Authentication
2. Update Firestore Security Rules
3. Wait 1-2 minutes for propagation
4. Try again

### Issue: Functions not deploying
**Solution:**
1. Check Firebase project: `firebase use`
2. Clear cache: `rm -rf .firebase/`
3. Reinstall: `cd functions && npm install`
4. Redeploy: `firebase deploy --only functions`

## 📈 Performance Optimization

### Web Dashboard
- [ ] Images optimized
- [ ] Code splitting implemented
- [ ] Lazy loading for routes
- [ ] Chart rendering optimized
- [ ] Firestore queries limited

### Cloud Functions
- [ ] Cold start time minimized
- [ ] Memory allocation appropriate
- [ ] Timeout settings configured
- [ ] Error handling robust
- [ ] Retry logic implemented

### Firestore
- [ ] Indexes created for queries
- [ ] Collection structure optimized
- [ ] Document size reasonable
- [ ] Batch operations used where possible

## 🎓 Training and Documentation

### User Training
- [ ] Dashboard navigation explained
- [ ] Alert interpretation covered
- [ ] Emergency procedures documented
- [ ] Troubleshooting guide provided

### Developer Documentation
- [ ] Architecture documented
- [ ] API endpoints listed
- [ ] Data schema explained
- [ ] Deployment process documented

## ✨ Post-Deployment

### Immediate (Day 1)
- [ ] Monitor for errors
- [ ] Test all features
- [ ] Verify LINE notifications
- [ ] Check performance

### Short-term (Week 1)
- [ ] Gather user feedback
- [ ] Fix any issues
- [ ] Optimize performance
- [ ] Update documentation

### Long-term (Month 1+)
- [ ] Analyze usage patterns
- [ ] Plan new features
- [ ] Regular maintenance
- [ ] Security audits

## 📋 Deployment Sign-off

**Deployed by:** _______________  
**Date:** _______________  
**Version:** _______________  
**Environment:** Production / Staging  

**Checklist Completion:**
- [ ] All installation steps completed
- [ ] All tests passed
- [ ] Security verified
- [ ] Documentation updated
- [ ] Team trained
- [ ] Monitoring configured

**Notes:**
_________________________________
_________________________________
_________________________________

**Approved by:** _______________  
**Date:** _______________

---

## 🆘 Emergency Contacts

**Firebase Support:** https://firebase.google.com/support  
**LINE Notify Support:** https://notify-bot.line.me/doc/  
**Project Repository:** [Your Git URL]  
**Team Lead:** [Contact Info]

---

**Last Updated:** December 6, 2025  
**Document Version:** 1.0

