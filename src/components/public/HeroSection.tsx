import { MaterialIcon } from '@/components/public/MaterialIcon'
import { parseContentBoolean } from '@/lib/cms-defaults'
import { socialIconFor } from '@/lib/public-nav'
import type { SectionContentMap } from '@/services/cms'
import type { Profile, Resume, SocialLink } from '@/types/database'

interface HeroSectionProps {
  profile: Profile | null
  resume: Resume | null
  socialLinks: SocialLink[]
  projectCount: number
  content?: SectionContentMap
}

function renderHeadline(headline: string, accent: string) {
  if (accent && headline.includes(accent)) {
    const [before, ...rest] = headline.split(accent)
    const after = rest.join(accent)
    return (
      <>
        {before}
        <span className="text-primary-container">{accent}</span>
        {after}
      </>
    )
  }
  return headline
}

export function HeroSection({
  profile,
  resume,
  socialLinks,
  projectCount,
  content = {},
}: HeroSectionProps) {
  const name = profile?.full_name || 'Charlotte T. Villafuerte'
  const title =
    profile?.title || 'Full-Stack Developer | System Analyst'
  const intro =
    profile?.short_intro ||
    profile?.career_objective ||
    'Engineering scalable web and mobile software at the intersection of business requirements, system architecture, and QA automation.'
  const specialization = profile?.specialization || 'Web & Mobile'
  const interests =
    profile?.technical_interests
      ?.split(/[,•|]/)
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 3)
      .join(' • ') || 'React • Flutter • Next'

  const github = socialLinks.find((l) =>
    l.platform.toLowerCase().includes('git'),
  )
  const linkedin = socialLinks.find((l) =>
    l.platform.toLowerCase().includes('linked'),
  )

  const showAvailability = content.show_availability
    ? parseContentBoolean(content.show_availability)
    : true
  const showGithub = content.show_github
    ? parseContentBoolean(content.show_github)
    : true
  const showLinkedin = content.show_linkedin
    ? parseContentBoolean(content.show_linkedin)
    : true
  const eyebrow =
    content.eyebrow?.trim() || 'Available for Full-Time Roles & Internships'
  const headline =
    content.headline?.trim() || 'Crafting Resilient Systems with Purpose.'
  const accent = content.headline_accent?.trim() || 'Resilient Systems'
  const primaryLabel = content.primary_cta_label?.trim() || 'View My Projects'
  const primaryHref = content.primary_cta_href?.trim() || '#featured-projects'
  const secondaryLabel = content.secondary_cta_label?.trim() || 'Download Resume'
  const secondaryHref = content.secondary_cta_href?.trim() || 'resume'
  const secondaryUrl =
    secondaryHref === 'resume' || secondaryHref === '#resume'
      ? resume?.file_url
      : secondaryHref
  const configFilename =
    content.config_filename?.trim() || 'developer.config.json'
  const configKeyEngineer =
    content.config_key_engineer?.trim() || 'engineer'
  const configEngineer = content.config_engineer?.trim() || name
  const configKeyStatus = content.config_key_status?.trim() || 'status'
  const configStatus = content.config_status?.trim() || 'Open to Work'
  const configKeyFocus = content.config_key_focus?.trim() || 'focus'
  const configFocus = content.config_focus?.trim() || specialization
  const configKeyReady =
    content.config_key_ready?.trim() || 'readyForDeployment'
  const configReady =
    content.config_ready === undefined || content.config_ready === ''
      ? true
      : parseContentBoolean(content.config_ready)

  const socials = [
    showGithub ? github : null,
    showLinkedin ? linkedin : null,
  ].filter(Boolean)

  return (
    <section
      id="home"
      className="relative w-full overflow-hidden bg-surface py-12 lg:py-20"
    >
      <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary-fixed/25 blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 -right-32 h-80 w-80 rounded-full bg-tertiary-fixed/20 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-12">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
          <div className="flex flex-col items-start gap-6 lg:col-span-7">
            {showAvailability ? (
              <div className="inline-flex items-center gap-2.5 rounded-full bg-surface-container-low px-3.5 py-1.5 shadow-sm">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-tertiary opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-tertiary-container" />
                </span>
                <span className="font-mono text-[11px] tracking-tight text-tertiary">
                  {eyebrow}
                </span>
              </div>
            ) : null}

            <div className="flex flex-col gap-2">
              <h1 className="font-display text-4xl leading-tight font-bold tracking-tight text-on-surface sm:text-5xl lg:text-[56px] lg:leading-[64px]">
                {renderHeadline(headline, accent)}
              </h1>
              <p className="font-mono text-[13px] tracking-wide text-on-surface-variant">
                {name} • {title}
              </p>
            </div>

            <p className="max-w-2xl text-lg leading-7 text-secondary">{intro}</p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href={primaryHref}
                className="inline-flex items-center gap-2 rounded-lg bg-primary-container px-6 py-3 text-sm font-semibold text-on-primary shadow-md no-underline transition-all duration-200 hover:bg-primary"
              >
                <span>{primaryLabel}</span>
                <MaterialIcon name="arrow_forward" className="text-base" />
              </a>
              {secondaryUrl ? (
                <a
                  href={secondaryUrl}
                  target={secondaryUrl.startsWith('http') ? '_blank' : undefined}
                  rel={secondaryUrl.startsWith('http') ? 'noreferrer' : undefined}
                  download={secondaryHref === 'resume' ? true : undefined}
                  className="inline-flex items-center gap-2 rounded-lg bg-surface-container-lowest px-5 py-3 font-mono text-[13px] text-on-surface shadow-sm no-underline transition-colors hover:bg-surface-container-high"
                >
                  <MaterialIcon
                    name="download"
                    className="text-base text-primary-container"
                  />
                  <span>{secondaryLabel}</span>
                </a>
              ) : null}
              {socials.length > 0 ? (
                <div className="flex items-center gap-1.5 pl-2">
                  {socials.map((link) =>
                    link ? (
                      <a
                        key={link.id}
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={link.platform}
                        className="rounded-lg bg-surface-container p-2.5 text-on-surface-variant no-underline transition-colors hover:bg-surface-container-high hover:text-on-surface"
                      >
                        <MaterialIcon
                          name={socialIconFor(link.platform)}
                          className="text-xl"
                        />
                      </a>
                    ) : null,
                  )}
                </div>
              ) : null}
            </div>

            <div className="grid w-full max-w-xl grid-cols-3 gap-4 pt-4">
              <div className="flex flex-col gap-1 rounded-xl bg-surface-container-lowest p-4 shadow-sm">
                <span className="font-mono text-[11px] tracking-wider text-secondary uppercase">
                  {content.stat_specialization_label?.trim() || 'Specialization'}
                </span>
                <span className="font-display text-xl font-semibold text-on-surface">
                  {specialization}
                </span>
                <span className="font-mono text-[11px] text-tertiary">
                  {interests}
                </span>
              </div>
              <div className="flex flex-col gap-1 rounded-xl bg-surface-container-lowest p-4 shadow-sm">
                <span className="font-mono text-[11px] tracking-wider text-secondary uppercase">
                  {content.stat_projects_label?.trim() || 'Systems Built'}
                </span>
                <span className="font-display text-xl font-semibold text-on-surface">
                  {projectCount}+ Projects
                </span>
                <span className="font-mono text-[11px] text-primary-container">
                  {content.stat_projects_subtext?.trim() || 'Production & Academic'}
                </span>
              </div>
              <div className="flex flex-col gap-1 rounded-xl bg-surface-container-lowest p-4 shadow-sm">
                <span className="font-mono text-[11px] tracking-wider text-secondary uppercase">
                  {content.stat_focus_label?.trim() || 'Focus'}
                </span>
                <span className="font-display text-xl font-semibold text-on-surface">
                  {content.stat_focus_value?.trim() || 'Full-Stack'}
                </span>
                <span className="font-mono text-[11px] text-on-surface-variant">
                  {content.stat_focus_subtext?.trim() || 'Systems & QA'}
                </span>
              </div>
            </div>
          </div>

          <div className="relative flex justify-center lg:col-span-5">
            <div className="relative w-full max-w-md rounded-2xl bg-surface-container-lowest p-6 shadow-xl">
              <div className="mb-4 flex items-center justify-between rounded-xl bg-surface-container-low px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-error" />
                  <span className="h-3 w-3 rounded-full bg-secondary-fixed-dim" />
                  <span className="h-3 w-3 rounded-full bg-tertiary-fixed-dim" />
                </div>
                <span className="font-mono text-[11px] text-on-surface-variant">
                  {content.terminal_prompt?.trim() || 'charlotte@arch-node:~'}
                </span>
                <MaterialIcon
                  name="laptop_mac"
                  className="text-sm text-on-surface-variant"
                />
              </div>

              <div className="relative mb-5 aspect-square overflow-hidden rounded-xl bg-surface-container-high">
                {profile?.profile_image_url ? (
                  <img
                    src={profile.profile_image_url}
                    alt={name}
                    className="h-full w-full object-cover object-top"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center px-6 text-center font-mono text-sm text-on-surface-variant">
                    Add a profile image in admin
                  </div>
                )}
                <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-lg bg-surface-container-lowest/90 px-3 py-1.5 shadow-md backdrop-blur-md">
                  <span className="h-2 w-2 rounded-full bg-primary-container" />
                  <span className="font-mono text-[11px] font-semibold text-on-surface">
                    {interests}
                  </span>
                </div>
                <div className="absolute top-3 right-3 flex items-center gap-2 rounded-lg bg-inverse-surface/90 px-3 py-1.5 shadow-md backdrop-blur-md">
                  <span className="h-2 w-2 rounded-full bg-tertiary-fixed-dim" />
                  <span className="font-mono text-[11px] text-inverse-on-surface">
                    {content.live_chip_label?.trim() || 'Live Portfolio Data'}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-1 overflow-x-auto rounded-xl bg-inverse-surface p-4 font-mono text-[11px] text-inverse-on-surface shadow-inner">
                <div className="text-tertiary-fixed-dim">
                  // {configFilename}
                </div>
                <div>
                  <span className="text-primary-fixed-dim">
                    "{configKeyEngineer}"
                  </span>
                  :{' '}
                  <span className="text-secondary-fixed">"{configEngineer}"</span>,
                </div>
                <div>
                  <span className="text-primary-fixed-dim">
                    "{configKeyStatus}"
                  </span>
                  :{' '}
                  <span className="text-tertiary-fixed-dim">
                    "{configStatus}"
                  </span>
                  ,
                </div>
                <div>
                  <span className="text-primary-fixed-dim">
                    "{configKeyFocus}"
                  </span>
                  :{' '}
                  <span className="text-secondary-fixed">"{configFocus}"</span>,
                </div>
                <div>
                  <span className="text-primary-fixed-dim">
                    "{configKeyReady}"
                  </span>
                  :{' '}
                  <span className="text-tertiary-fixed-dim">
                    {configReady ? 'true' : 'false'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
