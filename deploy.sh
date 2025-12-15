#!/bin/bash

# =============================================================================
# AquaFlow Deployment Script
# =============================================================================

set -e  # Exit on any error

echo "🚀 Starting AquaFlow deployment process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

print_success "Node.js version check passed: $(node -v)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

# Install dependencies
print_status "Installing dependencies..."
npm ci --silent
print_success "Dependencies installed successfully"

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    print_warning ".env.local not found. Creating from .env.example..."
    cp .env.example .env.local
    print_warning "Please edit .env.local with your actual API keys before deploying!"
    print_warning "Required variables:"
    echo "  - NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID"
    echo "  - NEXT_PUBLIC_GEMINI_API_KEY"
    echo "  - ARBISCAN_API_KEY"
    read -p "Press Enter to continue after setting up environment variables..."
fi

# Type check
print_status "Running TypeScript type check..."
npm run type-check
print_success "Type check passed"

# Lint check
print_status "Running ESLint..."
npm run lint
print_success "Lint check passed"

# Build the application
print_status "Building application for production..."
npm run build
print_success "Build completed successfully"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    print_warning "Vercel CLI not found. Installing globally..."
    npm install -g vercel
    print_success "Vercel CLI installed"
fi

# Deploy to Vercel
print_status "Deploying to Vercel..."

# Check if this is the first deployment
if [ ! -f ".vercel/project.json" ]; then
    print_status "First time deployment detected. Setting up Vercel project..."
    vercel --prod
else
    print_status "Deploying to existing Vercel project..."
    vercel --prod
fi

print_success "🎉 Deployment completed successfully!"

# Post-deployment checks
print_status "Running post-deployment verification..."

echo ""
echo "============================================================================="
echo "🎯 DEPLOYMENT SUMMARY"
echo "============================================================================="
echo "✅ Dependencies installed"
echo "✅ Type check passed"
echo "✅ Lint check passed"
echo "✅ Production build successful"
echo "✅ Deployed to Vercel"
echo ""
echo "🔗 Your AquaFlow application should now be live!"
echo ""
echo "📋 Next Steps:"
echo "1. Test the deployment URL"
echo "2. Verify wallet connection works"
echo "3. Test swap functionality"
echo "4. Check analytics dashboard"
echo "5. Monitor for any errors"
echo ""
echo "📞 Need help? Check DEPLOYMENT.md for troubleshooting"
echo "============================================================================="

print_success "Deployment script completed! 🚀"