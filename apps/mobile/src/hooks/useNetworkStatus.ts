import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

const readOnline = (): boolean => {
  if (Platform.OS !== 'web' || typeof navigator === 'undefined') {
    return true;
  }
  return navigator.onLine;
};

/**
 * Tracks the browser's online/offline connectivity state.
 *
 * Falls back to `true` on native platforms where offline connectivity is not
 * mediated by the browser. The returned value is only a hint for the current
 * availability of the network — it never gates data persistence, which is
 * always local (FR-004 / FR-008).
 */
export const useNetworkStatus = (): boolean => {
  const [isOnline, setIsOnline] = useState<boolean>(readOnline);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') {
      return;
    }

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};
