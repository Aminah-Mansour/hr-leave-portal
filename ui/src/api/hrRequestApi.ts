import { apiFetch } from './client'
import { getUiRuntimeConfig } from '../lib/amplify'
import type { HrRequestTimeOffInput, HrRequestGeneralInput, HrRequestResponse } from '../types'

function apiBase(): string {
  const url = getUiRuntimeConfig().apiUrl
  return url.endsWith('/') ? url : `${url}/`
}

export async function submitTimeOff(data: HrRequestTimeOffInput): Promise<HrRequestResponse> {
  return apiFetch<HrRequestResponse>(`${apiBase()}hr-requests/time-off`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function submitHrRequest(data: HrRequestGeneralInput): Promise<HrRequestResponse> {
  return apiFetch<HrRequestResponse>(`${apiBase()}hr-requests`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}
