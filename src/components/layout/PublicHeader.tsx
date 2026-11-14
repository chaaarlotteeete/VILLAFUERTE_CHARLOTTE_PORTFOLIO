import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

import { MaterialIcon } from '@/components/public/MaterialIcon'
import { useTheme } from '@/contexts/ThemeContext'
import { parseContentBoolean } from '@/lib/cms-defaults'
import { PUBLIC_SECTION_NAV } from '@/lib/public-nav'
import { cn } from '@/lib/utils'
import type { NavigationItem, SectionContentMap } from '@/services/cms'
import type { Profile, Resume } from '@/types/database'

interface PublicHeaderProps {
  profile?: Profile | null
  resume?: Resume | null
  compact?: boolean
  navItems?: NavigationItem[]
  headerContent?: SectionContentMap
}

function shortName(fullName?: string | null) {
  if (!fullName?.trim()) return 'Charlotte V.'
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 1) return parts[0]
  return `${parts[0]} ${parts[parts.length - 1][0]}.`
}

export function PublicHeader({
  profile,
  resume,
  compact = false,
  navItems,
  headerContent = {},
}: PublicHeaderProps) {
  const [open, setOpen] = useState(false)
  const [activeHash, setActiveHash] = useState('#home')
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()
  const isHome = location.pathname === '/' || location.pathname === ''

  const nav = useMemo(() => {
    if (navItems && navItems.length > 0) {
      return navItems.map((item) => ({
        label: item.label,
        href: item.destination.startsWith('#')
          ? item.destination
          : item.destination.startsWith('/')
            ? item.destination
            : `#${item.destination.replace(/^#/, '')}`,
      }))
    }
    return PUBLIC_SECTION_NAV.map((item) => ({
      label: item.label,
      href: item.href,
    }))
  }, [navItems])

  useEffect(() => {
    if (!isHome) return

    const sectionIds = nav
      .map((item) => (item.href.startsWith('#') ? item.href.slice(1) : ''))
      .filter(Boolean)

    function onScroll() {
      let current = '#home'
      for (const id of sectionIds) {
        const el = document.getElementById(id)
        if (!el) continue
        if (el.getBoundingClientRect().top <= 120) {
          current = `#${id}`
        }
      }
      setActiveHash(current)
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [isHome, nav])

  useEffect(() => {
    setOpen(false)
  }, [location.pathname, location.hash])

  const brandName =
    headerContent.display_name?.trim() || shortName(profile?.full_name)
  const subtitle =
    headerContent.subtitle?.trim() ||
    profile?.title?.split('|')[0]?.trim() ||
    profile?.specialization ||
    'Full-Stack & Systems'
  const logoUrl = headerContent.logo_url?.trim() || profile?.profile_image_url
  const resumeLabel = headerContent.resume_label?.trim() || 'Resume'
  const showResume = headerContent.show_resume
    ? parseContentBoolean(headerContent.show_resume)
    : true
  const showThemeToggle = headerContent.show_theme_toggle
    ? parseContentBoolean(headerContent.show_theme_toggle)
    : true

  function navHref(hash: string) {
    if (!hash.startsWith('#')) return hash
    return isHome ? hash : `/${hash}`
  }

  return (
    <header className="fixed top-0 right-0 left-0 z-50 bg-surface/85 shadow-[0_1px_8px_rgba(0,0,0,0.04)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-12">
        <Link to="/" className="flex items-center gap-3 no-underline">
          {logoUrl ? (
            <img src={logoUrl} alt="" className="h-8 w-8 rounded-lg object-cover" />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-container text-sm font-semibold text-on-primary">
              {brandName.slice(0, 1)}
            </div>
          )}
          <div className="flex flex-col">
            <span className="font-display text-xl leading-none font-semibold tracking-tight text-on-surface">
              {brandName}
            </span>
            <span className="hidden font-mono text-[11px] tracking-wide text-on-surface-variant sm:inline-block">
              {subtitle}
            </span>
          </div>
        </Link>

        {!compact ? (
          <nav className="hidden items-center gap-1 rounded-xl bg-surface-container-low/60 p-1 xl:flex">
            {nav.map((item) => (
              <a
                key={`${item.href}-${item.label}`}
                href={navHref(item.href)}
                className={cn(
                  'rounded-lg px-3 py-1.5 font-sans text-sm no-underline transition-all',
                  activeHash === item.href && isHome
                    ? 'bg-surface-container-high font-semibold text-on-surface'
                    : 'text-on-surface-variant hover:text-on-surface',
                )}
              >
                {item.label}
              </a>
            ))}
          </nav>
        ) : null}

        <div className="flex items-center gap-2 sm:gap-3">
          {showResume ? (
            resume ? (
              <a
                href={resume.file_url}
                target="_blank"
                rel="noreferrer"
                className="hidden items-center gap-2 rounded-lg bg-surface-container px-3.5 py-1.5 font-mono text-[13px] text-on-surface no-underline transition-colors hover:bg-surface-container-high sm:inline-flex"
              >
                <MaterialIcon name="description" className="text-base" />
                <span>{resumeLabel}</span>
              </a>
            ) : (
              <a
                href={navHref('#contact')}
                className="hidden items-center gap-2 rounded-lg bg-surface-container px-3.5 py-1.5 font-mono text-[13px] text-on-surface no-underline transition-colors hover:bg-surface-container-high sm:inline-flex"
              >
                <MaterialIcon name="description" className="text-base" />
                <span>{resumeLabel}</span>
              </a>
            )
          ) : null}

          {showThemeToggle ? (
            <button
              type="button"
              aria-label="Toggle color mode"
              onClick={toggleTheme}
              className="rounded-lg p-2 text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
            >
              <MaterialIcon
                name={theme === 'dark' ? 'dark_mode' : 'light_mode'}
                className="text-lg leading-none"
              />
            </button>
          ) : null}

          {!compact ? (
            <button
              type="button"
              aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
              className="rounded-lg p-2 text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface xl:hidden"
              onClick={() => setOpen((value) => !value)}
            >
              <MaterialIcon
                name={open ? 'close' : 'menu'}
                className="text-xl leading-none"
              />
            </button>
          ) : null}
        </div>
      </div>

      {open && !compact ? (
        <nav className="border-t border-outline/20 bg-surface px-6 py-3 xl:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1">
            {nav.map((item) => (
              <a
                key={`mobile-${item.href}-${item.label}`}
                href={navHref(item.href)}
                onClick={() => setOpen(false)}
                className={cn(
                  'rounded-lg px-3 py-2 text-sm no-underline',
                  activeHash === item.href && isHome
                    ? 'bg-surface-container-high font-semibold text-on-surface'
                    : 'text-on-surface-variant',
                )}
              >
                {item.label}
              </a>
            ))}
          </div>
        </nav>
      ) : null}
    </header>
  )
}
