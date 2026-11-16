import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { invokeAgent } from '../api/agentApi'
import type { ChatMessage } from '../types'

export default function useAgentChat(actorId: string | null) {
  const { t } = useTranslation()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sendMessage = useCallback(async (content: string) => {
    const text = content.trim()
    if (!text || !actorId || sending) return false

    const userMessage: ChatMessage = { role: 'user', content: text }
    const assistantMessage: ChatMessage = { role: 'assistant', content: '' }
    const history = [...messages, userMessage]

    setMessages([...history, assistantMessage])
    setSending(true)
    setError(null)

    try {
      for await (const chunk of invokeAgent(history, actorId)) {
        setMessages((current) => {
          const last = current.at(-1)
          if (!last || last.role !== 'assistant') return current
          return [...current.slice(0, -1), { ...last, content: last.content + chunk }]
        })
      }
      return true
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : ''
      if (message.includes('not configured')) {
        setError(t('errors.assistantNotConfigured'))
      } else if (/AgentCore invocation failed: HTTP (401|403)/.test(message)) {
        setError(t('errors.assistantUnauthorized'))
      } else {
        setError(t('errors.assistantFailed'))
      }
      return false
    } finally {
      setSending(false)
    }
  }, [actorId, messages, sending, t])

  return { messages, sending, error, sendMessage }
}
