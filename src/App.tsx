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

export default function App() {
  useEffect(() => {
    // PWA service worker registration (web only; no-op elsewhere).
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
