import React, { useEffect, useState } from 'react'
import { StatusBar, StyleSheet, Text, View, Platform } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import AppNavigator from './components/navigation/AppNavigator'
import AuthView from './components/views/AuthView'
import { AppProvider } from './context/AppContext'
import { registerServiceWorker } from './utils/serviceWorker'
import { useNetworkStatus } from './hooks/useNetworkStatus'
import { ErrorBoundary } from './utils/errorHandling'
import { PALETTE } from './utils/outdoorColors'
import { readLastAuthUser, readSession, isSessionExpired, clearSession } from './auth/session'
import { getUserPool, refreshSession } from './auth/cognito'
import { writeSession } from './auth/session'
import { drain } from './sync/engine'
import { CognitoUser } from 'amazon-cognito-identity-js'

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

// Cognito throws with a `name` like "NotAuthorizedException" when the refresh
// token is invalid or revoked — the only case where a stuck session is a real
// sign-out. Any other error (network, etc.) is transient and must not log the
// user out.
const isInvalidTokenError = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) {
    return false
  }
  const name = (error as { name?: unknown }).name
  return name === 'NotAuthorizedException'
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
      // Expired: attempt refresh only when online; otherwise stay usable offline.
      if (isOnline) {
        const pool = getUserPool()
        if (pool) {
          try {
            const user = new CognitoUser({ Username: username, Pool: pool })
            const refreshed = await refreshSession(user, session.refreshToken)
            writeSession(username, refreshed)
            setAuthenticated(true)
            return
          } catch (error) {
            // Only a genuine invalid-token/expired-refresh error is a real
            // sign-out. A transient network failure must not wipe the cached
            // session (and its refresh token), which would force a fresh login.
            if (isInvalidTokenError(error)) {
              clearSession(username)
              setAuthenticated(false)
              return
            }
            console.error('Session refresh failed:', error)
          }
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
      <GestureHandlerRootView style={styles.root}>
        <AppProvider>
          <StatusBar barStyle="dark-content" backgroundColor={PALETTE.WHITE} translucent={false} />
          {authenticated ? (
            <View style={styles.root}>
              <OfflineBanner />
              <AppNavigator />
            </View>
          ) : (
            <AuthView onAuthenticated={() => setAuthenticated(true)} />
          )}
        </AppProvider>
      </GestureHandlerRootView>
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
