import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

import { SectionContentFields } from '@/components/admin/SectionContentFields'
import { ErrorState } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { FLOATING_ACTIONS_FIELD_DEFS } from '@/lib/cms-defaults'
import {
  fetchSectionContentMap,
  saveAndPublishSectionContent,
  type SectionContentMap,
} from '@/services/cms'

export function AdminFloatingActionsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [values, setValues] = useState<SectionContentMap>({})

  async function load() {
    setLoading(true)
    setError(null)
    try {
      setValues(await fetchSectionContentMap('floating_actions'))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load floating actions')
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
        'floating_actions',
        'floating_actions',
        values,
        undefined,
        user?.id ?? null,
      )
      toast.success('Floating actions published')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Publish failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingState rows={3} />
  if (error) return <ErrorState message={error} onRetry={() => void load()} />

  return (
    <div className="space-y-8">
      <PageHeader
        title="Floating Actions"
        description="Floating contact CTA, back-to-top control, and realtime indicator settings."
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
        <SectionContentFields
          fields={FLOATING_ACTIONS_FIELD_DEFS}
          values={values}
          onChange={setValues}
        />
      </section>
    </div>
  )
}