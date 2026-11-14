import { ChevronDown, ChevronUp } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface ReorderControlsProps {
  onMoveUp: () => void
  onMoveDown: () => void
  disableUp?: boolean
  disableDown?: boolean
  className?: string
}

export function ReorderControls({
  onMoveUp,
  onMoveDown,
  disableUp,
  disableDown,
  className,
}: ReorderControlsProps) {
  return (
    <div className={cn('flex flex-col gap-0.5', className)}>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-8 w-8"
        disabled={disableUp}
        aria-label="Move up"
        onClick={onMoveUp}
      >
        <ChevronUp className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-8 w-8"
        disabled={disableDown}
        aria-label="Move down"
        onClick={onMoveDown}
      >
        <ChevronDown className="h-4 w-4" />
      </Button>
    </div>
  )
}