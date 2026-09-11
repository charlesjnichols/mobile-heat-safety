import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserSession,
  CognitoRefreshToken,
  type ICognitoUserPoolData,
} from 'amazon-cognito-identity-js'
import { cognitoConfig, isCognitoConfigured } from './config'

// Build the Cognito user pool from build-time config. Returns null when the
// pool is not configured so the app can run fully offline without auth.
export const getUserPool = (): CognitoUserPool | null => {
  if (!isCognitoConfigured()) {
    return null
  }
  const data: ICognitoUserPoolData = {
    UserPoolId: cognitoConfig.userPoolId,
    ClientId: cognitoConfig.userPoolClientId,
  }
  return new CognitoUserPool(data)
}

export interface SignUpResult {
  userSub: string
  userConfirmed: boolean
}

// Register a new user with email + password. Confirmation is delivered via the
// Cognito email code flow.
export const signUp = (
  email: string,
  password: string
): Promise<SignUpResult> => {
  const pool = getUserPool()
  if (!pool) {
    return Promise.reject(new Error('Cognito is not configured'))
  }
  return new Promise((resolve, reject) => {
    pool.signUp(
      email,
      password,
      [{ Name: 'email', Value: email }],
      [],
      (err, result) => {
      if (err || !result) {
        reject(err ?? new Error('Sign up failed'))
        return
      }
      resolve({
        userSub: result.userSub,
        userConfirmed: result.userConfirmed,
      })
    })
  })
}

// Confirm a pending sign-up with the emailed verification code.
export const confirmSignUp = (email: string, code: string): Promise<void> => {
  const pool = getUserPool()
  if (!pool) {
    return Promise.reject(new Error('Cognito is not configured'))
  }
  const user = new CognitoUser({ Username: email, Pool: pool })
  return new Promise((resolve, reject) => {
    user.confirmRegistration(code, true, (err) => {
      if (err) {
        reject(err)
        return
      }
      resolve()
    })
  })
}

// Authenticate with SRP and resolve with the resulting session.
export const signIn = (
  email: string,
  password: string
): Promise<CognitoUserSession> => {
  const pool = getUserPool()
  if (!pool) {
    return Promise.reject(new Error('Cognito is not configured'))
  }
  const user = new CognitoUser({ Username: email, Pool: pool })
  const authDetails = new AuthenticationDetails({
    Username: email,
    Password: password,
  })
  return new Promise((resolve, reject) => {
    user.authenticateUser(authDetails, {
      onSuccess: (session) => resolve(session),
      onFailure: (err) => reject(err),
    })
  })
}

// Refresh an expired session using the cached refresh token.
export const refreshSession = (
  user: CognitoUser,
  refreshToken: string
): Promise<CognitoUserSession> => {
  return new Promise((resolve, reject) => {
    const token = new CognitoRefreshToken({ RefreshToken: refreshToken })
    user.refreshSession(token, (err, session) => {
      if (err || !session) {
        reject(err ?? new Error('Refresh failed'))
        return
      }
      resolve(session)
    })
  })
}
