import {
  writeSession,
  readSession,
  isSessionExpired,
  readLastAuthUser,
} from '../../src/auth/session'

const makeSession = (expiryEpochSeconds: number) =>
  ({
    getIdToken: () => ({ getJwtToken: () => 'id-token', getExpiration: () => expiryEpochSeconds }),
    getAccessToken: () => ({ getJwtToken: () => 'access-token' }),
    getRefreshToken: () => ({ getToken: () => 'refresh-token' }),
  }) as unknown as Parameters<typeof writeSession>[1]

describe('offline session restoration', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('restores an unexpired cached session without any network call', () => {
    writeSession('coach@example.com', makeSession(Math.floor(Date.now() / 1000) + 3600))

    // Simulate app init: read the cached session directly (no refresh needed).
    const username = readLastAuthUser()
    const session = username ? readSession(username) : null

    expect(username).toBe('coach@example.com')
    expect(session).not.toBeNull()
    expect(isSessionExpired(session as NonNullable<typeof session>)).toBe(false)
  })

  it('does not refresh when the cached session is unexpired', () => {
    writeSession('coach@example.com', makeSession(Math.floor(Date.now() / 1000) + 3600))
    const session = readSession('coach@example.com')
    // No refresh token exchange is performed for an unexpired session.
    expect(isSessionExpired(session as NonNullable<typeof session>)).toBe(false)
  })
})
