#!/bin/bash
set -euo pipefail

# Windows Development Setup Script
# This script helps set up the development environment for Windows users

echo "🚀 Setting up Mobile Heat Safety Tracker for Windows Development"
echo "=============================================================="

# Check if running on Windows (MSYS/Git Bash, Cygwin, or WSL)
if [[ -n "${MSYSTEM:-}" ]]; then
    ENV_NAME="MSYS (Git Bash)"
elif [[ -n "${WSL_DISTRO_NAME:-}" ]]; then
    ENV_NAME="WSL"
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" || "$OSTYPE" == "cygwin" ]]; then
    ENV_NAME="$OSTYPE"
else
    echo "❌ This script is designed for Windows/WSL environment."
    echo "Please run this on Windows or in WSL."
    exit 1
fi

echo "✅ $ENV_NAME environment detected"

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

# Check Python installation (try python, python3, py)
PYTHON_CMD=""
for candidate in python python3 py; do
    if command -v "$candidate" &> /dev/null; then
        PYTHON_CMD="$candidate"
        break
    fi
done

if [[ -z "$PYTHON_CMD" ]]; then
    echo "❌ Python is not installed."
    echo "Please download and install Python from https://python.org/"
    echo "Make sure to check 'Add Python to PATH' during installation."
    exit 1
fi

PYTHON_VERSION=$("$PYTHON_CMD" --version 2>&1)
echo "✅ $PYTHON_VERSION installed"

# Install global dependencies
echo "📦 Installing global dependencies..."
npm install -g @expo/cli
npm install -g react-native-cli
npm install -g detox-cli
npm install -g jest-expo
npm install -g react-devtools

for pkg in @expo/cli react-native-cli detox-cli jest-expo react-devtools; do
    if ! command -v "$pkg" &> /dev/null; then
        echo "❌ Failed to install global dependency: $pkg"
        echo "Check npm registry access and retry."
        exit 1
    fi
done

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

# Derive Android SDK location from env or default, and write local.properties
ANDROID_SDK="${ANDROID_SDK_ROOT:-${ANDROID_HOME:-$HOME/AppData/Local/Android/Sdk}}"
if [ ! -f "android/local.properties" ]; then
    cat > android/local.properties << EOF
sdk.dir=$ANDROID_SDK
EOF
    echo "✅ Created android/local.properties (sdk.dir=$ANDROID_SDK)"
fi

# Run initial validation
echo "🔍 Running initial validation..."
LINT_EXIT=0
TYPE_CHECK_EXIT=0
npm run lint || LINT_EXIT=$?
npm run typecheck || TYPE_CHECK_EXIT=$?

if [ $LINT_EXIT -ne 0 ] || [ $TYPE_CHECK_EXIT -ne 0 ]; then
    echo "⚠️  Some issues found. Please fix them before proceeding."
    echo "Run 'npm run lint:fix' to automatically fix linting issues."
fi

echo "✅ Initial validation completed"

# Generate development documentation
echo "📚 Generating development documentation..."
if ! npm run docs:generate; then
    echo "❌ Failed to generate documentation."
    exit 1
fi

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
echo "- npm run test       # Run tests"
echo "- npm run lint       # Run linting"
echo "- npm run typecheck  # Run TypeScript checking"
echo ""
echo "For more information, see docs/windows-development.md"