export const SITE_TITLE =
  import.meta.env.VITE_SITE_TITLE || 'Portfolio - Villafuerte Charlotte'

export const ADMIN_EMAIL =
  import.meta.env.VITE_ADMIN_EMAIL || 'charlottevillafuerte.w@gmail.com'

export const PROJECT_TYPES = [
  'Individual',
  'Group',
  'Capstone',
  'Academic',
] as const

export const PROJECT_PLATFORMS = ['Web', 'Mobile', 'Web and Mobile'] as const

export const PROJECT_STATUSES = ['Ongoing', 'Completed', 'Archived'] as const

export const SKILL_CATEGORIES = [
  'Programming Languages',
  'Frontend Development',
  'Backend Development',
  'Mobile Development',
  'Database Management',
  'API and AI Integration',
  'Software Quality Assurance',
  'System Analysis',
  'Project Management',
  'Development Tools',
] as const

export const HOBBY_CATEGORIES = [
  'Creative',
  'Sports & Fitness',
  'Technology',
  'Learning',
  'Community',
  'Lifestyle',
  'Other',
] as const

export const PUBLIC_NAV = [
  { label: 'Home', href: '/#home' },
  { label: 'About', href: '/#about' },
  { label: 'Projects', href: '/#featured-projects' },
  { label: 'Skills', href: '/#skills' },
  { label: 'Experience', href: '/#experience' },
  { label: 'Hobbies', href: '/#hobbies' },
  { label: 'Certifications', href: '/#certifications' },
  { label: 'Contact', href: '/#contact' },
] as const

/** @deprecated Prefer ADMIN_PRIMARY_NAV from `@/lib/admin-nav` for the CMS shell. */
export const ADMIN_NAV = [
  { label: 'Dashboard', href: '/admin/dashboard' },
  { label: 'Projects', href: '/admin/projects' },
  { label: 'Skills & Technologies', href: '/admin/skills' },
  { label: 'Experience', href: '/admin/experience' },
  { label: 'Education', href: '/admin/education' },
  { label: 'Training', href: '/admin/training' },
  { label: 'Awards & Achievements', href: '/admin/awards' },
  { label: 'Hobbies & Interests', href: '/admin/hobbies' },
  { label: 'Certifications', href: '/admin/certifications' },
  { label: 'Resume', href: '/admin/resume' },
  { label: 'Media Library', href: '/admin/media' },
  { label: 'Contact Messages', href: '/admin/messages' },
  { label: 'Profile', href: '/admin/profile' },
  { label: 'Site Settings', href: '/admin/settings' },
] as const
