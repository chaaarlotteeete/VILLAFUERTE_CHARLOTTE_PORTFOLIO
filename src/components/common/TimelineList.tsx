import { Badge } from '@/components/ui/badge'
import { formatDateRange } from '@/utils/date'

interface TimelineItem {
  id: string
  title: string
  organization: string
  startDate?: string | null
  endDate?: string | null
  isCurrent?: boolean
  description?: string | null
  achievements?: string | null
}

interface TimelineListProps {
  items: TimelineItem[]
}

export function TimelineList({ items }: TimelineListProps) {
  return (
    <ol className="space-y-6 border-l border-border pl-6">
      {items.map((item) => (
        <li key={item.id} className="relative">
          <span className="absolute -left-[1.9rem] top-1.5 h-3 w-3 rounded-full border-2 border-primary bg-background" />
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold">{item.title}</h2>
              {item.isCurrent ? <Badge variant="success">Current</Badge> : null}
            </div>
            <p className="mt-1 text-sm font-medium text-muted-foreground">
              {item.organization}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatDateRange(item.startDate, item.endDate, item.isCurrent) ??
                'Dates unavailable'}
            </p>
            {item.description ? (
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed">
                {item.description}
              </p>
            ) : null}
            {item.achievements ? (
              <p className="mt-3 whitespace-pre-line text-sm text-muted-foreground">
                {item.achievements}
              </p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  )
}
