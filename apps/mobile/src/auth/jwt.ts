// Minimal JWT payload decoding for Cognito tokens. Only the payload claims the
// app needs (sub, email, exp) are extracted; no signature verification is
// performed client-side — the tokens were obtained directly from the Cognito
// token endpoint over HTTPS and are validated server-side by the API authorizer.
export interface JwtClaims {
  sub?: string
  email?: string
  exp?: number
}

const base64UrlDecode = (input: string): string => {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
  if (typeof globalThis.atob === 'function') {
    return globalThis.atob(padded)
  }
  // React Native fallback for environments without atob.
  return Buffer.from(padded, 'base64').toString('utf-8')
}

export const decodeJwt = (token: string): JwtClaims | null => {
  const parts = token.split('.')
  if (parts.length !== 3) {
    return null
  }
  try {
    const payload = JSON.parse(base64UrlDecode(parts[1])) as JwtClaims
    return typeof payload === 'object' && payload !== null ? payload : null
  } catch {
    return null
  }
}
