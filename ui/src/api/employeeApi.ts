import { apiFetch } from './client'
import { getUiRuntimeConfig } from '../lib/amplify'
import type { Employee, CreateEmployeeInput, UpdateEmployeeInput, ListEmployeesParams } from '../types'

function apiBase(): string {
  const url = getUiRuntimeConfig().apiUrl
  return url.endsWith('/') ? url : `${url}/`
}

function buildQuery(params: Record<string, string | undefined>): string {
  const qs = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      qs.set(key, value)
    }
  }
  const str = qs.toString()
  return str ? `?${str}` : ''
}

export async function listEmployees(params?: ListEmployeesParams): Promise<Employee[]> {
  const query = buildQuery({
    hiredFrom: params?.hiredFrom,
    hiredTo: params?.hiredTo,
  })
  const result = await apiFetch<{ employees: Employee[] }>(`${apiBase()}employees${query}`)
  return result.employees
}

export async function getEmployee(id: string): Promise<Employee> {
  return apiFetch<Employee>(`${apiBase()}employees/${encodeURIComponent(id)}`)
}

export async function createEmployee(data: CreateEmployeeInput): Promise<Employee> {
  return apiFetch<Employee>(`${apiBase()}employees`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateEmployee(id: string, data: UpdateEmployeeInput): Promise<Employee> {
  return apiFetch<Employee>(`${apiBase()}employees/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}
