import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import Layout from '../Layout'

describe('Layout', () => {
  it('renders the shared navigation links', () => {
    render(
      <MemoryRouter initialEntries={['/employees']}>
        <Layout>Page content</Layout>
      </MemoryRouter>,
    )

    expect(screen.getAllByRole('link', { name: 'Employees' })).toHaveLength(2)
    expect(screen.getAllByRole('link', { name: 'Leave' })).toHaveLength(2)
    expect(screen.getAllByRole('link', { name: 'HR Requests' })).toHaveLength(2)
    expect(screen.getAllByRole('link', { name: 'AI Assistant' })).toHaveLength(2)
  })

  it('marks the active route with the primary navigation style', () => {
    render(
      <MemoryRouter initialEntries={['/leave']}>
        <Layout>Page content</Layout>
      </MemoryRouter>,
    )

    for (const link of screen.getAllByRole('link', { name: 'Leave' })) {
      expect(link).toHaveAttribute('aria-current', 'page')
      expect(link).toHaveClass('text-primary')
    }
  })

  it('renders children inside the main content area', () => {
    render(
      <MemoryRouter initialEntries={['/employees']}>
        <Layout>
          <h1>Employee directory</h1>
        </Layout>
      </MemoryRouter>,
    )

    expect(screen.getByRole('main')).toContainElement(
      screen.getByRole('heading', { name: 'Employee directory' }),
    )
  })
})
