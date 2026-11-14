import {
  ChevronsLeft,
  ChevronsRight,
  type LucideIcon,
} from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  ADMIN_BOTTOM_NAV,
  ADMIN_PRIMARY_NAV,
} from '@/lib/admin-nav'
import { SITE_TITLE } from '@/lib/constants'
import { absoluteUrl, cn } from '@/lib/utils'

interface AdminSidebarProps {
  collapsed: boolean
  onToggleCollapsed: () => void
  onNavigate?: () => void
  onLogout: () => void
  className?: string
}

function NavItem({
  href,
  label,
  icon: Icon,
  collapsed,
  onNavigate,
  end,
  external,
}: {
  href: string
  label: string
  icon: LucideIcon
  collapsed: boolean
  onNavigate?: () => void
  end?: boolean
  external?: boolean
}) {
  const content = (
    <>
      <Icon className="size-4 shrink-0" />
      {!collapsed ? <span className="truncate">{label}</span> : null}
      {collapsed ? <span className="sr-only">{label}</span> : null}
    </>
  )

  const className = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center gap-3 rounded-md px-3 py-2 text-sm no-underline transition-colors',
      'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
      collapsed && 'justify-center px-2',
      isActive && 'bg-accent font-medium text-accent-foreground',
    )

  const link = external ? (
    <a
      href={absoluteUrl(href === '/' ? '' : href)}
      target="_blank"
      rel="noreferrer"
      onClick={onNavigate}
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-2 text-sm no-underline transition-colors',
        'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
        collapsed && 'justify-center px-2',
      )}
    >
      {content}
    </a>
  ) : (
    <NavLink to={href} end={end} onClick={onNavigate} className={className}>
      {content}
    </NavLink>
  )

  if (!collapsed) return link

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="block w-full">{link}</span>
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  )
}

export function AdminSidebar({
  collapsed,
  onToggleCollapsed,
  onNavigate,
  onLogout,
  className,
}: AdminSidebarProps) {
  return (
    <TooltipProvider delayDuration={0}>
      <div className={cn('flex h-full flex-col', className)}>
        <div
          className={cn(
            'flex h-14 shrink-0 items-center border-b px-3',
            collapsed ? 'justify-center' : 'justify-between gap-2',
          )}
        >
          {!collapsed ? (
            <>
              <Link
                to="/admin/dashboard"
                onClick={onNavigate}
                className="min-w-0 truncate font-display text-sm font-semibold no-underline"
              >
                {SITE_TITLE}
                <span className="ml-1 font-sans text-xs font-medium text-muted-foreground">
                  CMS
                </span>
              </Link>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="hidden size-8 shrink-0 md:inline-flex"
                onClick={onToggleCollapsed}
                aria-label="Collapse sidebar"
              >
                <ChevronsLeft />
              </Button>
            </>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={onToggleCollapsed}
                  aria-label="Expand sidebar"
                >
                  <ChevronsRight />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Expand sidebar</TooltipContent>
            </Tooltip>
          )}
        </div>

        {collapsed ? (
          <div className="hidden justify-center border-b py-2 md:flex">
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  to="/admin/dashboard"
                  onClick={onNavigate}
                  className="flex size-8 items-center justify-center rounded-md bg-primary text-xs font-semibold text-primary-foreground no-underline"
                  aria-label="Admin dashboard"
                >
                  CV
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">Admin CMS</TooltipContent>
            </Tooltip>
          </div>
        ) : null}

        <nav className="flex-1 space-y-1 overflow-y-auto p-2">
          {ADMIN_PRIMARY_NAV.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              collapsed={collapsed}
              onNavigate={onNavigate}
            />
          ))}
        </nav>

        <div className="mt-auto space-y-1 border-t p-2">
          <NavItem
            href={ADMIN_BOTTOM_NAV.publicSite.href}
            label={ADMIN_BOTTOM_NAV.publicSite.label}
            icon={ADMIN_BOTTOM_NAV.publicSite.icon}
            collapsed={collapsed}
            onNavigate={onNavigate}
            external
          />
          <NavItem
            href={ADMIN_BOTTOM_NAV.account.href}
            label={ADMIN_BOTTOM_NAV.account.label}
            icon={ADMIN_BOTTOM_NAV.account.icon}
            collapsed={collapsed}
            onNavigate={onNavigate}
          />

          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onLogout}
                  className="flex w-full items-center justify-center gap-3 rounded-md px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                  aria-label="Logout"
                >
                  <ADMIN_BOTTOM_NAV.logout.icon className="size-4 shrink-0" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Logout</TooltipContent>
            </Tooltip>
          ) : (
            <button
              type="button"
              onClick={onLogout}
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <ADMIN_BOTTOM_NAV.logout.icon className="size-4 shrink-0" />
              <span>Logout</span>
            </button>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}
