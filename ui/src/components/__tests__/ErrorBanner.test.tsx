import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import ErrorBanner from '../ErrorBanner'

describe('ErrorBanner', () => {
  it('renders the error message', () => {
    render(<ErrorBanner message="Unable to load employees." />)

    expect(screen.getByRole('alert')).toHaveTextContent('Unable to load employees.')
  })

  it('does not render when the message is empty', () => {
    render(<ErrorBanner message="" />)

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
