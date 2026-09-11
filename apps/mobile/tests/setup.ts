// Provide an in-memory IndexedDB for Dexie-backed tests (Node test env has none).
import 'fake-indexeddb/auto'

// Provide an in-memory localStorage for auth/session tests (Node test env has none).
const createStorage = (): Storage => {
  let store: Record<string, string> = {}
  return {
    get length() {
      return Object.keys(store).length
    },
    clear: () => {
      store = {}
    },
    getItem: (key: string) => store[key] ?? null,
    key: (index: number) => Object.keys(store)[index] ?? null,
    removeItem: (key: string) => {
      delete store[key]
    },
    setItem: (key: string, value: string) => {
      store[key] = String(value)
    },
  }
}
if (typeof globalThis.localStorage === 'undefined') {
  Object.defineProperty(globalThis, 'localStorage', {
    value: createStorage(),
    writable: true,
  })
}

// Provide an in-memory sessionStorage for auth/session tests (Node test env has
// none). Sessions are kept in sessionStorage so credentials do not persist to
// durable storage between program runs.
if (typeof globalThis.sessionStorage === 'undefined') {
  Object.defineProperty(globalThis, 'sessionStorage', {
    value: createStorage(),
    writable: true,
  })
}

// Mock AsyncStorage
const mockAsyncStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// Mock React Native modules
jest.mock('react-native-reanimated', () => {
  const real = jest.requireActual('react-native-reanimated');
  return {
    ...real,
    useSharedValue: jest.fn(() => 0),
    useAnimatedStyle: jest.fn(() => ({})),
    withTiming: jest.fn((value) => value),
    withSpring: jest.fn((value) => value),
  };
});



// Mock document picker
jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn(() => Promise.resolve({ assets: [] })),
}));

// Mock sharing
jest.mock('expo-sharing', () => ({
  shareAsync: jest.fn(() => Promise.resolve()),
}));

// Mock vector icons
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  const createIcon = (displayName: string) => {
    const Icon = (props: Record<string, unknown> & { name?: string }) =>
      React.createElement(Text, props, props?.name ?? displayName);
    Icon.displayName = displayName;
    Icon.glyphMap = {};
    return Icon;
  };
  return {
    Ionicons: createIcon('Ionicons'),
    MaterialIcons: createIcon('MaterialIcons'),
    MaterialCommunityIcons: createIcon('MaterialCommunityIcons'),
    FontAwesome: createIcon('FontAwesome'),
  };
});

// Set up test environment variables
process.env.EXPO_PUBLIC_API_URL = 'http://localhost:3000';

// Mock navigation
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockDispatch = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(() => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
    dispatch: mockDispatch,
  })),
  useRoute: () => ({
    params: {},
  }),
}));

// Mock gesture handler
jest.mock('react-native-gesture-handler', () => ({
  PanGestureHandler: ({ children }: any) => children,
  TapGestureHandler: ({ children }: any) => children,
  Swipeable: ({ children }: any) => children,
}));

// Mock safe area context
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  SafeAreaView: ({ children }: any) => children,
}));

// Mock screens
jest.mock('react-native-screens', () => ({
  useSafeAreaFrame: () => ({ width: 375, height: 812 }),
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

// Silence console errors during tests
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  jest.restoreAllMocks();
});

// Clear the shared Dexie database before each test so the AsyncStorage-seeded
// migration (and AppContext load) starts from an empty IndexedDB each time.
beforeEach(async () => {
  const { db } = require('../src/db/database') as {
    db: {
      delete: () => Promise<void>;
      teams: { clear: () => Promise<void> };
      practices: { clear: () => Promise<void> };
      syncQueue: { clear: () => Promise<void> };
    };
  };
  await db.teams.clear();
  await db.practices.clear();
  await db.syncQueue.clear();
});

// Custom matchers for mobile testing
expect.extend({
  toBeAccessible(received) {
    const pass = received && typeof received === 'object' && received.accessible !== false;
    return {
      pass,
      message: () => `Expected ${received} to be accessible`,
    };
  },

  toHaveMinTouchTarget(received, minSize = 44) {
    const pass = received &&
      typeof received === 'object' &&
      received.style &&
      ((received.style.height || 0) >= minSize || (received.style.minHeight || 0) >= minSize) &&
      ((received.style.width || 0) >= minSize || (received.style.minWidth || 0) >= minSize);

    return {
      pass,
      message: () => `Expected component to have minimum touch target size of ${minSize}x${minSize}px`,
    };
  },

  toHaveProp(received, prop: string, value?: unknown) {
    const props = received?.props ?? {};
    const hasProp = Object.prototype.hasOwnProperty.call(props, prop);
    const pass = value === undefined ? hasProp : hasProp && props[prop] === value;
    return {
      pass,
      message: () =>
        value === undefined
          ? `Expected component ${pass ? 'not ' : ''}to have prop "${prop}"`
          : `Expected component ${pass ? 'not ' : ''}to have prop "${prop}" with value ${JSON.stringify(value)}, got ${JSON.stringify(props[prop])}`,
    };
  },

  toHaveStyle(received, expectedStyle: Record<string, unknown>) {
    const flatten = (style: unknown): Record<string, unknown>[] => {
      if (!style) return [];
      if (Array.isArray(style)) return style.flatMap(flatten);
      if (typeof style === 'object') return [style as Record<string, unknown>];
      return [];
    };
    const flatStyles = flatten(received?.props?.style);
    const pass = Object.entries(expectedStyle).every(([key, val]) =>
      flatStyles.some(s => s[key] === val)
    );
    return {
      pass,
      message: () =>
        `Expected component ${pass ? 'not ' : ''}to have style ${JSON.stringify(expectedStyle)}, got ${JSON.stringify(flatStyles)}`,
    };
  },

  toHaveAccessibilityLabel(received, label: string) {
    const actual = received?.props?.accessibilityLabel;
    const pass = label === undefined ? actual !== undefined : actual === label;
    return {
      pass,
      message: () =>
        `Expected component ${pass ? 'not ' : ''}to have accessibilityLabel "${label}", got "${actual}"`,
    };
  },

  toHaveTextContent(received, expected: string) {
    const extractText = (node: unknown): string => {
      if (node === null || node === undefined || typeof node === 'boolean') return '';
      if (typeof node === 'string' || typeof node === 'number') return String(node);
      if (Array.isArray(node)) return node.map(extractText).join('');
      if (typeof node === 'object') {
        const children = (node as { props?: { children?: unknown } }).props?.children;
        return extractText(children);
      }
      return '';
    };
    const actual = extractText(received);
    const pass = actual.includes(expected);
    return {
      pass,
      message: () =>
        `Expected component ${pass ? 'not ' : ''}to have text content "${expected}", got "${actual}"`,
    };
  },
});