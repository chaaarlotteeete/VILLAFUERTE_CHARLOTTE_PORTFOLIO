import { MaterialIcon } from '@/components/public/MaterialIcon'
import { parseContentBoolean } from '@/lib/cms-defaults'
import { cn } from '@/lib/utils'
import type { SectionContentMap } from '@/services/cms'

interface FloatingActionsProps {
  live?: boolean
  content?: SectionContentMap
}

export function FloatingActions({ live, content = {} }: FloatingActionsProps) {
  const showContact = content.show_contact
    ? parseContentBoolean(content.show_contact)
    : true
  const showBackToTop = content.show_back_to_top
    ? parseContentBoolean(content.show_back_to_top)
    : true
  const showRealtime = content.show_realtime_indicator
    ? parseContentBoolean(content.show_realtime_indicator)
    : true
  const contactLabel = content.contact_label?.trim() || 'Hire Charlotte'
  const contactHref = content.contact_href?.trim() || '#contact'
  const position = content.position?.trim() || 'bottom-right'
  const isLeft = position === 'bottom-left'

  if (!showContact && !showBackToTop && !(showRealtime && live)) return null

  return (
    <aside
      className={cn(
        'fixed bottom-6 z-40 flex flex-col items-end gap-2.5',
        isLeft ? 'left-6 items-start' : 'right-6',
      )}
    >
      {showRealtime && live ? (
        <div className="rounded-full bg-surface-container-lowest px-3 py-1.5 font-mono text-[10px] text-tertiary shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
          Live updates on
        </div>
      ) : null}
      {showContact ? (
        <a
          href={contactHref}
          aria-label="Quick recruiter contact"
          className="flex items-center gap-2 rounded-full bg-primary-container px-4 py-2.5 font-mono text-[13px] text-on-primary no-underline shadow-[0_8px_20px_rgba(79,70,229,0.25)] transition-all hover:bg-primary"
        >
          <span className="h-2 w-2 animate-ping rounded-full bg-tertiary-fixed" />
          <MaterialIcon name="mail" className="text-base" />
          <span className="hidden sm:inline">{contactLabel}</span>
        </a>
      ) : null}
      {showBackToTop ? (
        <a
          href="#home"
          aria-label="Back to top"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-lowest text-on-surface-variant shadow-[0_2px_8px_rgba(0,0,0,0.06)] no-underline transition-colors hover:bg-surface-container-high hover:text-on-surface"
        >
          <MaterialIcon name="arrow_upward" className="text-lg leading-none" />
        </a>
      ) : null}
    </aside>
  )
}
