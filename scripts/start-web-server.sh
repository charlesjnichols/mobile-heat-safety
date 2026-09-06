#!/bin/bash

echo "🚀 Starting Mobile Heat Safety Tracker Web Development Server"
echo "=============================================================="

# Check if dist directory exists
if [ ! -d "dist" ]; then
    echo "❌ Build directory not found. Building the app first..."
    npm run build:web
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