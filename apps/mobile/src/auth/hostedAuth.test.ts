import {
  buildLoginUrl,
  createPkcePair,
  exchangeCodeForTokens,
  refreshTokens,
} from './hostedAuth'

jest.mock('./config', () => {
  const config = {
    userPoolId: 'us-east-1_test',
    userPoolClientId: 'client-123',
    region: 'us-east-1',
    apiUrl: '',
    domain: 'https://test.auth.us-east-1.amazoncognito.com',
    redirectUri: 'https://app.example.com/app/',
    logoutUri: 'https://app.example.com/app/',
  }
  return {
    cognitoConfig: config,
    isCognitoConfigured: () => config.userPoolId.length > 0 && config.userPoolClientId.length > 0,
    isHostedUiConfigured: () =>
      config.domain.length > 0 && config.redirectUri.length > 0 && config.userPoolClientId.length > 0,
    authorizeEndpoint: () => `${config.domain}/oauth2/authorize`,
    tokenEndpoint: () => `${config.domain}/oauth2/token`,
    logoutEndpoint: () => `${config.domain}/logout`,
  }
})

// Minimal Web Crypto mock: digest is only used to derive the challenge; tests
// assert the challenge is a base64url string, not its exact value.
const createDigest = (input: Uint8Array): ArrayBuffer => {
  // Deterministic "hash": XOR-fold bytes into 32 bytes.
  const out = new Uint8Array(32)
  for (let i = 0; i < input.length; i++) {
    out[i % 32] ^= input[i]
  }
  return out.buffer
}

beforeAll(() => {
  Object.defineProperty(globalThis, 'crypto', {
    value: {
      getRandomValues: (arr: Uint8Array): Uint8Array => {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = (i * 7 + 3) % 256
        }
        return arr
      },
      subtle: { digest: async (_: string, data: ArrayBuffer) => createDigest(new Uint8Array(data)) },
    },
    configurable: true,
  })
  Object.defineProperty(globalThis, 'btoa', { value: (s: string) => Buffer.from(s, 'binary').toString('base64'), configurable: true })
  Object.defineProperty(globalThis, 'atob', { value: (s: string) => Buffer.from(s, 'base64').toString('binary'), configurable: true })
})

const createSessionStorage = (): Storage => {
  let store: Record<string, string> = {}
  return {
    get length() {
      return Object.keys(store).length
    },
    clear: () => {
      store = {}
    },
    getItem: (key: string) => store[key] ?? null,
    key: (index: number) => Object.keys(store)[index] ?? null,
    removeItem: (key: string) => {
      delete store[key]
    },
    setItem: (key: string, value: string) => {
      store[key] = String(value)
    },
  }
}

describe('hostedAuth PKCE', () => {
  beforeEach(() => {
    ;(globalThis as { sessionStorage: Storage }).sessionStorage = createSessionStorage()
  })

  it('creates a verifier/challenge pair', async () => {
    const { verifier, challenge } = await createPkcePair()
    expect(verifier).toMatch(/^[A-Za-z0-9_-]{43,128}$/)
    expect(challenge).toMatch(/^[A-Za-z0-9_-]+$/)
    expect(challenge).not.toBe(verifier)
  })

  it('builds an authorize URL with required params and persists state', async () => {
    const url = await buildLoginUrl()
    expect(url.startsWith('https://test.auth.us-east-1.amazoncognito.com/oauth2/authorize?')).toBe(true)
    const params = new URL(url).searchParams
    expect(params.get('client_id')).toBe('client-123')
    expect(params.get('response_type')).toBe('code')
    expect(params.get('scope')).toBe('openid profile email')
    expect(params.get('redirect_uri')).toBe('https://app.example.com/app/')
    expect(params.get('code_challenge_method')).toBe('S256')
    expect(params.get('state')).toBeTruthy()
    expect(params.get('code_challenge')).toBeTruthy()
    expect(globalThis.sessionStorage.getItem('auth.state')).toBe(params.get('state'))
    expect(globalThis.sessionStorage.getItem('auth.codeVerifier')).toBeTruthy()
  })

  it('exchanges the code and clears persisted state', async () => {
    await buildLoginUrl()
    const state = globalThis.sessionStorage.getItem('auth.state') as string
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: 'at',
        id_token: 'it',
        refresh_token: 'rt',
        expires_in: 3600,
      }),
    })
    globalThis.fetch = fetchMock as unknown as typeof fetch

    const tokens = await exchangeCodeForTokens('the-code', state)
    expect(tokens.accessToken).toBe('at')
    expect(tokens.idToken).toBe('it')
    expect(tokens.refreshToken).toBe('rt')
    expect(tokens.expiresIn).toBe(3600)
    expect(fetchMock).toHaveBeenCalledWith(
      'https://test.auth.us-east-1.amazoncognito.com/oauth2/token',
      expect.objectContaining({ method: 'POST' })
    )
    const body = fetchMock.mock.calls[0][1].body as string
    expect(body).toContain('grant_type=authorization_code')
    expect(body).toContain('code=the-code')
    expect(body).toContain('code_verifier=')
    expect(globalThis.sessionStorage.getItem('auth.state')).toBeNull()
  })

  it('rejects a state mismatch', async () => {
    await buildLoginUrl()
    await expect(exchangeCodeForTokens('code', 'wrong-state')).rejects.toThrow('State mismatch')
  })

  it('refreshes tokens via the token endpoint', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: 'at2', id_token: 'it2', expires_in: 3600 }),
    })
    globalThis.fetch = fetchMock as unknown as typeof fetch
    const tokens = await refreshTokens('rt')
    expect(tokens.accessToken).toBe('at2')
    const body = fetchMock.mock.calls[0][1].body as string
    expect(body).toContain('grant_type=refresh_token')
    expect(body).toContain('refresh_token=rt')
  })
})
