# Windows Development Guide for Mobile Heat Safety Tracker

## Prerequisites

### Required Software for Windows Development

1. **Node.js and npm**
   - Download from: https://nodejs.org/
   - Version: 18.x or higher (LTS version recommended)
   - Verify installation: `node --version` and `npm --version`

2. **Python**
   - Download from: https://www.python.org/downloads/
   - Version: 3.8 or higher
   - Important: Check "Add Python to PATH" during installation

3. **Java Development Kit (JDK)**
   - Download from: https://adoptium.net/
   - Version: JDK 17 (LTS version recommended)
   - Set JAVA_HOME environment variable

4. **Android Studio**
   - Download from: https://developer.android.com/studio
   - Install with Android SDK
   - Set ANDROID_HOME environment variable

5. **Visual Studio (for Windows Build Tools)**
   - Install "Desktop development with C++" workload
   - Required for React Native Windows builds

6. **Git**
   - Download from: https://git-scm.com/
   - Install with default settings

### Environment Variables Setup

Create these environment variables in Windows (search for "Environment Variables" in Start menu):

```batch
# System Variables
JAVA_HOME=C:\Program Files\Java\jdk-17
ANDROID_HOME=C:\Users\YourUser\AppData\Local\Android\Sdk
ANDROID_SDK_ROOT=C:\Users\YourUser\AppData\Local\Android\Sdk
PATH=%PATH%;%JAVA_HOME%\bin;%ANDROID_HOME%\tools;%ANDROID_HOME%\platform-tools
```

## Expo CLI Installation

```bash
# Install Expo CLI globally
npm install -g @expo/cli

# Verify installation
expo --version
```

## Project Setup

### 1. Clone and Install Dependencies

```bash
# Navigate to your project directory
cd /path/to/your/project

# Install project dependencies
npm install

# Install additional development dependencies
npm install --save-dev @types/react-native @types/jest
```

### 2. iOS Development (macOS only)

**Note**: iOS development requires macOS. If you're on Windows, skip to Android development below.

```bash
# Install iOS dependencies (macOS only)
npm install -g ios-deploy

# Open iOS project in Xcode
npx expo start --ios
```

### 3. Android Development

```bash
# Install Android development dependencies
npm install -g react-native-cli

# Create Android debug keystore (if not exists)
keytool -genkeypair -v -keystore ~/.android/debug.keystore -alias androiddebugkey -keyalg RSA -keysize 2048 -validity 10000

# Build and run Android app
npx expo start --android
```

### 4. Windows Development (Optional)

```bash
# Install Windows dependencies
npm install -g react-native-windows-cli

# Build and run Windows app
npx expo start --windows
```

## Development Scripts

### Available Scripts

```bash
# Start development server
npm start

# Start for specific platforms
npm run android    # Android development
npm run ios        # iOS development (macOS only)
npm run web        # Web development

# Testing
npm test           # Run tests once
npm run test:watch # Run tests in watch mode
npm run test:coverage # Run tests with coverage

# Code quality
npm run lint       # Run ESLint
npm run lint:fix   # Fix ESLint issues
npm run typecheck  # Run TypeScript type checking

# Building
npm run build      # Build for all platforms
npm run build:android # Build Android APK
npm run build:ios  # Build iOS IPA (macOS only)

# E2E Testing
npm run test:e2e   # Run Detox tests
```

### Development Workflow

1. **Start Development Server**
   ```bash
   npm start
   ```

2. **Open on Device**
   - Scan the QR code with Expo Go app on your phone
   - Or press `a` for Android emulator
   - Or press `i` for iOS simulator (macOS only)

3. **Hot Reloading**
   - Press `r` for reload
   - Press `d` for developer menu
   - Press `w` to toggle element inspector

## Troubleshooting

### Common Issues

#### 1. "Command failed: spawn ENOENT"
```bash
# Solution: Add Python to PATH
# Download and install Python from https://python.org
# During installation, check "Add Python to PATH"
```

#### 2. "Android SDK not found"
```bash
# Solution: Set ANDROID_HOME environment variable
1. Open Environment Variables settings
2. Add ANDROID_HOME pointing to your Android SDK path
3. Add %ANDROID_HOME%\tools and %ANDROID_HOME%\platform-tools to PATH
```

#### 3. "JDK not found"
```bash
# Solution: Install JDK and set JAVA_HOME
1. Download JDK 17 from https://adoptium.net/
2. Set JAVA_HOME environment variable
3. Add %JAVA_HOME%\bin to PATH
```

#### 4. "Metro bundler fails to start"
```bash
# Solution: Clear cache and restart
npm start --clear
```

### Port Issues

If ports are already in use:

```bash
# Kill processes using common ports
netstat -ano | findstr :8080
taskkill /PID <PID> /F

# Or use alternative ports
npx expo start --port 8081
```

## Testing

### Unit Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run only component tests
npm run test:component
```

### E2E Testing with Detox

```bash
# Build test app
npm run build:android

# Run E2E tests
npm run test:e2e

# Run specific test file
npx detox test --path tests/e2e/your-test-file.test.js
```

## Building for Production

### Android Build

```bash
# Build APK
npm run build:android

# Build App Bundle (recommended for Play Store)
eas build --platform android --profile production
```

### iOS Build (macOS only)

```bash
# Build IPA
npm run build:ios

# Upload to App Store Connect
eas build --platform ios --profile production
```

### Web Build

```bash
# Build for web
npm run build:web

# Serve web build
npx serve dist -p 3000
```

## Performance Optimization

### Development Tips

1. **Use Fast Refresh**
   - Enabled by default in Expo
   - Press `Ctrl+R` for fast reload

2. **Enable Hermes Engine**
   ```javascript
   // app.json
   {
     "expo": {
       "jsEngine": "hermes"
     }
   }
   ```

3. **Optimize Image Loading**
   ```javascript
   // Use Image component with proper caching
   <Image
     source={require('./assets/image.png')}
     cachePolicy="memory-disk"
   />
   ```

### Debugging

1. **React DevTools**
   ```bash
   # Install React DevTools
   npm install -g react-devtools
   
   # Run DevTools
   react-devtools
   ```

2. **Console Logging**
   ```javascript
   // Use console.log with tags for easy filtering
   console.log('[HEAT SAFETY]', 'Practice data:', practiceData);
   
   // Use console.warn for warnings
   console.warn('[HEAT SAFETY]', 'High heat index detected:', heatIndex);
   ```

## Deployment

### Expo EAS Build

1. **Configure EAS**
   ```bash
   # Login to EAS
   eas login
   
   # Configure project
   eas build:configure
   ```

2. **Build and Deploy**
   ```bash
   # Build for production
   eas build --platform all --profile production
   
   # Submit to app stores
   eas submit --platform all
   ```

### Manual Deployment

1. **Android**
   - Generate APK: `npm run build:android`
   - Upload to Google Play Console

2. **iOS**
   - Generate IPA: `npm run build:ios`
   - Upload to App Store Connect

3. **Web**
   - Build: `npm run build:web`
   - Deploy to Vercel, Netlify, or web server

## Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [Detox Testing](https://github.com/wix/Detox)
- [React Native Windows](https://microsoft.github.io/react-native-windows/)
- [Android Developer Guide](https://developer.android.com/)
- [iOS Developer Guide](https://developer.apple.com/ios/)

## Support

If you encounter issues:
1. Check this guide first
2. Search existing issues in the project repository
3. Create a new issue with:
   - Windows version
   - Node.js version
   - Expo version
   - Error message and stack trace
   - Steps to reproduce