import { registerServiceWorker, isServiceWorkerSupported, SW_PATH } from './serviceWorker'

describe('service worker (offline launch support)', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('registers the service worker at the expected path on web', async () => {
    const mockRegister = jest.fn().mockResolvedValue({
      update: jest.fn().mockResolvedValue(undefined),
      addEventListener: jest.fn(),
    })

    Object.defineProperty(globalThis, 'navigator', {
      value: { serviceWorker: { register: mockRegister } },
      configurable: true,
    })
    Object.defineProperty(globalThis, 'window', { value: {}, configurable: true })
    jest.spyOn(require('react-native'), 'Platform', 'get').mockReturnValue({ OS: 'web' })

    await registerServiceWorker()

    expect(mockRegister).toHaveBeenCalledWith(SW_PATH)
    expect(isServiceWorkerSupported()).toBe(true)
  })

  it('degrades gracefully when service workers are unsupported', async () => {
    Object.defineProperty(globalThis, 'navigator', { value: {}, configurable: true })
    jest.spyOn(require('react-native'), 'Platform', 'get').mockReturnValue({ OS: 'web' })

    await expect(registerServiceWorker()).resolves.toBeUndefined()
    expect(isServiceWorkerSupported()).toBe(false)
  })
})
