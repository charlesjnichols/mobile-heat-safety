import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import AuthView from './AuthView'
import { login } from '../../auth/hostedAuth'
import { isCognitoConfigured, isHostedUiConfigured } from '../../auth/config'

jest.mock('../../auth/hostedAuth', () => ({
  login: jest.fn(),
}))

jest.mock('../../auth/config', () => ({
  isCognitoConfigured: jest.fn(() => true),
  isHostedUiConfigured: jest.fn(() => true),
  cognitoConfig: {
    userPoolId: 'pool',
    userPoolClientId: 'client',
    region: 'us-east-1',
    apiUrl: '',
    domain: 'https://test.auth.us-east-1.amazoncognito.com',
    redirectUri: 'https://app.example.com/app/',
    logoutUri: 'https://app.example.com/app/',
  },
}))

const mockedLogin = login as jest.Mock

describe('AuthView', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders a single Sign In button', () => {
    render(<AuthView onAuthenticated={() => {}} />)
    expect(screen.getByText('Sign In')).toBeTruthy()
    expect(screen.queryByLabelText('Email')).toBeNull()
    expect(screen.queryByLabelText('Password')).toBeNull()
  })

  it('invokes hosted login on press', async () => {
    mockedLogin.mockResolvedValue(undefined)
    render(<AuthView onAuthenticated={() => {}} />)
    fireEvent.press(screen.getByText('Sign In'))
    await waitFor(() => expect(mockedLogin).toHaveBeenCalledTimes(1))
  })

  it('shows an error when login fails', async () => {
    mockedLogin.mockRejectedValue(new Error('network down'))
    render(<AuthView onAuthenticated={() => {}} />)
    fireEvent.press(screen.getByText('Sign In'))
    await waitFor(() => expect(screen.getByText(/network down/i)).toBeTruthy())
  })

  it('shows offline mode when hosted UI is not configured', () => {
    ;(isHostedUiConfigured as unknown as jest.Mock).mockReturnValue(false)
    ;(isCognitoConfigured as unknown as jest.Mock).mockReturnValue(false)
    render(<AuthView onAuthenticated={() => {}} />)
    expect(screen.getByText('Offline Mode')).toBeTruthy()
    expect(screen.getByText('Continue Offline')).toBeTruthy()
  })
})
