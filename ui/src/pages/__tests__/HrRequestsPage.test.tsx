import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn<() => Promise<{ userId: string }>>(),
  submitTimeOff: vi.fn<(request: { user_id: string; start_date: string; end_date: string }) => Promise<{ executionArn: string }>>(),
  submitHrRequest: vi.fn<(request: { user_id: string; prompt: string }) => Promise<{ executionArn: string }>>(),
}))

vi.mock('aws-amplify/auth', () => ({ getCurrentUser: mocks.getCurrentUser }))
vi.mock('../../api/hrRequestApi', () => ({
  submitTimeOff: mocks.submitTimeOff,
  submitHrRequest: mocks.submitHrRequest,
}))

import HrRequestsPage from '../HrRequestsPage'

describe('HrRequestsPage', () => {
  beforeEach(() => {
    mocks.getCurrentUser.mockReset()
    mocks.getCurrentUser.mockResolvedValue({ userId: 'user-123' })
    mocks.submitTimeOff.mockReset()
    mocks.submitHrRequest.mockReset()
    mocks.submitTimeOff.mockResolvedValue({ executionArn: 'arn:time-off-request' })
    mocks.submitHrRequest.mockResolvedValue({ executionArn: 'arn:hr-request' })
  })

  it('submits a time-off request for the signed-in user and confirms acceptance', async () => {
    const user = userEvent.setup()
    render(<HrRequestsPage />)

    await screen.findByTestId('time-off-form')
    await user.type(screen.getByTestId('time-off-start-date'), '2025-07-01')
    await user.type(screen.getByTestId('time-off-end-date'), '2025-07-05')
    await user.click(screen.getByTestId('submit-time-off'))

    await waitFor(() => {
      expect(mocks.submitTimeOff).toHaveBeenCalledWith({
        user_id: 'user-123',
        start_date: '2025-07-01',
        end_date: '2025-07-05',
      })
    })
    expect(await screen.findByTestId('request-confirmation')).toHaveTextContent('arn:time-off-request')
  })
})
