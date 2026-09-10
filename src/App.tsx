import React, { useEffect } from 'react'
import { StatusBar, StyleSheet, Text, View, Platform } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import AppNavigator from './components/navigation/AppNavigator'
import { AppProvider } from './context/AppContext'
import { registerServiceWorker } from './utils/serviceWorker'
import { useNetworkStatus } from './hooks/useNetworkStatus'
import { ErrorBoundary } from './utils/errorHandling'
import { PALETTE } from './utils/outdoorColors'

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
  useEffect(() => {
    // Allow whole-page scrolling on web (dev + prod, independent of the
    // build-time index.html). Service worker registration (web only; no-op
    // elsewhere).
    injectWebScrollReset()
    registerServiceWorker()
  }, [])

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={styles.root}>
        <AppProvider>
          <StatusBar barStyle="dark-content" backgroundColor={PALETTE.WHITE} translucent={false} />
          <View style={styles.root}>
            <OfflineBanner />
            <AppNavigator />
          </View>
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
