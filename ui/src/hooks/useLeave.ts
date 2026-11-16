import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ApiError } from '../api/client'
import {
  createLeave as createLeaveRequest,
  listLeave,
  updateLeave as updateLeaveRequest,
} from '../api/leaveApi'
import type {
  CreateLeaveInput,
  LeaveRecord,
  ListLeaveParams,
  UpdateLeaveInput,
} from '../types'

function errorMessage(error: unknown, t: (key: string) => string): string {
  if (error instanceof ApiError) {
    if (error.status === 401 || error.status === 403) {
      return t('errors.leaveUnauthorized')
    }
    if (error.status >= 500) {
      return t('errors.leaveUnavailable')
    }
    return t('errors.leaveInvalid')
  }
  return t('errors.leaveLoad')
}

interface LeaveLoadResult {
  key: string
  records: LeaveRecord[]
  error: string | null
}

export default function useLeave(employeeId: string, month?: string) {
  const { t } = useTranslation()
  const [loadVersion, setLoadVersion] = useState(0)
  const [loadResult, setLoadResult] = useState<LeaveLoadResult | null>(null)
  const [saving, setSaving] = useState(false)
  const [mutationError, setMutationError] = useState<string | null>(null)
  const requestKey = `${employeeId}|${month ?? ''}|${loadVersion}`

  useEffect(() => {
    if (!employeeId) return
    let active = true
    const params: ListLeaveParams = month ? { month } : {}
    listLeave(employeeId, params)
      .then((records) => {
        if (active) setLoadResult({ key: requestKey, records, error: null })
      })
      .catch((caught: unknown) => {
        if (active) setLoadResult({ key: requestKey, records: [], error: errorMessage(caught, t) })
      })
    return () => { active = false }
  }, [employeeId, month, requestKey, t])

  const currentResult = loadResult?.key === requestKey ? loadResult : null
  const records = currentResult?.records ?? []
  const loading = Boolean(employeeId) && currentResult === null
  const error = currentResult?.error ?? mutationError

  const refresh = useCallback(() => {
    setMutationError(null)
    setLoadVersion((version) => version + 1)
  }, [])

  const createLeave = useCallback(async (data: CreateLeaveInput): Promise<LeaveRecord | null> => {
    if (!employeeId) return null
    setSaving(true)
    setMutationError(null)
    try {
      const created = await createLeaveRequest(employeeId, data)
      await refresh()
      return created
    } catch (caught) {
      setMutationError(errorMessage(caught, t))
      return null
    } finally {
      setSaving(false)
    }
  }, [employeeId, refresh, t])

  const updateLeave = useCallback(async (
    startDate: string,
    data: UpdateLeaveInput,
  ): Promise<LeaveRecord | null> => {
    if (!employeeId) return null
    setSaving(true)
    setMutationError(null)
    try {
      const updated = await updateLeaveRequest(employeeId, startDate, data)
      await refresh()
      return updated
    } catch (caught) {
      setMutationError(errorMessage(caught, t))
      return null
    } finally {
      setSaving(false)
    }
  }, [employeeId, refresh, t])

  return { records, loading, saving, error, refresh, createLeave, updateLeave }
}
