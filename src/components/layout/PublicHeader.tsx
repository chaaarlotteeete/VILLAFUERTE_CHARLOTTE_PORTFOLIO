import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'

import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { Button } from '@/components/ui/button'
import { PUBLIC_NAV, SITE_TITLE } from '@/lib/constants'
import { cn } from '@/lib/utils'

export function PublicHeader() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="font-display text-lg font-semibold no-underline">
          {SITE_TITLE}
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {PUBLIC_NAV.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'rounded-md px-3 py-2 text-sm no-underline transition-colors hover:bg-accent',
                  isActive && 'bg-accent font-medium text-accent-foreground',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X /> : <Menu />}
          </Button>
        </div>
      </div>

      {open ? (
        <nav className="border-t bg-background px-4 py-3 lg:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-1">
            {PUBLIC_NAV.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'rounded-md px-3 py-2 text-sm no-underline hover:bg-accent',
                    isActive && 'bg-accent font-medium',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </nav>
      ) : null}
    </header>
  )
}
