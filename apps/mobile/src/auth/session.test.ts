import {
  writeSession,
  readSession,
  readLastAuthUser,
  isSessionExpired,
  clearSession,
  LAST_AUTH_USER_KEY,
} from '../../src/auth/session'

// Minimal CognitoUserSession-shaped object with the accessors the cache uses.
const makeSession = (expiryEpochSeconds: number) =>
  ({
    getIdToken: () => ({ getJwtToken: () => 'id-token', getExpiration: () => expiryEpochSeconds }),
    getAccessToken: () => ({ getJwtToken: () => 'access-token' }),
    getRefreshToken: () => ({ getToken: () => 'refresh-token' }),
  }) as unknown as Parameters<typeof writeSession>[1]

describe('session cache', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('writes and reads a session', () => {
    writeSession('coach@example.com', makeSession(Math.floor(Date.now() / 1000) + 3600))

    const session = readSession('coach@example.com')
    expect(session?.idToken).toBe('id-token')
    expect(session?.accessToken).toBe('access-token')
    expect(session?.refreshToken).toBe('refresh-token')
    expect(readLastAuthUser()).toBe('coach@example.com')
  })

  it('returns null when no session is cached', () => {
    expect(readSession('coach@example.com')).toBeNull()
  })

  it('detects an expired session', () => {
    writeSession('coach@example.com', makeSession(Math.floor(Date.now() / 1000) - 60))
    const session = readSession('coach@example.com')
    expect(session).not.toBeNull()
    expect(isSessionExpired(session as NonNullable<typeof session>)).toBe(true)
  })

  it('treats an unexpired session as valid', () => {
    writeSession('coach@example.com', makeSession(Math.floor(Date.now() / 1000) + 3600))
    const session = readSession('coach@example.com')
    expect(isSessionExpired(session as NonNullable<typeof session>)).toBe(false)
  })

  it('clears the session on sign-out', () => {
    writeSession('coach@example.com', makeSession(Math.floor(Date.now() / 1000) + 3600))
    clearSession('coach@example.com')

    expect(readSession('coach@example.com')).toBeNull()
    expect(sessionStorage.getItem(LAST_AUTH_USER_KEY)).toBeNull()
  })
})
