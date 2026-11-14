import { supabase } from '@/lib/supabase'

export interface DashboardStats {
  totalProjects: number
  publishedProjects: number
  draftProjects: number
  featuredProjects: number
  totalSkills: number
  totalCertifications: number
  totalHobbies: number
  unreadMessages: number
  recentProjects: Array<{
    id: string
    title: string
    slug: string
    updated_at: string
    is_published: boolean
    status: string
  }>
  recentMessages: Array<{
    id: string
    full_name: string
    email: string
    subject: string
    is_read: boolean
    created_at: string
  }>
  publicationOverview: {
    publishedPercent: number
    draftPercent: number
    featuredPercent: number
  }
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const [
    projectsResult,
    skillsResult,
    certificationsResult,
    hobbiesResult,
    messagesResult,
    recentResult,
    recentMessagesResult,
  ] = await Promise.all([
    supabase.from('projects').select('id, is_published, is_featured'),
    supabase.from('skills').select('id', { count: 'exact', head: true }),
    supabase
      .from('certifications')
      .select('id', { count: 'exact', head: true }),
    supabase.from('hobbies').select('id', { count: 'exact', head: true }),
    supabase
      .from('contact_messages')
      .select('id', { count: 'exact', head: true })
      .eq('is_read', false),
    supabase
      .from('projects')
      .select('id, title, slug, updated_at, is_published, status')
      .order('updated_at', { ascending: false })
      .limit(5),
    supabase
      .from('contact_messages')
      .select('id, full_name, email, subject, is_read, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  if (projectsResult.error) throw new Error(projectsResult.error.message)
  if (skillsResult.error) throw new Error(skillsResult.error.message)
  if (certificationsResult.error) {
    throw new Error(certificationsResult.error.message)
  }
  // Hobbies table may not exist until migration 00005 is applied.
  const totalHobbies = hobbiesResult.error ? 0 : (hobbiesResult.count ?? 0)
  if (messagesResult.error) throw new Error(messagesResult.error.message)
  if (recentResult.error) throw new Error(recentResult.error.message)
  if (recentMessagesResult.error) {
    throw new Error(recentMessagesResult.error.message)
  }

  const projects = projectsResult.data ?? []
  const totalProjects = projects.length
  const publishedProjects = projects.filter((item) => item.is_published).length
  const draftProjects = projects.filter((item) => !item.is_published).length
  const featuredProjects = projects.filter((item) => item.is_featured).length

  const publishedPercent =
    totalProjects === 0 ? 0 : Math.round((publishedProjects / totalProjects) * 100)
  const draftPercent =
    totalProjects === 0 ? 0 : Math.round((draftProjects / totalProjects) * 100)
  const featuredPercent =
    totalProjects === 0 ? 0 : Math.round((featuredProjects / totalProjects) * 100)

  return {
    totalProjects,
    publishedProjects,
    draftProjects,
    featuredProjects,
    totalSkills: skillsResult.count ?? 0,
    totalCertifications: certificationsResult.count ?? 0,
    totalHobbies,
    unreadMessages: messagesResult.count ?? 0,
    recentProjects: recentResult.data ?? [],
    recentMessages: recentMessagesResult.data ?? [],
    publicationOverview: {
      publishedPercent,
      draftPercent,
      featuredPercent,
    },
  }
}
