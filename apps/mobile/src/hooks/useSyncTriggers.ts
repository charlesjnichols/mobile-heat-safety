import { useEffect, useRef } from 'react'
import { AppState, Platform } from 'react-native'
import { hasPendingWork } from '../sync/queue'
import { drain } from '../sync/engine'
import { syncTriggerController } from '../sync/trigger'
import { useNetworkStatus } from './useNetworkStatus'

/**
 * Owns the WHEN of sync drain (feature 016): starts the trigger controller at
 * mount, feeds it connectivity changes (restoration drains immediately; a
 * repeated "online" hint does not — that is the flap behavior this replaces),
 * keeps the periodic tick only while the app is active, and stops everything
 * on unmount. The engine's internal guard remains the single overlap
 * protection.
 */
export const useSyncTriggers = (): void => {
  const isOnline = useNetworkStatus()
  const isOnlineRef = useRef(isOnline)
  isOnlineRef.current = isOnline

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') {
      // Visibility lifecycle is web-only; native uses AppState so the periodic
      // tick pauses while the app is backgrounded.
      syncTriggerController.start({ drain, isOnline: true, hasPending: hasPendingWork })
      const handleAppState = (nextState: string): void => {
        syncTriggerController.setActive(nextState === 'active')
      }
      const subscription = AppState.addEventListener('change', handleAppState)
      return () => {
        subscription.remove()
        syncTriggerController.stop()
      }
    }
    const startOnline = isOnlineRef.current
    syncTriggerController.start({
      drain,
      isOnline: startOnline,
      hasPending: hasPendingWork,
    })
    syncTriggerController.setActive(document.visibilityState === 'visible')
    const handleVisibility = () => {
      syncTriggerController.setActive(document.visibilityState === 'visible')
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      syncTriggerController.stop()
    }
  }, [])

  useEffect(() => {
    syncTriggerController.setConnectivity(isOnline)
  }, [isOnline])
}
