import { getJwt, getUiRuntimeConfig } from '../lib/amplify'
import type { ChatMessage } from '../types'

function createRuntimeSessionId(): string {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  const randomPart = Math.random().toString(16).slice(2).padEnd(12, '0').slice(0, 12)
  return `00000000-0000-4000-8000-${randomPart}`
}

// Keep one AgentCore session for this browser tab so the runtime can preserve context.
const runtimeSessionId = createRuntimeSessionId()

function getInvocationUrl(): string {
  const { agentRuntimeArn, agentRuntimeUrl, region } = getUiRuntimeConfig()
  if (!agentRuntimeArn) {
    // Also accept a fully configured AgentCore REST path for local integrations.
    if (agentRuntimeUrl.includes('/runtimes/') && agentRuntimeUrl.includes('/invocations')) {
      return agentRuntimeUrl
    }
    throw new Error('AgentCore Runtime ARN is not configured.')
  }

  const arnRegion = agentRuntimeArn.split(':')[3]
  const runtimeRegion = region || arnRegion
  if (!runtimeRegion) throw new Error('AgentCore Runtime region is not configured.')

  // AgentCore uses a regional data-plane endpoint and URL-encoded runtime ARN.
  const endpoint = `https://bedrock-agentcore.${runtimeRegion}.amazonaws.com`
  const encodedArn = encodeURIComponent(agentRuntimeArn)
  return `${endpoint}/runtimes/${encodedArn}/invocations?qualifier=DEFAULT`
}

/**
 * Invoke the AgentCore Runtime with the given message history.
 *
 * Yields text chunks as they arrive (streaming SSE) or a single chunk on
 * non-streaming responses.  Never yields the JWT or any credential value.
 *
 * SSE format expected from the runtime (one line per event):
 *   data: {"contentBlockDelta":{"delta":{"text":"..."}}}
 */
export async function* invokeAgent(
  messages: ChatMessage[],
  actorId: string,
): AsyncGenerator<string> {
  const token = await getJwt()
  const invocationUrl = getInvocationUrl()
  const runtimeMessages = messages.map(({ role, content }) => ({
    role,
    // The AgentCore app accepts Strands messages with content blocks; ChatMessage
    // uses strings for display, so convert at the API boundary.
    content: [{ text: content }],
  }))

  const response = await fetch(invocationUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream, application/json',
      Authorization: `Bearer ${token}`,
      'X-Amzn-Bedrock-AgentCore-Runtime-Session-Id': runtimeSessionId,
    },
    body: JSON.stringify({ messages: runtimeMessages, actorId }),
  })

  if (!response.ok) {
    let detail = `HTTP ${response.status}`
    try {
      const errorBody = await response.json()
      if (typeof errorBody === 'object' && errorBody !== null && 'detail' in errorBody) {
        detail = String((errorBody as { detail: unknown }).detail)
      }
    } catch {
      // ignore JSON parse errors
    }
    throw new Error(`AgentCore invocation failed: ${detail}`)
  }

  const contentType = response.headers.get('content-type') ?? ''
  const isStreaming =
    contentType.includes('text/event-stream') || contentType.includes('application/x-ndjson')

  if (isStreaming && response.body) {
    // Streaming path: decode SSE chunks
    yield* readSSEStream(response.body)
  } else {
    // Non-streaming fallback: await full JSON response
    const data = await response.json()
    const text =
      typeof data?.text === 'string'
        ? data.text
        : typeof data?.content === 'string'
          ? data.content
          : typeof data?.response === 'string'
            ? data.response
          : JSON.stringify(data)
    yield text
  }
}

/**
 * Read a ReadableStream of SSE data and yield text deltas.
 * Handles the contentBlockDelta format used by the Bedrock AgentCore runtime.
 */
async function* readSSEStream(body: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })

      // Process complete lines in the buffer
      const lines = buffer.split('\n')
      // Keep the last (potentially incomplete) line in the buffer
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed.startsWith('data:')) continue

        const jsonStr = trimmed.slice('data:'.length).trim()
        if (!jsonStr || jsonStr === '[DONE]') continue

        try {
          const parsed: unknown = JSON.parse(jsonStr)
          const text = extractTextDelta(parsed)
          if (text) yield text
        } catch {
          // Skip malformed SSE lines
        }
      }
    }

    // Flush any remaining buffer content
    if (buffer.trim().startsWith('data:')) {
      const jsonStr = buffer.trim().slice('data:'.length).trim()
      if (jsonStr && jsonStr !== '[DONE]') {
        try {
          const parsed: unknown = JSON.parse(jsonStr)
          const text = extractTextDelta(parsed)
          if (text) yield text
        } catch {
          // ignore
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}

/**
 * Extract text delta from a parsed SSE event object.
 * Supports the Bedrock contentBlockDelta format and a plain text field.
 */
function extractTextDelta(parsed: unknown): string | null {
  if (typeof parsed !== 'object' || parsed === null) return null

  const obj = parsed as Record<string, unknown>
  const event = typeof obj.event === 'object' && obj.event !== null
    ? obj.event as Record<string, unknown>
    : obj

  // Bedrock AgentCore SSE format
  if (
    event.contentBlockDelta &&
    typeof event.contentBlockDelta === 'object' &&
    event.contentBlockDelta !== null
  ) {
    const delta = (event.contentBlockDelta as Record<string, unknown>).delta
    if (typeof delta === 'object' && delta !== null) {
      const text = (delta as Record<string, unknown>).text
      if (typeof text === 'string') return text
    }
  }

  // Fallback: top-level text or content field
  if (typeof obj.text === 'string') return obj.text
  if (typeof obj.content === 'string') return obj.content
  if (typeof obj.response === 'string') return obj.response

  return null
}
