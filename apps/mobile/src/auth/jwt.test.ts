import { decodeJwt } from './jwt'

const base64Url = (obj: unknown): string =>
  Buffer.from(JSON.stringify(obj)).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

describe('decodeJwt', () => {
  it('decodes sub, email, and exp claims', () => {
    const token = `${base64Url({ alg: 'RS256' })}.${base64Url({ sub: 'abc-123', email: 'coach@example.com', exp: 1700000000 })}.sig`
    expect(decodeJwt(token)).toEqual({ sub: 'abc-123', email: 'coach@example.com', exp: 1700000000 })
  })

  it('returns null for a malformed token', () => {
    expect(decodeJwt('not-a-jwt')).toBeNull()
    expect(decodeJwt('only.two')).toBeNull()
  })

  it('returns null for an invalid payload', () => {
    const bad = `${base64Url({ alg: 'RS256' })}.%%%invalid%%%.sig`
    expect(decodeJwt(bad)).toBeNull()
  })

  it('returns null when payload is not an object', () => {
    const token = `${base64Url({ alg: 'RS256' })}.${base64Url('plainstring')}.sig`
    expect(decodeJwt(token)).toBeNull()
  })
})
