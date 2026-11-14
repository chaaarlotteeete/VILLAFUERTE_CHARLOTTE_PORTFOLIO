import { supabase } from '@/lib/supabase'
import type {
  Project,
  ProjectContribution,
  ProjectFeature,
  ProjectMedia,
  TablesInsert,
  TablesUpdate,
  Technology,
} from '@/types/database'
import type { ProjectDetail } from '@/types/portfolio'

export interface AdminProjectPayload {
  project: TablesInsert<'projects'> | (TablesUpdate<'projects'> & { id?: string })
  featureIdsToKeep?: string[]
  features: Array<Omit<TablesInsert<'project_features'>, 'project_id'>>
  contributions: Array<Omit<TablesInsert<'project_contributions'>, 'project_id'>>
  media: Array<Omit<TablesInsert<'project_media'>, 'project_id'>>
  technologyIds: string[]
}

const detailSelect = `
  *,
  project_features (*),
  project_contributions (*),
  project_media (*),
  project_technologies (
    technologies (*)
  )
`

export async function fetchAdminProjects() {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('display_order', { ascending: true })
    .order('updated_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as Project[]
}

export async function fetchAdminProjectById(id: string) {
  const { data, error } = await supabase
    .from('projects')
    .select(detailSelect)
    .eq('id', id)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data as unknown as ProjectDetail | null
}

export async function fetchTechnologies() {
  const { data, error } = await supabase
    .from('technologies')
    .select('*')
    .order('display_order', { ascending: true })
    .order('name', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as Technology[]
}

export async function upsertTechnology(input: TablesInsert<'technologies'>) {
  const { data, error } = await supabase
    .from('technologies')
    .upsert(input, { onConflict: 'name' })
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return data as Technology
}

export async function deleteTechnology(id: string) {
  const { error } = await supabase.from('technologies').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function saveAdminProject(payload: AdminProjectPayload) {
  const { project, features, contributions, media, technologyIds } = payload
  const projectId = 'id' in project && project.id ? project.id : null

  let savedProject: Project

  if (projectId) {
    const { id: _id, ...updates } = project as TablesUpdate<'projects'> & {
      id: string
    }
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', projectId)
      .select('*')
      .single()
    if (error) throw new Error(error.message)
    savedProject = data as Project
  } else {
    const { data, error } = await supabase
      .from('projects')
      .insert(project as TablesInsert<'projects'>)
      .select('*')
      .single()
    if (error) throw new Error(error.message)
    savedProject = data as Project
  }

  const id = savedProject.id

  await Promise.all([
    supabase.from('project_features').delete().eq('project_id', id),
    supabase.from('project_contributions').delete().eq('project_id', id),
    supabase.from('project_media').delete().eq('project_id', id),
    supabase.from('project_technologies').delete().eq('project_id', id),
  ]).then((results) => {
    const firstError = results.find((result) => result.error)?.error
    if (firstError) throw new Error(firstError.message)
  })

  if (features.length > 0) {
    const { error } = await supabase.from('project_features').insert(
      features.map((item, index) => ({
        ...item,
        project_id: id,
        display_order: item.display_order ?? index,
      })),
    )
    if (error) throw new Error(error.message)
  }

  if (contributions.length > 0) {
    const { error } = await supabase.from('project_contributions').insert(
      contributions.map((item, index) => ({
        ...item,
        project_id: id,
        display_order: item.display_order ?? index,
      })),
    )
    if (error) throw new Error(error.message)
  }

  if (media.length > 0) {
    const { error } = await supabase.from('project_media').insert(
      media.map((item, index) => ({
        ...item,
        project_id: id,
        display_order: item.display_order ?? index,
      })),
    )
    if (error) throw new Error(error.message)
  }

  if (technologyIds.length > 0) {
    const { error } = await supabase.from('project_technologies').insert(
      technologyIds.map((technology_id) => ({
        project_id: id,
        technology_id,
      })),
    )
    if (error) throw new Error(error.message)
  }

  return savedProject
}

export async function updateProjectFlags(
  id: string,
  updates: Pick<TablesUpdate<'projects'>, 'is_published' | 'is_featured' | 'status'>,
) {
  const { error } = await supabase.from('projects').update(updates).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteProject(id: string) {
  const { error } = await supabase.from('projects').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export type { ProjectFeature, ProjectContribution, ProjectMedia }
