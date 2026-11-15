import {
  fetchCmsPortfolioBundle,
  filterNavByVisibleSections,
  isSectionVisible,
  type CmsPortfolioBundle,
  type NavigationItem,
  type PageSection,
  type SectionContentMap,
  type SkillCategory,
  type SpecializationCard,
} from '@/services/cms'
import { fetchVisibleAwards } from '@/services/adminAwards'
import { fetchAwardCategories } from '@/services/catalogs'
import { fetchCertifications } from '@/services/certifications'
import {
  fetchEducation,
  type EducationWithRelations,
} from '@/services/education'
import { fetchExperiences } from '@/services/experience'
import { fetchVisibleHobbies, type PublicHobby } from '@/services/hobbies'
import { fetchProfile } from '@/services/profile'
import { fetchPublishedProjects } from '@/services/projects'
import { fetchPublishedResume } from '@/services/resumes'
import {
  fetchBrandingSettings,
  fetchContactSettings,
  fetchCredentialsDisplaySettings,
  fetchHomepageSettings,
  fetchSeoSettings,
  type BrandingSettings,
  type ContactSettings,
  type CredentialsDisplaySettings,
  type HomepageSettings,
  type SeoSettings,
} from '@/services/settings'
import { fetchSkills } from '@/services/skills'
import { fetchSocialLinks } from '@/services/social'
import type {
  Award,
  AwardCategory,
  Certification,
  Experience,
  Profile,
  Resume,
  Skill,
  SocialLink,
} from '@/types/database'
import type { ProjectListItem } from '@/types/portfolio'

export interface PortfolioData {
  profile: Profile | null
  featuredProjects: ProjectListItem[]
  projects: ProjectListItem[]
  skills: Skill[]
  experiences: Experience[]
  education: EducationWithRelations[]
  hobbies: PublicHobby[]
  certifications: Certification[]
  awards: Award[]
  awardCategories: AwardCategory[]
  credentialsDisplay: CredentialsDisplaySettings
  resume: Resume | null
  socialLinks: SocialLink[]
  settings: HomepageSettings
  contactSettings: ContactSettings
  branding: BrandingSettings
  seo: SeoSettings
  cms: CmsPortfolioBundle
  sections: Record<string, PageSection>
  content: Record<string, SectionContentMap>
  headerNav: NavigationItem[]
  footerNav: NavigationItem[]
  specializationCards: SpecializationCard[]
  skillCategories: SkillCategory[]
}

function resolveFeaturedLimit(
  settings: HomepageSettings,
  content: Record<string, SectionContentMap>,
) {
  const fromContent = Number(content.featured_projects?.featured_limit)
  if (Number.isFinite(fromContent) && fromContent > 0) return fromContent
  return settings.featured_limit || 6
}

export async function fetchPortfolioData(): Promise<PortfolioData> {
  const [
    profile,
    settings,
    contactSettings,
    branding,
    seo,
    resume,
    socialLinks,
    projects,
    skills,
    experiences,
    education,
    hobbies,
    certifications,
    awards,
    awardCategories,
    credentialsDisplay,
    cms,
  ] = await Promise.all([
    fetchProfile(),
    fetchHomepageSettings(),
    fetchContactSettings(),
    fetchBrandingSettings(),
    fetchSeoSettings(),
    fetchPublishedResume(),
    fetchSocialLinks(),
    fetchPublishedProjects(),
    fetchSkills(),
    fetchExperiences(),
    fetchEducation(),
    fetchVisibleHobbies(),
    fetchCertifications(),
    fetchVisibleAwards(),
    fetchAwardCategories(),
    fetchCredentialsDisplaySettings(),
    fetchCmsPortfolioBundle(),
  ])

  const featuredLimit = resolveFeaturedLimit(settings, cms.content)
  const showFeatured =
    isSectionVisible(cms.sections, 'featured_projects') &&
    settings.show_featured_projects !== false
  const showSkills =
    isSectionVisible(cms.sections, 'skills') &&
    settings.show_highlighted_skills !== false
  const showHobbies =
    isSectionVisible(cms.sections, 'hobbies') && settings.show_hobbies !== false
  const showCerts =
    isSectionVisible(cms.sections, 'certifications') &&
    settings.show_certifications !== false
  const showAbout =
    isSectionVisible(cms.sections, 'about') && settings.show_about !== false
  const showExperience =
    isSectionVisible(cms.sections, 'experience') &&
    settings.show_experience !== false

  // Mirror visibility into settings shape used by HomePage
  const resolvedSettings: HomepageSettings = {
    ...settings,
    show_featured_projects: showFeatured,
    show_highlighted_skills: showSkills,
    show_hobbies: showHobbies,
    show_certifications: showCerts,
    show_about: showAbout,
    show_experience: showExperience,
    featured_limit: featuredLimit,
  }

  const featuredProjects = showFeatured
    ? projects.filter((project) => project.is_featured).slice(0, featuredLimit)
    : []

  // Stamp about/experience visibility onto cms sections for HomePage helpers
  if (cms.sections.about) cms.sections.about.is_visible = showAbout
  if (cms.sections.experience) cms.sections.experience.is_visible = showExperience

  return {
    profile,
    featuredProjects,
    projects,
    skills,
    experiences,
    education,
    hobbies: showHobbies ? hobbies : [],
    certifications: showCerts ? certifications : [],
    awards: showCerts ? awards : [],
    awardCategories: showCerts ? awardCategories : [],
    credentialsDisplay: showCerts
      ? credentialsDisplay
      : {
          show_certifications_group: true,
          show_awards_group: true,
        },
    resume,
    socialLinks,
    settings: resolvedSettings,
    contactSettings,
    branding,
    seo,
    cms,
    sections: cms.sections,
    content: cms.content,
    headerNav: filterNavByVisibleSections(cms.headerNav, cms.sections),
    footerNav: filterNavByVisibleSections(cms.footerNav, cms.sections),
    specializationCards: cms.specializationCards,
    skillCategories: cms.skillCategories,
  }
}
