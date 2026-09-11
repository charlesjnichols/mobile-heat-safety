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

  describe('hosted-UI tokens', () => {
    const b64url = (obj: unknown) =>
      Buffer.from(JSON.stringify(obj)).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    const makeTokenResponse = (expEpochSeconds: number) => ({
      accessToken: 'hosted-access',
      idToken: `h.${b64url({ sub: 'sub-abc', exp: expEpochSeconds })}.s`,
      refreshToken: 'hosted-refresh',
      expiresIn: 3600,
    })

    beforeEach(() => {
      jest.resetModules()
      jest.doMock('./hostedAuth', () => ({
        refreshTokens: jest.fn().mockResolvedValue({
          accessToken: 'new-access',
          idToken: `n.${b64url({ sub: 'sub-abc', exp: Math.floor(Date.now() / 1000) + 3600 })}.s`,
          refreshToken: 'new-refresh',
          expiresIn: 3600,
        }),
      }))
    })

    it('stores hosted tokens keyed by the id_token sub', () => {
      const { storeHostedTokens, readSession, readLastAuthUser } = require('../../src/auth/session')
      storeHostedTokens(makeTokenResponse(Math.floor(Date.now() / 1000) + 3600))

      const session = readSession('sub-abc')
      expect(session?.accessToken).toBe('hosted-access')
      expect(session?.refreshToken).toBe('hosted-refresh')
      expect(session?.idToken).toContain('h.')
      expect(readLastAuthUser()).toBe('sub-abc')
    })

    it('refreshes the stored session through the token endpoint', async () => {
      const { storeHostedTokens, refreshStoredSession, readSession } = require('../../src/auth/session')
      storeHostedTokens(makeTokenResponse(Math.floor(Date.now() / 1000) - 60))

      const username = await refreshStoredSession()
      expect(username).toBe('sub-abc')

      const session = readSession('sub-abc')
      expect(session?.accessToken).toBe('new-access')
    })

    it('returns null when refresh fails', async () => {
      jest.doMock('./hostedAuth', () => ({
        refreshTokens: jest.fn().mockRejectedValue(new Error('offline')),
      }))
      const { storeHostedTokens, refreshStoredSession, readSession } = require('../../src/auth/session')
      storeHostedTokens(makeTokenResponse(Math.floor(Date.now() / 1000) - 60))

      const username = await refreshStoredSession()
      expect(username).toBeNull()

      // The failed refresh must not wipe the cached session (offline use).
      const session = readSession('sub-abc')
      expect(session?.accessToken).toBe('hosted-access')
    })
  })
})
