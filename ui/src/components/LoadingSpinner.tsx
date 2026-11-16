interface LoadingSpinnerProps {
  label?: string
}

export default function LoadingSpinner({ label = 'Loading' }: LoadingSpinnerProps) {
  return (
    <div className="flex items-center gap-3 text-sm text-base-content/70" role="status">
      <span aria-hidden="true" className="loading loading-spinner loading-md text-primary" />
      <span>{label}</span>
    </div>
  )
}
