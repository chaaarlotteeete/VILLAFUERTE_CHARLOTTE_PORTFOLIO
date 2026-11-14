import { Link } from 'react-router-dom'

import { MaterialIcon } from '@/components/public/MaterialIcon'
import { parseContentBoolean } from '@/lib/cms-defaults'
import { socialIconFor } from '@/lib/public-nav'
import type { NavigationItem, SectionContentMap } from '@/services/cms'
import type { Profile, SocialLink } from '@/types/database'

interface PublicFooterProps {
  profile?: Profile | null
  socialLinks?: SocialLink[]
  email?: string | null
  footerContent?: SectionContentMap
  footerNav?: NavigationItem[]
  live?: boolean
}

export function PublicFooter({
  profile,
  socialLinks = [],
  email,
  footerContent = {},
  footerNav = [],
  live,
}: PublicFooterProps) {
  const name =
    footerContent.display_name?.trim() ||
    profile?.full_name ||
    'Charlotte T. Villafuerte'
  const blurb =
    footerContent.intro?.trim() ||
    profile?.short_intro ||
    profile?.bio ||
    'Full-Stack Developer and System Analyst architecting responsive web applications, robust systems, and intelligent digital workflows.'
  const showBadge = footerContent.show_availability_badge
    ? parseContentBoolean(footerContent.show_availability_badge)
    : true
  const badgeText =
    footerContent.availability_badge?.trim() || 'Available for hire / Internships'
  const showEmail = footerContent.show_email
    ? parseContentBoolean(footerContent.show_email)
    : true
  const showAdmin = footerContent.show_admin_link
    ? parseContentBoolean(footerContent.show_admin_link)
    : true
  const indexHeading = footerContent.index_heading?.trim() || 'Index'
  const connectHeading = footerContent.connect_heading?.trim() || 'Connect'
  const copyrightText =
    footerContent.copyright_text?.trim() || 'Engineered with precision.'
  const year =
    footerContent.custom_copyright_year?.trim() ||
    String(new Date().getFullYear())

  const nav =
    footerNav.length > 0
      ? footerNav.map((item) => ({
          href: item.destination.startsWith('#')
            ? item.destination
            : `#${item.destination.replace(/^#/, '')}`,
          label: item.label,
        }))
      : [
          { href: '#home', label: 'Home & Summary' },
          { href: '#about', label: 'About & Core Focus' },
          { href: '#skills', label: 'Technical Skills' },
          { href: '#featured-projects', label: 'Featured Projects' },
          { href: '#experience', label: 'Experience & Leadership' },
        ]

  const statusLabel = live ? 'Realtime connected' : 'Static mode'

  return (
    <footer className="mt-20 w-full bg-surface-container-low pt-16 pb-12">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <div className="grid grid-cols-1 gap-8 pb-12 md:grid-cols-12">
          <div className="flex flex-col items-start gap-4 md:col-span-5">
            <div className="flex items-center gap-3">
              {profile?.profile_image_url ? (
                <img
                  src={profile.profile_image_url}
                  alt=""
                  className="h-7 w-7 rounded-md object-cover"
                />
              ) : null}
              <span className="font-display text-xl font-semibold tracking-tight text-on-surface">
                {name}
              </span>
            </div>
            <p className="max-w-sm font-sans text-sm text-on-surface-variant">
              {blurb}
            </p>
            {showBadge ? (
              <div className="inline-flex items-center gap-2 rounded-full bg-surface-container-highest px-3 py-1 font-mono text-[11px] text-tertiary">
                <span className="h-2 w-2 rounded-full bg-tertiary-fixed-dim" />
                <span>{badgeText}</span>
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-3 md:col-span-3">
            <span className="font-mono text-[13px] font-semibold tracking-wider text-on-surface uppercase">
              {indexHeading}
            </span>
            <nav className="flex flex-col gap-2">
              {nav.map((item) => (
                <a
                  key={`${item.href}-${item.label}`}
                  href={item.href}
                  className="text-on-surface-variant no-underline transition-colors hover:text-on-surface"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>

          <div className="flex flex-col gap-3 md:col-span-4">
            <span className="font-mono text-[13px] font-semibold tracking-wider text-on-surface uppercase">
              {connectHeading}
            </span>
            <div className="flex flex-col gap-2 text-sm">
              {socialLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-on-surface-variant no-underline transition-colors hover:text-on-surface"
                >
                  <MaterialIcon
                    name={socialIconFor(link.platform)}
                    className="text-base"
                  />
                  <span>{link.platform}</span>
                </a>
              ))}
              {showEmail && email ? (
                <a
                  href={`mailto:${email}`}
                  className="inline-flex items-center gap-2 text-on-surface-variant no-underline transition-colors hover:text-on-surface"
                >
                  <MaterialIcon name="mail" className="text-base" />
                  <span>{email}</span>
                </a>
              ) : null}
              {showAdmin ? (
                <Link
                  to="/admin/login"
                  className="inline-flex items-center gap-2 text-on-surface-variant no-underline transition-colors hover:text-on-surface"
                >
                  <MaterialIcon name="admin_panel_settings" className="text-base" />
                  <span>Admin</span>
                </Link>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 pt-8 sm:flex-row">
          <p className="font-mono text-[11px] text-on-surface-variant">
            © {year} {name}. {copyrightText}
          </p>
          <div className="font-mono text-[11px] text-on-surface-variant">
            <span className="inline-flex items-center gap-1.5">
              <span
                className={`h-1.5 w-1.5 rounded-full ${live ? 'bg-tertiary' : 'bg-outline'}`}
              />
              System Status: {statusLabel}
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
