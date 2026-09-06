# Mobile Heat Safety Tracker

A cross-platform mobile-native React Native application for recording heat safety checklists during sports practices. Built with Expo SDK 50+ and TypeScript.

## 🎯 Features

- **Real-time Heat Index Calculation**: Uses NWS polynomial formula for accurate heat index calculations
- **Team Practice Tracking**: Organize practices by teams with filtering and sorting
- **Mobile-First Design**: Optimized for field use with large touch targets and outdoor visibility
- **High-Contrast Interface**: Color-coded heat risk indicators for bright outdoor conditions
- **Local Data Persistence**: AsyncStorage for offline data storage
- **Haptic Feedback**: Enhanced user experience with tactile feedback
- **Accessibility Support**: Full VoiceOver/TalkBack support
- **Export/Import**: Data export for compliance and record-keeping

## 📱 Platforms

- ✅ **iOS** (iPhone, iPad)
- ✅ **Android** (Phones, Tablets)
- ✅ **Web** (Progressive Web App)
- ✅ **Windows** (Optional)

## 🛠️ Prerequisites

### Windows Development Requirements

1. **Node.js** 18.x or higher (LTS version)
2. **Python** 3.8 or higher
3. **Java Development Kit (JDK)** 17
4. **Android Studio** (for Android development)
5. **Visual Studio** (for Windows builds - "Desktop development with C++" workload)

### Environment Variables (Windows)

Set these in Windows Environment Variables:

```batch
JAVA_HOME=C:\Program Files\Java\jdk-17
ANDROID_HOME=C:\Users\YourUser\AppData\Local\Android\Sdk
ANDROID_SDK_ROOT=C:\Users\YourUser\AppData\Local\Android\Sdk
PATH=%PATH%;%JAVA_HOME%\bin;%ANDROID_HOME%\tools;%ANDROID_HOME%\platform-tools
```

## 🚀 Quick Start

### 1. Clone and Setup

```bash
# Clone the repository
git clone https://github.com/your-username/mobile-heat-safety-tracker.git
cd mobile-heat-safety-tracker

# Run Windows setup script
chmod +x scripts/setup-windows.sh
./scripts/setup-windows.sh

# Or manually install dependencies
npm install
```

### 2. Start Development

```bash
# Start development server
npm start

# Or for specific platforms
npm run android    # Android development
npm run ios        # iOS development (macOS only)
npm run web        # Web development
npm run windows    # Windows development (optional)
```

### 3. Run on Device

1. **Mobile Device**: Scan the QR code with Expo Go app
2. **Android Emulator**: Press `a` in the terminal
3. **iOS Simulator**: Press `i` in the terminal (macOS only)

## 📋 Development Workflow

### Available Scripts

```bash
# Development
npm start                    # Start development server
npm run dev                  # Alternative start command
npm run dev:android          # Start Android development
npm run dev:ios              # Start iOS development
npm run dev:web              # Start web development
npm run dev:windows          # Start Windows development

# Testing
npm test                    # Run tests once
npm run test:watch          # Run tests in watch mode
npm run test:coverage       # Run tests with coverage
npm run test:component      # Run component tests only
npm run test:e2e            # Run E2E tests with Detox
npm run test:e2e:android    # Run E2E tests on Android
npm run test:e2e:ios        # Run E2E tests on iOS

# Code Quality
npm run lint                 # Run ESLint
npm run lint:fix             # Fix ESLint issues
npm run typecheck            # Run TypeScript checking
npm run validate             # Run all quality checks

# Building
npm run build                # Build for all platforms
npm run build:android        # Build Android APK
npm run build:ios            # Build iOS IPA (macOS only)
npm run build:web            # Build for web
npm run build:windows        # Build for Windows

# Utility
npm run clean                # Clean and reinstall dependencies
npm run format               # Format code with Prettier
npm run setup                # Initial project setup
```

### Hot Reloading

- **Reload**: Press `r` in terminal or shake device
- **Developer Menu**: Press `d` in terminal or shake device
- **Element Inspector**: Press `w` in terminal (web only)

## 🧪 Testing

### Unit Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- tests/unit/team-filter.test.ts
```

### E2E Testing with Detox

```bash
# Build test app
npm run build:android

# Run E2E tests
npm run test:e2e

# Run on specific platform
npm run test:e2e:android
npm run test:e2e:ios
```

### Component Testing

```bash
# Run component tests
npm run test:component

# Run specific component test
npm test -- tests/component/main-view.test.tsx
```

## 🏗️ Project Structure

```
mobile-heat-safety-tracker/
├── src/
│   ├── components/           # React components
│   │   ├── common/           # Reusable components
│   │   ├── views/           # Screen components
│   │   └── forms/          # Form components
│   ├── context/             # React Context providers
│   ├── utils/               # Utility functions
│   │   ├── practiceFilter.ts    # Practice filtering logic
│   │   ├── heatIndex.ts         # Heat index calculations
│   │   ├── storage.ts           # AsyncStorage utilities
│   │   ├── mobileDate.ts        # Mobile date utilities
│   │   ├── hapticFeedback.ts     # Haptic feedback utilities
│   │   └── outdoorColors.ts     # High-contrast colors
│   ├── types/               # TypeScript type definitions
│   └── assets/              # Static assets
├── tests/                   # Test files
│   ├── unit/               # Unit tests
│   ├── integration/        # Integration tests
│   ├── component/          # Component tests
│   └── e2e/               # E2E tests
├── docs/                   # Documentation
├── scripts/               # Utility scripts
├── android/               # Android native files
├── ios/                  # iOS native files
└── windows/              # Windows native files
```

## 🎨 Styling

The app uses:
- **NativeWind** for Tailwind CSS styling
- **High-contrast colors** for outdoor visibility
- **Large touch targets** (44x44+ points) for mobile accessibility
- **Custom color scheme** optimized for bright conditions

### Custom Color System

```typescript
import { OUTDOOR_COLORS, HEAT_INDEX_COLORS } from '@/utils/outdoorColors';

// High-contrast colors for outdoor use
const colors = OUTDOOR_COLORS;

// Heat index risk colors
const heatColors = HEAT_INDEX_COLORS;
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file for environment-specific configuration:

```env
EXPO_PUBLIC_API_URL=https://api.example.com
EXPO_PUBLIC_DEBUG=true
EXPO_PUBLIC_VERSION=1.0.0
```

### App Configuration

Update `app.json` for app-specific settings:

```json
{
  "expo": {
    "name": "Mobile Heat Safety Tracker",
    "slug": "heat-safety-tracker",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    }
  }
}
```

## 🚀 Building for Production

### Android

```bash
# Build APK
npm run build:android

# Build App Bundle (recommended)
eas build --platform android --profile production
```

### iOS (macOS only)

```bash
# Build IPA
npm run build:ios

# Upload to App Store Connect
eas build --platform ios --profile production
```

### Web

```bash
# Build for web
npm run build:web

# Serve the build
npx serve dist -p 3000
```

### Windows

```bash
# Build for Windows
npm run build:windows
```

## 📱 Deployment

### Expo EAS Build

1. **Configure EAS**:
   ```bash
   eas login
   eas build:configure
   ```

2. **Build and Deploy**:
   ```bash
   eas build --platform all --profile production
   eas submit --platform all
   ```

### Manual Deployment

1. **Android**: Upload APK to Google Play Console
2. **iOS**: Upload IPA to App Store Connect
3. **Web**: Deploy to Vercel, Netlify, or static hosting

## 🔍 Troubleshooting

### Common Issues

#### Windows/WSL Issues

1. **Command not found**:
   ```bash
   # Install missing global dependencies
   npm install -g @expo/cli react-native-cli detox-cli
   ```

2. **Android SDK not found**:
   - Set `ANDROID_HOME` environment variable
   - Install Android Studio with Android SDK

3. **Java not found**:
   - Install JDK 17
   - Set `JAVA_HOME` environment variable

#### Build Issues

1. **Metro bundler fails**:
   ```bash
   npm start --clear
   ```

2. **Port conflicts**:
   ```bash
   # Use alternative ports
   npm start --port 8081
   ```

3. **Certificate issues**:
   ```bash
   # Generate new debug keystore
   keytool -genkeypair -keystore ~/.android/debug.keystore -alias androiddebugkey
   ```

### Getting Help

1. **Check documentation**: See `docs/windows-development.md`
2. **Search issues**: Check existing GitHub issues
3. **Create issue**: Include:
   - Windows version
   - Node.js/npm versions
   - Error messages
   - Steps to reproduce

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

### Development Guidelines

- Follow TypeScript best practices
- Use existing components and utilities
- Write tests for new features
- Update documentation as needed
- Ensure mobile accessibility compliance

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [Expo](https://expo.dev/) for the React Native development platform
- [NWS](https://www.weather.gov/) for heat index calculation formulas
- [React Native](https://reactnative.dev/) for cross-platform mobile development
- [Tailwind CSS](https://tailwindcss.com/) for utility-first styling

---

**For detailed Windows development setup, see [docs/windows-development.md](docs/windows-development.md)**