import React, { useEffect, useState } from 'react'
import { StatusBar, StyleSheet, Text, View, Platform } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import AppNavigator from './components/navigation/AppNavigator'
import AuthView from './components/views/AuthView'
import { AppProvider } from './context/AppContext'
import { registerServiceWorker } from './utils/serviceWorker'
import { useNetworkStatus } from './hooks/useNetworkStatus'
import { ErrorBoundary } from './utils/errorHandling'
import { PALETTE } from './utils/outdoorColors'
import {
  readLastAuthUser,
  readSession,
  isSessionExpired,
  clearSession,
  storeHostedTokens,
  refreshStoredSession,
} from './auth/session'
import { exchangeCodeForTokens } from './auth/hostedAuth'
import { isHostedUiConfigured } from './auth/config'
import { drain } from './sync/engine'

function OfflineBanner() {
  const isOnline = useNetworkStatus()

  if (Platform.OS !== 'web' || isOnline) {
    return null
  }

  return (
    <View style={styles.banner}>
      <Text style={styles.bannerText}>Offline — changes are saved on this device</Text>
    </View>
  )
}

// Expo's web reset disables body scrolling (for internal <ScrollView> layouts).
// Screens that intentionally render their content directly (whole-page scroll
// instead of a nested scroller) need the page itself to scroll. Override it for
// web only; native platforms are unaffected.
function injectWebScrollReset() {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return
  if (document.getElementById('web-scroll-reset')) return

  const style = document.createElement('style')
  style.id = 'web-scroll-reset'
  style.textContent =
    'body { overflow-y: auto; overflow-x: hidden; }'
  document.head.appendChild(style)
}

export default function App() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null)
  const isOnline = useNetworkStatus()

  useEffect(() => {
    // Allow whole-page scrolling on web (dev + prod, independent of the
    // build-time index.html). Service worker registration (web only; no-op
    // elsewhere).
    injectWebScrollReset()
    registerServiceWorker()
  }, [])

  // Complete the hosted-UI redirect when present: exchange ?code&state for
  // tokens, cache the session, and clean the address bar so the callback is not
  // re-processed. On failure the user stays signed out and can retry.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const url = new URL(window.location.href)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')
    if (!code || !state) return
    ;(async () => {
      try {
        const tokens = await exchangeCodeForTokens(code, state)
        storeHostedTokens(tokens)
      } catch {
        // State mismatch or failed exchange: leave the user signed out; the
        // AuthView offers retry. Clear any partially-cached session.
        const username = readLastAuthUser()
        if (username) {
          clearSession(username)
        }
      }
      // Strip the OAuth params so a refresh does not replay the exchange.
      url.searchParams.delete('code')
      url.searchParams.delete('state')
      window.history.replaceState(null, '', url.toString())
      setAuthenticated(Boolean(readLastAuthUser()))
    })()
  }, [])

  // Restore the cached session on init. Offline with an unexpired cache keeps
  // the user authenticated; offline with an expired cache keeps the app usable
  // (local data accessible) but defers sync.
  useEffect(() => {
    const restore = async () => {
      const username = readLastAuthUser()
      if (!username) {
        setAuthenticated(false)
        return
      }
      const session = readSession(username)
      if (!session) {
        setAuthenticated(false)
        return
      }
      if (!isSessionExpired(session)) {
        setAuthenticated(true)
        return
      }
      // Expired: refresh via the hosted-UI token endpoint only when online;
      // otherwise stay usable offline. A failed refresh (network error or
      // revoked token) must not wipe the cached session — offline use continues
      // and sync retries when connectivity returns.
      if (isOnline && isHostedUiConfigured()) {
        const refreshed = await refreshStoredSession()
        if (refreshed) {
          setAuthenticated(true)
          return
        }
      }
      setAuthenticated(true)
    }
    restore()
  }, [isOnline])

  // Drain the sync queue automatically when connectivity returns. The engine
  // guards against overlapping runs; failures are logged, not silently dropped.
  useEffect(() => {
    if (isOnline) {
      drain().catch(error => {
        console.error('Sync drain failed:', error)
      })
    }
  }, [isOnline])

  if (authenticated === null) {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="dark-content" backgroundColor={PALETTE.WHITE} translucent={false} />
      </View>
    )
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <GestureHandlerRootView style={styles.root}>
          <AppProvider>
          <StatusBar barStyle="dark-content" backgroundColor={PALETTE.WHITE} translucent={false} />
          {authenticated ? (
            <View style={styles.root}>
              <OfflineBanner />
              <AppNavigator
                onSignOut={() => {
                  const username = readLastAuthUser()
                  if (username) {
                    clearSession(username)
                  }
                  setAuthenticated(false)
                }}
              />
            </View>
          ) : (
            <AuthView onAuthenticated={() => setAuthenticated(true)} />
          )}
          </AppProvider>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </ErrorBoundary>
  )
}

const styles = StyleSheet.create({
  banner: {
    alignItems: 'center',
    backgroundColor: PALETTE.AMBER_600,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  bannerText: {
    color: PALETTE.WHITE,
    fontSize: 13,
    fontWeight: '500',
  },
  root: {
    flex: 1,
  },
})
