import { useMemo, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ArrowDownToLine,
  BriefcaseBusiness,
  CalendarDays,
  ChevronDown,
  CircleUserRound,
  Plus,
  RefreshCw,
  Search,
  UsersRound,
} from 'lucide-react'
import type { Employee } from '../types'
import ErrorBanner from '../components/ErrorBanner'
import LoadingSpinner from '../components/LoadingSpinner'
import useEmployees from '../hooks/useEmployees'

type EditorMode = 'create' | 'edit' | null

interface EmployeeFormValues {
  name: string
  department: string
  startDate: string
  role: string
}

const emptyForm: EmployeeFormValues = {
  name: '',
  department: '',
  startDate: '',
  role: 'employee',
}

function employeeId(employee: Employee): string {
  // The backend calls this field employeeId; older API fixtures use id.
  return employee.id || (employee as Employee & { employeeId?: string }).employeeId || ''
}

function initials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('') || '–'
}

function formatDate(value: string, locale: string): string {
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value || '—'
  return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
}

export default function EmployeesPage() {
  const { t, i18n } = useTranslation()
  const { employees, loading, saving, error, refresh, getEmployee, createEmployee, updateEmployee } = useEmployees()
  const [hiredFrom, setHiredFrom] = useState('')
  const [hiredTo, setHiredTo] = useState('')
  const [search, setSearch] = useState('')
  const [department, setDepartment] = useState('all')
  const [editorMode, setEditorMode] = useState<EditorMode>(null)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [form, setForm] = useState<EmployeeFormValues>(emptyForm)
  const [details, setDetails] = useState<Employee | null>(null)
  const [detailsLoading, setDetailsLoading] = useState(false)

  const departments = useMemo(
    () => [...new Set(employees.map((employee) => employee.department).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [employees],
  )

  const filteredEmployees = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase()
    return employees.filter((employee) => {
      const matchesDepartment = department === 'all' || employee.department === department
      const searchable = `${employee.name} ${employee.department} ${employee.role ?? ''}`.toLocaleLowerCase()
      return matchesDepartment && (!normalizedSearch || searchable.includes(normalizedSearch))
    })
  }, [employees, search, department])

  const newHiresThisMonth = useMemo(() => {
    const now = new Date()
    return employees.filter((employee) => {
      const hireDate = new Date(`${employee.startDate}T00:00:00`)
      return !Number.isNaN(hireDate.getTime()) &&
        hireDate.getMonth() === now.getMonth() &&
        hireDate.getFullYear() === now.getFullYear()
    }).length
  }, [employees])

  const openCreate = () => {
    setEditingEmployee(null)
    setForm(emptyForm)
    setEditorMode('create')
  }

  const openEdit = (employee: Employee) => {
    setEditingEmployee(employee)
    setForm({
      name: employee.name,
      department: employee.department,
      startDate: employee.startDate,
      role: employee.role ?? 'employee',
    })
    setEditorMode('edit')
  }

  const openDetails = async (employee: Employee) => {
    setDetailsLoading(true)
    const result = await getEmployee(employeeId(employee))
    setDetailsLoading(false)
    if (result) setDetails(result)
  }

  const submitEmployee = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const values = {
      name: form.name.trim(),
      department: form.department.trim(),
      startDate: form.startDate,
      role: form.role.trim() || undefined,
    }

    const result = editorMode === 'create'
      ? await createEmployee(values)
      : editingEmployee
        ? await updateEmployee(employeeId(editingEmployee), values)
        : null

    if (result) setEditorMode(null)
  }

  const applyFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void refresh({ hiredFrom: hiredFrom || undefined, hiredTo: hiredTo || undefined })
  }

  const clearFilters = () => {
    setHiredFrom('')
    setHiredTo('')
    void refresh({})
  }

  return (
    <section className="space-y-7 sm:space-y-8" data-testid="employees-page">
      <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="section-eyebrow">{t('employees.eyebrow')}</p>
          <h1 className="page-title mt-2">{t('employees.title')}</h1>
          <p className="page-description">{t('employees.description')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            aria-label={t('employees.refreshEmployees')}
            className="btn btn-outline border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50"
            disabled={loading}
            onClick={() => void refresh()}
            type="button"
          >
            <RefreshCw aria-hidden="true" className={`size-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{t('employees.refresh')}</span>
          </button>
          <button className="btn btn-primary shadow-sm" data-testid="new-employee-button" onClick={openCreate}>
            <Plus aria-hidden="true" className="size-4" />
            {t('employees.newEmployee')}
          </button>
        </div>
      </header>

      <ErrorBanner message={error} />

      <div aria-label={t('employees.overview')} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="dashboard-card flex items-start justify-between p-5 sm:p-6">
          <div>
            <p className="text-sm font-medium text-slate-500">{t('employees.totalEmployees')}</p>
            <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{loading ? '—' : employees.length}</p>
            <p className="mt-2 text-xs text-slate-500">{t('employees.directoryPeople')}</p>
          </div>
          <span className="flex size-11 items-center justify-center rounded-xl bg-blue-50 text-blue-800">
            <UsersRound aria-hidden="true" className="size-5" />
          </span>
        </article>

        <article className="dashboard-card flex items-start justify-between p-5 sm:p-6">
          <div>
            <p className="text-sm font-medium text-slate-500">{t('employees.departments')}</p>
            <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{loading ? '—' : departments.length}</p>
            <p className="mt-2 text-xs text-slate-500">{t('employees.organizationTeams')}</p>
          </div>
          <span className="flex size-11 items-center justify-center rounded-xl bg-teal-50 text-teal-800">
            <BriefcaseBusiness aria-hidden="true" className="size-5" />
          </span>
        </article>

        <article className="dashboard-card flex items-start justify-between p-5 sm:p-6">
          <div>
            <p className="text-sm font-medium text-slate-500">{t('employees.joinedThisMonth')}</p>
            <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{loading ? '—' : newHiresThisMonth}</p>
            <p className="mt-2 text-xs text-slate-500">{t('employees.newTeamMembers')}</p>
          </div>
          <span className="flex size-11 items-center justify-center rounded-xl bg-violet-50 text-violet-800">
            <CalendarDays aria-hidden="true" className="size-5" />
          </span>
        </article>

        <article className="dashboard-card flex items-start justify-between p-5 sm:p-6">
          <div>
            <p className="text-sm font-medium text-slate-500">{t('employees.showing')}</p>
            <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{loading ? '—' : filteredEmployees.length}</p>
            <p className="mt-2 text-xs text-slate-500">{t('employees.matchingEmployees')}</p>
          </div>
          <span className="flex size-11 items-center justify-center rounded-xl bg-amber-50 text-amber-800">
            <CircleUserRound aria-hidden="true" className="size-5" />
          </span>
        </article>
      </div>

      <section aria-labelledby="directory-heading" className="dashboard-card overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900" id="directory-heading">{t('employees.directory')}</h2>
            <p className="mt-1 text-sm text-slate-500">{t('employees.directoryDescription')}</p>
          </div>
          <button
            className="btn btn-ghost btn-sm hidden gap-2 text-slate-600 sm:inline-flex"
            onClick={() => void refresh()}
            type="button"
          >
            <ArrowDownToLine aria-hidden="true" className="size-4" />
            <span>{t('employees.refreshList')}</span>
          </button>
        </div>

        <div className="space-y-4 border-b border-slate-100 bg-slate-50/70 p-4 sm:px-6 sm:py-5">
          <div className="grid gap-3 lg:grid-cols-[minmax(240px,1fr)_220px_auto]">
            <label className="relative block">
              <span className="sr-only">{t('employees.searchLabel')}</span>
              <Search aria-hidden="true" className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                aria-label={t('employees.searchLabel')}
                className="input input-bordered w-full border-slate-200 bg-white ps-10 text-sm focus:border-primary"
                data-testid="employees-search"
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t('employees.searchPlaceholder')}
                type="search"
                value={search}
              />
            </label>
            <label className="relative block">
              <span className="sr-only">{t('employees.filterDepartment')}</span>
              <select
                aria-label={t('employees.filterDepartment')}
                className="select select-bordered w-full appearance-none border-slate-200 bg-white pe-10 text-sm"
                data-testid="department-filter"
                onChange={(event) => setDepartment(event.target.value)}
                value={department}
              >
                <option value="all">{t('common.allDepartments')}</option>
                {departments.map((team) => <option key={team} value={team}>{team}</option>)}
              </select>
              <ChevronDown aria-hidden="true" className="pointer-events-none absolute end-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            </label>
            <form className="flex flex-wrap items-center gap-2" onSubmit={applyFilters}>
              <label className="sr-only" htmlFor="hired-from-filter">{t('employees.hiredFrom')}</label>
              <input
                aria-label={t('employees.hiredFrom')}
                className="input input-bordered min-w-0 flex-1 border-slate-200 bg-white text-sm sm:w-36 sm:flex-none"
                data-testid="hired-from-filter"
                id="hired-from-filter"
                onChange={(event) => setHiredFrom(event.target.value)}
                type="date"
                value={hiredFrom}
              />
              <label className="sr-only" htmlFor="hired-to-filter">{t('employees.hiredTo')}</label>
              <input
                aria-label={t('employees.hiredTo')}
                className="input input-bordered min-w-0 flex-1 border-slate-200 bg-white text-sm sm:w-36 sm:flex-none"
                data-testid="hired-to-filter"
                id="hired-to-filter"
                onChange={(event) => setHiredTo(event.target.value)}
                type="date"
                value={hiredTo}
              />
              <button aria-label={t('employees.applyDateFilters')} className="btn btn-primary btn-square" type="submit">
                <Search aria-hidden="true" className="size-4" />
              </button>
              <button className="btn btn-ghost btn-sm text-slate-600" onClick={clearFilters} type="button">{t('common.clear')}</button>
            </form>
          </div>
        </div>

        {loading ? (
          <div className="min-h-56 p-8"><LoadingSpinner label={t('employees.loading')} /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full" data-testid="employees-table">
              <thead>
                <tr className="border-b border-slate-100 bg-white text-[11px] uppercase tracking-[0.1em] text-slate-500">
                  <th className="py-4 ps-5 font-semibold sm:ps-6">{t('common.employee')}</th>
                  <th className="py-4 font-semibold">{t('common.department')}</th>
                  <th className="py-4 font-semibold">{t('common.hireDate')}</th>
                  <th className="py-4 font-semibold">{t('common.role')}</th>
                  <th className="py-4 pe-5 text-end font-semibold sm:pe-6"><span className="sr-only">{t('common.actions')}</span></th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((employee) => {
                  const id = employeeId(employee)
                  return (
                    <tr className="border-b border-slate-100 last:border-0 hover:bg-slate-50/80" key={id} data-testid="employee-row">
                      <td className="py-4 ps-5 sm:ps-6">
                        <div className="flex min-w-[190px] items-center gap-3">
                          <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-teal-50 text-xs font-bold text-teal-800">
                            {initials(employee.name)}
                          </span>
                          <span>
                            <span className="block font-semibold text-slate-800">{employee.name}</span>
                            <span className="mt-0.5 block text-xs text-slate-400">{t('common.employee')}</span>
                          </span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap py-4 text-sm text-slate-600">{employee.department || '—'}</td>
                      <td className="whitespace-nowrap py-4 text-sm text-slate-600">{formatDate(employee.startDate, i18n.language)}</td>
                      <td className="py-4">
                        <span className="badge badge-outline border-slate-200 bg-slate-50 font-medium text-slate-600">{employee.role || t('common.employee')}</span>
                      </td>
                      <td className="py-4 pe-5 text-end sm:pe-6">
                        <div className="flex justify-end gap-1.5">
                          <button
                            className="btn btn-ghost btn-sm text-slate-600 hover:bg-teal-50 hover:text-teal-800"
                            data-testid={`view-employee-${id}`}
                            onClick={() => void openDetails(employee)}
                            type="button"
                          >{t('common.view')}</button>
                          <button
                            className="btn btn-outline btn-sm border-slate-200 bg-white text-slate-700 hover:border-primary hover:bg-teal-50"
                            data-testid={`edit-employee-${id}`}
                            onClick={() => openEdit(employee)}
                            type="button"
                          >{t('common.edit')}</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {filteredEmployees.length === 0 && (
                  <tr>
                    <td className="py-16 text-center" colSpan={5}>
                      <UsersRound aria-hidden="true" className="mx-auto size-8 text-slate-300" />
                      <p className="mt-3 font-semibold text-slate-700">{t('employees.emptyTitle')}</p>
                      <p className="mt-1 text-sm text-slate-500">{t('employees.emptyDescription')}</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        <footer className="flex items-center justify-between border-t border-slate-100 px-5 py-3.5 text-xs text-slate-500 sm:px-6">
          <span>{loading ? t('employees.loadingDirectory') : t('employees.resultCount', { visible: filteredEmployees.length, total: employees.length })}</span>
          <span className="hidden sm:inline">{t('employees.dataCaption')}</span>
        </footer>
      </section>

      {editorMode && (
        <dialog aria-labelledby="employee-dialog-title" aria-modal="true" className="modal modal-open" open>
          <div className="modal-box max-w-lg space-y-5 rounded-2xl border border-slate-100 bg-white p-6 shadow-xl sm:p-8">
            <div>
              <p className="section-eyebrow">{t('employees.record')}</p>
              <h2 className="mt-2 text-xl font-bold text-slate-900" id="employee-dialog-title">
                {editorMode === 'create' ? t('employees.createTitle') : t('employees.editTitle')}
              </h2>
              <p className="mt-1 text-sm text-slate-500">{t('employees.formDescription')}</p>
            </div>
            <form className="space-y-4" onSubmit={(event) => void submitEmployee(event)}>
              <label className="form-control gap-1.5">
                <span className="label-text font-medium text-slate-700">{t('common.name')}</span>
                <input className="input input-bordered w-full border-slate-200 bg-white" data-testid="employee-name-input" onChange={(event) => setForm({ ...form, name: event.target.value })} required value={form.name} />
              </label>
              <label className="form-control gap-1.5">
                <span className="label-text font-medium text-slate-700">{t('common.department')}</span>
                <input className="input input-bordered w-full border-slate-200 bg-white" data-testid="employee-department-input" onChange={(event) => setForm({ ...form, department: event.target.value })} required value={form.department} />
              </label>
              <label className="form-control gap-1.5">
                <span className="label-text font-medium text-slate-700">{t('common.hireDate')}</span>
                <input className="input input-bordered w-full border-slate-200 bg-white" data-testid="employee-start-date-input" onChange={(event) => setForm({ ...form, startDate: event.target.value })} required type="date" value={form.startDate} />
              </label>
              <label className="form-control gap-1.5">
                <span className="label-text font-medium text-slate-700">{t('common.role')}</span>
                <input className="input input-bordered w-full border-slate-200 bg-white" data-testid="employee-role-input" onChange={(event) => setForm({ ...form, role: event.target.value })} value={form.role} />
              </label>
              <div className="modal-action mt-6">
                <button className="btn btn-ghost text-slate-600" onClick={() => setEditorMode(null)} type="button">{t('common.cancel')}</button>
                <button className="btn btn-primary min-w-32" data-testid="save-employee-button" disabled={saving} type="submit">
                  {saving ? t('common.saving') : t('employees.saveEmployee')}
                </button>
              </div>
            </form>
          </div>
          <button aria-label={t('common.close')} className="modal-backdrop" onClick={() => setEditorMode(null)} type="button" />
        </dialog>
      )}

      {detailsLoading && <LoadingSpinner label={t('common.loading')} />}
      {details && (
        <dialog aria-labelledby="employee-details-title" aria-modal="true" className="modal modal-open" open>
          <div className="modal-box max-w-lg space-y-5 rounded-2xl border border-slate-100 bg-white p-6 shadow-xl sm:p-8">
            <div>
              <p className="section-eyebrow">{t('employees.record')}</p>
              <h2 className="mt-2 text-xl font-bold text-slate-900" id="employee-details-title">{t('employees.detailsTitle')}</h2>
            </div>
            <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-3 rounded-xl bg-slate-50 p-5 text-sm">
              <dt className="font-medium text-slate-500">{t('common.name')}</dt><dd className="font-semibold text-slate-800">{details.name}</dd>
              <dt className="font-medium text-slate-500">{t('common.department')}</dt><dd className="font-semibold text-slate-800">{details.department}</dd>
              <dt className="font-medium text-slate-500">{t('common.hireDate')}</dt><dd className="font-semibold text-slate-800">{formatDate(details.startDate, i18n.language)}</dd>
              <dt className="font-medium text-slate-500">{t('common.role')}</dt><dd className="font-semibold text-slate-800">{details.role}</dd>
              <dt className="font-medium text-slate-500">{t('employees.employeeId')}</dt><dd className="break-all font-semibold text-slate-800">{employeeId(details)}</dd>
            </dl>
            <div className="modal-action">
              <button className="btn btn-primary" onClick={() => setDetails(null)} type="button">{t('common.close')}</button>
            </div>
          </div>
          <button aria-label={t('employees.closeDetails')} className="modal-backdrop" onClick={() => setDetails(null)} type="button" />
        </dialog>
      )}
    </section>
  )
}
