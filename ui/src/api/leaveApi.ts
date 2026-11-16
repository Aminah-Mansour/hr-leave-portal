import { apiFetch } from './client'
import { getUiRuntimeConfig } from '../lib/amplify'
import type { LeaveRecord, CreateLeaveInput, UpdateLeaveInput, ListLeaveParams } from '../types'

function apiBase(): string {
  const url = getUiRuntimeConfig().apiUrl
  return url.endsWith('/') ? url : `${url}/`
}

export async function listLeave(employeeId: string, params?: ListLeaveParams): Promise<LeaveRecord[]> {
  const qs = params?.month ? `?month=${encodeURIComponent(params.month)}` : ''
  const result = await apiFetch<{ leave: LeaveRecord[] }>(
    `${apiBase()}employees/${encodeURIComponent(employeeId)}/leave${qs}`,
  )
  return result.leave
}

export async function createLeave(
  employeeId: string,
  data: CreateLeaveInput,
): Promise<LeaveRecord> {
  return apiFetch<LeaveRecord>(
    `${apiBase()}employees/${encodeURIComponent(employeeId)}/leave`,
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
  )
}

export async function updateLeave(
  employeeId: string,
  startDate: string,
  data: UpdateLeaveInput,
): Promise<LeaveRecord> {
  return apiFetch<LeaveRecord>(
    `${apiBase()}employees/${encodeURIComponent(employeeId)}/leave/${encodeURIComponent(startDate)}`,
    {
      method: 'PUT',
      body: JSON.stringify(data),
    },
  )
}
