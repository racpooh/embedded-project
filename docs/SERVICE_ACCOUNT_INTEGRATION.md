# Service Account Integration Guide

## Service Account File Location

Your Google Cloud Storage service account JSON file is located at:
```
household-fire-system/display-c8393-40e854cf0fda.json
```

This file contains credentials for:
- **Service Account Email**: `fire-ai-uploader@display-c8393.iam.gserviceaccount.com`
- **Project ID**: `display-c8393`
- **Permissions**: Storage Object Admin (for uploading to GCS bucket)

## How It's Used

The Python AI script (`fire_detection.py`) uses this file to:

1. **Authenticate with Google Cloud Storage**
   - Uploads detected fire images to the `household-fire-images` bucket
   - Creates public URLs for uploaded images

2. **Integration Points**:
   ```python
   # In fire_detection.py
   detector = FireDetectionAI(
       esp32_cam_url="http://192.168.1.100/capture",
       gcs_bucket_name="household-fire-images",
       gcs_service_account_path="../display-c8393-40e854cf0fda.json",  # ← Your file
       ...
   )
   ```

## Security

✅ **Protected by `.gitignore`**:
- The file is excluded from git via pattern: `display-c8393-*.json`
- Never commit this file to version control
- Keep it secure and never share publicly

## Usage Examples

### Default Path (Recommended)
If the file is in the project root (`household-fire-system/`), the script will find it automatically:
```bash
cd ai
python fire_detection.py
```

### Custom Path
If the file is elsewhere, specify it:
```bash
python fire_detection.py --gcs-key /path/to/display-c8393-40e854cf0fda.json
```

### Environment Variable
```bash
export GCS_SERVICE_ACCOUNT=../display-c8393-40e854cf0fda.json
python fire_detection.py
```

## Verification

To verify the service account is working:

```python
from google.cloud import storage
from google.oauth2 import service_account

credentials = service_account.Credentials.from_service_account_file(
    "../display-c8393-40e854cf0fda.json"
)
client = storage.Client(credentials=credentials, project=credentials.project_id)
bucket = client.bucket("household-fire-images")

# Test upload
blob = bucket.blob("test.txt")
blob.upload_from_string("test content")
print("✓ Service account working!")
```

## Troubleshooting

**Error: File not found**
- Verify the file path is correct relative to the `ai/` directory
- Use absolute path if relative path doesn't work

**Error: Permission denied**
- Verify service account has `Storage Object Admin` role on the bucket
- Check bucket name is correct: `household-fire-images`

**Error: Authentication failed**
- Verify the JSON file is valid and not corrupted
- Check the service account email matches: `fire-ai-uploader@display-c8393.iam.gserviceaccount.com`

