import type { ReactNode } from 'react'
import { BriefcaseBusiness, ChevronRight, CircleHelp, Search } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Sidebar from './Sidebar'
import LanguageSwitcher from './LanguageSwitcher'

interface LayoutProps {
  children: ReactNode
}

const pageNames: Record<string, string> = {
  '/employees': 'nav.employees',
  '/leave': 'nav.leaveManagement',
  '/hr-requests': 'nav.hrRequests',
  '/assistant': 'nav.assistant',
}

export default function Layout({ children }: LayoutProps) {
  const { pathname } = useLocation()
  const { t, i18n } = useTranslation()
  const pageName = t(pageNames[pathname] ?? 'nav.employees')

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800" dir={i18n.dir()}>
      <aside className="fixed inset-y-0 start-0 z-30 hidden w-[264px] flex-col border-e border-slate-200 bg-white px-5 py-6 md:flex">
        <Link
          className="mb-10 flex items-center gap-3 rounded-xl px-1 text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          to="/employees"
        >
          <span className="flex size-11 items-center justify-center rounded-xl bg-secondary text-white shadow-sm">
            <BriefcaseBusiness aria-hidden="true" className="size-5" />
          </span>
          <span className="min-w-0">
            <span className="block text-base font-bold tracking-tight">{t('app.product')}</span>
            <span className="mt-0.5 block text-xs font-medium text-slate-500">{t('app.platform')}</span>
          </span>
        </Link>

        <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">{t('nav.section')}</p>
        <Sidebar />

        <div className="mt-auto rounded-2xl bg-slate-50 p-4">
          <div className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-800">
              <CircleHelp aria-hidden="true" className="size-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-800">{t('app.needHelp')}</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">{t('app.helpDescription')}</p>
              <Link className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline" to="/assistant">
                {t('app.askQuestion')} <ChevronRight aria-hidden="true" className="size-3.5 rtl:rotate-180" />
              </Link>
            </div>
          </div>
        </div>
        <p className="px-3 pt-5 text-[11px] text-slate-400">{t('app.workspaceFooter')}</p>
      </aside>

      <div className="min-h-screen md:ps-[264px]">
        <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 backdrop-blur">
          <div className="flex h-[72px] items-center justify-between gap-4 px-4 sm:px-7 lg:px-10">
            <div className="flex min-w-0 items-center gap-3">
              <Link className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-white md:hidden" to="/employees" aria-label={t('app.home')}>
                <BriefcaseBusiness aria-hidden="true" className="size-5" />
              </Link>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                  <span className="hidden sm:inline">{t('app.peopleOperations')}</span>
                  <ChevronRight aria-hidden="true" className="hidden size-3.5 sm:inline rtl:rotate-180" />
                  <span className="truncate text-slate-600">{pageName}</span>
                </div>
                <p className="mt-1 truncate text-sm font-semibold text-slate-900">{t('app.greeting')}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-5">
              <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-400 lg:flex">
                <Search aria-hidden="true" className="size-4" />
                <span>{t('app.peopleWorkspace')}</span>
              </div>
              <LanguageSwitcher />
              <div className="flex items-center gap-2.5 border-s border-slate-200 ps-3 sm:ps-5">
                <span aria-hidden="true" className="flex size-9 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-800">HR</span>
                <span className="hidden sm:block">
                  <span className="block text-xs font-semibold text-slate-800">{t('app.hrTeam')}</span>
                  <span className="block text-[11px] text-slate-500">{t('app.workspace')}</span>
                </span>
              </div>
            </div>
          </div>
        </header>

        <main className="min-h-[calc(100vh-72px)] px-4 pb-28 pt-7 sm:px-7 sm:pt-9 md:pb-10 lg:px-10">
          <div className="mx-auto w-full max-w-[1440px]">{children}</div>
        </main>

        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-2 py-2 backdrop-blur md:hidden">
          <Sidebar className="[&>ul]:menu-horizontal [&>ul]:justify-around [&>ul]:gap-0 [&>ul]:p-0 [&_a]:min-h-14 [&_a]:flex-col [&_a]:gap-1 [&_a]:px-1 [&_a]:py-1.5 [&_a]:text-[10px] [&_svg]:size-[18px]" />
        </div>
      </div>
    </div>
  )
}
