import { useState } from 'react'
import { toast } from 'sonner'

import { ConfirmDeleteButton } from '@/components/admin/ConfirmDeleteButton'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { PageHeader } from '@/components/common/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useAsyncData } from '@/hooks/useAsyncData'
import {
  deleteExperience,
  fetchAdminExperiences,
  saveExperience,
} from '@/services/adminContent'
import { formatDateRange } from '@/utils/date'

const empty = {
  title: '',
  organization: '',
  start_date: '',
  end_date: '',
  is_current: false,
  is_visible: true,
  description: '',
  achievements: '',
}

export function AdminExperiencePage() {
  const { data, error, loading, reload } = useAsyncData(fetchAdminExperiences)
  const [form, setForm] = useState(empty)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  if (loading) return <LoadingState rows={3} />
  if (error) return <ErrorState message={error} onRetry={reload} />

  const items = data ?? []

  function reset() {
    setForm(empty)
    setEditingId(null)
    setShowForm(false)
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Experience"
        description="Manage professional and organizational experience records."
        actions={
          <Button
            type="button"
            onClick={() => {
              setEditingId(null)
              setForm(empty)
              setShowForm(true)
            }}
          >
            Add Experience
          </Button>
        }
      />

      {showForm || editingId ? (
        <form
          className="space-y-4 rounded-xl border bg-card p-5"
          onSubmit={(event) => {
            event.preventDefault()
            void (async () => {
              if (!form.title.trim() || !form.organization.trim()) {
                toast.error('Position and organization are required')
                return
              }
              try {
                await saveExperience({
                  id: editingId ?? undefined,
                  title: form.title.trim(),
                  organization: form.organization.trim(),
                  start_date: form.start_date || null,
                  end_date: form.is_current ? null : form.end_date || null,
                  is_current: form.is_current,
                  is_visible: form.is_visible,
                  description: form.description || null,
                  achievements: form.achievements || null,
                  display_order: editingId
                    ? items.find((item) => item.id === editingId)?.display_order ??
                      items.length
                    : items.length,
                } as Parameters<typeof saveExperience>[0])
                toast.success(editingId ? 'Experience updated' : 'Experience added')
                reset()
                reload()
              } catch (err) {
                toast.error(err instanceof Error ? err.message : 'Save failed')
              }
            })()
          }}
        >
          <h2 className="text-lg font-semibold">
            {editingId ? 'Edit Experience' : 'Add Experience'}
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Position</Label>
              <Input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Organization</Label>
              <Input
                required
                value={form.organization}
                onChange={(e) =>
                  setForm({ ...form, organization: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                disabled={form.is_current}
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
              />
            </div>
          </div>
          <label className="flex items-center gap-3 text-sm">
            <Switch
              checked={form.is_current}
              onCheckedChange={(checked) =>
                setForm({
                  ...form,
                  is_current: checked,
                  end_date: checked ? '' : form.end_date,
                })
              }
            />
            Current Position
          </label>
          <label className="flex items-center gap-3 text-sm">
            <Switch
              checked={form.is_visible}
              onCheckedChange={(checked) =>
                setForm({ ...form, is_visible: checked })
              }
            />
            Visible on public site
          </label>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Achievements</Label>
            <Textarea
              value={form.achievements}
              onChange={(e) => setForm({ ...form, achievements: e.target.value })}
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit">{editingId ? 'Update' : 'Save Experience'}</Button>
            <Button type="button" variant="outline" onClick={reset}>
              Cancel
            </Button>
          </div>
        </form>
      ) : null}

      {items.length === 0 ? (
        <EmptyState title="No experience entries yet" />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-xl border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{item.title}</h3>
                    {item.is_current ? <Badge>Current</Badge> : null}
                    {'is_visible' in item && item.is_visible === false ? (
                      <Badge variant="secondary">Hidden</Badge>
                    ) : null}
                  </div>
                  <p className="text-sm text-muted-foreground">{item.organization}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateRange(item.start_date, item.end_date, item.is_current)}
                  </p>
                  {item.description ? (
                    <p className="mt-2 text-sm">{item.description}</p>
                  ) : null}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingId(item.id)
                      setShowForm(true)
                      setForm({
                        title: item.title,
                        organization: item.organization,
                        start_date: item.start_date ?? '',
                        end_date: item.end_date ?? '',
                        is_current: item.is_current,
                        is_visible:
                          'is_visible' in item && typeof item.is_visible === 'boolean'
                            ? item.is_visible
                            : true,
                        description: item.description ?? '',
                        achievements: item.achievements ?? '',
                      })
                    }}
                  >
                    Edit
                  </Button>
                  <ConfirmDeleteButton
                    onConfirm={async () => {
                      await deleteExperience(item.id)
                      toast.success('Deleted')
                      reload()
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
