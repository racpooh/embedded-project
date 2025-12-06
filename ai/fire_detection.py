"""
Household Fire Detection System - AI Fire Detection Script

This script:
1. Fetches images from ESP32-CAM via /capture endpoint
2. Runs fire detection using YOLO or FireNet model
3. Uploads detected fire images to Google Cloud Storage
4. Writes DANGER events to Firebase Firestore with image URL
"""

import os
import time
import requests
import json
from datetime import datetime
from pathlib import Path
from typing import Optional, Tuple

# Google Cloud Storage
from google.cloud import storage
from google.oauth2 import service_account

# Firebase
import firebase_admin
from firebase_admin import credentials, firestore

# AI Model (example with YOLO - adjust based on your model)
try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
except ImportError:
    YOLO_AVAILABLE = False
    print("Warning: YOLO not available. Install with: pip install ultralytics")


class FireDetectionAI:
    def __init__(
        self,
        esp32_cam_url: str,
        gcs_bucket_name: str,
        gcs_service_account_path: str,
        firebase_credentials_path: Optional[str] = None,
        model_path: Optional[str] = None
    ):
        """
        Initialize Fire Detection AI System
        
        Args:
            esp32_cam_url: URL of ESP32-CAM /capture endpoint (e.g., "http://192.168.1.100/capture")
            gcs_bucket_name: GCS bucket name (e.g., "household-fire-images")
            gcs_service_account_path: Path to GCS service account JSON file
            firebase_credentials_path: Path to Firebase service account JSON (optional, uses default if None)
            model_path: Path to fire detection model file (optional)
        """
        self.esp32_cam_url = esp32_cam_url
        self.gcs_bucket_name = gcs_bucket_name
        
        # Initialize GCS client
        self._init_gcs_client(gcs_service_account_path)
        
        # Initialize Firebase
        self._init_firebase(firebase_credentials_path)
        
        # Initialize AI model
        self.model = self._load_model(model_path)
    
    def _init_gcs_client(self, service_account_path: str):
        """Initialize Google Cloud Storage client"""
        if not os.path.exists(service_account_path):
            raise FileNotFoundError(
                f"GCS service account file not found: {service_account_path}\n"
                f"Please ensure the file exists. Expected location: {Path(service_account_path).absolute()}"
            )
        
        credentials = service_account.Credentials.from_service_account_file(
            service_account_path
        )
        self.gcs_client = storage.Client(
            credentials=credentials,
            project=credentials.project_id
        )
        self.bucket = self.gcs_client.bucket(self.gcs_bucket_name)
        print(f"✓ GCS client initialized. Bucket: {self.gcs_bucket_name}")
    
    def _init_firebase(self, credentials_path: Optional[str]):
        """Initialize Firebase Admin SDK"""
        try:
            # Check if Firebase is already initialized
            firebase_admin.get_app()
            print("✓ Firebase already initialized")
        except ValueError:
            # Initialize Firebase
            if credentials_path and os.path.exists(credentials_path):
                cred = credentials.Certificate(credentials_path)
            else:
                # Use default credentials (Application Default Credentials)
                cred = credentials.ApplicationDefault()
            
            firebase_admin.initialize_app(cred)
            print("✓ Firebase initialized")
        
        self.db = firestore.client()
    
    def _load_model(self, model_path: Optional[str]):
        """Load fire detection model"""
        if not YOLO_AVAILABLE:
            print("⚠ YOLO not available. Using mock detection.")
            return None
        
        if model_path and os.path.exists(model_path):
            model = YOLO(model_path)
            print(f"✓ Fire detection model loaded: {model_path}")
            return model
        else:
            # Try to use a pre-trained fire detection model
            try:
                # Example: Use a general YOLO model and fine-tune for fire detection
                # Or use a specific fire detection model
                print("⚠ No model path provided. Using default YOLO model.")
                print("  For production, use a trained fire detection model.")
                return None
            except Exception as e:
                print(f"⚠ Could not load model: {e}")
                return None
    
    def capture_image(self) -> Optional[bytes]:
        """Capture image from ESP32-CAM"""
        try:
            response = requests.get(self.esp32_cam_url, timeout=5)
            response.raise_for_status()
            return response.content
        except requests.exceptions.RequestException as e:
            print(f"✗ Failed to capture image from ESP32-CAM: {e}")
            return None
    
    def detect_fire(self, image_bytes: bytes) -> Tuple[bool, float]:
        """
        Detect fire in image using AI model
        
        Returns:
            Tuple of (fire_detected: bool, confidence: float)
        """
        if self.model is None:
            # Mock detection for testing
            # In production, replace with actual model inference
            print("⚠ Using mock detection. Install YOLO for real detection.")
            return False, 0.0
        
        try:
            # Save image temporarily for model inference
            temp_path = "/tmp/fire_detection_temp.jpg"
            with open(temp_path, "wb") as f:
                f.write(image_bytes)
            
            # Run inference
            results = self.model(temp_path)
            
            # Process results (adjust based on your model output)
            # Example: Check if fire class is detected with confidence > threshold
            fire_detected = False
            confidence = 0.0
            
            for result in results:
                boxes = result.boxes
                for box in boxes:
                    # Adjust class_id based on your model (e.g., class 0 = fire)
                    if box.cls == 0 and box.conf > 0.5:  # Fire class with >50% confidence
                        fire_detected = True
                        confidence = float(box.conf)
                        break
            
            # Clean up temp file
            os.remove(temp_path)
            
            return fire_detected, confidence
            
        except Exception as e:
            print(f"✗ Error during fire detection: {e}")
            return False, 0.0
    
    def upload_to_gcs(self, image_bytes: bytes, filename: str) -> Optional[str]:
        """
        Upload image to Google Cloud Storage
        
        Returns:
            Public URL of uploaded image, or None if upload failed
        """
        try:
            blob = self.bucket.blob(filename)
            blob.upload_from_string(image_bytes, content_type="image/jpeg")
            
            # Make blob publicly accessible (optional, adjust based on your security needs)
            # blob.make_public()
            
            # Return public URL
            url = f"https://storage.googleapis.com/{self.gcs_bucket_name}/{filename}"
            print(f"✓ Image uploaded to GCS: {url}")
            return url
            
        except Exception as e:
            print(f"✗ Failed to upload to GCS: {e}")
            return None
    
    def write_danger_event(
        self,
        ai_fire_detected: bool,
        ai_confidence: float,
        image_url: Optional[str] = None
    ):
        """Write DANGER event to Firestore events collection"""
        try:
            event_data = {
                "timestamp": int(time.time() * 1000),  # Milliseconds
                "event_type": "DANGER",
                "reason": "AI fire detection" if ai_fire_detected else "Manual trigger",
                "ai_fire_detected": ai_fire_detected,
                "ai_confidence": ai_confidence,
                "image_url": image_url,
                "acknowledged": False
            }
            
            # Add to events collection
            doc_ref = self.db.collection("events").add(event_data)
            print(f"✓ DANGER event written to Firestore: {doc_ref[1].id}")
            
        except Exception as e:
            print(f"✗ Failed to write event to Firestore: {e}")
    
    def process_frame(self) -> bool:
        """
        Process a single frame: capture, detect, upload, and log
        
        Returns:
            True if fire was detected, False otherwise
        """
        # Capture image
        image_bytes = self.capture_image()
        if not image_bytes:
            return False
        
        # Detect fire
        fire_detected, confidence = self.detect_fire(image_bytes)
        
        if fire_detected:
            # Generate filename with timestamp
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
            filename = f"fire_detection_{timestamp}.jpg"
            
            # Upload to GCS
            image_url = self.upload_to_gcs(image_bytes, filename)
            
            # Write DANGER event to Firestore
            self.write_danger_event(
                ai_fire_detected=True,
                ai_confidence=confidence,
                image_url=image_url
            )
            
            print(f"🔥 FIRE DETECTED! Confidence: {confidence:.2%}")
            return True
        else:
            print(f"✓ No fire detected (confidence: {confidence:.2%})")
            return False
    
    def run_continuous(self, interval: float = 2.0):
        """
        Run continuous fire detection loop
        
        Args:
            interval: Time between captures in seconds
        """
        print(f"\n🚀 Starting continuous fire detection...")
        print(f"   ESP32-CAM URL: {self.esp32_cam_url}")
        print(f"   GCS Bucket: {self.gcs_bucket_name}")
        print(f"   Detection interval: {interval}s\n")
        
        try:
            while True:
                self.process_frame()
                time.sleep(interval)
        except KeyboardInterrupt:
            print("\n\n⚠ Fire detection stopped by user")


def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Household Fire Detection AI")
    parser.add_argument(
        "--esp32-url",
        default=os.getenv("ESP32_CAM_URL", "http://192.168.1.100/capture"),
        help="ESP32-CAM capture endpoint URL"
    )
    parser.add_argument(
        "--gcs-bucket",
        default=os.getenv("GCS_BUCKET", "household-fire-images"),
        help="GCS bucket name"
    )
    parser.add_argument(
        "--gcs-key",
        default=os.getenv("GCS_SERVICE_ACCOUNT", "../embedded-project-6f2ed-6ff292c84b10.json"),
        help="Path to GCS service account JSON file"
    )
    parser.add_argument(
        "--firebase-key",
        default=os.getenv("FIREBASE_CREDENTIALS"),
        help="Path to Firebase service account JSON (optional)"
    )
    parser.add_argument(
        "--model",
        default=os.getenv("FIRE_MODEL_PATH"),
        help="Path to fire detection model file (optional)"
    )
    parser.add_argument(
        "--interval",
        type=float,
        default=2.0,
        help="Detection interval in seconds"
    )
    parser.add_argument(
        "--once",
        action="store_true",
        help="Process a single frame and exit"
    )
    
    args = parser.parse_args()
    
    # Resolve relative paths
    script_dir = Path(__file__).parent
    gcs_key_path = script_dir / args.gcs_key if not os.path.isabs(args.gcs_key) else args.gcs_key
    
    # Initialize detector
    detector = FireDetectionAI(
        esp32_cam_url=args.esp32_url,
        gcs_bucket_name=args.gcs_bucket,
        gcs_service_account_path=str(gcs_key_path),
        firebase_credentials_path=args.firebase_key,
        model_path=args.model
    )
    
    # Run detection
    if args.once:
        detector.process_frame()
    else:
        detector.run_continuous(interval=args.interval)


if __name__ == "__main__":
    main()

