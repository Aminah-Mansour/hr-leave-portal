import { Languages } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function LanguageSwitcher() {
  const { t, i18n } = useTranslation()
  const isArabic = i18n.language.startsWith('ar')

  return (
    <button
      aria-label={isArabic ? t('app.switchToEnglish') : t('app.switchToArabic')}
      className="btn btn-ghost btn-sm gap-2 text-slate-600"
      data-testid="language-switcher"
      onClick={() => void i18n.changeLanguage(isArabic ? 'en' : 'ar')}
      type="button"
    >
      <Languages aria-hidden="true" className="size-4" />
      <span>{isArabic ? t('app.languageEnglish') : t('app.languageArabic')}</span>
    </button>
  )
}
