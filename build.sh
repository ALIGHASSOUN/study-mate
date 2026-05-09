#!/bin/bash
# Render Build Script
# This builds both frontend and backend as a single service

set -e

echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..

echo "📦 Installing frontend dependencies..."
cd frontend
npm install

echo "🔨 Building frontend..."
npm run build

echo "📁 Copying frontend build to backend/public..."
rm -rf ../backend/public
cp -r dist ../backend/public

cd ..

echo "🌱 Seeding admin user (if not exists)..."
cd backend
node src/utils/generateSeed.js || true

echo "✅ Build complete!"
