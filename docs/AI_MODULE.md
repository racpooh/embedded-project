# Household Fire Detection System - AI Module

Python AI script for fire detection using ESP32-CAM images, Google Cloud Storage, and Firebase.

## Features

- Fetches images from ESP32-CAM via `/capture` endpoint
- Runs fire detection using AI models (YOLO, FireNet, etc.)
- Uploads detected fire images to Google Cloud Storage bucket
- Writes DANGER events to Firebase Firestore with image URLs

## Setup

### 1. Install Dependencies

```bash
cd ai
pip install -r requirements.txt
```

For AI model support, install additional packages based on your model:
```bash
# For YOLO models
pip install ultralytics

# For TensorFlow models (FireNet)
pip install tensorflow

# For PyTorch models
pip install torch torchvision
```

### 2. Service Account Configuration

The script uses the GCS service account JSON file located at:
```
../embedded-project-6f2ed-6ff292c84b10.json
```

**Important:** This file contains sensitive credentials and is excluded from git via `.gitignore`.

If your file is in a different location, specify it using:
- `--gcs-key` command line argument, or
- `GCS_SERVICE_ACCOUNT` environment variable

### 3. Firebase Configuration

The script uses Firebase Admin SDK. You can either:

**Option A:** Use Application Default Credentials (recommended for local development)
```bash
gcloud auth application-default login
```

**Option B:** Provide Firebase service account JSON
```bash
export FIREBASE_CREDENTIALS=/path/to/firebase-service-account.json
```

### 4. ESP32-CAM Configuration

Ensure your ESP32-CAM is accessible and the `/capture` endpoint is working:
```bash
curl http://192.168.1.100/capture
```

Update the URL in the script or via environment variable:
```bash
export ESP32_CAM_URL=http://192.168.1.100/capture
```

## Usage

### Basic Usage (Continuous Detection)

```bash
python fire_detection.py
```

This will:
- Use default ESP32-CAM URL: `http://192.168.1.100/capture`
- Use default GCS bucket: `household-fire-images`
- Use service account: `../embedded-project-6f2ed-6ff292c84b10.json`
- Run continuous detection every 2 seconds

### Custom Configuration

```bash
python fire_detection.py \
  --esp32-url http://192.168.1.100/capture \
  --gcs-bucket household-fire-images \
  --gcs-key ../embedded-project-6f2ed-6ff292c84b10.json \
  --interval 3.0
```

### Process Single Frame

```bash
python fire_detection.py --once
```

### Environment Variables

You can also configure via environment variables:

```bash
export ESP32_CAM_URL=http://192.168.1.100/capture
export GCS_BUCKET=household-fire-images
export GCS_SERVICE_ACCOUNT=../embedded-project-6f2ed-6ff292c84b10.json
export FIREBASE_CREDENTIALS=/path/to/firebase-key.json
export FIRE_MODEL_PATH=/path/to/fire_model.pt

python fire_detection.py
```

## Google Cloud Storage Setup

### Bucket Configuration

1. Create a GCS bucket named `household-fire-images` (or your preferred name)
2. Ensure the service account `fire-ai-uploader@display-c8393.iam.gserviceaccount.com` has:
   - **Storage Object Admin** role (for uploading)
   - Or **Storage Object Creator** + **Storage Object Viewer** roles

### Service Account Permissions

The service account JSON file (`embedded-project-6f2ed-6ff292c84b10.json`) should have:
- Project: `display-c8393`
- Email: `fire-ai-uploader@display-c8393.iam.gserviceaccount.com`
- Required role: `Storage Object Admin` on the bucket

## Firebase Integration

### Events Collection Structure

When fire is detected, the script writes to Firestore `events` collection:

```json
{
  "timestamp": 1712345678901,
  "event_type": "DANGER",
  "reason": "AI fire detection",
  "ai_fire_detected": true,
  "ai_confidence": 0.92,
  "image_url": "https://storage.googleapis.com/household-fire-images/fire_detection_20231206_143022_123456.jpg",
  "acknowledged": false
}
```

## AI Model Integration

### Using YOLO

1. Train or download a fire detection YOLO model
2. Update `_load_model()` method to use your model path
3. Adjust class detection logic in `detect_fire()` method

Example:
```python
model = YOLO("fire_detection_model.pt")
```

### Using FireNet or Other Models

Modify the `detect_fire()` method to use your model's inference API:

```python
def detect_fire(self, image_bytes: bytes) -> Tuple[bool, float]:
    # Your model inference code here
    # Return (fire_detected: bool, confidence: float)
    pass
```

## File Structure

```
ai/
├── fire_detection.py    # Main AI detection script
├── requirements.txt    # Python dependencies
└── README.md            # This file
```

## Troubleshooting

### GCS Upload Fails

- Verify service account JSON file exists and path is correct
- Check service account has Storage Object Admin permissions
- Verify bucket name is correct
- Check network connectivity to GCS

### Firebase Connection Fails

- Ensure Firebase Admin SDK is initialized
- Check Firebase credentials (service account or ADC)
- Verify Firestore is enabled in Firebase Console

### ESP32-CAM Connection Fails

- Verify ESP32-CAM IP address and `/capture` endpoint
- Check network connectivity
- Ensure ESP32-CAM is powered and running

### Model Not Loading

- Install required model dependencies (ultralytics, tensorflow, etc.)
- Verify model file path is correct
- Check model file format compatibility

## Security Notes

⚠️ **Important Security Considerations:**

1. **Never commit service account JSON files to git** - They are excluded via `.gitignore`
2. **Use environment variables** for sensitive configuration in production
3. **Restrict service account permissions** to minimum required (Storage Object Admin on specific bucket)
4. **Use Firebase Security Rules** to restrict Firestore access
5. **Consider using Secret Manager** for production deployments

## Production Deployment

For production, consider:

1. Running as a systemd service or Docker container
2. Using environment variables or secret management for credentials
3. Adding logging and monitoring
4. Implementing error recovery and retry logic
5. Using a message queue for async processing
6. Scaling horizontally for multiple ESP32-CAM devices

