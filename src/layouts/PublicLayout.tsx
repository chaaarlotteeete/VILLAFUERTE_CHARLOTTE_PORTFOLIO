import { Outlet, useLocation } from 'react-router-dom'

import { PublicFooter } from '@/components/layout/PublicFooter'
import { PublicHeader } from '@/components/layout/PublicHeader'
import { cn } from '@/lib/utils'

export function PublicLayout() {
  const location = useLocation()
  const isHome = location.pathname === '/' || location.pathname === ''
  const isProjectDetail = /^\/projects\/[^/]+\/?$/.test(location.pathname)
  const isFullBleed = isHome || isProjectDetail

  return (
    <div className="relative flex min-h-svh flex-col bg-surface">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-surface-container-lowest focus:px-3 focus:py-2 focus:shadow"
      >
        Skip to main content
      </a>

      {!isHome ? <PublicHeader compact={!isProjectDetail} /> : null}

      <main
        id="main-content"
        tabIndex={-1}
        className={cn(
          'w-full flex-1 bg-surface',
          isFullBleed
            ? 'pt-16'
            : 'mx-auto max-w-7xl px-6 pt-24 pb-12 lg:px-12',
        )}
      >
        <Outlet />
      </main>

      {!isHome ? <PublicFooter /> : null}
    </div>
  )
}
