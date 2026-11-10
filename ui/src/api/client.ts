import { getApiJwt } from '../lib/amplify'

// ---------------------------------------------------------------------------
// Error type
// ---------------------------------------------------------------------------

export class ApiError extends Error {
  public readonly status: number
  public readonly body: unknown

  constructor(
    status: number,
    body: unknown,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

// ---------------------------------------------------------------------------
// Core fetch wrapper
// ---------------------------------------------------------------------------

/**
 * Fetch wrapper that:
 *  - Attaches the Cognito JWT as `Authorization: Bearer <token>`
 *  - Throws `ApiError` for any 4xx or 5xx response
 *  - Never logs the token value
 */
export async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = await getApiJwt()

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
      // Token is set last so it cannot be overridden by the caller
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    let errorBody: unknown
    try {
      errorBody = await response.json()
    } catch {
      errorBody = await response.text().catch(() => null)
    }

    // Build a plain message — do not echo the token
    const detail =
      typeof errorBody === 'object' && errorBody !== null && 'detail' in errorBody
        ? String((errorBody as { detail: unknown }).detail)
        : `HTTP ${response.status}`

    throw new ApiError(response.status, errorBody, detail)
  }

  // 204 No Content — return empty object cast to T
  if (response.status === 204) {
    return {} as T
  }

  return response.json() as Promise<T>
}
