export type SectionContentType =
  | 'text'
  | 'markdown'
  | 'url'
  | 'boolean'
  | 'number'
  | 'json'

export interface SectionContentDefault {
  content_key: string
  content_value: string
  content_type: SectionContentType
}

export interface ContentFieldDef {
  key: string
  label: string
  type: SectionContentType
  description?: string
  placeholder?: string
}

function defs(
  section: SectionContentDefault[],
  labels: Record<string, string>,
): ContentFieldDef[] {
  return section.map((row) => ({
    key: row.content_key,
    label: labels[row.content_key] ?? row.content_key.replaceAll('_', ' '),
    type: row.content_type,
  }))
}

export const HERO_CONTENT_DEFAULTS: SectionContentDefault[] = [
  { content_key: 'eyebrow', content_value: 'Available for Full-Time Roles & Internships', content_type: 'text' },
  { content_key: 'headline', content_value: 'Crafting Resilient Systems with Purpose.', content_type: 'text' },
  { content_key: 'headline_accent', content_value: 'Resilient Systems', content_type: 'text' },
  { content_key: 'show_availability', content_value: 'true', content_type: 'boolean' },
  { content_key: 'primary_cta_label', content_value: 'View My Projects', content_type: 'text' },
  { content_key: 'primary_cta_href', content_value: '#featured-projects', content_type: 'url' },
  { content_key: 'secondary_cta_label', content_value: 'Download Resume', content_type: 'text' },
  { content_key: 'secondary_cta_href', content_value: 'resume', content_type: 'url' },
  { content_key: 'show_github', content_value: 'true', content_type: 'boolean' },
  { content_key: 'show_linkedin', content_value: 'true', content_type: 'boolean' },
  { content_key: 'stat_specialization_label', content_value: 'Specialization', content_type: 'text' },
  { content_key: 'stat_projects_label', content_value: 'Systems Built', content_type: 'text' },
  { content_key: 'stat_projects_subtext', content_value: 'Production & Academic', content_type: 'text' },
  { content_key: 'stat_focus_label', content_value: 'Focus', content_type: 'text' },
  { content_key: 'stat_focus_value', content_value: 'Full-Stack', content_type: 'text' },
  { content_key: 'stat_focus_subtext', content_value: 'Systems & QA', content_type: 'text' },
  { content_key: 'terminal_prompt', content_value: 'charlotte@arch-node:~', content_type: 'text' },
  { content_key: 'live_chip_label', content_value: 'Live Portfolio Data', content_type: 'text' },
  { content_key: 'config_filename', content_value: 'developer.config.json', content_type: 'text' },
  { content_key: 'config_key_engineer', content_value: 'engineer', content_type: 'text' },
  { content_key: 'config_engineer', content_value: '', content_type: 'text' },
  { content_key: 'config_key_status', content_value: 'status', content_type: 'text' },
  { content_key: 'config_status', content_value: 'Open to Work', content_type: 'text' },
  { content_key: 'config_key_focus', content_value: 'focus', content_type: 'text' },
  { content_key: 'config_focus', content_value: '', content_type: 'text' },
  { content_key: 'config_key_ready', content_value: 'readyForDeployment', content_type: 'text' },
  { content_key: 'config_ready', content_value: 'true', content_type: 'boolean' },
]

/** Hero fields excluding the developer.config card block. */
export const HERO_LAYOUT_FIELD_DEFS = defs(
  HERO_CONTENT_DEFAULTS.filter((row) => !row.content_key.startsWith('config_')),
  {
    eyebrow: 'Availability eyebrow',
    headline: 'Main headline',
    headline_accent: 'Headline accent phrase',
    show_availability: 'Show availability badge',
    primary_cta_label: 'Primary CTA label',
    primary_cta_href: 'Primary CTA link',
    secondary_cta_label: 'Secondary CTA label',
    secondary_cta_href: 'Secondary CTA link',
    show_github: 'Show GitHub button',
    show_linkedin: 'Show LinkedIn button',
    stat_specialization_label: 'Specialization stat label',
    stat_projects_label: 'Projects stat label',
    stat_projects_subtext: 'Projects stat subtext',
    stat_focus_label: 'Focus stat label',
    stat_focus_value: 'Focus stat value',
    stat_focus_subtext: 'Focus stat subtext',
    terminal_prompt: 'Terminal / window title',
    live_chip_label: 'Live data chip label',
  },
)

export const HERO_CONFIG_FIELD_DEFS: ContentFieldDef[] = [
  {
    key: 'config_filename',
    label: 'Filename comment',
    type: 'text',
    placeholder: 'developer.config.json',
  },
  {
    key: 'config_key_engineer',
    label: 'Line 1 key',
    type: 'text',
    placeholder: 'engineer',
  },
  {
    key: 'config_engineer',
    label: 'Line 1 value',
    type: 'text',
    placeholder: 'Leave blank to use Profile full name',
  },
  {
    key: 'config_key_status',
    label: 'Line 2 key',
    type: 'text',
    placeholder: 'status',
  },
  {
    key: 'config_status',
    label: 'Line 2 value',
    type: 'text',
    placeholder: 'Open to Work',
  },
  {
    key: 'config_key_focus',
    label: 'Line 3 key',
    type: 'text',
    placeholder: 'focus',
  },
  {
    key: 'config_focus',
    label: 'Line 3 value',
    type: 'text',
    placeholder: 'Leave blank to use Profile specialization',
  },
  {
    key: 'config_key_ready',
    label: 'Line 4 key',
    type: 'text',
    placeholder: 'readyForDeployment',
  },
  {
    key: 'config_ready',
    label: 'Line 4 boolean value',
    type: 'boolean',
  },
]

export const HERO_FIELD_DEFS = [
  ...HERO_LAYOUT_FIELD_DEFS,
  ...HERO_CONFIG_FIELD_DEFS,
]

export const ABOUT_CONTENT_DEFAULTS: SectionContentDefault[] = [
  { content_key: 'card_heading', content_value: 'Architecting Systems that Scale & Endure', content_type: 'text' },
  { content_key: 'card_description', content_value: '', content_type: 'text' },
  { content_key: 'vitals_heading', content_value: 'Profile Vitals', content_type: 'text' },
  { content_key: 'show_vitals', content_value: 'true', content_type: 'boolean' },
  { content_key: 'work_model', content_value: 'Hybrid / Remote / On-Site', content_type: 'text' },
]

export const ABOUT_FIELD_DEFS = defs(ABOUT_CONTENT_DEFAULTS, {
  card_heading: 'About card heading',
  card_description: 'About card description',
  vitals_heading: 'Profile vitals heading',
  show_vitals: 'Show profile vitals block',
  work_model: 'Work model label',
})

export const EXPERIENCE_CONTENT_DEFAULTS: SectionContentDefault[] = [
  {
    content_key: 'experience_column_heading',
    content_value: 'Professional Experience',
    content_type: 'text',
  },
  { content_key: 'education_column_heading', content_value: 'Education', content_type: 'text' },
  { content_key: 'highlights_heading', content_value: 'Highlights', content_type: 'text' },
]

export const HOBBIES_CONTENT_DEFAULTS: SectionContentDefault[] = [
  { content_key: 'show_when_empty', content_value: 'false', content_type: 'boolean' },
  { content_key: 'empty_state_message', content_value: '', content_type: 'text' },
]
export const CONTACT_CONTENT_DEFAULTS: SectionContentDefault[] = [
  { content_key: 'form_heading', content_value: 'Send a Message', content_type: 'text' },
  { content_key: 'submit_label', content_value: 'Send Message', content_type: 'text' },
  { content_key: 'error_message', content_value: 'Something went wrong. Please try again.', content_type: 'text' },
  { content_key: 'response_time_text', content_value: 'Response Time: Typically within 24 hours', content_type: 'text' },
  {
    content_key: 'opportunity_options',
    content_value: '["Full-Time Role","Internship","Freelance / Contract","Collaboration","Other"]',
    content_type: 'json',
  },
  { content_key: 'show_form', content_value: 'true', content_type: 'boolean' },
]

export const CONTACT_FIELD_DEFS = defs(CONTACT_CONTENT_DEFAULTS, {
  form_heading: 'Form heading',
  submit_label: 'Submit button label',
  error_message: 'Error message',
  response_time_text: 'Response time note',
  opportunity_options: 'Opportunity types (JSON array)',
  show_form: 'Show contact form',
})

export const HEADER_CONTENT_DEFAULTS: SectionContentDefault[] = [
  { content_key: 'display_name', content_value: '', content_type: 'text' },
  { content_key: 'subtitle', content_value: '', content_type: 'text' },
  { content_key: 'resume_label', content_value: 'Resume', content_type: 'text' },
  { content_key: 'show_resume', content_value: 'true', content_type: 'boolean' },
  { content_key: 'show_theme_toggle', content_value: 'true', content_type: 'boolean' },
  { content_key: 'logo_url', content_value: '', content_type: 'url' },
]

export const HEADER_FIELD_DEFS = defs(HEADER_CONTENT_DEFAULTS, {
  display_name: 'Display name override (empty = profile)',
  subtitle: 'Subtitle override (empty = profile)',
  resume_label: 'Resume button label',
  show_resume: 'Show resume button',
  show_theme_toggle: 'Show theme toggle',
  logo_url: 'Logo URL override',
})

export const FOOTER_CONTENT_DEFAULTS: SectionContentDefault[] = [
  { content_key: 'display_name', content_value: '', content_type: 'text' },
  { content_key: 'intro', content_value: '', content_type: 'text' },
  { content_key: 'availability_badge', content_value: 'Available for hire / Internships', content_type: 'text' },
  { content_key: 'show_availability_badge', content_value: 'true', content_type: 'boolean' },
  { content_key: 'show_email', content_value: 'true', content_type: 'boolean' },
  { content_key: 'show_admin_link', content_value: 'true', content_type: 'boolean' },
  { content_key: 'show_back_to_top', content_value: 'true', content_type: 'boolean' },
  { content_key: 'copyright_text', content_value: 'Engineered with precision.', content_type: 'text' },
  { content_key: 'custom_copyright_year', content_value: '', content_type: 'text' },
  { content_key: 'index_heading', content_value: 'Index', content_type: 'text' },
  { content_key: 'connect_heading', content_value: 'Connect', content_type: 'text' },
]

export const FOOTER_FIELD_DEFS = defs(FOOTER_CONTENT_DEFAULTS, {
  display_name: 'Footer display name',
  intro: 'Footer intro text',
  availability_badge: 'Availability badge text',
  show_availability_badge: 'Show availability badge',
  show_email: 'Show email link',
  show_admin_link: 'Show admin link',
  show_back_to_top: 'Show back to top in footer',
  copyright_text: 'Copyright tagline',
  custom_copyright_year: 'Custom copyright year (optional)',
  index_heading: 'Index column heading',
  connect_heading: 'Connect column heading',
})

export const FLOATING_ACTIONS_DEFAULTS: SectionContentDefault[] = [
  { content_key: 'contact_label', content_value: 'Hire Charlotte', content_type: 'text' },
  { content_key: 'show_contact', content_value: 'true', content_type: 'boolean' },
  { content_key: 'contact_href', content_value: '#contact', content_type: 'url' },
  { content_key: 'show_back_to_top', content_value: 'true', content_type: 'boolean' },
  { content_key: 'position', content_value: 'bottom-right', content_type: 'text' },
  { content_key: 'show_realtime_indicator', content_value: 'true', content_type: 'boolean' },
]

export const FLOATING_ACTIONS_FIELD_DEFS = defs(FLOATING_ACTIONS_DEFAULTS, {
  contact_label: 'Contact CTA label',
  show_contact: 'Show contact CTA',
  contact_href: 'Contact CTA destination',
  show_back_to_top: 'Show back to top button',
  position: 'Position (bottom-right, bottom-left)',
  show_realtime_indicator: 'Show realtime indicator',
})

export const PAGE_SECTION_DEFAULTS: Record<
  string,
  { eyebrow: string | null; heading: string; subtitle: string | null; is_locked: boolean }
> = {
  home: {
    eyebrow: null,
    heading: 'Home',
    subtitle: null,
    is_locked: true,
  },
  about: {
    eyebrow: 'System Overview • 01',
    heading: 'Bridging Business Logic & Engineering Rigor',
    subtitle:
      'I analyze real-world workflows, map requirements into architectural specifications, and ship maintainable digital products that stand the test of scale.',
    is_locked: false,
  },
  skills: {
    eyebrow: 'Competency Grid • 02',
    heading: 'Technical Skills & Proficiency Matrix',
    subtitle:
      'Categorized overview of languages, runtimes, databases, and analysis frameworks from the live portfolio database.',
    is_locked: false,
  },
  featured_projects: {
    eyebrow: 'Selected Work • 03',
    heading: 'Featured Projects',
    subtitle:
      'Published projects marked as featured — architecture, role, and stack from the live database.',
    is_locked: false,
  },
  projects: {
    eyebrow: 'Archive • 04',
    heading: 'All Projects',
    subtitle:
      'Searchable archive of published work. Filters are generated from live project data.',
    is_locked: true,
  },
  experience: {
    eyebrow: 'Career Path • 05',
    heading: 'Experience & Education',
    subtitle: 'Professional roles, leadership, and academic foundations.',
    is_locked: false,
  },
  hobbies: {
    eyebrow: 'Beyond Code • 06',
    heading: 'Hobbies & Interests',
    subtitle: 'Personal interests and photo galleries outside of engineering work.',
    is_locked: false,
  },
  certifications: {
    eyebrow: 'Credentials • 07',
    heading: 'Certifications & Achievements',
    subtitle: 'Verified credentials and professional milestones.',
    is_locked: false,
  },
  contact: {
    eyebrow: 'Connect • 08',
    heading: "Let's Build Something Reliable",
    subtitle:
      'Open to full-time roles, internships, and collaboration on thoughtful software systems.',
    is_locked: true,
  },
}

export const DEFAULT_HEADER_NAV = [
  { label: 'Home', destination: '#home', section_key: 'home' },
  { label: 'About', destination: '#about', section_key: 'about' },
  { label: 'Skills', destination: '#skills', section_key: 'skills' },
  { label: 'Projects', destination: '#featured-projects', section_key: 'featured_projects' },
  { label: 'Experience', destination: '#experience', section_key: 'experience' },
  { label: 'Hobbies', destination: '#hobbies', section_key: 'hobbies' },
  { label: 'Certifications', destination: '#certifications', section_key: 'certifications' },
  { label: 'Contact', destination: '#contact', section_key: 'contact' },
] as const

export const DEFAULT_FOOTER_NAV = [
  { label: 'Home & Summary', destination: '#home', section_key: 'home' },
  { label: 'About & Core Focus', destination: '#about', section_key: 'about' },
  { label: 'Technical Skills', destination: '#skills', section_key: 'skills' },
  { label: 'Featured Projects', destination: '#featured-projects', section_key: 'featured_projects' },
  { label: 'Experience & Leadership', destination: '#experience', section_key: 'experience' },
] as const

export const DEFAULT_SPECIALIZATION_CARDS = [
  {
    title: 'Web & Mobile Development',
    description:
      'Building performant web interfaces and cross-platform mobile apps with adaptive layouts and offline-first persistence.',
    icon: 'devices',
    tone: 'bg-primary-fixed text-primary-container',
  },
  {
    title: 'System Analysis & SQA',
    description:
      'Translating complex workflows into SRS documentation, ERDs, UML diagrams, and automated regression test pipelines.',
    icon: 'fact_check',
    tone: 'bg-secondary-container text-secondary',
  },
  {
    title: 'API & AI Integration',
    description:
      'Designing relational schemas and chaining LLM endpoints for intelligent data enrichment and agent assistants.',
    icon: 'neurology',
    tone: 'bg-tertiary-fixed text-tertiary',
  },
] as const

export const DEFAULT_SKILL_FILTERS = [
  { key: 'all', label: 'All Stack' },
  { key: 'Programming Languages', label: 'Programming Languages' },
  { key: 'Frontend Development', label: 'Frontend Development' },
  { key: 'Backend Development', label: 'Backend Development' },
  { key: 'Mobile Development', label: 'Mobile Development' },
  { key: 'Database Management', label: 'Database Management' },
  { key: 'API and AI Integration', label: 'API & AI Integration' },
  { key: 'Software Quality Assurance', label: 'Software QA' },
  { key: 'System Analysis', label: 'System Analysis & PM' },
  { key: 'Project Management', label: 'Project Management' },
  { key: 'Development Tools', label: 'Development Tools' },
] as const

export const HOMEPAGE_SECTION_KEYS = [
  'home',
  'about',
  'skills',
  'featured_projects',
  'projects',
  'experience',
  'hobbies',
  'certifications',
  'contact',
] as const

export const HOMEPAGE_SECTION_LABELS: Record<string, string> = {
  home: 'Home',
  about: 'About',
  skills: 'Skills',
  featured_projects: 'Featured Projects',
  projects: 'All Projects',
  experience: 'Experience & Education',
  hobbies: 'Hobbies',
  certifications: 'Certifications',
  contact: 'Contact',
}

export function defaultsForSection(sectionKey: string): SectionContentDefault[] {
  switch (sectionKey) {
    case 'hero':
      return HERO_CONTENT_DEFAULTS
    case 'about':
      return ABOUT_CONTENT_DEFAULTS
    case 'experience':
      return EXPERIENCE_CONTENT_DEFAULTS
    case 'hobbies':
      return HOBBIES_CONTENT_DEFAULTS
    case 'contact':
      return CONTACT_CONTENT_DEFAULTS
    case 'header':
      return HEADER_CONTENT_DEFAULTS
    case 'footer':
      return FOOTER_CONTENT_DEFAULTS
    case 'floating_actions':
      return FLOATING_ACTIONS_DEFAULTS
    default:
      return []
  }
}

export function fieldDefsForSection(sectionKey: string): ContentFieldDef[] {
  switch (sectionKey) {
    case 'hero':
      return HERO_FIELD_DEFS
    case 'about':
      return ABOUT_FIELD_DEFS
    case 'contact':
      return CONTACT_FIELD_DEFS
    case 'header':
      return HEADER_FIELD_DEFS
    case 'footer':
      return FOOTER_FIELD_DEFS
    case 'floating_actions':
      return FLOATING_ACTIONS_FIELD_DEFS
    default:
      return []
  }
}

export function mergeSectionContent(
  sectionKey: string,
  published: Record<string, string>,
): Record<string, string> {
  const defaults = defaultsForSection(sectionKey)
  const merged = { ...published }
  for (const row of defaults) {
    if (merged[row.content_key] === undefined) {
      merged[row.content_key] = row.content_value
    }
  }
  return merged
}

export function contentTypesForSection(sectionKey: string): Record<string, SectionContentType> {
  return Object.fromEntries(
    defaultsForSection(sectionKey).map((row) => [row.content_key, row.content_type]),
  )
}

export function parseContentBoolean(value: string | undefined): boolean {
  if (!value) return false
  return value === 'true' || value === '1'
}

export function serializeContentBoolean(value: boolean): string {
  return value ? 'true' : 'false'
}