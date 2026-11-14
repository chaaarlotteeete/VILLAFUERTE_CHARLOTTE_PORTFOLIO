import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

import { ErrorState } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { HOMEPAGE_SECTION_LABELS } from '@/lib/cms-defaults'
import { fetchSiteSettings, saveSiteSetting } from '@/services/adminContent'
import { fetchPageSections, updatePageSectionVisibility } from '@/services/cms'
import type { Json } from '@/types/database'
import type { PageSection } from '@/services/cms'

interface HomepageFlags {
  show_about: boolean
  show_featured_projects: boolean
  show_highlighted_skills: boolean
  show_experience: boolean
  show_hobbies: boolean
  show_certifications: boolean
  featured_limit: number
}

const sectionToFlag: Partial<Record<string, keyof HomepageFlags>> = {
  about: 'show_about',
  skills: 'show_highlighted_skills',
  featured_projects: 'show_featured_projects',
  experience: 'show_experience',
  hobbies: 'show_hobbies',
  certifications: 'show_certifications',
}

const defaultFlags: HomepageFlags = {
  show_about: true,
  show_featured_projects: true,
  show_highlighted_skills: true,
  show_experience: true,
  show_hobbies: true,
  show_certifications: true,
  featured_limit: 6,
}

export function AdminHomepageSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sections, setSections] = useState<PageSection[]>([])
  const [flags, setFlags] = useState<HomepageFlags>(defaultFlags)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const [pageSections, settings] = await Promise.all([
        fetchPageSections(),
        fetchSiteSettings(),
      ])
      setSections(pageSections)

      const homepage = settings.find((row) => row.key === 'homepage')?.value
      if (homepage && typeof homepage === 'object' && !Array.isArray(homepage)) {
        const map = homepage as Record<string, unknown>
        setFlags({
          show_about: Boolean(map.show_about ?? true),
          show_featured_projects: Boolean(map.show_featured_projects ?? true),
          show_highlighted_skills: Boolean(map.show_highlighted_skills ?? true),
          show_experience: Boolean(map.show_experience ?? true),
          show_hobbies: Boolean(map.show_hobbies ?? true),
          show_certifications: Boolean(map.show_certifications ?? true),
          featured_limit:
            typeof map.featured_limit === 'number' ? map.featured_limit : defaultFlags.featured_limit,
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load homepage settings')
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
      await saveSiteSetting('homepage', flags as unknown as Exclude<Json, null>)

      await Promise.all(
        sections.map(async (section) => {
          if (section.is_locked) return
          const flagKey = sectionToFlag[section.section_key]
          const visible = flagKey
            ? Boolean(flags[flagKey])
            : section.is_visible
          if (visible !== section.is_visible) {
            await updatePageSectionVisibility(section.section_key, visible)
          }
        }),
      )

      await Promise.all(
        Object.entries(sectionToFlag).map(async ([sectionKey, flagKey]) => {
          if (!flagKey) return
          await updatePageSectionVisibility(sectionKey, Boolean(flags[flagKey]))
        }),
      )

      const featured = sections.find((s) => s.section_key === 'featured_projects')
      if (featured) {
        await saveSiteSetting('homepage', {
          ...flags,
          featured_limit: flags.featured_limit,
        } as unknown as Exclude<Json, null>)
      }

      toast.success('Homepage settings saved')
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  function setSectionVisible(sectionKey: string, visible: boolean) {
    const flagKey = sectionToFlag[sectionKey]
    if (flagKey) {
      setFlags((current) => ({ ...current, [flagKey]: visible }))
    }
    setSections((current) =>
      current.map((section) =>
        section.section_key === sectionKey ? { ...section, is_visible: visible } : section,
      ),
    )
  }

  if (loading) return <LoadingState rows={4} />
  if (error) return <ErrorState message={error} onRetry={() => void load()} />

  return (
    <div className="space-y-8">
      <PageHeader
        title="Homepage Sections"
        description="Control which homepage sections are visible and sync page_sections with site settings."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link to="/admin/content">Back</Link>
            </Button>
            <Button disabled={saving} onClick={() => void handleSave()}>
              {saving ? 'Saving...' : 'Save settings'}
            </Button>
          </div>
        }
      />

      <section className="space-y-4 rounded-xl border bg-card p-5">
        <h2 className="text-lg font-semibold">Section visibility</h2>
        <div className="space-y-3">
          {sections.map((section) => {
            const label =
              HOMEPAGE_SECTION_LABELS[section.section_key] ?? section.section_key
            return (
              <div
                key={section.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3"
              >
                <div>
                  <p className="font-medium">{label}</p>
                  {section.is_locked ? (
                    <p className="text-xs text-muted-foreground">Always visible (locked)</p>
                  ) : null}
                </div>
                <label className="flex items-center gap-3 text-sm">
                  <Switch
                    checked={section.is_visible}
                    disabled={section.is_locked}
                    onCheckedChange={(checked) =>
                      setSectionVisible(section.section_key, checked)
                    }
                  />
                  {section.is_visible ? 'Visible' : 'Hidden'}
                </label>
              </div>
            )
          })}
        </div>
      </section>

      <section className="space-y-4 rounded-xl border bg-card p-5">
        <h2 className="text-lg font-semibold">Featured projects</h2>
        <div className="space-y-2 max-w-xs">
          <Label htmlFor="featured_limit">Featured project limit</Label>
          <Input
            id="featured_limit"
            type="number"
            min={1}
            max={24}
            value={flags.featured_limit}
            onChange={(event) =>
              setFlags((current) => ({
                ...current,
                featured_limit: Number(event.target.value) || 1,
              }))
            }
          />
        </div>
      </section>
    </div>
  )
}