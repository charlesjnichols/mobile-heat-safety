// Cognito configuration. Values are injected at build time via Expo public env
// vars (EXPO_PUBLIC_*). When unset, the app degrades to offline-only operation
// (no auth, no sync) rather than failing to boot.
export const cognitoConfig = {
  userPoolId: process.env.EXPO_PUBLIC_COGNITO_USER_POOL_ID ?? '',
  userPoolClientId: process.env.EXPO_PUBLIC_COGNITO_USER_POOL_CLIENT_ID ?? '',
  region: process.env.EXPO_PUBLIC_COGNITO_REGION ?? 'us-east-1',
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? '',
}

export const isCognitoConfigured = (): boolean =>
  cognitoConfig.userPoolId.length > 0 && cognitoConfig.userPoolClientId.length > 0
