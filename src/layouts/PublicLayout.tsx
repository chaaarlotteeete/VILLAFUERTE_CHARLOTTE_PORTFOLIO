import { Outlet } from 'react-router-dom'

import { PublicFooter } from '@/components/layout/PublicFooter'
import { PublicHeader } from '@/components/layout/PublicHeader'

export function PublicLayout() {
  return (
    <div className="flex min-h-svh flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:shadow"
      >
        Skip to main content
      </a>
      <PublicHeader />
      <main
        id="main-content"
        className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10"
        tabIndex={-1}
      >
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  )
}
