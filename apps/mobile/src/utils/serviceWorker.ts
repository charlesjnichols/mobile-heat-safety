import { Platform } from 'react-native';

export const SW_PATH = 'sw.js';

export const isServiceWorkerSupported = (): boolean => {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    Platform.OS === 'web'
  );
};

export interface ServiceWorkerRegistrationOptions {
  /**
   * Called when a new service worker is found but is not yet active (waiting).
   * Useful for prompting the user to refresh to get the latest version (FR-006).
   */
  onUpdateFound?: () => void;
}

/**
 * Registers the PWA service worker for the web platform.
 *
 * - Feature-detects before registering and degrades gracefully (no-op) on
 *   browsers/devices without service worker support (FR-009).
 * - Calls `registration.update()` on load so the latest deployed version is
 *   picked up without a manual re-install (FR-006).
 */
export const registerServiceWorker = async (
  options: ServiceWorkerRegistrationOptions = {}
): Promise<void> => {
  if (!isServiceWorkerSupported()) {
    return;
  }

  const onUpdateFound = options.onUpdateFound;

  try {
    const registration = await navigator.serviceWorker.register(SW_PATH);

    // Check for an update on every load so fresh deployments propagate.
    registration.update().catch(() => {});

    if (onUpdateFound) {
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              onUpdateFound();
            }
          });
        }
      });
    }
  } catch (error) {
    // Never block app boot on service worker failure (graceful fallback).
    console.warn('Service worker registration failed:', error);
  }
};

/**
 * Tells an awaiting service worker to take control and skip the waiting phase
 * so the user gets the latest version on the next reload (FR-006).
 */
export const skipWaiting = (): void => {
  if (!isServiceWorkerSupported() || !navigator.serviceWorker.controller) {
    return;
  }
  navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
};
