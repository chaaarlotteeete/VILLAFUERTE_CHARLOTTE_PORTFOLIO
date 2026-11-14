import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

import { FileUploadField } from '@/components/admin/FileUploadField'
import { ErrorState } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { PageHeader } from '@/components/common/PageHeader'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/contexts/AuthContext'
import { ADMIN_EMAIL, SITE_TITLE } from '@/lib/constants'
import { fetchSiteSettings, saveSiteSetting } from '@/services/adminContent'
import type { Json } from '@/types/database'

interface BrandingSettings {
  site_title: string
  tagline: string
  logo_url: string
  favicon_url: string
}

interface HomepageSettings {
  show_featured_projects: boolean
  show_highlighted_skills: boolean
  show_hobbies: boolean
  show_certifications: boolean
  section_order: string[]
  featured_limit: number
}

interface SeoSettings {
  meta_title: string
  meta_description: string
  og_image_url: string
}

interface ContactSettings {
  enable_form: boolean
  success_message: string
  support_email: string
}

const defaultBranding: BrandingSettings = {
  site_title: SITE_TITLE,
  tagline: 'Personal IT Project Portfolio',
  logo_url: '',
  favicon_url: '',
}

const defaultHomepage: HomepageSettings = {
  show_featured_projects: true,
  show_highlighted_skills: true,
  show_hobbies: true,
  show_certifications: true,
  section_order: ['featured', 'skills', 'hobbies', 'certifications'],
  featured_limit: 6,
}

const defaultSeo: SeoSettings = {
  meta_title: SITE_TITLE,
  meta_description: 'Professional IT project portfolio and credentials.',
  og_image_url: '',
}

const defaultContact: ContactSettings = {
  enable_form: true,
  success_message: 'Thank you. Your message has been sent.',
  support_email: ADMIN_EMAIL,
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

export function AdminSettingsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [branding, setBranding] = useState(defaultBranding)
  const [homepage, setHomepage] = useState(defaultHomepage)
  const [seo, setSeo] = useState(defaultSeo)
  const [contact, setContact] = useState(defaultContact)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const settings = await fetchSiteSettings()
      const map = Object.fromEntries(settings.map((item) => [item.key, item.value]))

      const brandingValue = asRecord(map.branding)
      if (brandingValue) {
        setBranding({
          site_title:
            typeof brandingValue.site_title === 'string'
              ? brandingValue.site_title
              : defaultBranding.site_title,
          tagline:
            typeof brandingValue.tagline === 'string'
              ? brandingValue.tagline
              : defaultBranding.tagline,
          logo_url:
            typeof brandingValue.logo_url === 'string'
              ? brandingValue.logo_url
              : '',
          favicon_url:
            typeof brandingValue.favicon_url === 'string'
              ? brandingValue.favicon_url
              : '',
        })
      }

      const homepageValue = asRecord(map.homepage)
      if (homepageValue) {
        setHomepage({
          show_featured_projects: Boolean(
            homepageValue.show_featured_projects ?? true,
          ),
          show_highlighted_skills: Boolean(
            homepageValue.show_highlighted_skills ?? true,
          ),
          show_hobbies: Boolean(homepageValue.show_hobbies ?? true),
          show_certifications: Boolean(
            homepageValue.show_certifications ?? true,
          ),
          section_order: Array.isArray(homepageValue.section_order)
            ? (homepageValue.section_order as string[])
            : defaultHomepage.section_order,
          featured_limit:
            typeof homepageValue.featured_limit === 'number'
              ? homepageValue.featured_limit
              : defaultHomepage.featured_limit,
        })
      }

      const seoValue = asRecord(map.seo)
      if (seoValue) {
        setSeo({
          meta_title:
            typeof seoValue.meta_title === 'string'
              ? seoValue.meta_title
              : defaultSeo.meta_title,
          meta_description:
            typeof seoValue.meta_description === 'string'
              ? seoValue.meta_description
              : defaultSeo.meta_description,
          og_image_url:
            typeof seoValue.og_image_url === 'string'
              ? seoValue.og_image_url
              : '',
        })
      }

      const contactValue = asRecord(map.contact)
      if (contactValue) {
        setContact({
          enable_form: Boolean(contactValue.enable_form ?? true),
          success_message:
            typeof contactValue.success_message === 'string'
              ? contactValue.success_message
              : defaultContact.success_message,
          support_email:
            typeof contactValue.support_email === 'string'
              ? contactValue.support_email
              : defaultContact.support_email,
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function handleSave() {
    setSaving(true)
    try {
      await Promise.all([
        saveSiteSetting('branding', branding as unknown as Exclude<Json, null>),
        saveSiteSetting('homepage', homepage as unknown as Exclude<Json, null>),
        saveSiteSetting('seo', seo as unknown as Exclude<Json, null>),
        saveSiteSetting('contact', contact as unknown as Exclude<Json, null>),
      ])
      toast.success('Settings saved')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  function moveSection(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= homepage.section_order.length) return
    const next = [...homepage.section_order]
    ;[next[index], next[target]] = [next[target], next[index]]
    setHomepage((current) => ({ ...current, section_order: next }))
  }

  if (loading) return <LoadingState rows={4} />
  if (error) return <ErrorState message={error} onRetry={() => void load()} />

  return (
    <div className="space-y-8">
      <PageHeader
        title="Site Settings"
        description="Portfolio branding, homepage layout, SEO, contact, and administrator preferences."
        actions={
          <Button onClick={() => void handleSave()} disabled={saving}>
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        }
      />

      <section className="space-y-4 rounded-xl border bg-card p-5">
        <h2 className="text-lg font-semibold">Portfolio branding</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="site_title">Site title</Label>
            <Input
              id="site_title"
              value={branding.site_title}
              onChange={(event) =>
                setBranding((current) => ({
                  ...current,
                  site_title: event.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tagline">Tagline</Label>
            <Input
              id="tagline"
              value={branding.tagline}
              onChange={(event) =>
                setBranding((current) => ({
                  ...current,
                  tagline: event.target.value,
                }))
              }
            />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <FileUploadField
            label="Logo"
            folder="branding"
            value={branding.logo_url}
            onUploaded={(url) =>
              setBranding((current) => ({ ...current, logo_url: url }))
            }
          />
          <FileUploadField
            label="Favicon"
            folder="branding"
            value={branding.favicon_url}
            onUploaded={(url) =>
              setBranding((current) => ({ ...current, favicon_url: url }))
            }
          />
        </div>
      </section>

      <section className="space-y-4 rounded-xl border bg-card p-5">
        <h2 className="text-lg font-semibold">Theme preferences</h2>
        <p className="text-sm text-muted-foreground">
          Toggle light/dark appearance for the admin and public experience.
        </p>
        <ThemeToggle />
      </section>

      <section className="space-y-4 rounded-xl border bg-card p-5">
        <h2 className="text-lg font-semibold">Homepage section visibility</h2>
        {(
          [
            ['show_featured_projects', 'Featured projects'],
            ['show_highlighted_skills', 'Highlighted skills'],
            ['show_hobbies', 'Hobbies & interests'],
            ['show_certifications', 'Certifications'],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="flex items-center gap-3 text-sm">
            <Switch
              checked={homepage[key]}
              onCheckedChange={(checked) =>
                setHomepage((current) => ({ ...current, [key]: checked }))
              }
            />
            {label}
          </label>
        ))}

        <div className="space-y-2">
          <Label htmlFor="featured_limit">Featured project limit</Label>
          <Input
            id="featured_limit"
            type="number"
            min={1}
            max={24}
            value={homepage.featured_limit}
            onChange={(event) =>
              setHomepage((current) => ({
                ...current,
                featured_limit: Number(event.target.value) || 1,
              }))
            }
          />
        </div>

        <div className="space-y-2">
          <Label>Homepage section ordering</Label>
          <div className="space-y-2">
            {homepage.section_order.map((section, index) => (
              <div
                key={section}
                className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm"
              >
                <span className="capitalize">{section.replaceAll('_', ' ')}</span>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={index === 0}
                    onClick={() => moveSection(index, -1)}
                  >
                    Up
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={index === homepage.section_order.length - 1}
                    onClick={() => moveSection(index, 1)}
                  >
                    Down
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-xl border bg-card p-5">
        <h2 className="text-lg font-semibold">SEO metadata</h2>
        <div className="space-y-2">
          <Label htmlFor="meta_title">Meta title</Label>
          <Input
            id="meta_title"
            value={seo.meta_title}
            onChange={(event) =>
              setSeo((current) => ({
                ...current,
                meta_title: event.target.value,
              }))
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="meta_description">Meta description</Label>
          <Textarea
            id="meta_description"
            value={seo.meta_description}
            onChange={(event) =>
              setSeo((current) => ({
                ...current,
                meta_description: event.target.value,
              }))
            }
          />
        </div>
        <FileUploadField
          label="Open Graph image"
          folder="branding"
          value={seo.og_image_url}
          onUploaded={(url) =>
            setSeo((current) => ({ ...current, og_image_url: url }))
          }
        />
      </section>

      <section className="space-y-4 rounded-xl border bg-card p-5">
        <h2 className="text-lg font-semibold">Contact form settings</h2>
        <label className="flex items-center gap-3 text-sm">
          <Switch
            checked={contact.enable_form}
            onCheckedChange={(checked) =>
              setContact((current) => ({ ...current, enable_form: checked }))
            }
          />
          Enable contact form
        </label>
        <div className="space-y-2">
          <Label htmlFor="support_email">Support email</Label>
          <Input
            id="support_email"
            type="email"
            value={contact.support_email}
            onChange={(event) =>
              setContact((current) => ({
                ...current,
                support_email: event.target.value,
              }))
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="success_message">Success message</Label>
          <Textarea
            id="success_message"
            value={contact.success_message}
            onChange={(event) =>
              setContact((current) => ({
                ...current,
                success_message: event.target.value,
              }))
            }
          />
        </div>
      </section>

      <section className="space-y-4 rounded-xl border bg-card p-5">
        <h2 className="text-lg font-semibold">Social links</h2>
        <p className="text-sm text-muted-foreground">
          Manage GitHub, LinkedIn, and other social profiles in Profile.
        </p>
        <Button asChild variant="outline">
          <Link to="/admin/profile">Open profile social links</Link>
        </Button>
      </section>

      <section className="space-y-4 rounded-xl border bg-card p-5">
        <h2 className="text-lg font-semibold">Administrator account settings</h2>
        <p className="text-sm text-muted-foreground">
          Signed in as {user?.email || ADMIN_EMAIL}
        </p>
        <Button asChild variant="outline">
          <Link to="/admin/account">Manage admin account</Link>
        </Button>
      </section>
    </div>
  )
}
