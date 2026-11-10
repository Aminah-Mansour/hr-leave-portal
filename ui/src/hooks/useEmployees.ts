import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  createEmployee as createEmployeeRequest,
  getEmployee as getEmployeeRequest,
  listEmployees,
  updateEmployee as updateEmployeeRequest,
} from '../api/employeeApi'
import { ApiError } from '../api/client'
import type {
  CreateEmployeeInput,
  Employee,
  ListEmployeesParams,
  UpdateEmployeeInput,
} from '../types'

function errorMessage(error: unknown, t: (key: string) => string): string {
  if (error instanceof ApiError) {
    if (error.status === 401 || error.status === 403) {
      return t('errors.employeeUnauthorized')
    }
    if (error.status >= 500) {
      return t('errors.employeeUnavailable')
    }
    return t('errors.employeeInvalid')
  }
  return t('errors.employeeLoad')
}

export default function useEmployees() {
  const { t } = useTranslation()
  const [employees, setEmployees] = useState<Employee[]>([])
  const filters = useRef<ListEmployeesParams>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async (nextFilters?: ListEmployeesParams) => {
    if (nextFilters) filters.current = nextFilters
    setLoading(true)
    setError(null)
    try {
      const result = await listEmployees(filters.current)
      setEmployees(result)
      return true
    } catch (caught) {
      setError(errorMessage(caught, t))
      return false
    } finally {
      setLoading(false)
    }
  }, [filters, t])

  useEffect(() => {
    let active = true
    listEmployees()
      .then((result) => {
        if (active) setEmployees(result)
      })
      .catch((caught: unknown) => {
        if (active) setError(errorMessage(caught, t))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [t])

  const getEmployee = useCallback(async (id: string): Promise<Employee | null> => {
    setError(null)
    try {
      return await getEmployeeRequest(id)
    } catch (caught) {
      setError(errorMessage(caught, t))
      return null
    }
  }, [t])

  const createEmployee = useCallback(async (data: CreateEmployeeInput): Promise<Employee | null> => {
    setSaving(true)
    setError(null)
    try {
      const created = await createEmployeeRequest(data)
      await refresh()
      return created
    } catch (caught) {
      setError(errorMessage(caught, t))
      return null
    } finally {
      setSaving(false)
    }
  }, [refresh, t])

  const updateEmployee = useCallback(async (
    id: string,
    data: UpdateEmployeeInput,
  ): Promise<Employee | null> => {
    setSaving(true)
    setError(null)
    try {
      const updated = await updateEmployeeRequest(id, data)
      await refresh()
      return updated
    } catch (caught) {
      setError(errorMessage(caught, t))
      return null
    } finally {
      setSaving(false)
    }
  }, [refresh, t])

  return { employees, loading, saving, error, refresh, getEmployee, createEmployee, updateEmployee }
}
