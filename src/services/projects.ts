import { supabase } from '@/lib/supabase'
import type { ProjectDetail, ProjectListItem } from '@/types/portfolio'

const projectListSelect = `
  *,
  project_technologies (
    technologies (*)
  )
`

const projectDetailSelect = `
  *,
  project_features (*),
  project_contributions (*),
  project_media (*),
  project_technologies (
    technologies (*)
  )
`

function sortRelated<T extends { display_order: number }>(items: T[] | null | undefined) {
  return [...(items ?? [])].sort((a, b) => a.display_order - b.display_order)
}

export async function fetchPublishedProjects() {
  const { data, error } = await supabase
    .from('projects')
    .select(projectListSelect)
    .eq('is_published', true)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as ProjectListItem[]
}

export async function fetchFeaturedProjects(limit = 3) {
  const { data, error } = await supabase
    .from('projects')
    .select(projectListSelect)
    .eq('is_published', true)
    .eq('is_featured', true)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as ProjectListItem[]
}

export async function fetchProjectBySlug(slug: string) {
  const { data, error } = await supabase
    .from('projects')
    .select(projectDetailSelect)
    .eq('slug', slug)
    .eq('is_published', true)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return null

  const project = data as unknown as ProjectDetail
  return {
    ...project,
    project_features: sortRelated(project.project_features),
    project_contributions: sortRelated(project.project_contributions),
    project_media: sortRelated(project.project_media),
  }
}

export async function fetchRelatedProjects(
  project: ProjectDetail,
  limit = 3,
) {
  const techIds = project.project_technologies
    .map((item) => item.technologies?.id)
    .filter((id): id is string => Boolean(id))

  const { data, error } = await supabase
    .from('projects')
    .select(projectListSelect)
    .eq('is_published', true)
    .neq('id', project.id)
    .order('display_order', { ascending: true })
    .limit(12)

  if (error) throw new Error(error.message)

  const candidates = (data ?? []) as unknown as ProjectListItem[]

  const scored = candidates
    .map((candidate) => {
      const candidateTechIds = candidate.project_technologies
        .map((item) => item.technologies?.id)
        .filter((id): id is string => Boolean(id))
      const sharedTech = candidateTechIds.filter((id) => techIds.includes(id)).length
      const sameType = candidate.project_type === project.project_type ? 1 : 0
      return { candidate, score: sharedTech * 2 + sameType }
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)

  return scored.slice(0, limit).map((item) => item.candidate)
}

export function getProjectTechnologies(project: ProjectListItem | ProjectDetail) {
  return project.project_technologies
    .map((item) => item.technologies)
    .filter((tech): tech is NonNullable<typeof tech> => Boolean(tech))
    .sort((a, b) => a.display_order - b.display_order || a.name.localeCompare(b.name))
}
