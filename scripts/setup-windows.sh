#!/bin/bash

# Windows Development Setup Script
# This script helps set up the development environment for Windows users

echo "🚀 Setting up Mobile Heat Safety Tracker for Windows Development"
echo "=============================================================="

# Check if running on Windows
if [[ "$OSTYPE" != "msys" && "$OSTYPE" != "win32" ]]; then
    echo "❌ This script is designed for Windows/WSL environment."
    echo "Please run this on Windows or in WSL."
    exit 1
fi

echo "✅ Windows/WSL environment detected"

# Check Node.js installation
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed."
    echo "Please download and install Node.js from https://nodejs.org/"
    echo "Make sure to check 'Add to PATH' during installation."
    exit 1
fi

NODE_VERSION=$(node --version)
echo "✅ Node.js $NODE_VERSION installed"

# Check npm installation
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed."
    echo "Please install npm by installing Node.js."
    exit 1
fi

NPM_VERSION=$(npm --version)
echo "✅ npm $NPM_VERSION installed"

# Check Python installation
if ! command -v python &> /dev/null; then
    echo "❌ Python is not installed."
    echo "Please download and install Python from https://python.org/"
    echo "Make sure to check 'Add Python to PATH' during installation."
    exit 1
fi

PYTHON_VERSION=$(python --version)
echo "✅ $PYTHON_VERSION installed"

# Install global dependencies
echo "📦 Installing global dependencies..."
npm install -g @expo/cli
npm install -g react-native-cli
npm install -g detox-cli
npm install -g jest-expo
npm install -g react-devtools

echo "✅ Global dependencies installed"

# Install project dependencies
echo "📦 Installing project dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install project dependencies."
    echo "Please check your internet connection and try again."
    exit 1
fi

echo "✅ Project dependencies installed"

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p android/app/src/main/assets
mkdir -p ios
mkdir -p dist
mkdir -p coverage

echo "✅ Directories created"

# Set up environment files
echo "🔧 Setting up environment files..."
if [ ! -f ".env" ]; then
    cat > .env << EOF
# Environment variables for development
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_DEBUG=true
EXPO_PUBLIC_VERSION=1.0.0
EOF
    echo "✅ Created .env file"
fi

if [ ! -f "android/local.properties" ]; then
    cat > android/local.properties << EOF
sdk.dir=$HOME/AppData/Local/Android/Sdk
EOF
    echo "✅ Created android/local.properties"
fi

# Run initial validation
echo "🔍 Running initial validation..."
npm run lint
npm run typecheck

if [ $? -ne 0 ]; then
    echo "⚠️  Some issues found. Please fix them before proceeding."
    echo "Run 'npm run lint:fix' to automatically fix linting issues."
fi

echo "✅ Initial validation completed"

# Generate development documentation
echo "📚 Generating development documentation..."
npm run docs:generate

echo "✅ Documentation generated"

# Display next steps
echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Review the documentation in docs/windows-development.md"
echo "2. Set up Android Studio and SDK (if doing Android development)"
echo "3. Set up Xcode (if doing iOS development on macOS)"
echo "4. Run 'npm start' to begin development"
echo "5. Scan the QR code with Expo Go app on your device"
echo ""
echo "Development commands:"
echo "- npm start          # Start development server"
echo "- npm run android    # Start Android development"
echo "- npm run ios        # Start iOS development (macOS only)"
echo "- npm test           # Run tests"
echo "- npm run lint       # Run linting"
echo "- npm run typecheck  # Run TypeScript checking"
echo ""
echo "For more information, see docs/windows-development.md"