export const PUBLIC_SECTION_NAV = [
  { label: 'Home', href: '#home' },
  { label: 'About', href: '#about' },
  { label: 'Skills', href: '#skills' },
  { label: 'Projects', href: '#featured-projects' },
  { label: 'Experience', href: '#experience' },
  { label: 'Certifications', href: '#certifications' },
  { label: 'Contact', href: '#contact' },
] as const

export const ROUTE_TO_HASH: Record<string, string> = {
  '/about': '/#about',
  '/skills': '/#skills',
  '/projects': '/#projects',
  '/experience': '/#experience',
  '/education': '/#experience',
  '/hobbies': '/#hobbies',
  '/certifications': '/#certifications',
  '/contact': '/#contact',
}

export const SKILL_FILTERS = [
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

export function skillIconFor(name: string, fallback?: string | null) {
  if (fallback?.trim()) return fallback.trim()
  const key = name.toLowerCase()
  if (key.includes('javascript')) return 'javascript'
  if (key.includes('typescript')) return 'data_object'
  if (key.includes('python')) return 'code'
  if (key.includes('java')) return 'coffee'
  if (key.includes('php')) return 'terminal'
  if (key.includes('dart')) return 'flutter_dash'
  if (key.includes('react native')) return 'smartphone'
  if (key.includes('react')) return 'rebase_edit'
  if (key.includes('next')) return 'webhook'
  if (key.includes('tailwind')) return 'css'
  if (key.includes('flutter')) return 'phone_android'
  if (key.includes('node')) return 'memory'
  if (key.includes('fastapi') || key.includes('express') || key.includes('nest'))
    return 'bolt'
  if (key.includes('postgres')) return 'database'
  if (key.includes('mysql')) return 'storage'
  if (key.includes('supabase')) return 'cloud_sync'
  if (key.includes('redis')) return 'cached'
  if (key.includes('openai') || key.includes('ai')) return 'smart_toy'
  if (key.includes('langchain')) return 'link'
  if (key.includes('postman')) return 'send'
  if (key.includes('jest')) return 'verified'
  if (key.includes('cypress')) return 'desktop_windows'
  if (key.includes('uml') || key.includes('srs')) return 'account_tree'
  if (key.includes('agile') || key.includes('scrum')) return 'view_kanban'
  if (key.includes('git')) return 'source'
  if (key.includes('docker')) return 'deployed_code'
  if (key.includes('figma')) return 'draw'
  return 'widgets'
}

export function socialIconFor(platform: string) {
  const key = platform.toLowerCase()
  if (key.includes('git')) return 'terminal'
  if (key.includes('linked')) return 'group'
  if (key.includes('mail') || key.includes('email')) return 'mail'
  if (key.includes('twitter') || key.includes('x.com')) return 'alternate_email'
  return 'link'
}
