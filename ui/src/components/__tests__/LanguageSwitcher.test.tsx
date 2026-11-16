import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import i18n, { LANGUAGE_STORAGE_KEY } from '../../i18n'
import LanguageSwitcher from '../LanguageSwitcher'

describe('LanguageSwitcher', () => {
  beforeEach(async () => {
    localStorage.removeItem(LANGUAGE_STORAGE_KEY)
    await i18n.changeLanguage('en')
  })

  afterEach(async () => {
    await i18n.changeLanguage('en')
    localStorage.removeItem(LANGUAGE_STORAGE_KEY)
  })

  it('switches between English and Arabic, updates direction, and persists the selection', async () => {
    const user = userEvent.setup()
    render(<LanguageSwitcher />)

    await user.click(screen.getByRole('button', { name: 'Switch language to Arabic' }))

    expect(await screen.findByRole('button', { name: 'تغيير اللغة إلى الإنجليزية' })).toBeInTheDocument()
    await waitFor(() => {
      expect(document.documentElement.lang).toBe('ar')
      expect(document.documentElement.dir).toBe('rtl')
      expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('ar')
    })

    await user.click(screen.getByRole('button', { name: 'تغيير اللغة إلى الإنجليزية' }))
    await waitFor(() => {
      expect(document.documentElement.lang).toBe('en')
      expect(document.documentElement.dir).toBe('ltr')
      expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('en')
    })
  })
})
