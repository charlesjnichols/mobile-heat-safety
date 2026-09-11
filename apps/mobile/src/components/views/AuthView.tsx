import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PALETTE } from '../../utils/outdoorColors';
import { login } from '../../auth/hostedAuth';
import { isCognitoConfigured, isHostedUiConfigured } from '../../auth/config';

interface AuthViewProps {
  onAuthenticated: () => void;
}

// Single-action sign-in: the app redirects to the Cognito hosted UI where
// coaches can use Google, Facebook, Amazon, Apple, or native email/password.
// No credentials are collected inside the app. When the hosted UI is not
// configured the app runs fully offline (no auth, no sync).
const AuthView = ({ onAuthenticated }: AuthViewProps) => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setBusy(true);
    setError(null);
    try {
      await login();
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : 'Sign in failed. Please try again.'
      );
    } finally {
      setBusy(false);
    }
  };

  if (!isHostedUiConfigured()) {
    const cloudSyncAvailable = isCognitoConfigured();
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.container}>
          <Text style={styles.title}>Offline Mode</Text>
          <Text style={styles.subtitle}>
            {cloudSyncAvailable
              ? 'Cloud sync is not fully configured. You can continue using the app fully offline.'
              : 'Cloud sync is not configured. You can continue using the app fully offline.'}
          </Text>
          <TouchableOpacity style={styles.button} onPress={onAuthenticated} accessible={true} accessibilityRole="button">
            <Text style={styles.buttonText}>Continue Offline</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <Text style={styles.title}>Heat Safety Tracker</Text>
        <Text style={styles.subtitle}>
          Sign in to sync your data across devices. Use your Google, Facebook,
          Amazon, or Apple account, or email sign-in on the next screen.
        </Text>

        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity
          style={styles.button}
          onPress={handleSignIn}
          disabled={busy}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Sign In"
        >
          {busy ? (
            <ActivityIndicator color={PALETTE.WHITE} />
          ) : (
            <Text style={styles.buttonText}>Sign In</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: PALETTE.BLUE_600,
    borderRadius: 8,
    justifyContent: 'center',
    marginTop: 16,
    minHeight: 48,
    paddingHorizontal: 16,
  },
  buttonText: {
    color: PALETTE.WHITE,
    fontSize: 16,
    fontWeight: '600',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  error: {
    color: PALETTE.RED_BOOTSTRAP,
    fontSize: 14,
    marginTop: 12,
  },
  safeArea: {
    backgroundColor: PALETTE.GRAY_50,
    flex: 1,
  },
  subtitle: {
    color: PALETTE.TEXT_SECONDARY,
    fontSize: 15,
    marginTop: 8,
    textAlign: 'center',
  },
  title: {
    color: PALETTE.TEXT_DEFAULT,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default AuthView;
