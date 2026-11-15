import { supabase } from '@/lib/supabase'

export interface CredentialsDisplaySettings {
  show_certifications_group: boolean
  show_awards_group: boolean
}

export interface HomepageSettings {
  show_featured_projects: boolean
  show_highlighted_skills: boolean
  show_hobbies: boolean
  show_certifications: boolean
  show_about: boolean
  show_experience: boolean
  section_order: string[]
  featured_limit: number
}

export interface ContactSettings {
  enable_form: boolean
  success_message: string
  support_email: string
}

export interface BrandingSettings {
  site_title: string
  tagline: string
  logo_url: string
  favicon_url: string
}

export interface SeoSettings {
  meta_title: string
  meta_description: string
  og_image_url: string
}

const defaultHomepage: HomepageSettings = {
  show_featured_projects: true,
  show_highlighted_skills: true,
  show_hobbies: true,
  show_certifications: true,
  show_about: true,
  show_experience: true,
  section_order: ['featured', 'skills', 'hobbies', 'certifications'],
  featured_limit: 6,
}

const defaultContact: ContactSettings = {
  enable_form: true,
  success_message: 'Thank you. Your message has been sent.',
  support_email: '',
}

const defaultBranding: BrandingSettings = {
  site_title: '',
  tagline: '',
  logo_url: '',
  favicon_url: '',
}

const defaultSeo: SeoSettings = {
  meta_title: '',
  meta_description: '',
  og_image_url: '',
}

function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

export async function fetchHomepageSettings(): Promise<HomepageSettings> {
  const { data, error } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', 'homepage')
    .maybeSingle()

  if (error) throw new Error(error.message)

  const value = asObject(data?.value)
  if (!value) return defaultHomepage

  return {
    show_featured_projects:
      value.show_featured_projects === undefined
        ? defaultHomepage.show_featured_projects
        : Boolean(value.show_featured_projects),
    show_highlighted_skills:
      value.show_highlighted_skills === undefined
        ? defaultHomepage.show_highlighted_skills
        : Boolean(value.show_highlighted_skills),
    show_hobbies:
      value.show_hobbies === undefined
        ? defaultHomepage.show_hobbies
        : Boolean(value.show_hobbies),
    show_certifications:
      value.show_certifications === undefined
        ? defaultHomepage.show_certifications
        : Boolean(value.show_certifications),
    show_about:
      value.show_about === undefined
        ? defaultHomepage.show_about
        : Boolean(value.show_about),
    show_experience:
      value.show_experience === undefined
        ? defaultHomepage.show_experience
        : Boolean(value.show_experience),
    section_order: Array.isArray(value.section_order)
      ? (value.section_order as string[])
      : defaultHomepage.section_order,
    featured_limit:
      typeof value.featured_limit === 'number'
        ? value.featured_limit
        : defaultHomepage.featured_limit,
  }
}

function parseSiteSettingBoolean(value: unknown, defaultValue: boolean) {
  if (value === undefined || value === null) return defaultValue
  if (typeof value === 'boolean') return value
  if (value === 'true') return true
  if (value === 'false') return false
  return defaultValue
}

export async function fetchCredentialsDisplaySettings(): Promise<CredentialsDisplaySettings> {
  const keys = ['show_certifications_group', 'show_awards_group'] as const
  const { data, error } = await supabase
    .from('site_settings')
    .select('key, value')
    .in('key', [...keys])

  if (error) throw new Error(error.message)

  const map = new Map(
    (data ?? []).map((row) => [row.key as string, row.value]),
  )

  return {
    show_certifications_group: parseSiteSettingBoolean(
      map.get('show_certifications_group'),
      true,
    ),
    show_awards_group: parseSiteSettingBoolean(map.get('show_awards_group'), true),
  }
}

export async function fetchContactSettings(): Promise<ContactSettings> {
  const { data, error } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', 'contact')
    .maybeSingle()

  if (error) throw new Error(error.message)

  const value = asObject(data?.value)
  if (!value) return defaultContact

  return {
    enable_form:
      value.enable_form === undefined
        ? defaultContact.enable_form
        : Boolean(value.enable_form),
    success_message:
      typeof value.success_message === 'string' && value.success_message.trim()
        ? value.success_message
        : defaultContact.success_message,
    support_email:
      typeof value.support_email === 'string' ? value.support_email : '',
  }
}

export async function fetchBrandingSettings(): Promise<BrandingSettings> {
  const { data, error } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', 'branding')
    .maybeSingle()

  if (error) throw new Error(error.message)

  const value = asObject(data?.value)
  if (!value) return defaultBranding

  return {
    site_title: typeof value.site_title === 'string' ? value.site_title : '',
    tagline: typeof value.tagline === 'string' ? value.tagline : '',
    logo_url: typeof value.logo_url === 'string' ? value.logo_url : '',
    favicon_url: typeof value.favicon_url === 'string' ? value.favicon_url : '',
  }
}

export async function fetchSeoSettings(): Promise<SeoSettings> {
  const { data, error } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', 'seo')
    .maybeSingle()

  if (error) throw new Error(error.message)

  const value = asObject(data?.value)
  if (!value) return defaultSeo

  return {
    meta_title: typeof value.meta_title === 'string' ? value.meta_title : '',
    meta_description:
      typeof value.meta_description === 'string' ? value.meta_description : '',
    og_image_url: typeof value.og_image_url === 'string' ? value.og_image_url : '',
  }
}
