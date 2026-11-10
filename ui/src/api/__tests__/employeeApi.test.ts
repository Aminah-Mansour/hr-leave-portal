import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { Employee } from '../../types'

// ---------------------------------------------------------------------------
// Mock the shared fetch client
// ---------------------------------------------------------------------------

const { mockApiFetch } = vi.hoisted(() => ({
  mockApiFetch: vi.fn(),
}))

vi.mock('../client', () => ({
  apiFetch: mockApiFetch,
  ApiError: class ApiError extends Error {
    status: number
    body: unknown

    constructor(
      status: number,
      body: unknown,
      message: string,
    ) {
      super(message)
      this.name = 'ApiError'
      this.status = status
      this.body = body
    }
  },
}))

// Set the Vite value before importing the module that captures it at load time.
vi.stubEnv('VITE_API_URL', 'https://api.example.com/prod/')

const { listEmployees, getEmployee, createEmployee } = await import('../employeeApi')

const sampleEmployee: Employee = {
  id: 'emp-001',
  name: 'Alice Smith',
  department: 'Engineering',
  startDate: '2023-01-15',
  role: 'engineer',
}

beforeEach(() => {
  mockApiFetch.mockClear()
  vi.stubEnv('VITE_API_URL', 'https://api.example.com/prod/')
})
afterEach(() => vi.unstubAllEnvs())

describe('listEmployees (FR2.1)', () => {
  it('returns employee array from API response', async () => {
    mockApiFetch.mockResolvedValue({ employees: [sampleEmployee] })

    const result = await listEmployees()
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Alice Smith')
  })

  it('passes hiredFrom and hiredTo as query params (FR2.5)', async () => {
    mockApiFetch.mockResolvedValue({ employees: [] })

    await listEmployees({ hiredFrom: '2023-01-01', hiredTo: '2023-12-31' })

    const calledUrl: string = mockApiFetch.mock.calls[0][0]
    expect(calledUrl).toContain('hiredFrom=2023-01-01')
    expect(calledUrl).toContain('hiredTo=2023-12-31')
  })

  it('omits query params when not provided', async () => {
    mockApiFetch.mockResolvedValue({ employees: [] })

    await listEmployees()

    const calledUrl: string = mockApiFetch.mock.calls[0][0]
    expect(calledUrl).not.toContain('?')
  })
})

describe('createEmployee (FR2.2)', () => {
  beforeEach(() => mockApiFetch.mockClear())

  it('POSTs to /employees and returns created employee', async () => {
    mockApiFetch.mockResolvedValue(sampleEmployee)

    const result = await createEmployee({
      name: 'Alice Smith',
      department: 'Engineering',
      startDate: '2023-01-15',
    })

    expect(result.id).toBe('emp-001')
    expect(mockApiFetch.mock.calls[0][1]?.method).toBe('POST')
  })
})

describe('getEmployee — error path (FR2.3)', () => {
  beforeEach(() => mockApiFetch.mockClear())

  it('calls apiFetch with correct URL for a given employee id', async () => {
    mockApiFetch.mockResolvedValue(sampleEmployee)

    await getEmployee('emp-123')

    const calledUrl: string = mockApiFetch.mock.calls[0][0]
    expect(calledUrl).toContain('/employees/emp-123')
  })
})
