import { describe, it, expect } from 'vitest'
import type {
  Employee,
  CreateEmployeeInput,
  UpdateEmployeeInput,
  LeaveRecord,
  CreateLeaveInput,
  UpdateLeaveInput,
  HrRequestTimeOffInput,
  HrRequestGeneralInput,
  HrRequestResponse,
  ChatMessage,
  AgentInvokeRequest,
} from '../index'

// ---------------------------------------------------------------------------
// Employee shapes
// ---------------------------------------------------------------------------

describe('Employee type', () => {
  it('accepts all required fields (FR2)', () => {
    const emp: Employee = {
      id: 'emp-001',
      name: 'Alice Smith',
      department: 'Engineering',
      startDate: '2023-01-15',
      role: 'engineer',
    }
    expect(emp.id).toBe('emp-001')
    expect(emp.name).toBe('Alice Smith')
    expect(emp.department).toBe('Engineering')
    expect(emp.startDate).toBe('2023-01-15')
    expect(emp.role).toBe('engineer')
  })

  it('CreateEmployeeInput allows optional role (FR2.2)', () => {
    const input: CreateEmployeeInput = {
      name: 'Bob Jones',
      department: 'HR',
      startDate: '2024-03-01',
    }
    expect(input.role).toBeUndefined()
  })

  it('UpdateEmployeeInput requires name, department, startDate (FR2.4)', () => {
    const input: UpdateEmployeeInput = {
      name: 'Bob Jones',
      department: 'HR',
      startDate: '2024-03-01',
    }
    expect(input.name).toBe('Bob Jones')
  })
})

// ---------------------------------------------------------------------------
// Leave shapes
// ---------------------------------------------------------------------------

describe('LeaveRecord type', () => {
  it('accepts all required fields (FR3)', () => {
    const leave: LeaveRecord = {
      employeeId: 'emp-001',
      startDate: '2024-07-01',
      endDate: '2024-07-05',
      note: 'Holiday',
    }
    expect(leave.employeeId).toBe('emp-001')
    expect(leave.startDate).toBe('2024-07-01')
  })

  it('CreateLeaveInput allows optional note (FR3.2)', () => {
    const input: CreateLeaveInput = {
      startDate: '2024-07-01',
      endDate: '2024-07-05',
    }
    expect(input.note).toBeUndefined()
  })

  it('UpdateLeaveInput requires endDate (FR3.3)', () => {
    const input: UpdateLeaveInput = { endDate: '2024-07-10' }
    expect(input.endDate).toBe('2024-07-10')
  })
})

// ---------------------------------------------------------------------------
// HR Request shapes
// ---------------------------------------------------------------------------

describe('HR Request types', () => {
  it('HrRequestTimeOffInput has required fields (FR4.1)', () => {
    const input: HrRequestTimeOffInput = {
      user_id: 'user-001',
      start_date: '2024-08-01',
      end_date: '2024-08-05',
    }
    expect(input.user_id).toBe('user-001')
  })

  it('HrRequestGeneralInput has user_id and prompt (FR4.2)', () => {
    const input: HrRequestGeneralInput = {
      user_id: 'user-001',
      prompt: 'What is the parental leave policy?',
    }
    expect(input.prompt).toBeDefined()
  })

  it('HrRequestResponse carries executionArn (FR4.3)', () => {
    const res: HrRequestResponse = {
      executionArn: 'arn:aws:states:us-east-1:123456789012:execution:StateMachine:abc',
    }
    expect(res.executionArn).toContain('arn:aws')
  })
})

// ---------------------------------------------------------------------------
// Chat / Agent shapes
// ---------------------------------------------------------------------------

describe('ChatMessage type', () => {
  it('accepts user role (FR5.3)', () => {
    const msg: ChatMessage = { role: 'user', content: 'Hello' }
    expect(msg.role).toBe('user')
  })

  it('accepts assistant role (FR5.2)', () => {
    const msg: ChatMessage = { role: 'assistant', content: 'Hi there' }
    expect(msg.role).toBe('assistant')
  })

  it('AgentInvokeRequest carries messages and actorId (FR5.4)', () => {
    const req: AgentInvokeRequest = {
      messages: [{ role: 'user', content: 'Hello' }],
      actorId: 'user-001',
    }
    expect(req.actorId).toBe('user-001')
    expect(req.messages).toHaveLength(1)
  })
})
