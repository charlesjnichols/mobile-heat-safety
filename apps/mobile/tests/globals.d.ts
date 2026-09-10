// Custom jest matcher type declarations for mobile testing utilities
// Matchers are implemented in tests/setup.ts

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeAccessible(): R;
      toHaveMinTouchTarget(minSize?: number): R;
      toHaveProp(prop: string, value?: unknown): R;
      toHaveStyle(expectedStyle: Record<string, unknown>): R;
      toHaveAccessibilityLabel(label: string): R;
      toHaveTextContent(expected: string): R;
    }
  }
}

export {};
