#!/bin/bash

# 🚀 Render Deployment Script
# This script helps prepare and deploy to Render

echo "🚀 Starting Render deployment preparation..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Run this script from the project root."
    exit 1
fi

# 1. Install dependencies
echo "📦 Installing dependencies..."
npm ci

# 2. Generate Prisma client
echo "🗄️ Generating Prisma client..."
npx prisma generate

# 3. Build the application
echo "🔨 Building application..."
npm run build

# 4. Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "📋 Next steps for Render deployment:"
    echo "1. Go to your Render dashboard"
    echo "2. Set these environment variables:"
    echo "   - DATABASE_URL (your Neon database URL)"
    echo "   - JWT_SECRET (generate with: node -e \"console.log(require('crypto').randomBytes(64).toString('base64'))\")"
    echo "   - REFRESH_TOKEN_SECRET (generate a different one)"
    echo "   - NODE_ENV=production"
    echo "   - NEXT_PUBLIC_APP_URL=https://your-app-name.onrender.com"
    echo ""
    echo "3. Set build command: npm run build"
    echo "4. Set start command: npm start"
    echo "5. Deploy!"
    echo ""
    echo "🔍 If deployment fails, check:"
    echo "   - Environment variables are set correctly"
    echo "   - Database connection is working"
    echo "   - Build logs for errors"
else
    echo "❌ Build failed! Check the errors above."
    exit 1
fi
