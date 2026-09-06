import { Detox, Config } from 'detox';

const config: Config = {
  testRunner: 'jest',
  runnerConfig: 'package.json',
  specs: ['e2e'],
  devices: {
    simulator: {
      type: 'ios.simulator',
      device: {
        name: 'iPhone 14',
        os: 'iOS 16.4',
      },
    },
    android: {
      type: 'android.emulator',
      device: {
        name: 'Pixel_4_API_30',
        os: 'Android 12.0',
      },
    },
  },
  configurations: {
    ios: {
      device: 'simulator',
      app: 'ios/build/Build/Products/Debug-iphonesimulator/MobileHeatSafetyTracker.app',
    },
    android: {
      device: 'android',
      app: 'android/app/build/outputs/apk/debug/app-debug.apk',
    },
  },
};

export default config;