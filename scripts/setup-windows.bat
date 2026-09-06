@echo off
echo 🚀 Setting up Mobile Heat Safety Tracker for Windows Development
echo ===============================================================

:: Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed.
    echo Please download and install Node.js from https://nodejs.org/
    echo Make sure to check 'Add to PATH' during installation.
    pause
    exit /b 1
)

echo ✅ Node.js is installed

:: Check npm installation
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed.
    echo Please install npm by installing Node.js.
    pause
    exit /b 1
)

echo ✅ npm is installed

:: Check Python installation
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python is not installed.
    echo Please download and install Python from https://python.org/
    echo Make sure to check 'Add Python to PATH' during installation.
    pause
    exit /b 1
)

echo ✅ Python is installed

:: Install global dependencies
echo 📦 Installing global dependencies...
npm install -g @expo/cli
npm install -g react-native-cli
npm install -g detox-cli
npm install -g jest-expo
npm install -g react-devtools

if %errorlevel% neq 0 (
    echo ❌ Failed to install global dependencies.
    pause
    exit /b 1
)

echo ✅ Global dependencies installed

:: Install project dependencies
echo 📦 Installing project dependencies...
npm install

if %errorlevel% neq 0 (
    echo ❌ Failed to install project dependencies.
    echo Please check your internet connection and try again.
    pause
    exit /b 1
)

echo ✅ Project dependencies installed

:: Create necessary directories
echo 📁 Creating necessary directories...
if not exist "android\app\src\main\assets" mkdir "android\app\src\main\assets"
if not exist "ios" mkdir "ios"
if not exist "dist" mkdir "dist"
if not exist "coverage" mkdir "coverage"

echo ✅ Directories created

:: Set up environment files
echo 🔧 Setting up environment files...

if not exist ".env" (
    echo EXPO_PUBLIC_API_URL=http://localhost:3000 > .env
    echo EXPO_PUBLIC_DEBUG=true >> .env
    echo EXPO_PUBLIC_VERSION=1.0.0 >> .env
    echo ✅ Created .env file
)

if not exist "android\local.properties" (
    echo sdk.dir=%USERPROFILE%\AppData\Local\Android\Sdk > android\local.properties
    echo ✅ Created android\local.properties
)

:: Run initial validation
echo 🔍 Running initial validation...
npm run lint
if %errorlevel% neq 0 (
    echo ⚠️  Linting issues found. Run 'npm run lint:fix' to fix them.
)

npm run typecheck
if %errorlevel% neq 0 (
    echo ⚠️  TypeScript issues found. Please fix them.
)

echo ✅ Initial validation completed

:: Display success message
echo.
echo 🎉 Setup completed successfully!
echo.
echo Next steps:
echo 1. Review the documentation in docs/windows-development.md
echo 2. Set up Android Studio and SDK (if doing Android development)
echo 3. Set up Xcode (if doing iOS development on macOS)
echo 4. Run 'npm start' to begin development
echo 5. Scan the QR code with Expo Go app on your device
echo.
echo Development commands:
echo - npm start          # Start development server
echo - npm run android    # Start Android development
echo - npm run ios        # Start iOS development (macOS only)
echo - npm test           # Run tests
echo - npm run lint       # Run linting
echo - npm run typecheck  # Run TypeScript checking
echo.
echo For more information, see docs/windows-development.md
echo.

:: Ask if user wants to start development
set /p startDev="Would you like to start the development server now? (y/n): "
if /i "%startDev%"=="y" (
    echo Starting development server...
    npm start
)

pause