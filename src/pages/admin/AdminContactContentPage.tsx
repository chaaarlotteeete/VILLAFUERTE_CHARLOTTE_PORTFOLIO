import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

import { SectionContentFields } from '@/components/admin/SectionContentFields'
import { ErrorState } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/contexts/AuthContext'
import { CONTACT_FIELD_DEFS } from '@/lib/cms-defaults'
import {
  fetchPageSectionByKey,
  fetchSectionContentMap,
  saveAndPublishSectionContent,
  type PageSection,
  type SectionContentMap,
} from '@/services/cms'

export function AdminContactContentPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [values, setValues] = useState<SectionContentMap>({})
  const [pageSection, setPageSection] = useState<Partial<PageSection>>({})

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const [map, section] = await Promise.all([
        fetchSectionContentMap('contact'),
        fetchPageSectionByKey('contact'),
      ])
      setValues(map)
      setPageSection(section ?? { section_key: 'contact' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load contact content')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function handlePublish() {
    setSaving(true)
    try {
      await saveAndPublishSectionContent(
        'contact',
        'contact',
        values,
        {
          section_key: 'contact',
          eyebrow: pageSection.eyebrow ?? null,
          heading: pageSection.heading ?? null,
          subtitle: pageSection.subtitle ?? null,
        },
        user?.id ?? null,
      )
      toast.success('Contact content published')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Publish failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingState rows={4} />
  if (error) return <ErrorState message={error} onRetry={() => void load()} />

  return (
    <div className="space-y-8">
      <PageHeader
        title="Contact Content"
        description="Contact section headings, form labels, and opportunity type options."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link to="/admin/content">Back</Link>
            </Button>
            <Button disabled={saving} onClick={() => void handlePublish()}>
              {saving ? 'Publishing...' : 'Publish now'}
            </Button>
          </div>
        }
      />

      <section className="space-y-4 rounded-xl border bg-card p-5">
        <h2 className="text-lg font-semibold">Section chrome</h2>
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="contact_eyebrow">Eyebrow</Label>
            <Input
              id="contact_eyebrow"
              value={pageSection.eyebrow ?? ''}
              onChange={(event) =>
                setPageSection((current) => ({ ...current, eyebrow: event.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact_heading">Heading</Label>
            <Input
              id="contact_heading"
              value={pageSection.heading ?? ''}
              onChange={(event) =>
                setPageSection((current) => ({ ...current, heading: event.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact_subtitle">Subtitle</Label>
            <Textarea
              id="contact_subtitle"
              value={pageSection.subtitle ?? ''}
              onChange={(event) =>
                setPageSection((current) => ({ ...current, subtitle: event.target.value }))
              }
            />
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-xl border bg-card p-5">
        <h2 className="text-lg font-semibold">Form & messaging</h2>
        <SectionContentFields fields={CONTACT_FIELD_DEFS} values={values} onChange={setValues} />
      </section>
    </div>
  )
}