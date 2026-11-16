import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { apiFetch, ApiError } from '../client'

// ---------------------------------------------------------------------------
// Hoist mocks
// ---------------------------------------------------------------------------

const { mockGetApiJwt } = vi.hoisted(() => ({
  mockGetApiJwt: vi.fn<() => Promise<string>>(),
}))

vi.mock('../../lib/amplify', () => ({
  getApiJwt: mockGetApiJwt,
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeResponse(status: number, body: unknown, contentType = 'application/json') {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': contentType },
  })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('apiFetch', () => {
  beforeEach(() => {
    mockGetApiJwt.mockResolvedValue('mock-id-token')
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('attaches Authorization: Bearer token header (FR1.2)', async () => {
    vi.mocked(fetch).mockResolvedValue(makeResponse(200, { ok: true }))

    await apiFetch<{ ok: boolean }>('https://api.example.com/test')

    const [, options] = vi.mocked(fetch).mock.calls[0]
    const headers = options?.headers as Record<string, string>
    expect(headers['Authorization']).toBe('Bearer mock-id-token')
  })

  it('resolves with parsed JSON on 200 response', async () => {
    const payload = { employees: [{ id: '1', name: 'Alice' }] }
    vi.mocked(fetch).mockResolvedValue(makeResponse(200, payload))

    const result = await apiFetch<typeof payload>('https://api.example.com/employees')
    expect(result.employees).toHaveLength(1)
    expect(result.employees[0].name).toBe('Alice')
  })

  it('throws ApiError with status 404 on not-found response (FR2.3)', async () => {
    vi.mocked(fetch).mockResolvedValue(makeResponse(404, { detail: 'Employee not found' }))

    await expect(apiFetch('https://api.example.com/employees/bad')).rejects.toMatchObject({
      status: 404,
      name: 'ApiError',
    })
  })

  it('throws ApiError with status 500 on server error', async () => {
    vi.mocked(fetch).mockResolvedValue(makeResponse(500, { detail: 'Internal error' }))

    await expect(apiFetch('https://api.example.com/fail')).rejects.toMatchObject({
      status: 500,
    })
  })

  it('does NOT include the token value in ApiError message (NFR1.3)', async () => {
    vi.mocked(fetch).mockResolvedValue(makeResponse(403, { detail: 'Forbidden' }))

    let caughtMessage = ''
    try {
      await apiFetch('https://api.example.com/protected')
    } catch (err) {
      caughtMessage = (err as ApiError).message
    }
    expect(caughtMessage).not.toContain('mock-id-token')
  })

  it('sets Content-Type: application/json by default', async () => {
    vi.mocked(fetch).mockResolvedValue(makeResponse(200, {}))

    await apiFetch('https://api.example.com/test', { method: 'POST', body: '{}' })

    const [, options] = vi.mocked(fetch).mock.calls[0]
    const headers = options?.headers as Record<string, string>
    expect(headers['Content-Type']).toBe('application/json')
  })
})
