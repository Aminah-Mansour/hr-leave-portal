import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Employee } from '../../types'

const employeeHook = vi.hoisted(() => ({ useEmployees: vi.fn() }))

vi.mock('../../hooks/useEmployees', () => ({ default: employeeHook.useEmployees }))

import EmployeesPage from '../EmployeesPage'

const sampleEmployee: Employee = {
  id: 'emp-001',
  name: 'Alice Smith',
  department: 'Engineering',
  startDate: '2023-01-15',
  role: 'engineer',
}

function employeesHookState(overrides: Record<string, unknown> = {}) {
  return {
    employees: [sampleEmployee],
    loading: false,
    saving: false,
    error: null,
    refresh: vi.fn(),
    getEmployee: vi.fn(),
    createEmployee: vi.fn(),
    updateEmployee: vi.fn(),
    ...overrides,
  }
}

describe('EmployeesPage', () => {
  beforeEach(() => {
    employeeHook.useEmployees.mockReset()
    employeeHook.useEmployees.mockReturnValue(employeesHookState())
  })

  it('renders the employee list', () => {
    render(<EmployeesPage />)

    expect(screen.getByRole('heading', { name: 'Employees' })).toBeInTheDocument()
    expect(screen.getByText('Alice Smith')).toBeInTheDocument()
    expect(screen.getByTestId('employees-table')).toBeInTheDocument()
  })

  it('filters the loaded employee records by search text', async () => {
    const user = userEvent.setup()
    const secondEmployee: Employee = {
      id: 'emp-002',
      name: 'Jordan Lee',
      department: 'Finance',
      startDate: '2024-04-20',
      role: 'analyst',
    }
    employeeHook.useEmployees.mockReturnValue(employeesHookState({ employees: [sampleEmployee, secondEmployee] }))

    render(<EmployeesPage />)
    await user.type(screen.getByRole('searchbox', { name: 'Search employees' }), 'alice')

    expect(screen.getByText('Alice Smith')).toBeInTheDocument()
    expect(screen.queryByText('Jordan Lee')).not.toBeInTheDocument()
  })

  it('filters the loaded employee records by department', async () => {
    const user = userEvent.setup()
    const secondEmployee: Employee = {
      id: 'emp-002',
      name: 'Jordan Lee',
      department: 'Finance',
      startDate: '2024-04-20',
      role: 'analyst',
    }
    employeeHook.useEmployees.mockReturnValue(employeesHookState({ employees: [sampleEmployee, secondEmployee] }))

    render(<EmployeesPage />)
    await user.selectOptions(screen.getByRole('combobox', { name: 'Filter by department' }), 'Finance')

    expect(screen.getByText('Jordan Lee')).toBeInTheDocument()
    expect(screen.queryByText('Alice Smith')).not.toBeInTheDocument()
  })

  it('shows a spinner while employees are loading', () => {
    employeeHook.useEmployees.mockReturnValue(employeesHookState({ loading: true }))

    render(<EmployeesPage />)

    expect(screen.getByRole('status')).toHaveTextContent('Loading employees')
  })

  it('shows an error banner when employee loading fails', () => {
    employeeHook.useEmployees.mockReturnValue(
      employeesHookState({ employees: [], error: 'Employees could not be loaded.' }),
    )

    render(<EmployeesPage />)

    expect(screen.getByRole('alert')).toHaveTextContent('Employees could not be loaded.')
  })

  it('opens the new employee modal', async () => {
    const user = userEvent.setup()
    render(<EmployeesPage />)

    await user.click(screen.getByTestId('new-employee-button'))

    expect(screen.getByRole('dialog', { name: 'New Employee' })).toBeInTheDocument()
    expect(screen.getByTestId('employee-name-input')).toBeInTheDocument()
  })
})
