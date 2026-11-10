// ---------------------------------------------------------------------------
// Employee types
// ---------------------------------------------------------------------------

export interface Employee {
  id: string
  name: string
  department: string
  startDate: string // ISO date string "YYYY-MM-DD"
  role: string
}

export interface CreateEmployeeInput {
  name: string
  department: string
  startDate: string // ISO date string "YYYY-MM-DD"
  role?: string
}

export interface UpdateEmployeeInput {
  name: string
  department: string
  startDate: string
  role?: string
}

export interface ListEmployeesParams {
  hiredFrom?: string // ISO date string "YYYY-MM-DD"
  hiredTo?: string   // ISO date string "YYYY-MM-DD"
}

// ---------------------------------------------------------------------------
// Leave types
// ---------------------------------------------------------------------------

export interface LeaveRecord {
  employeeId: string
  startDate: string  // ISO date string "YYYY-MM-DD"
  endDate: string    // ISO date string "YYYY-MM-DD"
  note?: string
}

export interface CreateLeaveInput {
  startDate: string
  endDate: string
  note?: string
}

export interface UpdateLeaveInput {
  endDate: string
  note?: string
}

export interface ListLeaveParams {
  month?: string // "YYYY-MM"
}

// ---------------------------------------------------------------------------
// HR Request types
// ---------------------------------------------------------------------------

export interface HrRequestTimeOffInput {
  user_id: string
  start_date: string // ISO date string "YYYY-MM-DD"
  end_date: string   // ISO date string "YYYY-MM-DD"
}

export interface HrRequestGeneralInput {
  user_id: string
  prompt: string
}

export interface HrRequestResponse {
  executionArn: string
}

// ---------------------------------------------------------------------------
// Agent Chat types
// ---------------------------------------------------------------------------

export type ChatRole = 'user' | 'assistant'

export interface ChatMessage {
  role: ChatRole
  content: string
}

export interface AgentInvokeRequest {
  messages: ChatMessage[]
  actorId: string
}

export interface AgentInvokeResponse {
  text: string
}
