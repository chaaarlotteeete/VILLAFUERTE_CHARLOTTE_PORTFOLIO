import { SITE_TITLE } from '@/lib/constants'
import type { BrandingSettings, SeoSettings } from '@/services/settings'
import type { Profile } from '@/types/database'

function ensureMeta(name: string, content: string) {
  if (!content.trim()) return
  let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute('name', name)
    document.head.appendChild(el)
  }
  el.content = content
}

function ensureLink(rel: string, href: string) {
  if (!href.trim()) return
  let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null
  if (!el) {
    el = document.createElement('link')
    el.rel = rel
    document.head.appendChild(el)
  }
  el.href = href
}

export function resolveBrowserTitle(
  branding?: BrandingSettings | null,
  seo?: SeoSettings | null,
  profile?: Profile | null,
) {
  const fromBranding = branding?.site_title?.trim()
  if (fromBranding) return fromBranding

  const fromSeo = seo?.meta_title?.trim()
  if (fromSeo) return fromSeo

  const name = profile?.full_name?.trim()
  const title = profile?.title?.trim()
  if (name && title) return `${name} | ${title}`
  if (name) return name

  return SITE_TITLE
}

export function applyDocumentMeta(input: {
  branding?: BrandingSettings | null
  seo?: SeoSettings | null
  profile?: Profile | null
}) {
  const title = resolveBrowserTitle(input.branding, input.seo, input.profile)
  document.title = title

  const description = input.seo?.meta_description?.trim()
  if (description) ensureMeta('description', description)

  const favicon = input.branding?.favicon_url?.trim()
  if (favicon) {
    ensureLink('icon', favicon)
    ensureLink('shortcut icon', favicon)
  }
}
