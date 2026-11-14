import { getProjectTechnologies } from '@/services/projects'
import type { ProjectFilters, ProjectListItem } from '@/types/portfolio'
import { getYear } from '@/utils/date'

export function getDefaultProjectFilters(): ProjectFilters {
  return {
    search: '',
    status: 'all',
    projectType: 'all',
    platform: 'all',
    technology: 'all',
    year: 'all',
    sort: 'newest',
  }
}

export function filterAndSortProjects(
  projects: ProjectListItem[],
  filters: ProjectFilters,
) {
  const search = filters.search.trim().toLowerCase()

  const filtered = projects.filter((project) => {
    const technologies = getProjectTechnologies(project)
    const year = getYear(project.start_date) ?? getYear(project.created_at)

    const matchesSearch =
      !search ||
      [project.title, project.short_description, project.role, project.full_description]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(search)) ||
      technologies.some((tech) => tech.name.toLowerCase().includes(search))

    const matchesStatus =
      filters.status === 'all' || project.status === filters.status
    const matchesType =
      filters.projectType === 'all' ||
      project.project_type === filters.projectType
    const matchesPlatform =
      filters.platform === 'all' || project.platform === filters.platform
    const matchesTechnology =
      filters.technology === 'all' ||
      technologies.some((tech) => tech.name === filters.technology)
    const matchesYear =
      filters.year === 'all' || String(year) === filters.year

    return (
      matchesSearch &&
      matchesStatus &&
      matchesType &&
      matchesPlatform &&
      matchesTechnology &&
      matchesYear
    )
  })

  return filtered.sort((a, b) => {
    if (filters.sort === 'title') {
      return a.title.localeCompare(b.title)
    }

    const aTime = new Date(a.created_at).getTime()
    const bTime = new Date(b.created_at).getTime()
    return filters.sort === 'oldest' ? aTime - bTime : bTime - aTime
  })
}

export function collectTechnologyOptions(projects: ProjectListItem[]) {
  const names = new Set<string>()
  for (const project of projects) {
    for (const tech of getProjectTechnologies(project)) {
      names.add(tech.name)
    }
  }
  return [...names].sort((a, b) => a.localeCompare(b))
}

export function collectYearOptions(projects: ProjectListItem[]) {
  const years = new Set<string>()
  for (const project of projects) {
    const year = getYear(project.start_date) ?? getYear(project.created_at)
    if (year) years.add(String(year))
  }
  return [...years].sort((a, b) => Number(b) - Number(a))
}
