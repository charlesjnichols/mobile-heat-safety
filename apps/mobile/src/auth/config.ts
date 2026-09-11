// Cognito configuration. Values are injected at build time via Expo public env
// vars (EXPO_PUBLIC_*). When unset, the app degrades to offline-only operation
// (no auth, no sync) rather than failing to boot.
export const cognitoConfig = {
  userPoolId: process.env.EXPO_PUBLIC_COGNITO_USER_POOL_ID ?? '',
  userPoolClientId: process.env.EXPO_PUBLIC_COGNITO_USER_POOL_CLIENT_ID ?? '',
  region: process.env.EXPO_PUBLIC_COGNITO_REGION ?? 'us-east-1',
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? '',
  // Hosted UI (SSO) configuration — web-only OAuth2 authorization-code + PKCE.
  domain: process.env.EXPO_PUBLIC_COGNITO_DOMAIN ?? '',
  redirectUri: process.env.EXPO_PUBLIC_REDIRECT_URI ?? '',
  logoutUri: process.env.EXPO_PUBLIC_LOGOUT_URI ?? '',
}

export const isCognitoConfigured = (): boolean =>
  cognitoConfig.userPoolId.length > 0 && cognitoConfig.userPoolClientId.length > 0

// Hosted UI is usable only when every OAuth parameter is present. Partial
// configuration (e.g. pool set but no domain) must degrade to offline mode
// rather than attempting a broken redirect.
export const isHostedUiConfigured = (): boolean =>
  cognitoConfig.domain.length > 0 &&
  cognitoConfig.redirectUri.length > 0 &&
  cognitoConfig.userPoolClientId.length > 0 &&
  cognitoConfig.logoutUri.length > 0

export const authorizeEndpoint = (): string => `${cognitoConfig.domain}/oauth2/authorize`
export const tokenEndpoint = (): string => `${cognitoConfig.domain}/oauth2/token`
export const logoutEndpoint = (): string => `${cognitoConfig.domain}/logout`
