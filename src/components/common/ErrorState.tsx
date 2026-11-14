import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
  className?: string
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'Unable to load this content right now. Please try again.',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-10 text-center',
        className,
      )}
    >
      <h2 className="text-lg font-medium">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      {onRetry ? (
        <Button className="mt-6" variant="outline" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  )
}
