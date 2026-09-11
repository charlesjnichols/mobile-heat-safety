import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import AuthView from './AuthView'
import { signIn, signUp, confirmSignUp } from '../../auth/cognito'
import { writeSession } from '../../auth/session'

jest.mock('../../auth/cognito', () => ({
  signIn: jest.fn(),
  signUp: jest.fn(),
  confirmSignUp: jest.fn(),
  getUserPool: jest.fn(),
  refreshSession: jest.fn(),
}))

jest.mock('../../auth/config', () => ({
  isCognitoConfigured: () => true,
  cognitoConfig: { userPoolId: 'pool', userPoolClientId: 'client', region: 'us-east-1', apiUrl: '' },
}))

const mockedSignIn = signIn as jest.Mock
const mockedSignUp = signUp as jest.Mock
const mockedConfirm = confirmSignUp as jest.Mock

describe('AuthView', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    sessionStorage.clear()
  })

  it('renders sign-in form', () => {
    render(<AuthView onAuthenticated={() => {}} />)
    expect(screen.getByLabelText('Email')).toBeTruthy()
    expect(screen.getByLabelText('Password')).toBeTruthy()
    expect(screen.getByText('Sign In')).toBeTruthy()
  })

  it('signs in and calls onAuthenticated', async () => {
    const onAuthenticated = jest.fn()
    const session = {
      getIdToken: () => ({ getJwtToken: () => 'id', getExpiration: () => Math.floor(Date.now() / 1000) + 3600 }),
      getAccessToken: () => ({ getJwtToken: () => 'access' }),
      getRefreshToken: () => ({ getToken: () => 'refresh' }),
    } as unknown as Parameters<typeof writeSession>[1]
    mockedSignIn.mockResolvedValue(session)

    render(<AuthView onAuthenticated={onAuthenticated} />)
    fireEvent.changeText(screen.getByLabelText('Email'), 'coach@example.com')
    fireEvent.changeText(screen.getByLabelText('Password'), 'Password123!')
    fireEvent.press(screen.getByText('Sign In'))

    await waitFor(() => expect(onAuthenticated).toHaveBeenCalled())
    expect(mockedSignIn).toHaveBeenCalledWith('coach@example.com', 'Password123!')
  })

  it('switches to sign-up mode', () => {
    render(<AuthView onAuthenticated={() => {}} />)
    fireEvent.press(screen.getByText('Create an account'))
    expect(screen.getByText('Sign Up')).toBeTruthy()
  })

  it('handles sign-up then confirmation flow', async () => {
    mockedSignUp.mockResolvedValue({ userSub: 'sub', userConfirmed: false })
    mockedConfirm.mockResolvedValue(undefined)

    render(<AuthView onAuthenticated={() => {}} />)
    fireEvent.press(screen.getByText('Create an account'))
    fireEvent.changeText(screen.getByLabelText('Email'), 'coach@example.com')
    fireEvent.changeText(screen.getByLabelText('Password'), 'Password123!')
    fireEvent.press(screen.getByText('Sign Up'))

    await waitFor(() => expect(screen.getByLabelText('Verification code')).toBeTruthy())
    fireEvent.changeText(screen.getByLabelText('Verification code'), '123456')
    fireEvent.press(screen.getByText('Confirm'))

    await waitFor(() => expect(mockedConfirm).toHaveBeenCalledWith('coach@example.com', '123456'))
  })
})
