interface ErrorBannerProps {
  message?: string | null
}

export default function ErrorBanner({ message }: ErrorBannerProps) {
  if (!message?.trim()) return null

  return (
    <div className="alert alert-error" role="alert">
      <span>{message}</span>
    </div>
  )
}
