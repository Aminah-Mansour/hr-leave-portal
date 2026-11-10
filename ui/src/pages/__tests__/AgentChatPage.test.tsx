import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn<() => Promise<{ userId: string }>>(),
  invokeAgent: vi.fn<(messages: unknown[], actorId: string) => AsyncGenerator<string>>(),
}))

vi.mock('aws-amplify/auth', () => ({ getCurrentUser: mocks.getCurrentUser }))
vi.mock('../../api/agentApi', () => ({ invokeAgent: mocks.invokeAgent }))

import AgentChatPage from '../AgentChatPage'

describe('AgentChatPage', () => {
  beforeEach(() => {
    mocks.getCurrentUser.mockReset()
    mocks.getCurrentUser.mockResolvedValue({ userId: 'user-456' })
    mocks.invokeAgent.mockReset()
    mocks.invokeAgent.mockImplementation(async function* () {
      yield 'Your leave balance is '
      yield '12 days.'
    })
  })

  it('sends a message and displays the user and streamed assistant messages', async () => {
    const user = userEvent.setup()
    render(<AgentChatPage />)

    const input = await screen.findByRole('textbox', { name: 'Message' })
    await user.type(input, 'How much leave do I have?')
    await user.click(screen.getByTestId('send-chat-message'))

    expect(await screen.findByTestId('chat-message-user')).toHaveTextContent('How much leave do I have?')
    expect(await screen.findByText('Your leave balance is 12 days.')).toBeInTheDocument()
    await waitFor(() => {
      expect(mocks.invokeAgent).toHaveBeenCalledWith(
        [{ role: 'user', content: 'How much leave do I have?' }],
        'user-456',
      )
    })
  })
})
