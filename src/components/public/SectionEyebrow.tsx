import type { ReactNode } from 'react'

interface SectionEyebrowProps {
  children: ReactNode
}

export function SectionEyebrow({ children }: SectionEyebrowProps) {
  return (
    <div className="inline-flex items-center gap-2 rounded-md bg-secondary-container px-3 py-1 font-mono text-[11px] tracking-wider text-on-secondary-fixed uppercase">
      {children}
    </div>
  )
}
