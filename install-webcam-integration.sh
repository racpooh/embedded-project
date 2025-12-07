#!/bin/bash

# Installation script for External Webcam + YOLO Fire Detection Integration
# Run: bash install-webcam-integration.sh

set -e

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  External Webcam + YOLO Fire Detection - Installation       ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "📍 Working directory: $SCRIPT_DIR"
echo ""

# Step 1: Check prerequisites
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 1: Checking prerequisites..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✓${NC} Node.js: $NODE_VERSION"
else
    echo -e "${RED}✗${NC} Node.js not found. Please install Node.js 18+"
    exit 1
fi

# Check Python
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    echo -e "${GREEN}✓${NC} Python: $PYTHON_VERSION"
else
    echo -e "${RED}✗${NC} Python not found. Please install Python 3.8+"
    exit 1
fi

# Check ffmpeg
if command -v ffmpeg &> /dev/null; then
    FFMPEG_VERSION=$(ffmpeg -version | head -n 1)
    echo -e "${GREEN}✓${NC} ffmpeg: $(echo $FFMPEG_VERSION | cut -d' ' -f3)"
else
    echo -e "${RED}✗${NC} ffmpeg not found. Install with: brew install ffmpeg"
    exit 1
fi

# Check pip
if command -v pip3 &> /dev/null || command -v pip &> /dev/null; then
    echo -e "${GREEN}✓${NC} pip installed"
else
    echo -e "${RED}✗${NC} pip not found. Please install pip"
    exit 1
fi

echo ""

# Step 2: Check camera
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 2: Checking cameras..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "Available cameras:"
ffmpeg -f avfoundation -list_devices true -i "" 2>&1 | grep -E '\[AVFoundation.*\] \['
echo ""

# Step 3: Fix npm permissions if needed
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 3: Checking npm permissions..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -d "$HOME/.npm" ] && [ "$(stat -f '%u' "$HOME/.npm" 2>/dev/null)" = "0" ]; then
    echo -e "${YELLOW}⚠${NC}  npm cache has root-owned files"
    echo "   Fixing permissions..."
    sudo chown -R $(id -u):$(id -g) "$HOME/.npm"
    echo -e "${GREEN}✓${NC} Permissions fixed"
else
    echo -e "${GREEN}✓${NC} npm permissions OK"
fi

echo ""

# Step 4: Install Node.js dependencies
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 4: Installing Node.js dependencies..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

npm install
echo -e "${GREEN}✓${NC} Node.js dependencies installed"
echo ""

# Step 5: Install Python dependencies
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 5: Installing Python dependencies..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd ai
pip3 install -r requirements.txt
echo -e "${GREEN}✓${NC} Python dependencies installed"
cd ..
echo ""

# Step 6: Test components
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 6: Testing components..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Test webcam capture
echo ""
echo "Testing webcam capture (device 1 - external camera)..."
if ffmpeg -f avfoundation -video_size 1280x720 -framerate 30 -i "1" -frames:v 1 -y /tmp/test-webcam.jpg 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Webcam capture successful: /tmp/test-webcam.jpg"
    echo "   Opening image..."
    open /tmp/test-webcam.jpg
else
    echo -e "${YELLOW}⚠${NC}  Webcam capture failed. Check camera permissions:"
    echo "   System Settings → Privacy & Security → Camera → Terminal"
fi

# Test YOLO wrapper
echo ""
echo "Testing YOLO wrapper (mock mode)..."
if python3 ai/yolo_fire_wrapper.py /tmp/test-webcam.jpg --mock 2>/dev/null; then
    echo -e "${GREEN}✓${NC} YOLO wrapper working"
else
    echo -e "${YELLOW}⚠${NC}  YOLO wrapper test failed"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 7: Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "To enable webcam integration, add to your web/.env file:"
echo ""
echo -e "${YELLOW}USE_WEBCAM=1${NC}"
echo -e "${YELLOW}WEBCAM_DEVICE=1${NC}"
echo -e "${YELLOW}YOLO_CONF=0.6${NC}"
echo -e "${YELLOW}GCS_ENABLED=1${NC}"
echo -e "${YELLOW}GCS_BUCKET=household-fire-images${NC}"
echo -e "${YELLOW}GCS_SERVICE_ACCOUNT=../embedded-project-6f2ed-6ff292c84b10.json${NC}"
echo ""

# Step 8: Next steps
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Installation Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📚 Documentation:"
echo "   - Quick Start: QUICKSTART_WEBCAM.md"
echo "   - Full Guide:  docs/WEBCAM_INTEGRATION.md"
echo "   - Config:      ENV_CONFIG.md"
echo ""
echo "🚀 To run with webcam:"
echo "   USE_WEBCAM=1 npm run ingest-esp32"
echo ""
echo "🧪 To test:"
echo "   npm run test-esp32-mock"
echo ""
