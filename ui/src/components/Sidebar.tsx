import { Bot, CalendarDays, ClipboardList, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router-dom'

const navigationItems = [
  { to: '/employees', label: 'nav.employees', Icon: Users },
  { to: '/leave', label: 'nav.leave', Icon: CalendarDays },
  { to: '/hr-requests', label: 'nav.hrRequests', Icon: ClipboardList },
  { to: '/assistant', label: 'nav.assistant', Icon: Bot },
]

interface SidebarProps {
  className?: string
}

export default function Sidebar({ className = '' }: SidebarProps) {
  const { t } = useTranslation()
  return (
    <nav aria-label={t('nav.main')} className={className}>
      <ul className="menu w-full gap-1.5 p-0">
        {navigationItems.map(({ to, label, Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              className={({ isActive }) =>
                `flex min-h-12 items-center gap-3 rounded-xl px-3.5 text-sm transition-colors ${
                  isActive
                    ? 'bg-teal-50 font-semibold text-primary'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              <Icon aria-hidden="true" className="size-[18px] shrink-0" />
              <span className="truncate">{t(label)}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
