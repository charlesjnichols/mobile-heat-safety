// Cognito Hosted UI authentication for the web-only PWA. Implements the OAuth2
// authorization-code + PKCE (S256) flow against the Cognito hosted UI:
//
//   1. login()             → redirect to /oauth2/authorize with PKCE + state
//   2. exchangeCodeForTokens() → on return, exchange ?code for tokens
//   3. refreshTokens()     → grant_type=refresh_token
//   4. logout()            → clear local session, redirect to /logout
//
// Social providers (Google, Facebook, Amazon, Apple) and native email/password
// are rendered by the hosted page itself; the app only redirects and consumes
// tokens. Configuration is build-time injected (EXPO_PUBLIC_*).
import {
  cognitoConfig,
  authorizeEndpoint,
  tokenEndpoint,
  logoutEndpoint,
  isHostedUiConfigured,
} from './config'

// Convenience re-export so UI layers can treat hosted auth as the single
// import surface for the sign-in flow.
export { isHostedUiConfigured }

const STATE_KEY = 'auth.state'
const VERIFIER_KEY = 'auth.codeVerifier'
const SCOPES = 'openid profile email'

export interface TokenResponse {
  accessToken: string
  idToken: string
  refreshToken?: string
  expiresIn: number // seconds until access token expiry
}

const session = (): Storage | null => {
  if (typeof sessionStorage === 'undefined') {
    return null
  }
  return sessionStorage
}

const base64UrlEncode = (bytes: Uint8Array): string => {
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  if (typeof globalThis.btoa === 'function') {
    return globalThis.btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  }
  return Buffer.from(bytes).toString('base64url')
}

const randomString = (): string => {
  const bytes = new Uint8Array(32)
  globalThis.crypto.getRandomValues(bytes)
  return base64UrlEncode(bytes)
}

const sha256 = async (input: string): Promise<Uint8Array> => {
  const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))
  return new Uint8Array(digest)
}

// PKCE code verifier (43-128 base64url chars) + S256 challenge pair.
export const createPkcePair = async (): Promise<{ verifier: string; challenge: string }> => {
  const verifier = randomString()
  const challenge = base64UrlEncode(await sha256(verifier))
  return { verifier, challenge }
}

// Build the hosted-UI authorize URL and persist PKCE state for the callback.
export const buildLoginUrl = async (): Promise<string> => {
  const { verifier, challenge } = await createPkcePair()
  const state = randomString()
  const storage = session()
  if (storage) {
    storage.setItem(STATE_KEY, state)
    storage.setItem(VERIFIER_KEY, verifier)
  }
  const params = new URLSearchParams({
    client_id: cognitoConfig.userPoolClientId,
    response_type: 'code',
    scope: SCOPES,
    redirect_uri: cognitoConfig.redirectUri,
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  })
  return `${authorizeEndpoint()}?${params.toString()}`
}

// Kick off sign-in: navigate the top-level window to the hosted UI.
export const login = async (): Promise<void> => {
  const url = await buildLoginUrl()
  globalThis.window.location.assign(url)
}

interface TokenEndpointResponse {
  access_token?: string
  id_token?: string
  refresh_token?: string
  expires_in?: number
}

const postToken = async (body: Record<string, string>): Promise<TokenResponse> => {
  const response = await fetch(tokenEndpoint(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body).toString(),
  })
  if (!response.ok) {
    throw new Error(`Token exchange failed (${response.status})`)
  }
  const payload = (await response.json()) as TokenEndpointResponse
  if (!payload.access_token || !payload.id_token || payload.expires_in === undefined) {
    throw new Error('Token response missing required fields')
  }
  return {
    accessToken: payload.access_token,
    idToken: payload.id_token,
    refreshToken: payload.refresh_token,
    expiresIn: payload.expires_in,
  }
}

// Complete the authorization-code flow: verify state, exchange the code using
// the persisted verifier. Throws on state mismatch or failed exchange.
export const exchangeCodeForTokens = async (code: string, returnedState: string): Promise<TokenResponse> => {
  const storage = session()
  const expectedState = storage?.getItem(STATE_KEY) ?? null
  const verifier = storage?.getItem(VERIFIER_KEY) ?? null
  if (!expectedState || !verifier || expectedState !== returnedState) {
    throw new Error('State mismatch — possible CSRF; sign in again')
  }
  try {
    const tokens = await postToken({
      grant_type: 'authorization_code',
      client_id: cognitoConfig.userPoolClientId,
      code,
      redirect_uri: cognitoConfig.redirectUri,
      code_verifier: verifier,
    })
    return tokens
  } finally {
    storage?.removeItem(STATE_KEY)
    storage?.removeItem(VERIFIER_KEY)
  }
}

// Refresh an expired session using the cached refresh token.
export const refreshTokens = async (refreshToken: string): Promise<TokenResponse> => {
  return postToken({
    grant_type: 'refresh_token',
    client_id: cognitoConfig.userPoolClientId,
    refresh_token: refreshToken,
  })
}

// Clear the local session then end the hosted-UI session and return to the app.
export const logout = async (): Promise<void> => {
  const params = new URLSearchParams({
    client_id: cognitoConfig.userPoolClientId,
    logout_uri: cognitoConfig.logoutUri,
  })
  globalThis.window.location.assign(`${logoutEndpoint()}?${params.toString()}`)
}
