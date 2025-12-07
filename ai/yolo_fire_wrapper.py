#!/usr/bin/env python3
"""
YOLO Fire Detection Wrapper Script
Outputs JSON for Node.js integration

Usage:
    python yolo_fire_wrapper.py <image_path> [--model <model_path>] [--conf <confidence>]

Output format:
    {"fire": true, "confidence": 0.92}
    or
    {"fire": false, "confidence": 0.0}
"""

import sys
import json
import argparse
from pathlib import Path

# Try to import YOLO
try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
except ImportError:
    YOLO_AVAILABLE = False


def detect_fire_brightness(image_path: str, conf_threshold: float = 0.5, debug: bool = False):
    """
    Simple fire detection based on bright spots (fallback method)
    Detects bright yellow/orange/white regions that could indicate fire/flame
    
    Returns:
        dict: {"fire": bool, "confidence": float}
    """
    try:
        from PIL import Image
        import numpy as np
        
        img = Image.open(image_path)
        img_array = np.array(img)
        
        if debug:
            print(f"[DEBUG] Image shape: {img_array.shape}", file=sys.stderr)
        
        # Convert to HSV for better color detection
        if len(img_array.shape) == 3:
            # Simple brightness and color analysis
            # Fire characteristics: high red, moderate green, low blue, high brightness
            r = img_array[:, :, 0].astype(float)
            g = img_array[:, :, 1].astype(float)
            b = img_array[:, :, 2].astype(float)
            
            # Calculate brightness
            brightness = (r + g + b) / 3
            
            # More lenient fire detection:
            # 1. Very bright spots (likely flame core) - white/yellow
            very_bright = brightness > 200
            
            # 2. Fire-like colors: warm tones (red/orange/yellow)
            warm_colors = (r > 100) & (r >= g) & (g >= b) & (brightness > 100)
            
            # Combine conditions
            fire_mask = very_bright | warm_colors
            
            # Calculate percentage of fire-like pixels
            fire_pixels = np.sum(fire_mask)
            total_pixels = fire_mask.size
            fire_ratio = fire_pixels / total_pixels
            
            if debug:
                print(f"[DEBUG] Fire pixels: {fire_pixels} / {total_pixels} = {fire_ratio:.4f}", file=sys.stderr)
                print(f"[DEBUG] Max brightness: {np.max(brightness):.1f}", file=sys.stderr)
                print(f"[DEBUG] Max R: {np.max(r):.1f}, Max G: {np.max(g):.1f}, Max B: {np.max(b):.1f}", file=sys.stderr)
            
            # If >0.3% of pixels look like fire, consider it detected (more lenient)
            if fire_ratio > 0.003:
                confidence = min(0.5 + (fire_ratio * 30), 0.95)
                if debug:
                    print(f"[DEBUG] FIRE DETECTED! Confidence: {confidence:.2f}", file=sys.stderr)
                return {
                    "fire": True,
                    "confidence": round(confidence, 2)
                }
        
        if debug:
            print(f"[DEBUG] No fire detected", file=sys.stderr)
        return {"fire": False, "confidence": 0.0}
        
    except Exception as e:
        if debug:
            print(f"[DEBUG] Error in brightness detection: {e}", file=sys.stderr)
        return {"fire": False, "confidence": 0.0}


def detect_fire_yolo(image_path: str, model_path: str = None, conf_threshold: float = 0.5, debug: bool = False):
    """
    Detect fire in image using YOLO model
    
    Args:
        image_path: Path to image file
        model_path: Path to YOLO model file (optional)
        conf_threshold: Confidence threshold for detection
        debug: Enable debug output
    
    Returns:
        dict: {"fire": bool, "confidence": float}
    """
    if not YOLO_AVAILABLE:
        print(json.dumps({
            "error": "YOLO not installed. Run: pip install ultralytics",
            "fire": False,
            "confidence": 0.0
        }), file=sys.stderr)
        return {"fire": False, "confidence": 0.0}
    
    try:
        # Load model
        if model_path and Path(model_path).exists():
            model = YOLO(model_path)
            if debug:
                print(f"[DEBUG] Using custom model: {model_path}", file=sys.stderr)
        else:
            # Use default YOLOv8 model (you should replace with fire-trained model)
            # For now, we'll use a general model and check for fire-like classes
            model = YOLO('yolov8n.pt')  # Nano model for speed
            if debug:
                print(f"[DEBUG] Using default YOLOv8n model (no fire classes)", file=sys.stderr)
        
        # Run inference
        results = model(image_path, conf=conf_threshold, verbose=False)
        
        # Check for fire detection
        # NOTE: Adjust this logic based on your fire detection model
        # For a fire-trained model, class 0 might be 'fire'
        # For general YOLOv8, we might look for 'fire', 'flame', etc.
        
        fire_detected = False
        max_confidence = 0.0
        
        for result in results:
            boxes = result.boxes
            if boxes is not None and len(boxes) > 0:
                if debug:
                    print(f"[DEBUG] YOLO detected {len(boxes)} objects", file=sys.stderr)
                for box in boxes:
                    # Get class name
                    cls_id = int(box.cls[0])
                    conf = float(box.conf[0])
                    cls_name = model.names[cls_id] if cls_id < len(model.names) else "unknown"
                    
                    if debug:
                        print(f"[DEBUG] Object: {cls_name} (confidence: {conf:.2f})", file=sys.stderr)
                    
                    # Check if this is a fire class
                    # Adjust based on your model's class names
                    fire_keywords = ['fire', 'flame', 'smoke', 'burn']
                    if any(keyword in cls_name.lower() for keyword in fire_keywords):
                        fire_detected = True
                        max_confidence = max(max_confidence, conf)
            elif debug:
                print(f"[DEBUG] YOLO detected no objects", file=sys.stderr)
        
        # HYBRID APPROACH: Use both YOLO and brightness detection
        # Take the higher confidence result
        brightness_result = detect_fire_brightness(image_path, conf_threshold, debug)
        
        if not fire_detected:
            # YOLO found nothing, use brightness result
            if debug:
                print(f"[DEBUG] No fire classes in YOLO output, using brightness detection result", file=sys.stderr)
            return brightness_result
        else:
            # YOLO found fire - use whichever has higher confidence
            if brightness_result["fire"] and brightness_result["confidence"] > max_confidence:
                if debug:
                    print(f"[DEBUG] Brightness detection has higher confidence ({brightness_result['confidence']} vs {max_confidence})", file=sys.stderr)
                return brightness_result
            else:
                if debug:
                    print(f"[DEBUG] Using YOLO result (confidence: {max_confidence})", file=sys.stderr)
                return {
                    "fire": fire_detected,
                    "confidence": round(max_confidence, 2)
                }
    
    except Exception as e:
        print(json.dumps({
            "error": str(e),
            "fire": False,
            "confidence": 0.0
        }), file=sys.stderr)
        return {"fire": False, "confidence": 0.0}


def detect_fire_mock(image_path: str, conf_threshold: float = 0.5):
    """
    Mock fire detection for testing (when YOLO not available)
    Randomly detects fire based on filename or image characteristics
    """
    import random
    
    # For testing: detect fire if 'fire' is in filename
    path = Path(image_path)
    if 'fire' in path.name.lower():
        return {
            "fire": True,
            "confidence": round(random.uniform(0.7, 0.95), 2)
        }
    else:
        return {
            "fire": False,
            "confidence": round(random.uniform(0.0, 0.3), 2)
        }


def main():
    parser = argparse.ArgumentParser(description='YOLO Fire Detection Wrapper')
    parser.add_argument('image_path', help='Path to image file')
    parser.add_argument('--model', default=None, help='Path to YOLO model file')
    parser.add_argument('--conf', type=float, default=0.5, help='Confidence threshold')
    parser.add_argument('--mock', action='store_true', help='Use mock detection for testing')
    parser.add_argument('--debug', action='store_true', help='Enable debug output')
    
    args = parser.parse_args()
    
    # Check if image exists
    if not Path(args.image_path).exists():
        result = {
            "error": f"Image not found: {args.image_path}",
            "fire": False,
            "confidence": 0.0
        }
        print(json.dumps(result))
        sys.exit(1)
    
    # Run detection
    if args.mock or not YOLO_AVAILABLE:
        result = detect_fire_mock(args.image_path, args.conf)
    else:
        result = detect_fire_yolo(args.image_path, args.model, args.conf, args.debug)
    
    # Output JSON
    print(json.dumps(result))
    sys.exit(0 if result["fire"] else 0)  # Always exit 0 for valid JSON output


if __name__ == '__main__':
    main()
