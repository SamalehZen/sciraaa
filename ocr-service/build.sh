#!/usr/bin/env bash
set -e

echo "📦 Installing system dependencies..."
apt-get update
apt-get install -y --no-install-recommends \
    poppler-utils \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1

echo "🐍 Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo "📥 Pre-downloading PaddleOCR models..."
python -c "
from paddleocr import PPStructure
print('Downloading PP-Structure models...')
engine = PPStructure(table=True, ocr=True, show_log=True, use_gpu=False, lang='fr')
print('✅ Models downloaded successfully!')
"

echo "✅ Build complete!"
