import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import type { Employee, LeaveRecord } from '../types'
import ErrorBanner from '../components/ErrorBanner'
import LoadingSpinner from '../components/LoadingSpinner'
import useEmployees from '../hooks/useEmployees'
import useLeave from '../hooks/useLeave'

type EditorMode = 'create' | 'edit' | null

interface LeaveFormValues {
  startDate: string
  endDate: string
  note: string
}

const emptyForm: LeaveFormValues = { startDate: '', endDate: '', note: '' }

function employeeId(employee: Employee): string {
  return employee.id || (employee as Employee & { employeeId?: string }).employeeId || ''
}

export default function LeavePage() {
  const { t } = useTranslation()
  const { employees, loading: employeesLoading, error: employeesError } = useEmployees()
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null)
  const [month, setMonth] = useState('')
  const [appliedMonth, setAppliedMonth] = useState('')
  const [editorMode, setEditorMode] = useState<EditorMode>(null)
  const [editingRecord, setEditingRecord] = useState<LeaveRecord | null>(null)
  const [form, setForm] = useState<LeaveFormValues>(emptyForm)
  const activeEmployeeId = selectedEmployeeId ?? (employees[0] ? employeeId(employees[0]) : '')
  const { records, loading, saving, error, refresh, createLeave, updateLeave } = useLeave(
    activeEmployeeId,
    appliedMonth || undefined,
  )

  const openCreate = () => {
    setEditingRecord(null)
    setForm(emptyForm)
    setEditorMode('create')
  }

  const openEdit = (record: LeaveRecord) => {
    setEditingRecord(record)
    setForm({ startDate: record.startDate, endDate: record.endDate, note: record.note ?? '' })
    setEditorMode('edit')
  }

  const submitLeave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = { endDate: form.endDate, note: form.note.trim() || undefined }
    const result = editorMode === 'create'
      ? await createLeave({ ...data, startDate: form.startDate })
      : editingRecord
        ? await updateLeave(editingRecord.startDate, data)
        : null
    if (result) setEditorMode(null)
  }

  const applyMonth = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setAppliedMonth(month)
  }

  const clearMonth = () => {
    setMonth('')
    setAppliedMonth('')
    refresh()
  }

  const combinedError = error ?? employeesError

  return (
    <section className="space-y-6" data-testid="leave-page">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="section-eyebrow">{t('leave.eyebrow')}</p>
          <h1 className="page-title mt-2">{t('leave.title')}</h1>
          <p className="page-description">{t('leave.description')}</p>
        </div>
        <button
          className="btn btn-primary"
          data-testid="new-leave-button"
          disabled={!activeEmployeeId}
          onClick={openCreate}
          type="button"
        >{t('leave.newLeave')}</button>
      </header>

      <ErrorBanner message={combinedError} />

      <div className="dashboard-card flex flex-wrap items-end gap-4 p-4 sm:p-5">
        <label className="form-control w-full max-w-sm">
          <span className="label-text mb-1">{t('leave.employee')}</span>
          <select
            aria-label={t('leave.employee')}
            className="select select-bordered"
            data-testid="employee-picker"
            disabled={employeesLoading}
            onChange={(event) => setSelectedEmployeeId(event.target.value)}
            value={activeEmployeeId}
          >
            <option value="">{t('leave.selectEmployee')}</option>
            {employees.map((employee) => (
              <option key={employeeId(employee)} value={employeeId(employee)}>
                {employee.name}
              </option>
            ))}
          </select>
        </label>
        <form className="flex flex-wrap items-end gap-3" onSubmit={applyMonth}>
          <label className="form-control">
            <span className="label-text mb-1">{t('leave.month')}</span>
            <input
              aria-label={t('leave.month')}
              className="input input-bordered"
              data-testid="leave-month-filter"
              onChange={(event) => setMonth(event.target.value)}
              type="month"
              value={month}
            />
          </label>
          <button className="btn btn-outline" type="submit">{t('common.apply')}</button>
          <button className="btn btn-ghost" onClick={clearMonth} type="button">{t('common.clear')}</button>
        </form>
      </div>

      {employeesLoading ? (
        <LoadingSpinner label={t('leave.loadingEmployees')} />
      ) : !activeEmployeeId ? (
        <p className="rounded-box bg-base-200 p-6 text-base-content/70">{t('leave.addEmployeeFirst')}</p>
      ) : loading ? (
        <LoadingSpinner label={t('leave.loadingRecords')} />
      ) : (
        <div className="dashboard-card overflow-x-auto">
          <table className="table table-zebra w-full" data-testid="leave-table">
            <thead>
              <tr><th>{t('common.startDate')}</th><th>{t('common.endDate')}</th><th>{t('common.note')}</th><th><span className="sr-only">{t('common.actions')}</span></th></tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={`${record.employeeId}-${record.startDate}`} data-testid="leave-row">
                  <td>{record.startDate}</td>
                  <td>{record.endDate}</td>
                  <td>{record.note || '—'}</td>
                  <td>
                    <button
                      className="btn btn-outline btn-sm"
                      data-testid={`edit-leave-${record.startDate}`}
                      onClick={() => openEdit(record)}
                      type="button"
                    >{t('common.edit')}</button>
                  </td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr><td className="py-8 text-center text-base-content/70" colSpan={4}>{t('leave.empty')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {editorMode && (
        <dialog aria-labelledby="leave-dialog-title" aria-modal="true" className="modal modal-open" open>
          <div className="modal-box space-y-4">
            <h2 className="text-xl font-semibold" id="leave-dialog-title">
              {editorMode === 'create' ? t('leave.createTitle') : t('leave.editTitle')}
            </h2>
            <form className="space-y-4" onSubmit={(event) => void submitLeave(event)}>
              <label className="form-control">
                <span className="label-text mb-1">{t('common.startDate')}</span>
                <input
                  className="input input-bordered"
                  data-testid="leave-start-date-input"
                  disabled={editorMode === 'edit'}
                  onChange={(event) => setForm({ ...form, startDate: event.target.value })}
                  required
                  type="date"
                  value={form.startDate}
                />
              </label>
              <label className="form-control">
                <span className="label-text mb-1">{t('common.endDate')}</span>
                <input
                  className="input input-bordered"
                  data-testid="leave-end-date-input"
                  onChange={(event) => setForm({ ...form, endDate: event.target.value })}
                  required
                  type="date"
                  value={form.endDate}
                />
              </label>
              <label className="form-control">
                <span className="label-text mb-1">{t('common.note')}</span>
                <textarea
                  className="textarea textarea-bordered"
                  data-testid="leave-note-input"
                  onChange={(event) => setForm({ ...form, note: event.target.value })}
                  value={form.note}
                />
              </label>
              <div className="modal-action">
                <button className="btn btn-ghost" onClick={() => setEditorMode(null)} type="button">{t('common.cancel')}</button>
                <button className="btn btn-primary" data-testid="save-leave-button" disabled={saving} type="submit">
                  {saving ? t('leave.saving') : t('leave.saveLeave')}
                </button>
              </div>
            </form>
          </div>
          <button aria-label={t('leave.closeDialog')} className="modal-backdrop" onClick={() => setEditorMode(null)} type="button" />
        </dialog>
      )}
    </section>
  )
}
