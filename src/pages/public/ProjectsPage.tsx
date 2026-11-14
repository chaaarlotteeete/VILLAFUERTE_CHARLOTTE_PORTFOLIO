import { useMemo, useState } from 'react'

import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { PageHeader } from '@/components/common/PageHeader'
import { ProjectCard } from '@/components/projects/ProjectCard'
import { ProjectFiltersBar } from '@/components/projects/ProjectFilters'
import { useAsyncData } from '@/hooks/useAsyncData'
import { fetchPublishedProjects } from '@/services/projects'
import {
  collectTechnologyOptions,
  collectYearOptions,
  filterAndSortProjects,
  getDefaultProjectFilters,
} from '@/utils/projects'

export function ProjectsPage() {
  const { data, error, loading, reload } = useAsyncData(fetchPublishedProjects)
  const [filters, setFilters] = useState(getDefaultProjectFilters)

  const technologyOptions = useMemo(
    () => collectTechnologyOptions(data ?? []),
    [data],
  )
  const yearOptions = useMemo(() => collectYearOptions(data ?? []), [data])
  const visibleProjects = useMemo(
    () => filterAndSortProjects(data ?? [], filters),
    [data, filters],
  )
  const projects = data ?? []

  if (loading) return <LoadingState rows={4} />
  if (error) return <ErrorState message={error} onRetry={reload} />

  return (
    <div className="space-y-8">
      <PageHeader
        title="Projects"
        description="Browse published academic and personal software projects."
      />

      <ProjectFiltersBar
        filters={filters}
        technologyOptions={technologyOptions}
        yearOptions={yearOptions}
        onChange={setFilters}
      />

      {projects.length === 0 ? (
        <EmptyState
          title="No published projects"
          description="Published projects will appear here. Draft projects remain private in the admin dashboard."
        />
      ) : visibleProjects.length === 0 ? (
        <EmptyState
          title="No matching projects"
          description="Try adjusting your search or filters."
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {visibleProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  )
}
