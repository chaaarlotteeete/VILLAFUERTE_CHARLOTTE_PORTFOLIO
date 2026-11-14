import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

import { SectionContentFields } from '@/components/admin/SectionContentFields'
import { ErrorState } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { HERO_FIELD_DEFS } from '@/lib/cms-defaults'
import {
  fetchActiveDraft,
  fetchSectionContentMap,
  saveContentDraft,
  publishSectionContentDraft,
  saveAndPublishSectionContent,
  type SectionContentMap,
} from '@/services/cms'

export function AdminHeroContentPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [drafting, setDrafting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [values, setValues] = useState<SectionContentMap>({})
  const [draftId, setDraftId] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const [map, draft] = await Promise.all([
        fetchSectionContentMap('hero'),
        fetchActiveDraft('hero', 'hero'),
      ])
      if (draft?.payload && typeof draft.payload === 'object' && !Array.isArray(draft.payload)) {
        const body = draft.payload as Record<string, unknown>
        if (body.values && typeof body.values === 'object') {
          setValues({ ...map, ...(body.values as SectionContentMap) })
        } else {
          setValues(map)
        }
        setDraftId(draft.id)
      } else {
        setValues(map)
        setDraftId(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load hero content')
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
      await saveAndPublishSectionContent('hero', 'hero', values, undefined, user?.id ?? null)
      setDraftId(null)
      toast.success('Hero content published')
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Publish failed')
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveDraft() {
    setDrafting(true)
    try {
      const draft = await saveContentDraft({
        entityType: 'hero',
        entityKey: 'hero',
        payload: { values },
        label: 'Hero draft',
        createdBy: user?.id ?? null,
      })
      setDraftId(draft.id)
      toast.success('Draft saved')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Draft save failed')
    } finally {
      setDrafting(false)
    }
  }

  async function handlePublishDraft() {
    if (!draftId) {
      toast.error('No draft to publish')
      return
    }
    setSaving(true)
    try {
      await publishSectionContentDraft(draftId)
      toast.success('Draft published')
      await load()
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
        title="Hero Content"
        description="Headline, availability, CTAs, and hero metrics copy shown on the homepage."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link to="/admin/content">Back</Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={drafting}
              onClick={() => void handleSaveDraft()}
            >
              {drafting ? 'Saving draft...' : 'Save draft'}
            </Button>
            {draftId ? (
              <Button
                type="button"
                variant="secondary"
                disabled={saving}
                onClick={() => void handlePublishDraft()}
              >
                Publish draft
              </Button>
            ) : null}
            <Button type="button" disabled={saving} onClick={() => void handlePublish()}>
              {saving ? 'Publishing...' : 'Publish now'}
            </Button>
          </div>
        }
      />

      <section className="space-y-4 rounded-xl border bg-card p-5">
        <h2 className="text-lg font-semibold">Hero fields</h2>
        <p className="text-sm text-muted-foreground">
          Profile name, title, and biography are edited under{' '}
          <Link to="/admin/profile" className="text-primary underline">
            Profile
          </Link>
          .
        </p>
        <SectionContentFields fields={HERO_FIELD_DEFS} values={values} onChange={setValues} />
      </section>
    </div>
  )
}