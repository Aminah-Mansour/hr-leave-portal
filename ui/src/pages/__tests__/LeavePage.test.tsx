import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Employee, LeaveRecord } from '../../types'

const hooks = vi.hoisted(() => ({
  useEmployees: vi.fn(),
  useLeave: vi.fn(),
}))

vi.mock('../../hooks/useEmployees', () => ({ default: hooks.useEmployees }))
vi.mock('../../hooks/useLeave', () => ({ default: hooks.useLeave }))

import LeavePage from '../LeavePage'

const sampleEmployee: Employee = {
  id: 'emp-001',
  name: 'Alice Smith',
  department: 'Engineering',
  startDate: '2023-01-15',
  role: 'engineer',
}

const sampleLeave: LeaveRecord = {
  employeeId: 'emp-001',
  startDate: '2025-06-02',
  endDate: '2025-06-05',
  note: 'Family trip',
}

function setupHooks(leaveOverrides: Record<string, unknown> = {}) {
  hooks.useEmployees.mockReturnValue({
    employees: [sampleEmployee],
    loading: false,
    error: null,
  })
  hooks.useLeave.mockReturnValue({
    records: [sampleLeave],
    loading: false,
    saving: false,
    error: null,
    refresh: vi.fn(),
    createLeave: vi.fn(),
    updateLeave: vi.fn(),
    ...leaveOverrides,
  })
}

describe('LeavePage', () => {
  beforeEach(() => {
    hooks.useEmployees.mockReset()
    hooks.useLeave.mockReset()
    setupHooks()
  })

  it('renders leave records for the selected employee', () => {
    render(<LeavePage />)

    expect(screen.getByRole('heading', { name: 'Leave' })).toBeInTheDocument()
    expect(screen.getByTestId('employee-picker')).toHaveValue('emp-001')
    expect(screen.getByTestId('leave-table')).toBeInTheDocument()
    expect(screen.getByText('Family trip')).toBeInTheDocument()
    expect(hooks.useLeave).toHaveBeenCalledWith('emp-001', undefined)
  })

  it('applies the month filter to the selected employee leave query', () => {
    render(<LeavePage />)

    fireEvent.change(screen.getByTestId('leave-month-filter'), { target: { value: '2025-06' } })
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }))

    expect(hooks.useLeave).toHaveBeenLastCalledWith('emp-001', '2025-06')
  })

  it('shows a loading state while leave records are fetched', () => {
    setupHooks({ loading: true, records: [] })

    render(<LeavePage />)

    expect(screen.getByRole('status')).toHaveTextContent('Loading leave records')
  })

  it('shows an error banner when leave records fail to load', () => {
    setupHooks({ error: 'Leave records could not be loaded.' })

    render(<LeavePage />)

    expect(screen.getByRole('alert')).toHaveTextContent('Leave records could not be loaded.')
  })
})
