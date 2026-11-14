import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface LoadingStateProps {
  className?: string
  rows?: number
}

export function LoadingState({ className, rows = 3 }: LoadingStateProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-28 w-full rounded-xl" />
      ))}
    </div>
  )
}
