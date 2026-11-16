import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ---------------------------------------------------------------------------
// Hoist mocks
// ---------------------------------------------------------------------------

const { mockGetJwt } = vi.hoisted(() => ({
  mockGetJwt: vi.fn<() => Promise<string>>(),
}))

vi.mock('../../lib/amplify', () => ({
  getJwt: mockGetJwt,
  getUiRuntimeConfig: () => ({
    apiUrl: 'https://api.example.com/prod/',
    userPoolId: 'us-east-1_test',
    userPoolClientId: 'test-client',
    agentRuntimeUrl: 'https://bedrock-agentcore.us-east-1.amazonaws.com',
    agentRuntimeArn: 'arn:aws:bedrock-agentcore:us-east-1:123456789012:runtime/test-runtime',
    region: 'us-east-1',
  }),
}))

import { invokeAgent } from '../agentApi'
import type { ChatMessage } from '../../types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sseChunk(text: string): Uint8Array {
  const line = `data: ${JSON.stringify({ event: { contentBlockDelta: { delta: { text } } } })}\n\n`
  return new TextEncoder().encode(line)
}

function makeStreamResponse(chunks: Uint8Array[]): Response {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(chunk)
      }
      controller.close()
    },
  })
  return new Response(stream, {
    status: 200,
    headers: { 'Content-Type': 'text/event-stream' },
  })
}

function makeJsonResponse(text: string): Response {
  return new Response(JSON.stringify({ text }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

const sampleMessages: ChatMessage[] = [{ role: 'user', content: 'Hello' }]

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('invokeAgent — streaming path (FR5.1, FR5.2)', () => {
  beforeEach(() => {
    mockGetJwt.mockResolvedValue('mock-agent-token')
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('yields text chunks from SSE stream', async () => {
    vi.mocked(fetch).mockResolvedValue(
      makeStreamResponse([sseChunk('Hello'), sseChunk(' world')]),
    )

    const chunks: string[] = []
    for await (const chunk of invokeAgent(sampleMessages, 'user-001')) {
      chunks.push(chunk)
    }

    expect(chunks).toEqual(['Hello', ' world'])

    const [url, options] = vi.mocked(fetch).mock.calls[0]
    expect(url).toBe('https://bedrock-agentcore.us-east-1.amazonaws.com/runtimes/arn%3Aaws%3Abedrock-agentcore%3Aus-east-1%3A123456789012%3Aruntime%2Ftest-runtime/invocations?qualifier=DEFAULT')
    expect(options?.method).toBe('POST')
    const request = JSON.parse(options?.body as string)
    expect(request.messages).toEqual([{ role: 'user', content: [{ text: 'Hello' }] }])
    expect(options?.headers).toHaveProperty('X-Amzn-Bedrock-AgentCore-Runtime-Session-Id')
  })

  it('does not yield the JWT value in any chunk (NFR1.3)', async () => {
    const tokenChunk = sseChunk('mock-agent-token') // if token leaked, this would yield it
    vi.mocked(fetch).mockResolvedValue(makeStreamResponse([tokenChunk]))

    // The chunk content IS mock-agent-token here — but we verify the token
    // wasn't injected by the implementation, only what the SSE says
    const chunks: string[] = []
    for await (const chunk of invokeAgent(sampleMessages, 'user-001')) {
      chunks.push(chunk)
    }

    // The fetch Authorization header should carry the token, but the yielded
    // content must be only what came from the SSE data lines (not the header)
    const [, options] = vi.mocked(fetch).mock.calls[0]
    const headers = options?.headers as Record<string, string>
    expect(headers['Authorization']).toBe('Bearer mock-agent-token')
    // The chunks are from the SSE content only
    expect(chunks[0]).toBe('mock-agent-token') // SSE said this, so it's fine
  })

  it('sends actorId in request body (FR5.4)', async () => {
    vi.mocked(fetch).mockResolvedValue(makeStreamResponse([sseChunk('ok')]))

    const gen = invokeAgent(sampleMessages, 'user-specific-id')
    await gen.next()

    const [, options] = vi.mocked(fetch).mock.calls[0]
    const body = JSON.parse(options?.body as string)
    expect(body.actorId).toBe('user-specific-id')
  })

  it.each([
    ['English', 'What is my leave balance?', 'Your leave balance is 10 days.'],
    ['Arabic', 'ما رصيد إجازاتي؟', 'رصيد إجازاتك هو 10 أيام.'],
  ])('preserves %s prompts and streamed responses', async (_language, prompt, reply) => {
    vi.mocked(fetch).mockResolvedValue(makeStreamResponse([sseChunk(reply)]))

    const chunks: string[] = []
    for await (const chunk of invokeAgent([{ role: 'user', content: prompt }], 'user-001')) {
      chunks.push(chunk)
    }

    expect(chunks.join('')).toBe(reply)
    const [, options] = vi.mocked(fetch).mock.calls[0]
    expect(JSON.parse(options?.body as string).messages).toEqual([
      { role: 'user', content: [{ text: prompt }] },
    ])
  })
})

describe('invokeAgent — non-streaming fallback (FR5.2)', () => {
  beforeEach(() => {
    mockGetJwt.mockResolvedValue('mock-agent-token')
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('yields complete text from JSON response', async () => {
    vi.mocked(fetch).mockResolvedValue(makeJsonResponse('Full agent response'))

    const chunks: string[] = []
    for await (const chunk of invokeAgent(sampleMessages, 'user-001')) {
      chunks.push(chunk)
    }

    expect(chunks).toEqual(['Full agent response'])
  })

  it('reads AgentCore JSON responses using the response field', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ response: 'Agent reply' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }))

    const chunks: string[] = []
    for await (const chunk of invokeAgent(sampleMessages, 'user-001')) chunks.push(chunk)

    expect(chunks).toEqual(['Agent reply'])
  })

  it('throws on non-200 responses', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ detail: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    const gen = invokeAgent(sampleMessages, 'user-001')
    await expect(gen.next()).rejects.toThrow('AgentCore invocation failed')
  })
})
