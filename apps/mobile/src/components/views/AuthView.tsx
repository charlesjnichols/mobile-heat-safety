import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PALETTE } from '../../utils/outdoorColors';
import { signUp, confirmSignUp, signIn } from '../../auth/cognito';
import { writeSession } from '../../auth/session';
import { isCognitoConfigured } from '../../auth/config';

const BUTTON_LABELS: Record<'signin' | 'signup' | 'confirm', string> = {
  signin: 'Sign In',
  signup: 'Sign Up',
  confirm: 'Confirm',
};

type AuthMode = 'signin' | 'signup' | 'confirm';

// Basic client-side validation before any Cognito call, so users get immediate
// feedback instead of a round-trip to the provider.
const validate = (
  mode: AuthMode,
  email: string,
  password: string,
  code: string
): string | null => {
  if (!email.trim()) {
    return 'Email is required';
  }
  if (mode !== 'confirm') {
    if (!password) {
      return 'Password is required';
    }
    if (password.length < 8) {
      return 'Password must be at least 8 characters';
    }
  } else if (!code.trim()) {
    return 'Verification code is required';
  }
  return null;
};

// Map known Cognito error codes to human-readable text instead of surfacing raw
// provider messages (e.g. "InvalidParameterException: ...").
const friendlyErrorMessage = (err: unknown): string => {
  const name = (err as { name?: string })?.name;
  switch (name) {
    case 'UserNotFoundException':
      return 'No account found for that email';
    case 'NotAuthorizedException':
      return 'Incorrect email or password';
    case 'UsernameExistsException':
      return 'An account with that email already exists';
    case 'CodeMismatchException':
      return 'The verification code is incorrect';
    case 'ExpiredCodeException':
      return 'The verification code has expired. Please request a new one.';
    case 'InvalidPasswordException':
      return 'Password does not meet the requirements';
    case 'LimitExceededException':
      return 'Too many attempts. Please wait and try again.';
    default:
      return err instanceof Error && err.message
        ? err.message
        : 'Authentication failed';
  }
};

interface AuthViewProps {
  onAuthenticated: () => void;
}

// Minimal sign-in / sign-up screen. When Cognito is not configured the app runs
// fully offline without auth (the view shows a notice and an offline continue).
const AuthView = ({ onAuthenticated }: AuthViewProps) => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'confirm'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    const validationError = validate(mode, email, password, code);
    if (validationError) {
      setError(validationError);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (mode === 'signup') {
        await signUp(email, password);
        setMode('confirm');
        setPassword('');
      } else if (mode === 'confirm') {
        await confirmSignUp(email, code);
        setMode('signin');
        setCode('');
        setPassword('');
      } else {
        const session = await signIn(email, password);
        writeSession(email, session);
        onAuthenticated();
      }
    } catch (err) {
      setError(friendlyErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (!isCognitoConfigured()) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.container}>
          <Text style={styles.title}>Offline Mode</Text>
          <Text style={styles.subtitle}>
            Cloud sync is not configured. You can continue using the app fully offline.
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
          {mode === 'signin' && 'Sign in to sync your data across devices.'}
          {mode === 'signup' && 'Create an account to enable cloud sync.'}
          {mode === 'confirm' && `Enter the verification code sent to ${email}.`}
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          accessibilityLabel="Email"
        />
        {mode !== 'confirm' && (
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            accessibilityLabel="Password"
          />
        )}
        {mode === 'confirm' && (
          <TextInput
            style={styles.input}
            placeholder="Verification code"
            value={code}
            onChangeText={setCode}
            accessibilityLabel="Verification code"
          />
        )}

        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={busy} accessible={true} accessibilityRole="button">
          {busy ? (
            <ActivityIndicator color={PALETTE.WHITE} />
          ) : (
            <Text style={styles.buttonText}>
              {BUTTON_LABELS[mode]}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => {
            setMode(mode === 'signin' ? 'signup' : 'signin');
            // Clear fields when switching flows so a password typed for one mode
            // is never accidentally submitted for the other.
            setPassword('');
            setCode('');
            setError(null);
          }}
          accessible={true}
          accessibilityRole="button"
        >
          <Text style={styles.linkText}>
            {mode === 'signin' ? 'Create an account' : 'Already have an account? Sign in'}
          </Text>
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
  input: {
    backgroundColor: PALETTE.WHITE,
    borderColor: PALETTE.NEUTRAL_300,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
    marginTop: 12,
    minHeight: 48,
    paddingHorizontal: 12,
  },
  linkButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    minHeight: 44,
  },
  linkText: {
    color: PALETTE.BLUE_600,
    fontSize: 14,
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
