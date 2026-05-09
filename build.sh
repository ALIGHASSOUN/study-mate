#!/bin/bash
set -e

echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..

echo "📦 Installing frontend dependencies..."
cd frontend
npm install --include=dev

echo "🔨 Building frontend..."
npx vite build

echo "📁 Copying frontend build to backend/public..."
cp -r dist ../backend/public

cd ..

echo "🌱 Seeding admin user (if not exists)..."
cd backend
node src/utils/generateSeed.js || true

echo "✅ Build complete!"