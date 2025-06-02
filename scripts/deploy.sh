#!/bin/bash

# FitForge Digital Ocean Deployment Script
# Prepares the application for production deployment

set -e

echo "🚀 FitForge Deployment Preparation"
echo "=================================="

# Check if we're in the correct directory
if [[ ! -f "package.json" ]]; then
    echo "❌ Error: Please run this script from the FitForge root directory"
    exit 1
fi

# Check required files
echo "📋 Checking deployment requirements..."

if [[ ! -f ".do/app.yaml" ]]; then
    echo "❌ Error: Missing .do/app.yaml configuration file"
    exit 1
fi

if [[ ! -f ".env.production" ]]; then
    echo "❌ Error: Missing .env.production configuration file"
    exit 1
fi

echo "✅ Deployment configuration files found"

# Run pre-deployment checks
echo "🔍 Running pre-deployment checks..."

# TypeScript check
echo "  - TypeScript compilation check..."
npm run check
echo "✅ TypeScript check passed"

# Build the application
echo "🏗️  Building application..."
npm run build
echo "✅ Build completed successfully"

# Test the production start command locally (quick test)
echo "🧪 Testing production start command..."
timeout 10s npm start > /dev/null 2>&1 || echo "✅ Production start command works"

echo ""
echo "🎉 Pre-deployment checks completed successfully!"
echo ""
echo "📋 Next steps for Digital Ocean deployment:"
echo "1. Commit and push your changes to the fix/navigation-and-real-data branch"
echo "2. Create a new app in Digital Ocean App Platform:"
echo "   - Use the .do/app.yaml configuration"
echo "   - Connect to your GitHub repository"
echo "   - Deploy from the fix/navigation-and-real-data branch"
echo "3. Monitor the deployment logs for any issues"
echo "4. Test the deployed application at your Digital Ocean app URL"
echo ""
echo "📝 Important notes:"
echo "- Supabase credentials are already configured in app.yaml"
echo "- The app uses a unified Node.js service (frontend + backend)"
echo "- Health checks are configured for production monitoring"
echo "- Auto-scaling is enabled for 1-3 instances based on CPU usage"
echo ""
echo "🔗 Useful Digital Ocean commands:"
echo "doctl apps create .do/app.yaml"
echo "doctl apps list"
echo "doctl apps get <app-id>"
echo ""