import { Config } from 'detox';

const config: Config = {
  testRunner: 'jest',
  runnerConfig: 'e2e/jest.config.js',
  specs: ['e2e'],
  devices: {
    simulator: {
      type: 'ios.simulator',
      device: {
        name: process.env.DETOX_IOS_DEVICE_NAME || 'iPhone 14',
        os: process.env.DETOX_IOS_OS || 'iOS 16.4',
      },
    },
    android: {
      type: 'android.emulator',
      device: {
        name: process.env.DETOX_ANDROID_DEVICE_NAME || 'Pixel_4_API_30',
        os: process.env.DETOX_ANDROID_OS || 'Android 12.0',
      },
    },
  },
  configurations: {
    ios: {
      device: 'simulator',
      app: process.env.DETOX_IOS_APP ||
        'ios/build/Build/Products/Debug-iphonesimulator/MobileHeatSafetyTracker.app',
    },
    android: {
      device: 'android',
      app: process.env.DETOX_ANDROID_APP ||
        'android/app/build/outputs/apk/debug/app-debug.apk',
    },
  },
};

export default config;