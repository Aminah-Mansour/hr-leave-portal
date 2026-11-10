import { useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { getCurrentUser } from 'aws-amplify/auth'
import { ApiError } from '../api/client'
import { submitHrRequest, submitTimeOff } from '../api/hrRequestApi'
import ErrorBanner from '../components/ErrorBanner'
import LoadingSpinner from '../components/LoadingSpinner'

function errorMessage(error: unknown, t: (key: string) => string): string {
  if (error instanceof ApiError) {
    if (error.status === 401 || error.status === 403) {
      return t('errors.requestUnauthorized')
    }
    if (error.status >= 500) {
      return t('errors.requestUnavailable')
    }
    return t('errors.requestInvalid')
  }
  return t('errors.requestFailed')
}

export default function HrRequestsPage() {
  const { t } = useTranslation()
  const [userId, setUserId] = useState<string | null>(null)
  const [identityLoading, setIdentityLoading] = useState(true)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [prompt, setPrompt] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [identityError, setIdentityError] = useState(false)
  const [confirmation, setConfirmation] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    getCurrentUser()
      .then((user) => {
        if (active) setUserId(user.userId)
      })
      .catch(() => {
        if (active) setIdentityError(true)
      })
      .finally(() => {
        if (active) setIdentityLoading(false)
      })
    return () => { active = false }
  }, [])

  const handleTimeOff = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!userId) return
    setSubmitting(true)
    setError(null)
    setConfirmation(null)
    try {
      const response = await submitTimeOff({ user_id: userId, start_date: startDate, end_date: endDate })
      setConfirmation(t('requests.confirmTimeOff', { reference: response.executionArn }))
      setStartDate('')
      setEndDate('')
    } catch (caught) {
      setError(errorMessage(caught, t))
    } finally {
      setSubmitting(false)
    }
  }

  const handleGeneralRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!userId) return
    setSubmitting(true)
    setError(null)
    setConfirmation(null)
    try {
      const response = await submitHrRequest({ user_id: userId, prompt: prompt.trim() })
      setConfirmation(t('requests.confirmGeneral', { reference: response.executionArn }))
      setPrompt('')
    } catch (caught) {
      setError(errorMessage(caught, t))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="space-y-6" data-testid="hr-requests-page">
      <header>
        <p className="section-eyebrow">{t('requests.eyebrow')}</p>
        <h1 className="page-title mt-2">{t('requests.title')}</h1>
        <p className="page-description">{t('requests.description')}</p>
      </header>

      <ErrorBanner message={identityError ? t('errors.identityFailed') : error} />
      {confirmation && (
        <div className="alert alert-success" data-testid="request-confirmation" role="status">
          <span>{confirmation}</span>
        </div>
      )}
      {identityLoading ? (
        <LoadingSpinner label={t('requests.loadingAccount')} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <form className="dashboard-card space-y-5 p-5 sm:p-7" data-testid="time-off-form" onSubmit={(event) => void handleTimeOff(event)}>
            <h2 className="text-xl font-semibold">{t('requests.timeOffTitle')}</h2>
            <label className="form-control">
              <span className="label-text mb-1">{t('common.startDate')}</span>
              <input
                className="input input-bordered"
                data-testid="time-off-start-date"
                onChange={(event) => setStartDate(event.target.value)}
                required
                type="date"
                value={startDate}
              />
            </label>
            <label className="form-control">
              <span className="label-text mb-1">{t('common.endDate')}</span>
              <input
                className="input input-bordered"
                data-testid="time-off-end-date"
                onChange={(event) => setEndDate(event.target.value)}
                required
                type="date"
                value={endDate}
              />
            </label>
            <button className="btn btn-primary self-start" data-testid="submit-time-off" disabled={!userId || submitting} type="submit">
              {submitting ? t('requests.sending') : t('requests.sendTimeOff')}
            </button>
          </form>

          <form className="dashboard-card space-y-5 p-5 sm:p-7" data-testid="general-hr-form" onSubmit={(event) => void handleGeneralRequest(event)}>
            <h2 className="text-xl font-semibold">{t('requests.generalTitle')}</h2>
            <label className="form-control">
              <span className="label-text mb-1">{t('requests.howCanWeHelp')}</span>
              <textarea
                className="textarea textarea-bordered min-h-32"
                data-testid="hr-inquiry-prompt"
                onChange={(event) => setPrompt(event.target.value)}
                required
                value={prompt}
              />
            </label>
            <button className="btn btn-primary self-start" data-testid="submit-hr-inquiry" disabled={!userId || submitting} type="submit">
              {submitting ? t('requests.sending') : t('requests.sendInquiry')}
            </button>
          </form>
        </div>
      )}
    </section>
  )
}
