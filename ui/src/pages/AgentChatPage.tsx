import { useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { getCurrentUser } from 'aws-amplify/auth'
import ErrorBanner from '../components/ErrorBanner'
import LoadingSpinner from '../components/LoadingSpinner'
import useAgentChat from '../hooks/useAgentChat'

export default function AgentChatPage() {
  const { t } = useTranslation()
  const [actorId, setActorId] = useState<string | null>(null)
  const [identityLoading, setIdentityLoading] = useState(true)
  const [identityError, setIdentityError] = useState(false)
  const [input, setInput] = useState('')
  const { messages, sending, error, sendMessage } = useAgentChat(actorId)

  useEffect(() => {
    let active = true
    getCurrentUser()
      .then((user) => {
        if (active) setActorId(user.userId)
      })
      .catch(() => {
        if (active) setIdentityError(true)
      })
      .finally(() => {
        if (active) setIdentityLoading(false)
      })
    return () => { active = false }
  }, [])

  const submitMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const sent = await sendMessage(input)
    if (sent) setInput('')
  }

  return (
    <section className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-4xl flex-col gap-6" data-testid="agent-chat-page">
      <header>
        <p className="section-eyebrow">{t('assistant.eyebrow')}</p>
        <h1 className="page-title mt-2">{t('assistant.title')}</h1>
        <p className="page-description">{t('assistant.description')}</p>
      </header>

      <ErrorBanner message={identityError ? t('errors.assistantIdentityFailed') : error} />

      {identityLoading ? (
        <LoadingSpinner label={t('assistant.loadingAccount')} />
      ) : (
        <>
          <ol
            aria-label={t('assistant.conversation')}
            aria-live="polite"
            className="dashboard-card flex flex-1 flex-col gap-4 overflow-y-auto p-4 sm:p-6"
            data-testid="chat-history"
          >
            {messages.length === 0 && (
              <li className="m-auto text-center text-base-content/70">{t('assistant.empty')}</li>
            )}
            {messages.map((message, index) => (
              <li
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                data-testid={`chat-message-${message.role}`}
                key={`${index}-${message.role}`}
              >
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-content'
                      : 'bg-base-300 text-base-content'
                  }`}
                >
                  <p className="mb-1 text-xs font-semibold opacity-70">
                    {message.role === 'user' ? t('assistant.you') : t('assistant.assistant')}
                  </p>
                  <p>{message.content || (sending ? '…' : '')}</p>
                </div>
              </li>
            ))}
          </ol>

          <form className="flex items-end gap-3" data-testid="chat-form" onSubmit={(event) => void submitMessage(event)}>
            <label className="form-control flex-1">
              <span className="label-text mb-1">{t('assistant.message')}</span>
              <textarea
                aria-label={t('assistant.message')}
                className="textarea textarea-bordered min-h-14"
                data-testid="chat-message-input"
                disabled={!actorId || sending}
                onChange={(event) => setInput(event.target.value)}
                placeholder={t('assistant.placeholder')}
                required
                value={input}
              />
            </label>
            <button
              className="btn btn-primary"
              data-testid="send-chat-message"
              disabled={!actorId || sending || !input.trim()}
              type="submit"
            >
              {sending ? t('assistant.sending') : t('assistant.send')}
            </button>
          </form>
        </>
      )}
    </section>
  )
}
