import { fetchFeaturedProjects } from '@/services/projects'
import { fetchProfile } from '@/services/profile'
import { fetchPublishedResume } from '@/services/resumes'
import { fetchHomepageSettings } from '@/services/settings'
import { fetchSkills } from '@/services/skills'
import { fetchSocialLinks } from '@/services/social'
import type { HomepageData } from '@/types/portfolio'

export async function fetchHomepageData(): Promise<HomepageData> {
  const [profile, settings, resume, socialLinks] = await Promise.all([
    fetchProfile(),
    fetchHomepageSettings(),
    fetchPublishedResume(),
    fetchSocialLinks(),
  ])

  const [featuredProjects, skills] = await Promise.all([
    settings.show_featured_projects
      ? fetchFeaturedProjects(3)
      : Promise.resolve([]),
    settings.show_highlighted_skills
      ? fetchSkills()
      : Promise.resolve([]),
  ])

  return {
    profile,
    featuredProjects,
    skills: skills.slice(0, 8),
    resume,
    socialLinks,
    settings,
  }
}
