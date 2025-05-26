#!/bin/bash

# This script handles building on Render while avoiding Replit-specific plugins
echo "📦 Starting Maharashtra Tour Guide build for Render..."

# Install dependencies
echo "📥 Installing dependencies..."
npm install

# Copy our Render-specific vite config to use during build
echo "🔧 Setting up Render-compatible build configuration..."
cp vite.config.render.ts vite.config.render-backup.ts
cp vite.config.render.ts vite.config.ts

# Run the build
echo "🏗️ Building frontend..."
npx vite build

# Run esbuild for the server
echo "🏗️ Building backend..."
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

# Restore original config
echo "🔄 Restoring original configuration..."
mv vite.config.render-backup.ts vite.config.render.ts
[ -f vite.config.ts.bak ] && mv vite.config.ts.bak vite.config.ts

echo "✅ Build completed successfully!" 