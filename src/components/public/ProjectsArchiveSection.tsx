import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { MaterialIcon } from '@/components/public/MaterialIcon'
import { SectionEyebrow } from '@/components/public/SectionEyebrow'
import { PROJECT_TYPES } from '@/lib/constants'
import { getProjectTechnologies } from '@/services/projects'
import {
  filterAndSortProjects,
  getDefaultProjectFilters,
} from '@/utils/projects'
import { cn } from '@/lib/utils'
import type { PageSection } from '@/services/cms'
import type { ProjectFilters, ProjectListItem } from '@/types/portfolio'

interface ProjectsArchiveSectionProps {
  projects: ProjectListItem[]
  section?: PageSection | null
}

const TYPE_TONES: Record<string, string> = {
  Capstone: 'bg-primary-fixed text-primary',
  Group: 'bg-secondary-container text-on-secondary-fixed',
  Individual: 'bg-tertiary-fixed text-tertiary',
  Academic: 'bg-secondary-container text-on-secondary-fixed',
}

const STATUS_TONES: Record<string, string> = {
  Completed: 'bg-secondary-container text-on-secondary-fixed',
  Ongoing: 'bg-primary-fixed text-primary',
  Archived: 'bg-surface-container-high text-secondary',
}

export function ProjectsArchiveSection({
  projects,
  section,
}: ProjectsArchiveSectionProps) {
  const [filters, setFilters] = useState<ProjectFilters>(getDefaultProjectFilters)

  const availableTypes = useMemo(() => {
    const present = new Set(projects.map((project) => project.project_type))
    return PROJECT_TYPES.filter((type) => present.has(type))
  }, [projects])

  const visible = useMemo(
    () => filterAndSortProjects(projects, filters),
    [projects, filters],
  )

  return (
    <section id="projects" className="w-full bg-surface py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <div className="mb-8 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <SectionEyebrow>
              {section?.eyebrow || 'System Repositories • 04'}
            </SectionEyebrow>
            <h2 className="mt-2 font-display text-3xl font-bold text-on-surface lg:text-4xl">
              {section?.heading || 'All Projects Archive'}
            </h2>
            <p className="mt-2 text-base text-secondary">
              {section?.subtitle ||
                'Filter through individual, collaborative, academic, and capstone developments.'}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-stretch justify-between gap-4 pb-8 lg:flex-row lg:items-center">
          <div className="relative max-w-md flex-grow">
            <MaterialIcon
              name="search"
              className="absolute top-1/2 left-3.5 -translate-y-1/2 text-lg text-secondary"
            />
            <input
              value={filters.search}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, search: e.target.value }))
              }
              placeholder="Search systems, frameworks, keywords..."
              className="w-full rounded-xl bg-surface-container-low py-2.5 pr-4 pl-10 text-sm text-on-surface shadow-inner outline-none focus:ring-2 focus:ring-primary-container"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() =>
                setFilters((prev) => ({ ...prev, projectType: 'all' }))
              }
              className={cn(
                'rounded-lg px-3 py-1.5 font-mono text-[11px] transition-colors',
                filters.projectType === 'all'
                  ? 'bg-primary-container text-on-primary shadow-sm'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high',
              )}
            >
              All
            </button>
            {availableTypes.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() =>
                  setFilters((prev) => ({ ...prev, projectType: type }))
                }
                className={cn(
                  'rounded-lg px-3 py-1.5 font-mono text-[11px] transition-colors',
                  filters.projectType === type
                    ? 'bg-primary-container text-on-primary shadow-sm'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high',
                )}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, status: e.target.value }))
              }
              className="rounded-lg bg-surface-container px-3 py-2 font-mono text-[11px] text-on-surface outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="Completed">Completed</option>
              <option value="Ongoing">In Progress</option>
              <option value="Archived">Archived</option>
            </select>
            <select
              value={filters.sort}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  sort: e.target.value as 'newest' | 'oldest' | 'title',
                }))
              }
              className="rounded-lg bg-surface-container px-3 py-2 font-mono text-[11px] text-on-surface outline-none"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="title">Title A–Z</option>
            </select>
          </div>
        </div>

        {visible.length === 0 ? (
          <p className="rounded-2xl bg-surface-container-low px-6 py-10 text-center text-sm text-on-surface-variant">
            {projects.length === 0
              ? 'No published projects yet.'
              : 'No matching projects. Try adjusting filters.'}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {visible.map((project) => {
              const techs = getProjectTechnologies(project).slice(0, 3)
              return (
                <div
                  key={project.id}
                  className="flex flex-col gap-3 rounded-2xl bg-surface-container-lowest p-6 shadow-sm transition-all hover:shadow-md"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        'rounded px-2.5 py-1 font-mono text-[11px]',
                        TYPE_TONES[project.project_type] ||
                          'bg-surface-container text-on-surface',
                      )}
                    >
                      {project.project_type}
                    </span>
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 font-mono text-[11px]',
                        STATUS_TONES[project.status] ||
                          'bg-surface-container text-secondary',
                      )}
                    >
                      {project.status === 'Ongoing'
                        ? 'In Progress'
                        : project.status}
                    </span>
                  </div>
                  <h3 className="font-display text-xl font-bold text-on-surface">
                    {project.title}
                  </h3>
                  <p className="line-clamp-3 text-sm text-on-surface-variant">
                    {project.short_description ||
                      'Published project from the portfolio database.'}
                  </p>
                  <div className="my-2 flex flex-wrap gap-1.5">
                    {techs.map((tech) => (
                      <span
                        key={tech.id}
                        className="rounded bg-surface-container px-2 py-0.5 font-mono text-[11px] text-secondary"
                      >
                        {tech.name}
                      </span>
                    ))}
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-3">
                    <span className="font-mono text-[11px] text-secondary">
                      {project.role || project.platform}
                    </span>
                    <Link
                      to={`/projects/${project.slug}`}
                      className="font-mono text-[11px] font-semibold text-primary-container no-underline hover:underline"
                    >
                      View Details →
                    </Link>
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
