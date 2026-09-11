import { cognitoConfig } from './config'
import { decodeJwt } from './jwt'
import { refreshTokens, type TokenResponse } from './hostedAuth'

// Interface describing the token accessors the cache needs. Both the legacy
// CognitoUserSession object and plain token payloads satisfy it, keeping
// existing call sites and tests working after the hosted-UI migration.
export interface SessionTokens {
  getIdToken: () => { getJwtToken: () => string; getExpiration: () => number }
  getAccessToken: () => { getJwtToken: () => string }
  getRefreshToken: () => { getToken: () => string }
}

// Key prefix for the cached Cognito session, unique per pool + username.
const KEY_PREFIX = (username: string): string =>
  `cognito.${cognitoConfig.userPoolId}.${username}`

export const LAST_AUTH_USER_KEY = 'cognito.LastAuthUser'

export interface CachedSession {
  username: string
  idToken: string
  accessToken: string
  refreshToken: string
  tokenExpiry: string // ISO 8601
}

// Tokens are held in sessionStorage (non-persistent, cleared when the tab/program
// closes) rather than localStorage, so credentials are not left readable on disk
// and the long-lived refresh token is not durable across restarts.
const readStorage = (): Storage | null => {
  if (typeof sessionStorage === 'undefined') {
    return null
  }
  return sessionStorage
}

// Persist a Cognito session to sessionStorage, keyed by username.
export const writeSession = (username: string, session: SessionTokens): void => {
  const storage = readStorage()
  if (!storage) {
    return
  }
  const prefix = KEY_PREFIX(username)
  storage.setItem(`${prefix}.idToken`, session.getIdToken().getJwtToken())
  storage.setItem(`${prefix}.accessToken`, session.getAccessToken().getJwtToken())
  storage.setItem(`${prefix}.refreshToken`, session.getRefreshToken().getToken())
  storage.setItem(`${prefix}.tokenExpiry`, new Date(session.getIdToken().getExpiration() * 1000).toISOString())
  storage.setItem(LAST_AUTH_USER_KEY, username)
}

// Persist tokens obtained from the Cognito hosted-UI token endpoint. The
// identity (sub) is taken from the id_token payload; email is a fallback
// display value. Shape matches CachedSession so the rest of the app is
// unaffected by which flow produced the session.
export const storeHostedTokens = (tokens: TokenResponse): void => {
  const storage = readStorage()
  if (!storage) {
    return
  }
  const claims = decodeJwt(tokens.idToken)
  const username = claims?.sub ?? claims?.email
  if (!username) {
    return
  }
  const expiryMs = (claims?.exp ?? Math.floor(Date.now() / 1000) + tokens.expiresIn) * 1000
  const prefix = KEY_PREFIX(username)
  storage.setItem(`${prefix}.idToken`, tokens.idToken)
  storage.setItem(`${prefix}.accessToken`, tokens.accessToken)
  if (tokens.refreshToken) {
    storage.setItem(`${prefix}.refreshToken`, tokens.refreshToken)
  }
  storage.setItem(`${prefix}.tokenExpiry`, new Date(expiryMs).toISOString())
  storage.setItem(LAST_AUTH_USER_KEY, username)
}

// Refresh the cached session through the hosted-UI token endpoint. Returns the
// username of the refreshed session, or null when there is no cached session
// or the refresh fails (network or invalid refresh token). Never throws.
export const refreshStoredSession = async (): Promise<string | null> => {
  const username = readLastAuthUser()
  if (!username) {
    return null
  }
  const cached = readSession(username)
  if (!cached) {
    return null
  }
  try {
    const tokens = await refreshTokens(cached.refreshToken)
    storeHostedTokens(tokens)
    return username
  } catch {
    return null
  }
}

// Read the cached session for a username, or null if absent.
export const readSession = (username: string): CachedSession | null => {
  const storage = readStorage()
  if (!storage) {
    return null
  }
  const prefix = KEY_PREFIX(username)
  const idToken = storage.getItem(`${prefix}.idToken`)
  const accessToken = storage.getItem(`${prefix}.accessToken`)
  const refreshToken = storage.getItem(`${prefix}.refreshToken`)
  const tokenExpiry = storage.getItem(`${prefix}.tokenExpiry`)
  if (!idToken || !accessToken || !refreshToken || !tokenExpiry) {
    return null
  }
  return { username, idToken, accessToken, refreshToken, tokenExpiry }
}

// Read the last signed-in username, or null.
export const readLastAuthUser = (): string | null => {
  const storage = readStorage()
  if (!storage) {
    return null
  }
  return storage.getItem(LAST_AUTH_USER_KEY)
}

// True if the cached session's idToken has not yet expired. Unparseable or
// malformed expiry values are treated as expired rather than valid, so a corrupt
// session is never mistaken for a live one.
export const isSessionExpired = (session: CachedSession): boolean => {
  const expiry = new Date(session.tokenExpiry).getTime()
  if (Number.isNaN(expiry)) {
    return true
  }
  return expiry <= Date.now()
}

// Clear all cached session keys for a username (sign-out). Local data is kept.
export const clearSession = (username: string): void => {
  const storage = readStorage()
  if (!storage) {
    return
  }
  const prefix = KEY_PREFIX(username)
  storage.removeItem(`${prefix}.idToken`)
  storage.removeItem(`${prefix}.accessToken`)
  storage.removeItem(`${prefix}.refreshToken`)
  storage.removeItem(`${prefix}.tokenExpiry`)
  storage.removeItem(LAST_AUTH_USER_KEY)
}
