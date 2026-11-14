import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'

import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import {
  ADMIN_BOTTOM_NAV,
  ADMIN_PRIMARY_NAV,
  ADMIN_SIDEBAR_STORAGE_KEY,
} from '@/lib/admin-nav'
import { SITE_TITLE } from '@/lib/constants'
import { cn } from '@/lib/utils'

function readStoredCollapsed(): boolean | null {
  try {
    const value = localStorage.getItem(ADMIN_SIDEBAR_STORAGE_KEY)
    if (value === null) return null
    return value === 'true'
  } catch {
    return null
  }
}

export function AdminLayout() {
  const { signOut, user } = useAuth()
  const location = useLocation()
  const isTabletUp = useMediaQuery('(min-width: 768px)')

  const [collapsed, setCollapsed] = useState(() => {
    const stored = readStoredCollapsed()
    if (stored !== null) return stored
    if (typeof window !== 'undefined') {
      return window.matchMedia('(min-width: 768px) and (max-width: 1023px)').matches
    }
    return false
  })
  const [mobileOpen, setMobileOpen] = useState(false)
  const showMobileMenu = mobileOpen && !isTabletUp

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem(ADMIN_SIDEBAR_STORAGE_KEY, String(next))
      } catch {
        // Ignore quota / private mode failures.
      }
      return next
    })
  }

  async function handleLogout() {
    setMobileOpen(false)
    await signOut()
  }

  const sidebarWidth = collapsed ? 'md:w-16' : 'md:w-64'
  const contentOffset = collapsed ? 'md:pl-16' : 'md:pl-64'
  const currentLabel =
    ADMIN_PRIMARY_NAV.find((item) => location.pathname.startsWith(item.href))
      ?.label ??
    (location.pathname.startsWith(ADMIN_BOTTOM_NAV.account.href)
      ? ADMIN_BOTTOM_NAV.account.label
      : 'Administration')

  return (
    <div className="min-h-svh bg-background">
      {/* Desktop / tablet persistent sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 hidden border-r border-border/80 bg-card shadow-sm transition-[width] duration-200 md:flex md:flex-col',
          sidebarWidth,
        )}
      >
        <AdminSidebar
          collapsed={collapsed}
          onToggleCollapsed={toggleCollapsed}
          onLogout={() => void handleLogout()}
        />
      </aside>

      {/* Mobile top navigation */}
      <header className="sticky top-0 z-50 border-b border-border/80 bg-background/95 backdrop-blur md:hidden">
        <div className="flex h-14 items-center justify-between gap-3 px-4">
          <div className="flex min-w-0 items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-expanded={showMobileMenu}
              aria-controls="admin-mobile-menu"
              aria-label={showMobileMenu ? 'Close menu' : 'Open menu'}
              onClick={() => setMobileOpen((value) => !value)}
            >
              {showMobileMenu ? <X /> : <Menu />}
            </Button>
            <Link
              to="/admin/dashboard"
              className="truncate font-display text-sm font-semibold no-underline"
            >
              {SITE_TITLE}
              <span className="ml-1 font-sans text-xs font-medium text-muted-foreground">
                CMS
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-1">
            <span className="hidden max-w-[9rem] truncate text-xs text-muted-foreground sm:inline">
              {user?.email}
            </span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {showMobileMenu ? (
        <div className="fixed inset-0 z-40 md:hidden" role="presentation">
          <button
            type="button"
            className="absolute inset-0 bg-foreground/20"
            aria-label="Close menu overlay"
            onClick={() => setMobileOpen(false)}
          />
          <div
            id="admin-mobile-menu"
            className="absolute inset-x-0 top-14 max-h-[calc(100svh-3.5rem)] overflow-y-auto border-b bg-card shadow-lg"
          >
            <AdminSidebar
              collapsed={false}
              onToggleCollapsed={toggleCollapsed}
              onNavigate={() => setMobileOpen(false)}
              onLogout={() => void handleLogout()}
            />
          </div>
        </div>
      ) : null}

      {/* Main content */}
      <div
        className={cn(
          'min-h-svh transition-[padding] duration-200',
          contentOffset,
        )}
      >
        <div className="sticky top-0 z-30 hidden h-14 items-center justify-between gap-3 border-b border-border/80 bg-background/90 px-6 backdrop-blur md:flex">
          <p className="text-sm font-medium text-foreground">{currentLabel}</p>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground lg:inline">
              {user?.email}
            </span>
            <ThemeToggle />
          </div>
        </div>

        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
