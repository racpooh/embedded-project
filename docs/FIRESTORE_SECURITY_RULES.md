# Firestore Security Rules Setup

To allow the upload script and dashboard to work properly, you need to configure Firebase Security Rules.

## Required Steps

### 1. Enable Anonymous Authentication

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `display-c8393`
3. Navigate to **Authentication** → **Sign-in method**
4. Find **Anonymous** in the providers list
5. Click **Enable**
6. Click **Save**

### 2. Update Firestore Security Rules

1. Go to **Firestore Database** → **Rules** tab
2. Replace the rules with the following:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write sensor_logs
    match /sensor_logs/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // Allow authenticated users to read/write events
    match /events/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

3. Click **Publish**

## Security Rules Explained

### Current Rules (Restrictive)
```javascript
match /sensor_logs/{document=**} {
  allow read: if request.auth != null;
  allow write: if request.auth != null;
}
```
- Only authenticated users can read/write
- Anonymous authentication counts as authenticated
- Protects data from unauthorized access

### Alternative: Development Mode (Testing Only)
```javascript
match /sensor_logs/{document=**} {
  allow read, write: if true;
}
```
⚠️ **WARNING**: This allows anyone to read/write. Only use for testing!

### Production Rules (Recommended)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Sensor logs: Anyone authenticated can read, only specific sources can write
    match /sensor_logs/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                   request.resource.data.source in ['gateway', 'ai'];
    }
    
    // Events: Anyone authenticated can read, only specific sources can write
    match /events/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
                   request.resource.data.event_type in ['WARNING', 'DANGER'];
    }
  }
}
```

## Troubleshooting

### Error: "Missing or insufficient permissions"

**Cause**: Anonymous authentication is not enabled or security rules don't allow access.

**Solutions**:
1. ✅ Enable Anonymous Authentication (see step 1 above)
2. ✅ Update Firestore Security Rules (see step 2 above)
3. ✅ Wait 1-2 minutes for rules to propagate
4. ✅ Re-run the upload script

### Error: "auth/api-key-not-valid"

**Cause**: Invalid Firebase configuration in `.env` file.

**Solution**: 
- Verify Firebase config in `web/.env` matches Firebase Console
- Check all 6 required variables are present

### Error: "Failed to get document"

**Cause**: Firestore is not initialized or doesn't exist.

**Solution**:
- Go to Firebase Console → Firestore Database
- Click "Create database" if not already created
- Select "Start in test mode" or "Start in production mode"
- Choose your region (closest to users)

## Testing the Rules

After updating rules, test them:

```bash
# Run the upload script
npm run upload-mock-data

# Should see:
# ✅ Successfully uploaded 50 documents to Firestore!
```

If successful, your rules are working correctly!

## Security Best Practices

1. ✅ Always require authentication for reads/writes
2. ✅ Use field validation in production rules
3. ✅ Limit data size with `request.resource.size`
4. ✅ Validate data types and required fields
5. ⚠️ Never use `allow read, write: if true` in production

## Example: Advanced Production Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /sensor_logs/{logId} {
      allow read: if request.auth != null;
      
      allow create: if request.auth != null &&
                      request.resource.data.keys().hasAll([
                        'timestamp', 'node_id', 'temp', 'humidity',
                        'mq_arduino', 'risk_level', 'source'
                      ]) &&
                      request.resource.data.timestamp is int &&
                      request.resource.data.temp is number &&
                      request.resource.data.risk_level in ['NORMAL', 'WARNING', 'DANGER'];
      
      allow update, delete: if false; // Prevent modifications
    }
    
    match /events/{eventId} {
      allow read: if request.auth != null;
      
      allow create: if request.auth != null &&
                      request.resource.data.event_type in ['WARNING', 'DANGER'] &&
                      request.resource.data.timestamp is int;
      
      allow update: if request.auth != null &&
                      request.resource.data.diff(resource.data).affectedKeys()
                        .hasOnly(['acknowledged']); // Only allow acknowledging
      
      allow delete: if false;
    }
  }
}
```

## Quick Reference

| Action | Command |
|--------|---------|
| View current rules | Firebase Console → Firestore → Rules |
| Test rules | Firebase Console → Firestore → Rules → Simulator |
| Publish rules | Firebase Console → Firestore → Rules → Publish |
| Enable auth | Firebase Console → Authentication → Sign-in method |

## Need Help?

If you're still getting permission errors:
1. Check the Firebase Console logs
2. Verify authentication is working (check browser DevTools → Network)
3. Try "test mode" rules temporarily to isolate the issue
4. Re-deploy security rules and wait 1-2 minutes

