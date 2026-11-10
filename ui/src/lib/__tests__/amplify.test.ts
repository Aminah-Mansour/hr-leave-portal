import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks — use vi.hoisted() so mock variables are available inside vi.mock()
// factories, which are hoisted to the top of the file by Vitest.
// ---------------------------------------------------------------------------

const { mockConfigure, mockFetchAuthSession } = vi.hoisted(() => ({
  mockConfigure: vi.fn(),
  mockFetchAuthSession: vi.fn(),
}))

vi.mock('aws-amplify', () => ({
  Amplify: {
    configure: mockConfigure,
  },
}))

vi.mock('aws-amplify/auth', () => ({
  fetchAuthSession: mockFetchAuthSession,
}))

// Import the module under test after mocks are wired.
import { configureAmplify, getApiJwt, getJwt } from '../amplify'

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('configureAmplify (FR1.1, FR7.1)', () => {
  beforeEach(() => {
    mockConfigure.mockClear()
    vi.unstubAllEnvs()
  })

  it('calls Amplify.configure with userPoolId and userPoolClientId from env', () => {
    vi.stubEnv('VITE_USER_POOL_ID', 'us-east-1_TestPool')
    vi.stubEnv('VITE_USER_POOL_CLIENT_ID', 'TestClientId')
    vi.stubEnv('VITE_API_URL', 'https://api.example.com/prod/')

    configureAmplify()

    expect(mockConfigure).toHaveBeenCalledOnce()
    const config = mockConfigure.mock.calls[0][0]

    expect(config.Auth.Cognito.userPoolId).toBe('us-east-1_TestPool')
    expect(config.Auth.Cognito.userPoolClientId).toBe('TestClientId')
    expect(config.API.REST.HrLeavePortalApi.endpoint).toBe('https://api.example.com/prod/')
  })

  it('does not embed raw passwords or secrets in the configure object (NFR1.3)', () => {
    vi.stubEnv('VITE_USER_POOL_ID', 'us-east-1_SecretPool')
    vi.stubEnv('VITE_USER_POOL_CLIENT_ID', 'SecretClientId')
    vi.stubEnv('VITE_API_URL', 'https://api.example.com/prod/')

    configureAmplify()

    const serialised = JSON.stringify(mockConfigure.mock.calls[0][0])
    expect(serialised).not.toContain('password')
    expect(serialised).not.toContain('secret_key')
  })
})

describe('Cognito API tokens (FR1.2, NFR1.3)', () => {
  beforeEach(() => {
    mockFetchAuthSession.mockClear()
  })

  it('returns the access token for AgentCore from a valid session', async () => {
    mockFetchAuthSession.mockResolvedValue({
      tokens: {
        accessToken: { toString: () => 'mock-access-token' },
      },
    })

    const token = await getJwt()
    expect(token).toBe('mock-access-token')
  })

  it('returns the ID token for API Gateway from a valid session', async () => {
    mockFetchAuthSession.mockResolvedValue({
      tokens: {
        idToken: { toString: () => 'mock-id-token' },
        accessToken: { toString: () => 'mock-access-token' },
      },
    })

    await expect(getApiJwt()).resolves.toBe('mock-id-token')
  })

  it('requires an ID token for API Gateway requests', async () => {
    mockFetchAuthSession.mockResolvedValue({
      tokens: { accessToken: { toString: () => 'mock-access-token' } },
    })

    await expect(getApiJwt()).rejects.toThrow('No active identity token')
  })

  it('throws with descriptive message when there is no active session (FR1.3)', async () => {
    mockFetchAuthSession.mockResolvedValue({ tokens: undefined })
    await expect(getJwt()).rejects.toThrow('No active session')
  })

  it('throws when accessToken is null (FR1.3)', async () => {
    mockFetchAuthSession.mockResolvedValue({
      tokens: { accessToken: null },
    })
    await expect(getJwt()).rejects.toThrow('No active session')
  })

  it('does NOT include the token value in the error message on session failure (NFR1.3)', async () => {
    // fetchAuthSession throws before we obtain a token — error must not echo a token
    mockFetchAuthSession.mockRejectedValue(new Error('Network error during token fetch'))

    let caughtMessage = ''
    try {
      await getJwt()
    } catch (err) {
      caughtMessage = (err as Error).message
    }
    // Whatever the error, no sensitive token value must appear
    expect(caughtMessage).not.toContain('mock-access-token')
  })
})
