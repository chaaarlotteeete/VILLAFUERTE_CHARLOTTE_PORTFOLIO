import type {
  Certification,
  Education,
  Experience,
  Profile,
  Project,
  ProjectContribution,
  ProjectFeature,
  ProjectMedia,
  Resume,
  Skill,
  SocialLink,
  Technology,
} from '@/types/database'

export interface ProjectTechnologyJoin {
  technologies: Technology | null
}

export interface ProjectListItem extends Project {
  project_technologies: ProjectTechnologyJoin[]
}

export interface ProjectDetail extends Project {
  project_features: ProjectFeature[]
  project_contributions: ProjectContribution[]
  project_media: ProjectMedia[]
  project_technologies: ProjectTechnologyJoin[]
}

export interface HomepageSettings {
  show_featured_projects: boolean
  show_highlighted_skills: boolean
}

export interface HomepageData {
  profile: Profile | null
  featuredProjects: ProjectListItem[]
  skills: Skill[]
  resume: Resume | null
  socialLinks: SocialLink[]
  settings: HomepageSettings
}

export type {
  Certification,
  Education,
  Experience,
  Profile,
  Project,
  Resume,
  Skill,
  SocialLink,
  Technology,
}

export type ProjectSort = 'newest' | 'oldest' | 'title'

export interface ProjectFilters {
  search: string
  status: string
  projectType: string
  platform: string
  technology: string
  year: string
  sort: ProjectSort
}
