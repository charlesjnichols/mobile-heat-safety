import type { CognitoUserSession } from 'amazon-cognito-identity-js'
import { cognitoConfig } from './config'

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
export const writeSession = (username: string, session: CognitoUserSession): void => {
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
