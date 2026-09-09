#!/bin/bash
set -euo pipefail

echo "🚀 Starting Mobile Heat Safety Tracker Web Build/Server Prep"
echo "=============================================================="

# Check npm is available
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed."
    echo "Please install Node.js (which bundles npm) and retry."
    exit 1
fi

# Build the web app first (prepare-web-build)
echo "🔨 Building web app..."
if ! npm run build:web; then
    echo "❌ Web build failed. Aborting."
    exit 1
fi

echo "✅ Web build completed"

# Check dist directory exists
if [ ! -d "dist" ]; then
    echo "❌ Build directory not found after build."
    exit 1
fi

echo "✅ Build directory found"
echo "📁 Web app files are available in: ./dist"
echo ""
echo "🌐 To view the app, you can:"
echo "1. Open dist/index.html in your browser"
echo "2. Use a local server to serve the files:"
echo "   - Python: cd dist && python3 -m http.server 3000"
echo "   - Node.js: cd dist && npx serve"
echo "   - PHP: cd dist && php -S localhost:3000"
echo ""
echo "📱 App Features:"
echo "- ✅ Team practice tracking"
echo "- ✅ Heat safety monitoring"
echo "- ✅ Mobile-optimized interface"
echo "- ✅ High-contrast colors for outdoor use"
echo "- ✅ Haptic feedback support"
echo ""
echo "🔧 Development Commands:"
echo "- npm run dev:web    # Start development server"
echo "- npm run build:web  # Build for production"
echo "- npm run test      # Run tests"
echo ""
echo "📚 Documentation:"
echo "- docs/windows-development.md"
echo "- README-WINDOWS.md"
echo ""
echo "🎉 The Mobile Heat Safety Tracker is ready!"