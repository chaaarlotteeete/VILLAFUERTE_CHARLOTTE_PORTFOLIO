import { Link } from 'react-router-dom'

import { MaterialIcon } from '@/components/public/MaterialIcon'
import { SectionEyebrow } from '@/components/public/SectionEyebrow'
import { getProjectTechnologies } from '@/services/projects'
import { formatDateRange, getYear } from '@/utils/date'
import type { PageSection } from '@/services/cms'
import type { ProjectListItem } from '@/types/portfolio'
import { cn } from '@/lib/utils'

interface FeaturedProjectsSectionProps {
  projects: ProjectListItem[]
  section?: PageSection | null
}

const TYPE_TONES: Record<string, string> = {
  Capstone: 'bg-primary-fixed text-primary',
  Group: 'bg-secondary-container text-on-secondary-fixed',
  Individual: 'bg-tertiary-fixed text-tertiary',
  Academic: 'bg-secondary-container text-on-secondary-fixed',
}

export function FeaturedProjectsSection({
  projects,
  section,
}: FeaturedProjectsSectionProps) {
  return (
    <section
      id="featured-projects"
      className="w-full bg-surface-container-low/40 py-20"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <div className="mb-12 flex flex-col items-start gap-2">
          <SectionEyebrow>
            {section?.eyebrow || 'Architecture Highlights • 03'}
          </SectionEyebrow>
          <h2 className="font-display text-3xl font-bold text-on-surface lg:text-4xl">
            {section?.heading || 'Featured Engineering Showcases'}
          </h2>
          <p className="max-w-2xl text-base text-secondary">
            {section?.subtitle ||
              'Deep-dives into systems with real-world utility, strict data contracts, and complete system analysis specifications.'}
          </p>
        </div>

        {projects.length === 0 ? (
          <p className="rounded-2xl bg-surface-container-lowest px-6 py-10 text-center text-sm text-on-surface-variant shadow-sm">
            Mark published projects as featured in admin to showcase them here.
          </p>
        ) : (
          <div className="flex flex-col gap-12">
            {projects.map((project, index) => {
              const techs = getProjectTechnologies(project).slice(0, 5)
              const year =
                getYear(project.end_date) ||
                getYear(project.start_date) ||
                getYear(project.created_at)
              const reverse = index % 2 === 1

              return (
                <div
                  key={project.id}
                  className={cn(
                    'flex flex-col items-center gap-8 rounded-2xl bg-surface-container-lowest p-8 shadow-md lg:p-10',
                    reverse ? 'lg:flex-row-reverse' : 'lg:flex-row',
                  )}
                >
                  <div className="flex w-full flex-col gap-4 lg:w-1/2">
                    <div className="flex flex-wrap items-center gap-3">
                      <span
                        className={cn(
                          'rounded-md px-3 py-1 font-mono text-[11px] font-semibold',
                          TYPE_TONES[project.project_type] ||
                            'bg-surface-container text-on-surface',
                        )}
                      >
                        {project.project_type}
                        {project.role ? ` • ${project.role}` : ''}
                      </span>
                      {year ? (
                        <span className="rounded-full bg-secondary-container px-2.5 py-0.5 font-mono text-[11px] text-on-secondary-fixed">
                          {year}
                        </span>
                      ) : null}
                    </div>

                    <h3 className="font-display text-3xl font-bold text-on-surface">
                      {project.title}
                    </h3>
                    <p className="leading-relaxed text-secondary">
                      {project.short_description ||
                        project.full_description ||
                        'Featured project from the portfolio database.'}
                    </p>

                    <div className="grid grid-cols-3 gap-3 py-2">
                      <div className="flex flex-col rounded-xl bg-surface-container p-3">
                        <span className="font-mono text-[11px] text-secondary">
                          Platform
                        </span>
                        <span className="font-display text-lg font-bold text-primary-container">
                          {project.platform}
                        </span>
                      </div>
                      <div className="flex flex-col rounded-xl bg-surface-container p-3">
                        <span className="font-mono text-[11px] text-secondary">
                          Status
                        </span>
                        <span className="font-display text-lg font-bold text-tertiary">
                          {project.status}
                        </span>
                      </div>
                      <div className="flex flex-col rounded-xl bg-surface-container p-3">
                        <span className="font-mono text-[11px] text-secondary">
                          Timeline
                        </span>
                        <span className="font-display text-lg font-bold text-on-surface">
                          {formatDateRange(
                            project.start_date,
                            project.end_date,
                            project.status === 'Ongoing',
                            project.start_date_precision,
                            project.end_date_precision,
                          ) || '—'}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                      {techs.map((tech) => (
                        <span
                          key={tech.id}
                          className="rounded bg-surface-container px-2.5 py-1 font-mono text-[11px] text-secondary"
                        >
                          {tech.name}
                        </span>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 pt-4">
                      <Link
                        to={`/projects/${project.slug}`}
                        className="inline-flex items-center gap-2 rounded-lg bg-primary-container px-5 py-2.5 text-sm font-semibold text-on-primary shadow no-underline transition-all hover:bg-primary"
                      >
                        <span>Inspect Architecture</span>
                        <MaterialIcon name="open_in_new" className="text-sm" />
                      </Link>
                      {project.github_url ? (
                        <a
                          href={project.github_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-lg bg-surface-container px-4 py-2.5 font-mono text-[13px] text-on-surface no-underline transition-colors hover:bg-surface-container-high"
                        >
                          <MaterialIcon name="code" className="text-base" />
                          <span>Source Code</span>
                        </a>
                      ) : null}
                    </div>
                  </div>

                  <div className="w-full lg:w-1/2">
                    <div className="relative aspect-video overflow-hidden rounded-2xl bg-surface-container-high shadow-lg">
                      {project.thumbnail_url ? (
                        <img
                          src={project.thumbnail_url}
                          alt={project.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center px-6 text-center font-mono text-sm text-on-surface-variant">
                          {project.title}
                        </div>
                      )}
                      <div className="absolute right-4 bottom-4 left-4 flex items-center justify-between rounded-xl bg-inverse-surface/90 p-3 font-mono text-[11px] text-inverse-on-surface backdrop-blur">
                        <span className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-tertiary-fixed-dim" />
                          <span>{project.project_type.toUpperCase()}</span>
                        </span>
                        <span className="text-tertiary-fixed-dim">
                          {project.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
